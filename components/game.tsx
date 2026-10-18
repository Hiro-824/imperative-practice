"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  acts,
  correctPrefix,
  finaleScript,
  openingScript,
  people,
  steps,
  tutorial,
  type Gender,
  type Rank,
  type ScriptLine,
} from "@/lib/story";
import { evaluate, wordBank, type Answer } from "@/lib/answer";
import { prepareSpeech, recognitionConstructor, speak, stopSpeaking, type Recognition } from "@/lib/speech";
import { PlayerKnight, Scene, Stage } from "./scene";

type Screen = "home" | "intro" | "tutorial" | "prologue" | "game" | "finale" | "ending";
type TurnPhase = "thought" | "input" | "reaction";
type Settings = {
  gender: Gender;
  name: string;
  inputMode: "voice" | "words";
  audio: boolean;
  tutorialDone: boolean;
};
type Stats = Record<Rank, number> & { grammarMistakes: number; choiceMistakes: number };
type Save = {
  version: 1;
  settings: Settings;
  index: number;
  clues: string[];
  stats: Stats;
};

const STORAGE = "crown-quest-v1";
const emptyStats: Stats = { lower: 0, equal: 0, higher: 0, grammarMistakes: 0, choiceMistakes: 0 };
const defaults: Save = {
  version: 1,
  settings: { gender: "female", name: "", inputMode: "voice", audio: true, tutorialDone: false },
  index: 0,
  clues: [],
  stats: emptyStats,
};

const introDialogue = {
  en: "This is the Kingdom of Eldoria. I am a young knight serving at the royal castle.",
  ja: "ここはエルドリア王国。私は王城に仕える若き騎士だ。",
};

function playerName(save: Save) {
  return save.settings.name.trim() || (save.settings.gender === "female" ? "リリア" : "レオン");
}

function playerEnglishName(save: Save) {
  const name = save.settings.name.trim();
  if (!name) return save.settings.gender === "female" ? "Lilia" : "Leon";
  if (name === "リリア") return "Lilia";
  if (name === "レオン") return "Leon";
  return /^[A-Za-z][A-Za-z .'-]*$/.test(name) ? name : "Knight";
}

function readSave(): Save {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE) || "null");
    if (value?.version !== 1) return defaults;
    return {
      ...defaults,
      index: Number.isInteger(value.index) ? Math.max(0, Math.min(17, value.index)) : 0,
      clues: Array.isArray(value.clues) ? value.clues.filter((item: unknown) => typeof item === "string") : [],
      stats: {
        lower: Number.isInteger(value.stats?.lower) ? Math.max(0, value.stats.lower) : 0,
        equal: Number.isInteger(value.stats?.equal) ? Math.max(0, value.stats.equal) : 0,
        higher: Number.isInteger(value.stats?.higher) ? Math.max(0, value.stats.higher) : 0,
        grammarMistakes: Number.isInteger(value.stats?.grammarMistakes) ? Math.max(0, value.stats.grammarMistakes) : 0,
        choiceMistakes: Number.isInteger(value.stats?.choiceMistakes)
          ? Math.max(0, value.stats.choiceMistakes)
          : Number.isInteger(value.mistakes)
            ? Math.max(0, value.mistakes)
            : 0,
      },
      settings: {
        gender: value.settings?.gender === "male" ? "male" : "female",
        name: typeof value.settings?.name === "string" ? value.settings.name.slice(0, 24) : "",
        inputMode: value.settings?.inputMode === "words" ? "words" : "voice",
        audio: value.settings?.audio !== false,
        tutorialDone: value.settings?.tutorialDone === true,
      },
    };
  } catch {
    return defaults;
  }
}

