import { test, expect, type Page } from "@playwright/test";
import { correctPrefix, people, steps, tutorial } from "../lib/story";
const key = "crown-quest-v1";
async function quiet(
  page: Page,
  options: {
    tutorialDone?: boolean;
    inputMode?: "voice" | "words";
  } = {},
) {
  const { tutorialDone = true, inputMode = "words" } = options;
  await page.addInitScript(({ inputMode, tutorialDone }) => {
    localStorage.setItem(
      "crown-quest-v1",
      JSON.stringify({
        version: 1,
        settings: {
          gender: "male",
          inputMode,
          audio: false,
          tutorialDone,
        },
        index: 0,
        completed: false,
        mistakes: 0,
        clues: [],
      }),
    );
  }, { inputMode, tutorialDone });
}
async function start(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "物語をはじめる" }).click();
  await page.getByRole("button", { name: "本編から始める" }).click();
  await advanceToInput(page);
}
async function advanceToInput(page: Page) {
  const next = page.getByRole("button", { name: "次へ" });
  await expect(next).toBeEnabled();
  await next.click();
  await expect(next).toBeEnabled();
  await next.click();
}
async function words(page: Page, phrase: string) {
  for (const word of phrase.split(" "))
    await page
      .locator(".word-bank")
      .getByRole("button", { name: new RegExp("^" + word + "$", "i") })
      .click();
  await page.getByRole("button", { name: "このことばで伝える" }).click();
}

test("complete all 18 requests with one-message RPG turns and NPC retries", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await quiet(page);
  await start(page);
  await expect(page.getByRole("button", { name: "次へ" })).toBeDisabled();
  // Polite but socially wrong: NPC responds and the story remains on the same request.
  await words(page, "Can you check");
  await expect(page.locator(".rpg-speaker")).toHaveText("トーマス");
  await expect(page.locator(".rpg-message")).toContainText("戸惑います");
  await expect(page.locator(".step-count strong")).toHaveText("01");
  await page.getByRole("button", { name: "もう一度" }).click();
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
      await expect(page.locator(".rpg-speaker")).toHaveText("私");
      await expect(page.locator(".rpg-message")).toContainText("言葉の形を確認");
      await expect(page.locator(".scene")).not.toHaveClass(/acted/);
      await page.getByRole("button", { name: "もう一度" }).click();
      await expect(page.locator(".reorder-buttons")).toHaveCount(0);
      await words(page, "Would you mind showing");
    } else await words(page, phrase);
    await expect(page.locator(".rpg-speaker")).toHaveText(
      people[steps[i].person].ja,
    );
    await expect(page.locator(".rpg-message")).toContainText(
      steps[i].result.replace(/[「」]/g, ""),
    );
    if (i === 9)
      await expect(page.locator(".crate-front")).toHaveClass(/moved/);
    if (i === 11) await expect(page.locator(".dragon-prop")).toBeVisible();
    if (i === 1 && process.env.CAPTURE)
      await page.screenshot({ path: "work/desktop-final.png", fullPage: true });
    await page
      .getByRole("button", {
        name: i === 17 ? "エンディングへ" : "次へ",
      })
      .click();
    if (i < 17) await advanceToInput(page);
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
  await expect(page.locator(".player-preview .player-knight")).toBeVisible();
  await expect(page.locator(".site-header")).toHaveCount(0);
  await expect(page.locator(".start-dock")).toHaveCSS("position", "fixed");
  await page.getByRole("switch").click();
  await page.getByRole("button", { name: "男性の騎士" }).click();
  await page.getByRole("button", { name: /語句を選ぶ/ }).click();
  if (process.env.CAPTURE)
    await page.screenshot({ path: "work/home-mobile.png", fullPage: true });
  await page.getByRole("button", { name: "物語をはじめる" }).click();
  await page.getByRole("button", { name: "チュートリアルへ" }).click();
  for (let i = 0; i < 3; i++) {
    await advanceToInput(page);
    await words(page, correctPrefix(tutorial[i]));
    await page
      .getByRole("button", { name: i === 2 ? "本編へ" : "次へ" })
      .click();
  }
  await expect(page.locator(".step-count strong")).toHaveText("01");
  await advanceToInput(page);
  await words(page, "check");
  await page.getByRole("button", { name: "次へ" }).click();
  await page.reload();
  await page.getByRole("button", { name: /保存した場面 2 \/ 18 から再開/ }).click();
  await expect(page.locator(".step-count strong")).toHaveText("02");
  await advanceToInput(page);
  await expect(page.locator(".word-input")).toBeVisible();
  expect(
    await page.locator(".rpg-turn-panel").evaluate(
      (panel) => panel.scrollHeight <= panel.clientHeight,
    ),
  ).toBe(true);
  if (process.env.CAPTURE)
    await page.screenshot({ path: "work/mobile-input.png", fullPage: true });
  await words(page, "Would you mind showing");
  await expect(page.getByRole("button", { name: "次へ" })).toBeEnabled();
  if (process.env.CAPTURE)
    await page.screenshot({ path: "work/mobile-final.png", fullPage: true });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  const stored = await page.evaluate(
    (k) => JSON.parse(localStorage.getItem(k)!),
    key,
  );
  expect(stored.settings.tutorialDone).toBe(true);
  expect(stored.settings.audio).toBe(false);
  expect(stored.settings.gender).toBe("male");
  expect(stored.settings.inputMode).toBe("words");
});

test("speech adapter: silence and network failure are retries, full sentence is accepted", async ({
  page,
}) => {
  await quiet(page, { inputMode: "voice" });
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
  await expect(page.locator(".rpg-message")).toContainText(
    steps[0].result.replace(/[「」]/g, ""),
  );
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
  await quiet(page, { inputMode: "voice" });
  await page.addInitScript(() => {
    const w = window as unknown as Record<string, unknown>;
    w.SpeechRecognition = undefined;
    w.webkitSpeechRecognition = undefined;
  });
  await start(page);
  await expect(page.locator(".word-input")).toBeVisible();
  await words(page, "check");
  await expect(page.locator(".rpg-message")).toContainText(
    steps[0].result.replace(/[「」]/g, ""),
  );
});
