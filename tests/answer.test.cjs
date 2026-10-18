const { test } = require("node:test");
const assert = require("node:assert/strict");
const {
  steps,
  tutorial,
  people,
  sentence,
  correctPrefix,
  openingScript,
  finaleScript,
} = require("../work/test-build/story.js");
const { evaluate, wordBank } = require("../work/test-build/answer.js");
test("scenario contains all 18 requests, six per rank, with usable verb forms", () => {
  assert.equal(steps.length, 18);
  for (const rank of ["lower", "equal", "higher"])
    assert.equal(steps.filter((s) => people[s.person].rank === rank).length, 6);
  assert.equal(tutorial.length, 3);
  assert.equal(new Set(tutorial.map((s) => people[s.person].rank)).size, 3);
  for (const step of [...steps, ...tutorial]) {
    assert.ok(step.ing.endsWith("ing"));
    assert.equal(evaluate(sentence(step), step).kind, "correct");
    assert.equal(evaluate(correctPrefix(step), step).kind, "correct");
    const words = wordBank(step).map((x) => x.word.toLowerCase());
    for (const word of correctPrefix(step).toLowerCase().split(" "))
      assert.ok(words.includes(word));
  }
});
test("every spoken story beat is bilingual and every requested bubble asset is used", () => {
  for (const step of [...steps, ...tutorial]) {
    assert.ok(step.thoughtEn && step.thoughtJa);
    assert.ok(step.resultEn && step.resultJa);
    assert.ok(step.ja.includes(`(${step.verb})`));
  }
  for (const line of [...openingScript, ...finaleScript])
    assert.ok(line.en && line.ja);
  const bubbles = new Set([...steps, ...tutorial].map((step) => step.bubble));
  for (const required of [
    "bag",
    "tracks",
    "cloakedMan",
    "menagerieCrest",
    "record",
    "princessSeal",
    "brooch",
    "honeyCakes",
    "basket",
    "crown",
  ])
    assert.ok(bubbles.has(required), required);
});
test("all grammar-valid but socially wrong forms are choice mistakes", () => {
  for (const step of steps) {
    const forms = [
      ["lower", step.verb],
      ["equal", `Can you ${step.verb}`],
      ["higher", `Would you mind ${step.ing}`],
    ];
    for (const [rank, prefix] of forms) {
      const result = evaluate(prefix, step);
      assert.equal(
        result.kind,
        rank === people[step.person].rank ? "correct" : "choice",
      );
    }
  }
});
test("Would you plus base verb is a choice, and works naturally for a colleague", () => {
  for (const step of steps) {
    assert.equal(
      evaluate(`Would you ${step.verb}`, step).kind,
      people[step.person].rank === "equal" ? "correct" : "choice",
    );
  }
});
test("base versus ing is strictly distinguished while full spoken requests are accepted", () => {
  for (const step of steps) {
    for (const bad of [
      `Would you mind ${step.verb}`,
      `Can you ${step.ing}`,
      step.ing,
      `Could you ${step.verb}`,
      `I said ${correctPrefix(step)}`,
    ])
      assert.equal(evaluate(bad, step).kind, "grammar", bad);
    assert.equal(wordBank(step).some((entry) => entry.word === "Could"), false);
    assert.equal(evaluate(`${correctPrefix(step)} ${step.tail}`, step).kind, "correct");
    assert.equal(evaluate(`${correctPrefix(step)} ${step.tail}, please`, step).kind, "correct");
  }
});
test("case, punctuation, spaces and apostrophe variants work without changing the verb", () => {
  const step = steps[1];
  assert.equal(
    evaluate("  WOULD YOU MIND SHOWING me the guard's log?! ", step).kind,
    "correct",
  );
  assert.equal(
    evaluate("would you mind show me the guards log", step).kind,
    "grammar",
  );
  assert.equal(
    evaluate("would you mind showing me todays delivery list", steps[5]).kind,
    "correct",
  );
});
test("no transcript means no incorrect answer or NPC reaction", () => {
  for (const text of ["", "   ", "..."])
    assert.equal(evaluate(text, steps[0]).kind, "empty");
});