function BilingualTypewriter({ en, ja, onDone }: { en: string; ja: string; onDone: () => void }) {
  const text = `${en}\n${ja}`;
  const [length, setLength] = useState(0);
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      const reveal = window.setTimeout(() => {
        setLength(text.length);
        onDone();
      }, 0);
      return () => window.clearTimeout(reveal);
    }
    let position = 0;
    const timer = window.setInterval(() => {
      position = Math.min(text.length, position + 1);
      setLength(position);
      if (position === text.length) {
        window.clearInterval(timer);
        onDone();
      }
    }, 12);
    return () => window.clearInterval(timer);
  }, [text, onDone]);
  const visible = text.slice(0, length);
  const [visibleEn, visibleJa = ""] = visible.split("\n");
  return (
    <div className="dialogue-copy">
      <p className="dialogue-en">{visibleEn}{length < en.length && <span className="type-cursor" />}</p>
      <p className="dialogue-ja">{visibleJa}{length >= en.length && length < text.length && <span className="type-cursor" />}</p>
      <span className="sr-only" aria-live="polite">{length === text.length ? `${en} ${ja}` : ""}</span>
    </div>
  );
}

function Metric({ label, value, max, mistake = false }: { label: string; value: number; max: number; mistake?: boolean }) {
  const width = mistake ? Math.min(100, value * 14) : Math.min(100, (value / max) * 100);
  return (
    <div className={`result-meter ${mistake ? "mistake-meter" : ""}`}>
      <div><span>{label}</span><strong>{mistake ? value : `${value} / ${max}`}</strong></div>
      <div className="meter-track"><span style={{ width: `${width}%` }} /></div>
    </div>
  );
}

function replaceName(line: ScriptLine, nameEn: string, nameJa: string) {
  return {
    ...line,
    en: line.en.replaceAll("{nameEn}", nameEn),
    ja: line.ja.replaceAll("{nameJa}", nameJa),
  };
}

function scriptGender(line: ScriptLine, playerGender: Gender): Gender {
  if (line.speaker === "elena") return "female";
  if (line.speaker === "player") return playerGender;
  return "male";
}

