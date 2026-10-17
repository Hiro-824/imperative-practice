import { test, expect, type Page } from "@playwright/test";
import { correctPrefix, steps, tutorial } from "../lib/story";
const key = "crown-quest-v1";
async function quiet(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem(
      "crown-quest-v1",
      JSON.stringify({
        version: 1,
        settings: { gender: "male", audio: false, tutorialDone: false },
        index: 0,
        completed: false,
        mistakes: 0,
        clues: [],
      }),
    );
  });
}
async function start(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "物語をはじめる" }).click();
  await page.getByRole("button", { name: "物語へ進む" }).click();
}
async function words(page: Page, phrase: string) {
  for (const word of phrase.split(" "))
    await page
      .locator(".word-bank")
      .getByRole("button", { name: new RegExp("^" + word + "$", "i") })
      .click();
  await page.getByRole("button", { name: "このことばで伝える" }).click();
}

test("complete all 18 requests, NPC retries, grammar retry, drag and keyboard reorder", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await quiet(page);
  await start(page);
  await page
    .getByRole("button", { name: "声が出せませんか？ 語句で組み立てる" })
    .click();
  // Polite but socially wrong: NPC responds and the story remains on the same request.
  await words(page, "Can you check");
  await expect(page.getByText("トーマスの反応")).toBeVisible();
  await expect(page.locator(".step-count strong")).toHaveText("01");
  await page.getByRole("button", { name: "もう一度伝える" }).click();
  // Drag a bank word into the answer area, then remove it by tapping.
  await page
    .locator(".word-bank")
    .getByRole("button", { name: "check", exact: true })
    .dragTo(page.locator(".word-answer"));
  await expect(page.getByRole("button", { name: "checkを戻す" })).toBeVisible();
  await page.getByRole("button", { name: "checkを戻す" }).click();
  for (let i = 0; i < 18; i++) {
    const phrase = correctPrefix(steps[i]);
    if (i === 1) {
      await words(page, "Would you mind show");
      await expect(page.getByText("ことばの形を確認しよう")).toBeVisible();
      await expect(page.locator(".scene")).not.toHaveClass(/acted/);
      await page.getByRole("button", { name: "もう一度伝える" }).click();
      // Assemble out of order, then correct it with accessible reorder controls.
      for (const w of ["Would", "mind", "you", "showing"])
        await page
          .locator(".word-bank")
          .getByRole("button", { name: w, exact: true })
          .click();
      await page.getByRole("button", { name: "youを左へ" }).click();
      await page.getByRole("button", { name: "このことばで伝える" }).click();
    } else await words(page, phrase);
    await expect(page.getByText("ことばが、届いた。")).toBeVisible();
    await expect(page.locator(".result-narration")).toHaveText(steps[i].result);
    if (i === 9)
      await expect(page.locator(".crate-front")).toHaveClass(/moved/);
    if (i === 11) await expect(page.locator(".dragon-prop")).toBeVisible();
    if (i === 1 && process.env.CAPTURE)
      await page.screenshot({ path: "work/desktop-final.png", fullPage: true });
    await page
      .getByRole("button", {
        name: i === 17 ? "エンディングへ" : "物語を進める",
      })
      .click();
  }
  await expect(page.getByText("QUEST COMPLETE")).toBeVisible();
  await expect(page.getByText("18 / 18", { exact: true })).toBeVisible();
  expect(
    await page.evaluate(
      (k) => JSON.parse(localStorage.getItem(k)!).completed,
      key,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
});

test("mobile tutorial, preferences, saved progress and resume survive reload", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page
    .getByRole("button", { name: "読み上げをオフ", exact: true })
    .click();
  await page.getByRole("button", { name: "男性の騎士" }).click();
  if (process.env.CAPTURE)
    await page.screenshot({ path: "work/home-mobile.png", fullPage: true });
  await page.getByRole("button", { name: "物語をはじめる" }).click();
  await page.getByRole("button", { name: "3回の練習で試してみる" }).click();
  await page
    .getByRole("button", { name: "声が出せませんか？ 語句で組み立てる" })
    .click();
  for (let i = 0; i < 3; i++) {
    await words(page, correctPrefix(tutorial[i]));
    await page
      .getByRole("button", { name: i === 2 ? "王冠の物語へ" : "物語を進める" })
      .click();
  }
  await expect(page.locator(".step-count strong")).toHaveText("01");
  await words(page, "check");
  await page.getByRole("button", { name: "物語を進める" }).click();
  await page.reload();
  await page.getByRole("button", { name: "続きから" }).click();
  await expect(page.locator(".step-count strong")).toHaveText("02");
  await expect(page.locator(".voice-input")).toBeVisible(); // voice is the default at next launch
  await page
    .getByRole("button", { name: "声が出せませんか？ 語句で組み立てる" })
    .click();
  await words(page, "Would you mind showing");
  if (process.env.CAPTURE)
    await page.screenshot({ path: "work/mobile-final.png", fullPage: true });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "設定", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "男性の騎士" }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "閉じる", exact: true }).click();
  const stored = await page.evaluate(
    (k) => JSON.parse(localStorage.getItem(k)!),
    key,
  );
  expect(stored.settings.tutorialDone).toBe(true);
  expect(stored.settings.audio).toBe(false);
  expect(stored.settings.gender).toBe("male");
});

