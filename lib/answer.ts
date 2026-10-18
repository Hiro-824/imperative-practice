import { people, type Step, type Rank } from "./story";

export function normalize(text: string) {
  return text.toLowerCase().normalize("NFKC").replace(/[’‘']/g, "").replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

export type Answer =
  | { kind: "correct"; rank: Rank }
  | { kind: "choice"; rank: Rank; messageEn: string; messageJa: string }
  | { kind: "grammar" | "empty"; messageEn: string; messageJa: string };

export function evaluate(text: string, step: Step): Answer {
  const value = normalize(text);
  if (!value) return { kind: "empty", messageEn: "I could not hear you. Please try again.", messageJa: "聞き取れませんでした。もう一度言ってみましょう。" };
  const matches = (prefix: string) => {
    const normalizedPrefix = normalize(prefix);
    return value === normalizedPrefix || value.startsWith(`${normalizedPrefix} `);
  };
  const expected = people[step.person].rank;

  if (matches(`would you ${step.verb}`)) {
    if (expected === "equal") return { kind: "correct", rank: "equal" };
    return expected === "lower"
      ? { kind: "choice", rank: "equal", messageEn: "Would you? That is unusually polite for an order to me. Please tell me directly.", messageJa: "『Would you...?』だなんて、私への命令にしては丁寧すぎて戸惑います。いつもどおり、はっきり指示してください。" }
      : { kind: "choice", rank: "equal", messageEn: "Remember your station. Address a senior noble with greater respect.", messageJa: "身分をわきまえなさい。上級貴族には、さらに敬意をこめて頼むのだ。" };
  }

  const forms: [Rank, string][] = [["lower", step.verb], ["equal", `can you ${step.verb}`], ["higher", `would you mind ${step.ing}`]];
  const found = forms.find(([, prefix]) => matches(prefix));
  if (!found) return { kind: "grammar", messageEn: "Check the verb form. Use the base verb after ‘Can you,’ and the -ing form after ‘Would you mind.’", messageJa: "動詞の形を確認しましょう。Can you の後は動詞の原形、Would you mind の後は ing形です。" };

  const actual = found[0];
  if (actual === expected) return { kind: "correct", rank: actual };
  if (expected === "lower") return { kind: "choice", rank: actual, messageEn: "That is so polite that I am not sure how to respond. Please give me a clear instruction.", messageJa: "そんなに丁寧に頼まれると戸惑います……。いつもどおり、はっきり指示してください。" };
  if (expected === "equal") return {
    kind: "choice", rank: actual,
    messageEn: actual === "lower" ? "That sounds rather abrupt. Ask me as a fellow knight." : "That sounds too formal. We are fellow knights, remember?",
    messageJa: actual === "lower" ? "今日はぶっきらぼうね。同僚として頼んでほしいわ。" : "ずいぶん改まっているのね。私たち、同じ騎士でしょう？",
  };
  return {
    kind: "choice", rank: actual,
    messageEn: actual === "equal" ? "Remember your station. Ask me with the respect due to a senior noble." : "Mind your manners. Address a senior noble properly.",
    messageJa: actual === "equal" ? "もう少し身分をわきまえた頼み方があるだろう。丁寧に言い直してもらおうか。" : "身分をわきまえなさい。上級貴族には敬意をこめて頼むのだ。",
  };
}

export function wordBank(step: Step) {
  return ["Would", "you", "mind", step.verb, "Can", step.ing, "to", "is"].map((word, id) => ({ word, id }));
}
