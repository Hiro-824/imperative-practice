"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  acts,
  correctPrefix,
  ending,
  people,
  steps,
  tutorial,
} from "@/lib/story";
import { evaluate, wordBank, type Answer } from "@/lib/answer";
import {
  recognitionConstructor,
  speak,
  stopSpeaking,
  type Recognition,
} from "@/lib/speech";
import { Item, PlayerKnight, Scene } from "./scene";

type Screen = "home" | "rules" | "tutorial" | "game" | "ending";
type TurnPhase = "thought" | "npc" | "input" | "reaction";
type Settings = {
  gender: "male" | "female";
  inputMode: "voice" | "words";
  audio: boolean;
  tutorialDone: boolean;
};
type Save = {
  version: 1;
  settings: Settings;
  index: number;
  completed: boolean;
  mistakes: number;
  clues: string[];
};
const STORAGE = "crown-quest-v1";
const defaults: Save = {
  version: 1,
  settings: {
    gender: "female",
    inputMode: "voice",
    audio: true,
    tutorialDone: false,
  },
  index: 0,
  completed: false,
  mistakes: 0,
  clues: [],
};
function Typewriter({
  text,
  onDone,
}: {
  text: string;
  onDone: () => void;
}) {
  const [length, setLength] = useState(0);
  useEffect(() => {
    let index = 0;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = window.setInterval(
      () => {
        index = Math.min(text.length, index + 1);
        setLength(index);
        if (index === text.length) {
          window.clearInterval(timer);
          onDone();
        }
      },
      reduced ? 1 : 16,
    );
    return () => window.clearInterval(timer);
  }, [text, onDone]);
  return (
    <>
      <p className="rpg-message" aria-hidden="true">
        {text.slice(0, length)}
        {length < text.length && <span className="type-cursor" />}
      </p>
      <p className="sr-only" aria-live="polite">
        {length === text.length ? text : ""}
      </p>
    </>
  );
}
function spoken(text: string) {
  return text.replace(/[「」]/g, "");
}
function readSave(): Save {
  try {
    const v = JSON.parse(localStorage.getItem(STORAGE) || "null");
    if (v?.version !== 1) return defaults;
    return {
      ...defaults,
      index: Number.isInteger(v.index) ? Math.max(0, Math.min(17, v.index)) : 0,
      completed: v.completed === true,
      mistakes: Number.isInteger(v.mistakes) ? Math.max(0, v.mistakes) : 0,
      clues: Array.isArray(v.clues)
        ? v.clues.filter((x: unknown) => typeof x === "string")
        : [],
      settings: {
        gender: v.settings?.gender === "male" ? "male" : "female",
        inputMode: v.settings?.inputMode === "words" ? "words" : "voice",
        audio: v.settings?.audio !== false,
        tutorialDone: v.settings?.tutorialDone === true,
      },
    };
  } catch {
    return defaults;
  }
}
function RuleCards() {
  return (
    <div className="rule-cards">
      <div>
        <span className="rank-icon">↓</span>
        <strong>従者に、はっきりと</strong>
        <p>
          Open <small>the door.</small>
        </p>
        <span>動詞の原形で指示する</span>
      </div>
      <div>
        <span className="rank-icon">＝</span>
        <strong>同僚に、親しみをこめて</strong>
        <p>
          Can you open <small>the door?</small>
        </p>
        <span>Can you ＋ 動詞の原形</span>
      </div>
      <div>
        <span className="rank-icon">↑</span>
        <strong>目上に、敬意をこめて</strong>
        <p>
          Would you mind opening <small>the door?</small>
        </p>
        <span>Would you mind ＋ 動詞のing形</span>
      </div>
    </div>
  );
}
export default function Game() {
  const [save, setSave] = useState<Save>(defaults);
  const [ready, setReady] = useState(false);
  const [screen, setScreen] = useState<Screen>("home");
  const [tutorialIndex, setTutorialIndex] = useState(0);
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
  const [dragId, setDragId] = useState<number | null>(null);
  const recognition = useRef<Recognition | null>(null);
  const stopRecognition = useCallback(() => {
    const r = recognition.current;
    recognition.current = null;
    if (r) {
      r.onresult = null;
      r.onerror = null;
      r.onend = null;
      r.abort();
    }
    setListening(false);
  }, []);
  const gotResult = useRef(false);
  const step =
    screen === "tutorial" ? tutorial[tutorialIndex] : steps[save.index];
  const person = people[step.person];
  const bank = wordBank(step);
  const mode = save.settings.inputMode;
  const acted = answer?.kind === "correct";
  const playing = screen === "game" || screen === "tutorial";
  const dialogueText =
    turnPhase === "thought"
      ? step.context
      : turnPhase === "npc"
        ? `${step.line}\n${step.lineJa}`
        : turnPhase === "reaction"
          ? spoken(answer?.kind === "correct" ? step.result : answer?.message || "")
          : "";
  const dialogueOwner =
    turnPhase === "thought"
      ? "私"
      : turnPhase === "reaction" &&
          answer?.kind !== "correct" &&
          answer?.kind !== "social"
        ? "私"
        : person.ja;
  const dialogueRole =
    dialogueOwner === "私" ? "王国騎士" : person.title;
  const finishTyping = useCallback(() => setTyping(false), []);
  function showPhase(phase: TurnPhase) {
    stopSpeaking();
    setTurnPhase(phase);
    setTyping(phase !== "input");
  }
  const update = useCallback(
    (fn: (s: Save) => Save) =>
      setSave((old) => {
        const next = fn(old);
        try {
          localStorage.setItem(STORAGE, JSON.stringify(next));
        } catch {
          setStorageWarning(true);
        }
        return next;
      }),
    [],
  );
  useEffect(() => {
    const stored = readSave();
    const available = !!recognitionConstructor();
    if (!available) stored.settings.inputMode = "words";
    const frame = requestAnimationFrame(() => {
      setSave(stored);
      setReady(true);
      setVoiceAvailable(available);
      window.speechSynthesis?.getVoices();
    });
    return () => {
      cancelAnimationFrame(frame);
      stopRecognition();
      stopSpeaking();
    };
  }, [stopRecognition]);
  useEffect(() => {
    if (!ready || !save.settings.audio || !playing) return;
    if (turnPhase === "thought")
      speak([{ text: step.context, lang: "ja-JP" }]);
    else if (turnPhase === "npc")
      speak([
        { text: step.line, lang: "en-US" },
        { text: step.lineJa, lang: "ja-JP" },
      ]);
    else if (turnPhase === "reaction" && answer)
      speak([
        {
          text: answer.kind === "correct" ? step.result : answer.message,
          lang: "ja-JP",
        },
      ]);
    return stopSpeaking;
  }, [
    ready,
    screen,
    save.index,
    tutorialIndex,
    save.settings.audio,
    playing,
    turnPhase,
    answer,
    step.context,
    step.line,
    step.lineJa,
    step.result,
  ]);
  useEffect(() => {
    if (screen === "ending" && save.settings.audio)
      speak([
        { text: ending.text, lang: "ja-JP" },
        { text: ending.en, lang: "en-US" },
        { text: ending.ja, lang: "ja-JP" },
      ]);
  }, [screen, save.settings.audio]);
  function resetInput() {
    stopRecognition();
    setListening(false);
    setSelected([]);
    setAnswer(null);
    setTranscript("");
    setVoiceMessage("");
    setShowHint(false);
  }
  function startGame(resume = false) {
    resetInput();
    showPhase("thought");
    if (!resume)
      update((s) => ({
        ...s,
        index: 0,
        completed: false,
        mistakes: 0,
        clues: [],
      }));
    setScreen("game");
  }
  function beginTutorial() {
    resetInput();
    showPhase("thought");
    setTutorialIndex(0);
    setScreen("tutorial");
  }
  function submit(text: string) {
    if (turnPhase !== "input") return;
    const result = evaluate(text, step);
    setTranscript(text);
    setAnswer(result);
    showPhase("reaction");
    if (result.kind === "correct") {
      if (screen === "game")
        update((s) => ({
          ...s,
          clues:
            step.clue && !s.clues.includes(step.clue)
              ? [...s.clues, step.clue]
              : s.clues,
        }));
    } else if (result.kind === "social") {
      if (screen === "game")
        update((s) => ({ ...s, mistakes: s.mistakes + 1 }));
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
      return;
    }
    stopSpeaking();
    setAnswer(null);
    setVoiceMessage("");
    setTranscript("");
    gotResult.current = false;
    const r = new Constructor();
    recognition.current = r;
    r.lang = "en-US";
    r.interimResults = false;
    r.continuous = false;
    r.maxAlternatives = 1;
    r.onresult = (e) => {
      gotResult.current = true;
      const text = e.results[0]?.[0]?.transcript || "";
      submit(text);
    };
    r.onerror = (e) => {
      gotResult.current = true;
      setVoiceMessage(
        e.error === "not-allowed" || e.error === "service-not-allowed"
          ? "マイクを利用できません。ブラウザでマイクを許可するか、語句モードで続けられます。"
          : e.error === "network"
            ? "音声認識に接続できません。再試行するか、語句モードをお使いください。"
            : "聞き取れませんでした。もう一度言ってみましょう。",
      );
    };
    r.onend = () => {
      setListening(false);
      if (!gotResult.current)
        setVoiceMessage("聞き取れませんでした。もう一度言ってみましょう。");
    };
    try {
      r.start();
      setListening(true);
    } catch {
      setListening(false);
      setVoiceMessage(
        "音声入力を開始できませんでした。もう一度試すか、語句モードをお使いください。",
      );
    }
  }
  function advanceStep() {
    stopSpeaking();
    resetInput();
    showPhase("thought");
    if (screen === "tutorial") {
      if (tutorialIndex < 2) setTutorialIndex((i) => i + 1);
      else {
        update((s) => ({
          ...s,
          settings: { ...s.settings, tutorialDone: true },
        }));
        setScreen("game");
      }
    } else if (save.index < 17) update((s) => ({ ...s, index: s.index + 1 }));
    else {
      update((s) => ({ ...s, completed: true }));
      setScreen("ending");
    }
  }
  function advanceTurn() {
    if (typing || turnPhase === "input") return;
    if (turnPhase === "thought") showPhase("npc");
    else if (turnPhase === "npc") showPhase("input");
    else if (answer?.kind === "correct") advanceStep();
    else {
      resetInput();
      showPhase("input");
    }
  }
  function reorder(id: number, target: number | null) {
    if (!selected.includes(id)) {
      setSelected((s) =>
        target === null
          ? [...s, id]
          : [
              ...s.slice(0, s.indexOf(target)),
              id,
              ...s.slice(s.indexOf(target)),
            ],
      );
    } else
      setSelected((s) => {
        const rest = s.filter((x) => x !== id);
        const at = target === null ? rest.length : rest.indexOf(target);
        return [
          ...rest.slice(0, Math.max(0, at)),
          id,
          ...rest.slice(Math.max(0, at)),
        ];
      });
    setAnswer(null);
    setDragId(null);
  }
  const phaseIndex = screen === "tutorial" ? tutorialIndex : save.index;
  if (!ready)
    return (
      <div className="loading">
        <span>♜</span>物語を開いています…
      </div>
    );
  return (
    <div
      className={`app-shell ${playing ? "is-playing" : ""} ${screen === "home" ? "is-setup" : ""}`}
    >
      {storageWarning && (
        <p className="storage-warning" role="status">
          このブラウザでは記録を保存できません。このまま遊べますが、再読み込みすると進行が戻ります。
        </p>
      )}
      {screen === "home" && (
        <main className="setup-page">
          <div className="setup-backdrop" aria-hidden="true" />
          <section className="setup-card">
            <div className="setup-heading">
              <p className="eyebrow">PLAYER SETUP</p>
              <h1>冒険の準備</h1>
              <p>あなたは王城に仕える騎士。姿と遊び方を選んでください。</p>
            </div>
            <div className="player-preview" aria-label="あなたの騎士">
              <PlayerKnight gender={save.settings.gender} />
              <div className="player-badge">
                <span>YOU</span>
                <strong>王国騎士</strong>
              </div>
              <span className="player-shield">♜</span>
            </div>
            <div className="setup-options">
            <fieldset className="gender-choice">
              <legend>騎士の姿</legend>
              {(["female", "male"] as const).map((g) => (
                <button
                  key={g}
                  aria-label={g === "female" ? "女性の騎士" : "男性の騎士"}
                  aria-pressed={save.settings.gender === g}
                  onClick={() =>
                    update((s) => ({
                      ...s,
                      settings: { ...s.settings, gender: g },
                    }))
                  }
                >
                  <span>{g === "female" ? "♘" : "♞"}</span>
                  {g === "female" ? "女性" : "男性"}
                </button>
              ))}
            </fieldset>
              <fieldset className="input-choice">
                <legend>入力方法</legend>
                <button
                  aria-pressed={mode === "voice"}
                  disabled={!voiceAvailable}
                  onClick={() =>
                    update((s) => ({
                      ...s,
                      settings: { ...s.settings, inputMode: "voice" },
                    }))
                  }
                >
                  <span>●</span>
                  <strong>音声で話す</strong>
                  <small>{voiceAvailable ? "マイクを使用" : "この端末では利用不可"}</small>
                </button>
                <button
                  aria-pressed={mode === "words"}
                  onClick={() =>
                    update((s) => ({
                      ...s,
                      settings: { ...s.settings, inputMode: "words" },
                    }))
                  }
                >
                  <span>◆</span>
                  <strong>語句を選ぶ</strong>
                  <small>タップで組み立て</small>
                </button>
              </fieldset>
              <div className="setup-audio">
                <span>
                  セリフの読み上げ<small>日本語・英語</small>
                </span>
                <button
                  role="switch"
                  aria-checked={save.settings.audio}
                  className={`switch ${save.settings.audio ? "on" : ""}`}
                  onClick={() =>
                    update((s) => ({
                      ...s,
                      settings: { ...s.settings, audio: !s.settings.audio },
                    }))
                  }
                >
                  {save.settings.audio ? "ON" : "OFF"}
                </button>
              </div>
            </div>
            {!save.completed && save.index > 0 && (
              <button
                className="text-button setup-resume"
                onClick={() => startGame(true)}
              >
                保存した場面 {save.index + 1} / 18 から再開
              </button>
            )}
          </section>
          <div className="start-dock">
            <button
              className="setup-start"
              aria-label="物語をはじめる"
              onClick={() => {
                resetInput();
                setScreen("rules");
              }}
            >
              <strong>START</strong>
              <span>冒険を始める</span>
            </button>
          </div>
        </main>
      )}
      {screen === "rules" && (
        <main className="intro-page">
          <div className="intro-scene">
            <Scene step={steps[0]} acted={false} index={0} />
            <div className="intro-player">
              <PlayerKnight gender={save.settings.gender} />
            </div>
          </div>
          <section className="intro-dialogue">
            <span className="dialogue-owner">私 · 王国騎士</span>
            <p>
              ここはエルドリア王国。私は王城に仕える若き騎士だ。今日は新しい国王の戴冠式。
              私の役目は、仲間に英語で指示を出し、式を無事に迎えること。
            </p>
            <strong>
              {save.settings.tutorialDone
                ? "チュートリアルを受けますか？"
                : "まずは3人の仲間に声をかけ、頼み方を覚えよう。"}
            </strong>
            <div className="intro-actions">
              <button className="primary" onClick={beginTutorial}>
                {save.settings.tutorialDone
                  ? "チュートリアルを始める"
                  : "チュートリアルへ"}
              </button>
              {save.settings.tutorialDone && (
                <button className="primary secondary-primary" onClick={() => startGame(false)}>
                  本編から始める
                </button>
              )}
            </div>
            {!save.settings.tutorialDone && (
              <small>初回はチュートリアルから始まります。</small>
            )}
          </section>
        </main>
      )}
      {playing && (
        <main className="game-layout">
          <section className="game-main">
            <div className="chapter-bar">
              <div>
                <span className="eyebrow">
                  {screen === "tutorial"
                    ? "PROLOGUE · チュートリアル"
                    : `ACT 0${step.act} / 05`}
                </span>
                <h1>
                  {screen === "tutorial"
                    ? "騎士の、ことばの稽古"
                    : acts[step.act - 1]}
                </h1>
              </div>
              <div className="step-count">
                <strong>{String(phaseIndex + 1).padStart(2, "0")}</strong>
                <span>/ {screen === "tutorial" ? "03" : "18"}</span>
              </div>
            </div>
            <div className="progress-track">
              <span
                style={{
                  width: `${((phaseIndex + (acted ? 1 : 0)) / (screen === "tutorial" ? 3 : 18)) * 100}%`,
                }}
              />
            </div>
            <Scene
              step={step}
              acted={acted}
              index={screen === "tutorial" ? 0 : save.index}
            />
            <div className="player-presence">
              <PlayerKnight gender={save.settings.gender} />
              <span>YOU</span>
            </div>
            <section
              className={`rpg-turn-panel phase-${turnPhase}`}
              aria-label={turnPhase === "input" ? "あなたの番" : `${dialogueOwner}のセリフ`}
            >
              {turnPhase === "input" ? (
                <div className="rpg-input">
                  <div className="rpg-speaker-row">
                    <span className="rpg-speaker">あなた</span>
                    <small>{mode === "voice" ? "音声で伝える" : "語句を選んで伝える"}</small>
                  </div>
                  <div className="rpg-request-row">
                    <p>{step.ja}</p>
                    <span>使う動詞：<b>{step.verb}</b></span>
                  </div>
                  <div className="sentence-area">
                    <span className="sentence-blank">
                      {mode === "words" && selected.length
                        ? selected.map((id) => bank[id].word).join(" ")
                        : "　　　　　　　　　"}
                    </span>
                    <span className="sentence-tail">
                      {" "}{step.tail}{person.rank === "lower" ? "." : "?"}
                    </span>
                  </div>
                  {mode === "voice" ? (
                    <div className="voice-input">
                      <button
                        className={`mic-button ${listening ? "listening" : ""}`}
                        onClick={listen}
                        disabled={!voiceAvailable}
                        aria-label={listening ? "録音を終了" : "マイクで話す"}
                      >
                        <svg width="24" height="28" viewBox="0 0 24 28" aria-hidden="true">
                          <rect x="8" y="2" width="8" height="15" rx="4" fill="none" stroke="currentColor" strokeWidth="1.8" />
                          <path d="M4 11v3a8 8 0 0 0 16 0v-3M12 22v4m-4 0h8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <div className="word-input">
                      <div
                        className="word-answer"
                        aria-label="組み立てた語句"
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault();
                          if (dragId !== null) reorder(dragId, null);
                        }}
                      >
                        {selected.length === 0 ? (
                          <span className="word-placeholder">語句を順番にタップ</span>
                        ) : (
                          selected.map((id) => (
                            <div
                              key={id}
                              className="selected-word"
                              draggable
                              onDragStart={(e) => {
                                setDragId(id);
                                e.dataTransfer.setData("text/plain", String(id));
                              }}
                              onDragEnd={() => setDragId(null)}
                              onDragOver={(e) => e.preventDefault()}
                              onDrop={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                if (dragId !== null && dragId !== id) reorder(dragId, id);
                              }}
                            >
                              <button
                                aria-label={`${bank[id].word}を戻す`}
                                onClick={() => setSelected((s) => s.filter((x) => x !== id))}
                              >
                                {bank[id].word}<span>×</span>
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                      <div className="word-bank" aria-label="使える語句">
                        {bank.map(({ word, id }) => (
                          <button
                            key={id}
                            draggable={!selected.includes(id)}
                            disabled={selected.includes(id)}
                            onClick={() => setSelected((s) => [...s, id])}
                            onDragStart={(e) => {
                              setDragId(id);
                              e.dataTransfer.setData("text/plain", String(id));
                            }}
                            onDragEnd={() => setDragId(null)}
                          >
                            {word}
                          </button>
                        ))}
                      </div>
                      <div className="word-actions">
                        <button className="text-button" disabled={!selected.length} onClick={() => setSelected([])}>
                          すべて戻す
                        </button>
                        <button
                          className="primary"
                          disabled={!selected.length}
                          onClick={() => submit(selected.map((id) => bank[id].word).join(" "))}
                        >
                          このことばで伝える
                        </button>
                      </div>
                    </div>
                  )}
                  {voiceMessage && <p className="system-message" role="status">{voiceMessage}</p>}
                  {transcript && mode === "voice" && (
                    <p className="transcript">聞き取ったことば：<span>{transcript}</span></p>
                  )}
                  <div className="input-footnote">
                    <span>
                      {person.rank === "lower"
                        ? "↓ あなたより下の身分"
                        : person.rank === "equal"
                          ? "＝ あなたと同じ身分"
                          : "↑ あなたより上の身分"}
                    </span>
                    <button className="text-button" onClick={() => setShowHint((v) => !v)}>
                      {showHint ? "ヒントを閉じる" : "ヒントを見る"}
                    </button>
                  </div>
                  {showHint && (
                    <p className="hint">
                      {person.rank === "lower"
                        ? "動詞の原形から始めよう。"
                        : person.rank === "equal"
                          ? "Can you に動詞の原形を続けよう。"
                          : "Would you mind に動詞のing形を続けよう。"}
                      <strong>{correctPrefix(step)} <span>{step.tail}</span></strong>
                    </p>
                  )}
                </div>
              ) : (
                <div className="rpg-dialogue">
                  <div className="rpg-speaker-row">
                    <span className="rpg-speaker">{dialogueOwner}</span>
                    <small>{dialogueRole}</small>
                  </div>
                  <Typewriter
                    key={`${phaseIndex}-${turnPhase}-${answer?.kind || "none"}`}
                    text={dialogueText}
                    onDone={finishTyping}
                  />
                </div>
              )}
              <button
                className="story-next"
                onClick={advanceTurn}
                disabled={typing || turnPhase === "input"}
              >
                <span>
                  {turnPhase === "reaction" && answer?.kind !== "correct"
                    ? "もう一度"
                    : turnPhase === "reaction" && screen === "tutorial" && tutorialIndex === 2
                      ? "本編へ"
                      : turnPhase === "reaction" && screen === "game" && save.index === 17
                        ? "エンディングへ"
                        : "次へ"}
                </span>
                <b>→</b>
              </button>
            </section>
          </section>
        </main>
      )}
      {screen === "ending" && (
        <main className="ending-page">
          <div className="ending-emblem">
            <Item kind="crown" />
            <Item kind="dragon" />
          </div>
          <p className="eyebrow">QUEST COMPLETE</p>
          <h1>王冠は、ふたたび国王のもとへ。</h1>
          <p className="ending-story">{ending.text}</p>
          <blockquote>
            “{ending.en}”<small>{ending.ja}</small>
          </blockquote>
          <p className="ending-message">
            18のひと言が、王国を救った。
            <br />
            あなたの冒険は、ここでひと区切り。
          </p>
          <div className="ending-stats">
            <span>
              <strong>18 / 18</strong>依頼を達成
            </span>
            <span>
              <strong>6 × 3</strong>3つの言い方を練習
            </span>
            <span>
              <strong>{save.clues.length}</strong>集めた手がかり
            </span>
          </div>
          <RuleCards />
          <button
            className="primary"
            onClick={() => {
              stopSpeaking();
              setScreen("home");
            }}
          >
            タイトルに戻る →
          </button>
          <p className="eyebrow end-label">THE END · THANK YOU FOR PLAYING</p>
        </main>
      )}
    </div>
  );
}