test("speech adapter: silence and network failure are retries, full sentence is accepted", async ({
  page,
}) => {
  await quiet(page);
  await page.addInitScript(() => {
    const w = window as unknown as Record<string, unknown>;
    class MockRecognition {
      lang = "";
      interimResults = false;
      continuous = false;
      maxAlternatives = 1;
      onresult: ((e: unknown) => void) | null = null;
      onerror: ((e: unknown) => void) | null = null;
      onend: (() => void) | null = null;
      start() {
        w.recognitionMock = this;
      }
      stop() {
        this.onend?.();
      }
      abort() {
        this.onend?.();
      }
    }
    w.SpeechRecognition = MockRecognition;
  });
  await start(page);
  await page.getByRole("button", { name: "マイクで話す", exact: true }).click();
  await page.evaluate(() => {
    const r = (window as unknown as { recognitionMock: { onend: () => void } })
      .recognitionMock;
    r.onend();
  });
  await expect(
    page.getByText("聞き取れませんでした。もう一度言ってみましょう。", {
      exact: true,
    }),
  ).toBeVisible();
  await page.getByRole("button", { name: "マイクで話す", exact: true }).click();
  await page.evaluate(() => {
    const r = (
      window as unknown as {
        recognitionMock: {
          onerror: (e: { error: string }) => void;
          onend: () => void;
        };
      }
    ).recognitionMock;
    r.onerror({ error: "network" });
    r.onend();
  });
  await expect(page.getByText(/音声認識に接続できません/)).toBeVisible();
  await expect(page.locator(".step-count strong")).toHaveText("01");
  await page.getByRole("button", { name: "マイクで話す", exact: true }).click();
  await page.evaluate(() => {
    const r = (
      window as unknown as {
        recognitionMock: { onresult: (e: unknown) => void; onend: () => void };
      }
    ).recognitionMock;
    r.onresult({ results: [[{ transcript: "CHECK THE FLOOR!" }]] });
    r.onend();
  });
  await expect(page.getByText("ことばが、届いた。")).toBeVisible();
  expect(
    await page.evaluate(
      (k) => JSON.parse(localStorage.getItem(k)!).mistakes,
      key,
    ),
  ).toBe(0);
});

test("unsupported speech browsers can finish a request with words", async ({
  page,
}) => {
  await quiet(page);
  await page.addInitScript(() => {
    const w = window as unknown as Record<string, unknown>;
    w.SpeechRecognition = undefined;
    w.webkitSpeechRecognition = undefined;
  });
  await start(page);
  await expect(
    page.getByText("このブラウザは音声入力に対応していません"),
  ).toBeVisible();
  await page.getByRole("button", { name: "語句モードで続ける" }).click();
  await words(page, "check");
  await expect(page.getByText("ことばが、届いた。")).toBeVisible();
});