export default function Game() {
  const [save, setSave] = useState<Save>(defaults);
  const [ready, setReady] = useState(false);
  const [screen, setScreen] = useState<Screen>("home");
  const [tutorialIndex, setTutorialIndex] = useState(0);
  const [scriptIndex, setScriptIndex] = useState(0);
  const [turnPhase, setTurnPhase] = useState<TurnPhase>("thought");
  const [typing, setTyping] = useState(true);
  const [selected, setSelected] = useState<number[]>([]);
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [transcript, setTranscript] = useState("");
  const [listening, setListening] = useState(false);
  const [voiceAvailable, setVoiceAvailable] = useState(true);
  const [voiceMessage, setVoiceMessage] = useState("");
  const [showHint, setShowHint] = useState(false);
  const [storageWarning, setStorageWarning] = useState(false);
  const [tutorialPrompt, setTutorialPrompt] = useState(false);
  const [dragId, setDragId] = useState<number | null>(null);
  const recognition = useRef<Recognition | null>(null);
  const gotResult = useRef(false);

  const stopRecognition = useCallback(() => {
    const current = recognition.current;
    recognition.current = null;
    if (current) {
      current.onresult = null;
      current.onerror = null;
      current.onend = null;
      current.abort();
    }
    setListening(false);
  }, []);

  const step = screen === "tutorial" ? tutorial[tutorialIndex] : steps[save.index];
  const person = people[step.person];
  const bank = wordBank(step);
  const mode = save.settings.inputMode;
  const acted = answer?.kind === "correct";
  const playing = screen === "game" || screen === "tutorial";
  const name = playerName(save);
  const nameEn = playerEnglishName(save);
  const finishTyping = useCallback(() => setTyping(false), []);
  const say = useCallback((text: string, gender: Gender) => {
    if (save.settings.audio) void speak(text, gender);
  }, [save.settings.audio]);

  const update = useCallback((change: (current: Save) => Save) => {
    setSave((current) => {
      const next = change(current);
      try {
        localStorage.setItem(STORAGE, JSON.stringify(next));
      } catch {
        setStorageWarning(true);
      }
      return next;
    });
  }, []);

  useEffect(() => {
    const stored = readSave();
    const available = Boolean(recognitionConstructor());
    if (!available) stored.settings.inputMode = "words";
    const initialization = window.setTimeout(() => {
      setSave(stored);
      setVoiceAvailable(available);
      setReady(true);
      try {
        prepareSpeech();
      } catch {
        // Speech support must never prevent the game itself from opening.
      }
    }, 0);
    return () => {
      window.clearTimeout(initialization);
      stopRecognition();
      stopSpeaking();
    };
  }, [stopRecognition]);

  const currentScript = useMemo(
    () =>
      screen === "prologue"
        ? replaceName(openingScript[scriptIndex], nameEn, name)
        : screen === "finale"
          ? finaleScript[scriptIndex]
          : null,
    [screen, scriptIndex, name, nameEn],
  );

  const dialogue = useMemo(() => playing
    ? turnPhase === "thought"
      ? { en: step.thoughtEn, ja: step.thoughtJa }
      : turnPhase === "reaction" && answer
        ? answer.kind === "correct"
          ? { en: step.resultEn, ja: step.resultJa }
          : { en: answer.messageEn, ja: answer.messageJa }
        : null
    : null, [playing, turnPhase, step.thoughtEn, step.thoughtJa, step.resultEn, step.resultJa, answer]);

  function resetInput() {
    stopRecognition();
    setSelected([]);
    setAnswer(null);
    setTranscript("");
    setVoiceMessage("");
    setShowHint(false);
  }

  function showPhase(phase: TurnPhase) {
    stopSpeaking();
    setTurnPhase(phase);
    setTyping(phase !== "input");
  }

  function beginNewQuest() {
    resetInput();
    setScriptIndex(0);
    setTyping(true);
    update((current) => ({ ...current, index: 0, clues: [], stats: { ...emptyStats } }));
    setScreen("prologue");
    const firstLine = replaceName(openingScript[0], nameEn, name);
    say(firstLine.en, scriptGender(firstLine, save.settings.gender));
  }

  function beginTutorial() {
    resetInput();
    setTutorialPrompt(false);
    setTutorialIndex(0);
    showPhase("thought");
    setScreen("tutorial");
    say(tutorial[0].thoughtEn, save.settings.gender);
  }

  function resumeGame() {
    resetInput();
    showPhase("thought");
    setScreen("game");
    say(steps[save.index].thoughtEn, save.settings.gender);
  }

  function submit(text: string) {
    if (turnPhase !== "input") return;
    const result = evaluate(text, step);
    setTranscript(text);
    setAnswer(result);
    showPhase("reaction");
    say(
      result.kind === "correct" ? step.resultEn : result.messageEn,
      result.kind === "correct" || result.kind === "choice" ? people[step.person].gender : save.settings.gender,
    );
    if (screen !== "game") return;
    if (result.kind === "correct") {
      update((current) => ({
        ...current,
        clues: step.clue && !current.clues.includes(step.clue) ? [...current.clues, step.clue] : current.clues,
        stats: { ...current.stats, [result.rank]: current.stats[result.rank] + 1 },
      }));
    } else if (result.kind === "choice") {
      update((current) => ({ ...current, stats: { ...current.stats, choiceMistakes: current.stats.choiceMistakes + 1 } }));
    } else if (result.kind === "grammar") {
      update((current) => ({ ...current, stats: { ...current.stats, grammarMistakes: current.stats.grammarMistakes + 1 } }));
    }
  }

  function listen() {
    if (listening) {
      recognition.current?.stop();
      return;
    }
    const Constructor = recognitionConstructor();
    if (!Constructor) {
      setVoiceAvailable(false);
      update((current) => ({ ...current, settings: { ...current.settings, inputMode: "words" } }));
      return;
    }
    stopSpeaking();
    setAnswer(null);
    setVoiceMessage("");
    setTranscript("");
    gotResult.current = false;
    const instance = new Constructor();
    recognition.current = instance;
    instance.lang = "en-US";
    instance.interimResults = false;
    instance.continuous = false;
    instance.maxAlternatives = 1;
    instance.onresult = (event) => {
      gotResult.current = true;
      setTranscript(event.results[0]?.[0]?.transcript || "");
      setListening(false);
    };
    instance.onerror = (event) => {
      gotResult.current = true;
      setVoiceMessage(
        event.error === "not-allowed" || event.error === "service-not-allowed"
          ? "マイクを利用できません。許可を確認するか、語句モードで続けてください。"
          : event.error === "network"
            ? "音声認識に接続できません。再試行するか、語句モードをお使いください。"
            : "聞き取れませんでした。もう一度言ってみましょう。",
      );
    };
    instance.onend = () => {
      setListening(false);
      if (!gotResult.current) setVoiceMessage("聞き取れませんでした。もう一度言ってみましょう。");
    };
    try {
      instance.start();
      setListening(true);
    } catch {
      setListening(false);
      setVoiceMessage("音声入力を開始できませんでした。もう一度試すか、語句モードをお使いください。");
    }
  }

  function finishQuest() {
    stopSpeaking();
    try {
      localStorage.removeItem(STORAGE);
    } catch {
      setStorageWarning(true);
    }
    setScriptIndex(0);
    setTyping(true);
    setScreen("finale");
    say(finaleScript[0].en, scriptGender(finaleScript[0], save.settings.gender));
  }

  function advanceStep() {
    resetInput();
    showPhase("thought");
    if (screen === "tutorial") {
      if (tutorialIndex < tutorial.length - 1) {
        const nextIndex = tutorialIndex + 1;
        setTutorialIndex(nextIndex);
        say(tutorial[nextIndex].thoughtEn, save.settings.gender);
      }
      else {
        update((current) => ({ ...current, settings: { ...current.settings, tutorialDone: true } }));
        beginNewQuest();
      }
    } else if (save.index < steps.length - 1) {
      say(steps[save.index + 1].thoughtEn, save.settings.gender);
      update((current) => ({ ...current, index: current.index + 1 }));
    } else finishQuest();
  }

  function advanceTurn() {
    if (turnPhase === "input") {
      if (mode === "voice" && transcript.trim()) submit(transcript);
      else if (mode === "words" && selected.length) submit(selected.map((id) => bank[id].word).join(" "));
      return;
    }
    if (typing) return;
    if (turnPhase === "thought") showPhase("input");
    else if (answer?.kind === "correct") advanceStep();
    else {
      resetInput();
      showPhase("input");
    }
  }

  function advanceScript() {
    if (typing) return;
    const script = screen === "prologue" ? openingScript : finaleScript;
    if (scriptIndex < script.length - 1) {
      const nextIndex = scriptIndex + 1;
      const nextLine = screen === "prologue"
        ? replaceName(openingScript[nextIndex], nameEn, name)
        : finaleScript[nextIndex];
      setScriptIndex(nextIndex);
      setTyping(true);
      say(nextLine.en, scriptGender(nextLine, save.settings.gender));
    } else if (screen === "prologue") {
      resetInput();
      showPhase("thought");
      setScreen("game");
      say(steps[save.index].thoughtEn, save.settings.gender);
    } else setScreen("ending");
  }

  function reorder(id: number, target: number | null) {
    setSelected((current) => {
      const rest = current.filter((item) => item !== id);
      const targetIndex = target === null ? rest.length : rest.indexOf(target);
      return [...rest.slice(0, Math.max(0, targetIndex)), id, ...rest.slice(Math.max(0, targetIndex))];
    });
    setAnswer(null);
    setDragId(null);
  }

  if (!ready) return <div className="loading"><span>♜</span><p>物語を開いています…</p></div>;

  const playerCharacter = save.settings.gender === "female" ? "playerFemale" : "playerMale";
  const dialogueOwner = turnPhase === "thought"
    ? name
    : answer?.kind === "grammar" || answer?.kind === "empty"
      ? "ことばの案内役"
      : person.ja;
  const dialogueRole = turnPhase === "thought"
    ? "王国騎士・心の声"
    : answer?.kind === "grammar" || answer?.kind === "empty"
      ? "英語のヒント"
      : person.title;
  const sceneCharacter = screen === "tutorial"
    ? step.person
    : turnPhase === "thought"
      ? playerCharacter
      : step.person;
  const phaseIndex = screen === "tutorial" ? tutorialIndex : save.index;

  let scriptOwner = "";
  let scriptRole = "";
  let scriptCharacter: "playerMale" | "playerFemale" | "thomas" | "elena" | "aldric" | "cook" | "king" = "king";
  if (currentScript) {
    if (currentScript.speaker === "player") {
      scriptOwner = name;
      scriptRole = "王国騎士";
      scriptCharacter = playerCharacter;
    } else if (currentScript.speaker === "king") {
      scriptOwner = "新国王";
      scriptRole = "エルドリア国王";
      scriptCharacter = "king";
    } else if (currentScript.speaker === "narrator") {
      scriptOwner = "物語";
      scriptRole = "戴冠式";
      scriptCharacter = "king";
    } else {
      scriptOwner = people[currentScript.speaker].ja;
      scriptRole = people[currentScript.speaker].title;
      scriptCharacter = currentScript.speaker;
    }
  }

  return (
    <div className={`app-shell screen-${screen}`}>
      {storageWarning && <p className="storage-warning" role="status">このブラウザでは進行を保存できません。</p>}

      {screen === "home" && (
        <main className="setup-page">
          <section className="setup-card">
            <div className="setup-heading">
              <p className="eyebrow">PLAYER SETUP</p>
              <h1>王冠と、ことばの騎士</h1>
              <p>騎士の名前と遊び方を決めてください。</p>
            </div>
            <div className="player-preview"><PlayerKnight gender={save.settings.gender} /><span>{name}</span></div>
            <div className="setup-options">
              <label className="name-field">
                <span>騎士の名前</span>
                <input
                  value={save.settings.name}
                  maxLength={24}
                  placeholder={`${name}（自動）`}
                  onChange={(event) => update((current) => ({ ...current, settings: { ...current.settings, name: event.target.value } }))}
                />
              </label>
              <fieldset className="choice-row">
                <legend>騎士の姿</legend>
                {(["female", "male"] as const).map((gender) => (
                  <button key={gender} aria-pressed={save.settings.gender === gender} onClick={() => update((current) => ({ ...current, settings: { ...current.settings, gender } }))}>
                    {gender === "female" ? "女性" : "男性"}
                  </button>
                ))}
              </fieldset>
              <fieldset className="choice-row">
                <legend>入力方法</legend>
                <button disabled={!voiceAvailable} aria-pressed={mode === "voice"} onClick={() => update((current) => ({ ...current, settings: { ...current.settings, inputMode: "voice" } }))}>音声で話す</button>
                <button aria-pressed={mode === "words"} onClick={() => update((current) => ({ ...current, settings: { ...current.settings, inputMode: "words" } }))}>語句を選ぶ</button>
              </fieldset>
              <div className="audio-setting">
                <span>セリフの読み上げ<small>英語のみ・キャラクターの性別に対応</small></span>
                <button role="switch" aria-checked={save.settings.audio} onClick={() => update((current) => ({ ...current, settings: { ...current.settings, audio: !current.settings.audio } }))}>{save.settings.audio ? "ON" : "OFF"}</button>
              </div>
            </div>
            {save.index > 0 && <button className="resume-button" onClick={resumeGame}>保存した場面 {save.index + 1} / 18 から再開</button>}
            <button className="primary start-button" aria-label="START" onClick={() => { setTyping(true); setScreen("intro"); say(introDialogue.en, save.settings.gender); }}>START</button>
          </section>
        </main>
      )}

      {screen === "intro" && (
        <main className="story-page">
          <div className="interactive-stage">
            <Stage background="/art-new/castle-entry-open.webp" location="エルドリア城" character={playerCharacter} />
            <section className="dialogue-panel">
              <div className="speaker-line"><strong>{name}</strong><span>王国騎士</span></div>
              <BilingualTypewriter
                en={introDialogue.en}
                ja={introDialogue.ja}
                onDone={finishTyping}
              />
              <button className="story-next" disabled={typing} onClick={() => setTutorialPrompt(true)}>次へ <b>→</b></button>
            </section>
          </div>
          {tutorialPrompt && (
            <div className="modal-backdrop">
              <section className="tutorial-modal" role="dialog" aria-modal="true" aria-labelledby="tutorial-title">
                <p className="eyebrow">TUTORIAL</p>
                <h2 id="tutorial-title">チュートリアルを受けますか？</h2>
                <p>3人の相手に合わせた頼み方を練習できます。</p>
                <div><button className="primary" onClick={beginTutorial}>受ける</button><button className="secondary" onClick={() => { setTutorialPrompt(false); beginNewQuest(); }}>今回は受けない</button></div>
              </section>
            </div>
          )}
        </main>
      )}

      {(screen === "prologue" || screen === "finale") && currentScript && (
        <main className="story-page story-page-script">
          <div className="chapter-bar"><p className="eyebrow">{screen === "prologue" ? "THE MISSING CROWN" : "CORONATION"}</p><span>{scriptIndex + 1} / {screen === "prologue" ? openingScript.length : finaleScript.length}</span></div>
          <div className="interactive-stage">
            <Stage
              background={screen === "prologue" ? "/art-new/castle-entry-closed.webp" : "/art-new/throne-room-closed.webp"}
              location={screen === "prologue" ? "王冠の保管室" : "戴冠式の大広間"}
              character={scriptCharacter}
              bubble={screen === "finale" && scriptIndex === 0 ? "crown" : undefined}
            />
            <section className="dialogue-panel">
              <div className="speaker-line"><strong>{scriptOwner}</strong><span>{scriptRole}</span></div>
              <BilingualTypewriter key={`${screen}-${scriptIndex}`} en={currentScript.en} ja={currentScript.ja} onDone={finishTyping} />
              <button className="story-next" disabled={typing} onClick={advanceScript}>{screen === "finale" && scriptIndex === finaleScript.length - 1 ? "結果を見る" : "次へ"} <b>→</b></button>
            </section>
          </div>
        </main>
      )}

      {playing && (
        <main className="game-page">
          <div className="chapter-bar">
            <div><p className="eyebrow">{screen === "tutorial" ? "TUTORIAL" : `ACT 0${step.act} / 05`}</p><h1>{screen === "tutorial" ? "頼み方の稽古" : acts[step.act - 1]}</h1></div>
            <span>{String(phaseIndex + 1).padStart(2, "0")} / {screen === "tutorial" ? "03" : "18"}</span>
          </div>
          <div className="progress-track"><span style={{ width: `${((phaseIndex + (acted ? 1 : 0)) / (screen === "tutorial" ? 3 : 18)) * 100}%` }} /></div>
          <div className="interactive-stage">
            <Scene step={step} acted={acted} index={phaseIndex} tutorial={screen === "tutorial"} character={sceneCharacter} />
            <section className={`dialogue-panel phase-${turnPhase}`}>
            {turnPhase === "input" ? (
              <div className="request-panel">
                <div className="speaker-line"><strong>{name}</strong><span>{mode === "voice" ? "英語で話す" : "語句を組み立てる"}</span></div>
                <p className="request-ja">{step.ja}</p>
                <p className="sentence-area">
                  {mode === "voice" ? (
                    <><output className="voice-transcript" aria-label="音声認識の文字起こし" aria-live="polite">{transcript}</output> {step.tail}{person.rank === "lower" ? "." : "?"}</>
                  ) : (
                    <><span>{selected.length ? selected.map((id) => bank[id].word).join(" ") : "　　　　　　　　　"}</span> {step.tail}{person.rank === "lower" ? "." : "?"}</>
                  )}
                </p>
                {mode === "voice" ? (
                  <div className="voice-input"><button className={listening ? "listening" : ""} onClick={listen} disabled={!voiceAvailable} aria-label={listening ? "録音を終了" : "マイクで話す"}>●</button><span>{listening ? "聞いています…" : "← タップして話す"}</span></div>
                ) : (
                  <div className="word-input">
                    <div className="word-answer" onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); if (dragId !== null) reorder(dragId, null); }}>
                      {selected.length ? selected.map((id) => (
                        <button key={id} draggable onDragStart={(event) => { setDragId(id); event.dataTransfer.setData("text/plain", String(id)); }} onDragEnd={() => setDragId(null)} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); event.stopPropagation(); if (dragId !== null && dragId !== id) reorder(dragId, id); }} onClick={() => setSelected((current) => current.filter((item) => item !== id))} aria-label={`${bank[id].word}を戻す`}>{bank[id].word} ×</button>
                      )) : <span>語句を順番に選んで、「次へ」を押してください</span>}
                    </div>
                    <div className="word-bank">{bank.map(({ word, id }) => <button key={id} disabled={selected.includes(id)} onClick={() => setSelected((current) => [...current, id])}>{word}</button>)}</div>
                    <button className="clear-words" disabled={!selected.length} onClick={() => setSelected([])}>すべて戻す</button>
                  </div>
                )}
                {voiceMessage && <p className="system-message" role="status">{voiceMessage}</p>}
                <div className="request-footer">
                  <span>{person.rank === "lower" ? "目下" : person.rank === "equal" ? "同僚" : "目上"}</span>
                  <button onClick={() => setShowHint((shown) => !shown)}>{showHint ? "ヒントを閉じる" : "ヒントを見る"}</button>
                </div>
                {showHint && <p className="hint">{person.rank === "lower" ? "動詞の原形から始めよう。" : person.rank === "equal" ? "Can you に動詞の原形を続けよう。" : "Would you mind に動詞のing形を続けよう。"}<strong>{correctPrefix(step)} {step.tail}</strong></p>}
              </div>
            ) : dialogue ? (
              <div className="rpg-dialogue">
                <div className="speaker-line"><strong>{dialogueOwner}</strong><span>{dialogueRole}</span></div>
                <BilingualTypewriter key={`${screen}-${phaseIndex}-${turnPhase}-${answer?.kind || "none"}`} en={dialogue.en} ja={dialogue.ja} onDone={finishTyping} />
              </div>
            ) : null}
            <button
              className="story-next"
              onClick={advanceTurn}
              disabled={turnPhase === "input" ? (mode === "voice" ? !transcript.trim() : !selected.length) : typing}
            >
              {turnPhase === "reaction" && answer?.kind !== "correct" ? "もう一度" : "次へ"} <b>→</b>
            </button>
            </section>
          </div>
        </main>
      )}

      {screen === "ending" && (
        <main className="ending-page">
          <p className="eyebrow">QUEST COMPLETE</p>
          <h1>王冠奪還任務、完了</h1>
          <p>{name}の依頼記録</p>
          <section className="result-card">
            <Metric label="目下への依頼" value={6} max={6} />
            <Metric label="同僚への依頼" value={6} max={6} />
            <Metric label="目上への依頼" value={6} max={6} />
            <Metric label="文法エラー" value={save.stats.grammarMistakes} max={1} mistake />
            <Metric label="敬意レベルの選択ミス" value={save.stats.choiceMistakes} max={1} mistake />
          </section>
          <button className="primary" onClick={() => { setSave((current) => ({ ...defaults, settings: current.settings })); setScreen("home"); }}>タイトルに戻る</button>
        </main>
      )}
    </div>
  );
}
