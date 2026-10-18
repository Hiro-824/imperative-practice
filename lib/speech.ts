import type { Gender } from "./story";

export interface RecognitionResultEvent {
  results: { [index: number]: { [index: number]: { transcript: string }; isFinal: boolean }; length: number };
}
export interface Recognition {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  onresult: ((event: RecognitionResultEvent) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

export function recognitionConstructor(): (new () => Recognition) | undefined {
  const w = window as unknown as { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition };
  return w.SpeechRecognition || w.webkitSpeechRecognition;
}

const femaleVoices = /samantha|victoria|karen|moira|tessa|fiona|ava|susan|zira|aria|jenny|salli|joanna|female/i;
const maleVoices = /alex|daniel|tom|fred|arthur|david|guy|george|ryan|matthew|brian|male/i;

let voiceLoad: Promise<SpeechSynthesisVoice[]> | null = null;

function englishVoices() {
  return window.speechSynthesis
    .getVoices()
    .filter((voice) => /^en(?:-|_)/i.test(voice.lang));
}

function loadEnglishVoices() {
  const current = englishVoices();
  if (current.length) return Promise.resolve(current);
  if (voiceLoad) return voiceLoad;

  const pending = new Promise<SpeechSynthesisVoice[]>((resolve) => {
    const synthesis = window.speechSynthesis;
    let settled = false;
    const finish = () => {
      if (settled) return;
      const voices = englishVoices();
      if (!voices.length) return;
      settled = true;
      synthesis.removeEventListener("voiceschanged", finish);
      resolve(voices);
    };
    synthesis.addEventListener("voiceschanged", finish);
    synthesis.getVoices();
    window.setTimeout(() => {
      if (settled) return;
      settled = true;
      synthesis.removeEventListener("voiceschanged", finish);
      resolve(englishVoices());
    }, 1500);
  });
  voiceLoad = pending.finally(() => {
    voiceLoad = null;
  });
  return voiceLoad;
}

export function prepareSpeech() {
  if (window.speechSynthesis) void loadEnglishVoices();
}

export async function speak(text: string, gender: Gender) {
  if (!window.speechSynthesis || !text) return;
  const synthesis = window.speechSynthesis;
  synthesis.cancel();
  const voices = await loadEnglishVoices();
  if (!voices.length) return;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  utterance.rate = 0.9;
  utterance.pitch = gender === "female" ? 1.08 : 0.9;
  const genderPattern = gender === "female" ? femaleVoices : maleVoices;
  const regionalVoices = voices.filter((voice) => /^en-US$/i.test(voice.lang));
  const googleVoices = voices.filter((voice) => /google/i.test(voice.name));
  const googleGenderPattern = gender === "female" ? /female|US English/i : /male/i;
  utterance.voice =
    googleVoices.find((voice) => googleGenderPattern.test(voice.name)) ||
    googleVoices.find((voice) => genderPattern.test(voice.name)) ||
    regionalVoices.find((voice) => genderPattern.test(voice.name)) ||
    voices.find((voice) => genderPattern.test(voice.name)) ||
    googleVoices[0] ||
    regionalVoices[0] ||
    voices[0];
  synthesis.speak(utterance);
}

export function stopSpeaking() {
  window.speechSynthesis?.cancel();
}
