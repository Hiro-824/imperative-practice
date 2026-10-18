import { test, expect, type Page } from "@playwright/test";
import { correctPrefix, people, steps, tutorial } from "../lib/story";

const storageKey = "crown-quest-v1";

async function quiet(page: Page, inputMode: "voice" | "words" = "words") {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(({ inputMode }) => {
    localStorage.setItem(
      "crown-quest-v1",
      JSON.stringify({
        version: 1,
        settings: { gender: "male", name: "テスト騎士", inputMode, audio: false, tutorialDone: true },
        index: 0,
        clues: [],
        stats: { lower: 0, equal: 0, higher: 0, grammarMistakes: 0, choiceMistakes: 0 },
      }),
    );
  }, { inputMode });
}

async function next(page: Page, name: "次へ" | "もう一度" | "結果を見る" = "次へ") {
  const button = page.getByRole("button", { name: new RegExp(`^${name}`) });
  await expect(button).toBeEnabled();
  await button.click();
}

async function startMainStory(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "START", exact: true }).click();
  await next(page);
  await page.getByRole("button", { name: "今回は受けない" }).click();
  for (let index = 0; index < 9; index += 1) await next(page);
  await next(page);
}

async function chooseWords(page: Page, phrase: string) {
  for (const word of phrase.split(" ")) {
    await page.locator(".word-bank").getByRole("button", { name: new RegExp(`^${word}$`, "i") }).click();
  }
  await next(page);
}

test("all 18 requests follow thought, player request, then response", async ({ page }) => {
  test.setTimeout(90_000);
  await quiet(page);
  await startMainStory(page);

  await chooseWords(page, "Can you check");
  await expect(page.locator(".dialogue-ja")).toContainText("戸惑います");
  await expect(page.locator(".chapter-bar > span")).toContainText("01 / 18");
  await next(page, "もう一度");

  for (let index = 0; index < steps.length; index += 1) {
    if (index === 3) await expect(page.getByRole("img", { name: "外套の男" })).toHaveCount(0);
    await chooseWords(page, correctPrefix(steps[index]));
    if (index === 3) await expect(page.getByRole("img", { name: "外套の男" })).toBeVisible();
    await expect(page.getByText(steps[index].resultJa, { exact: true })).toBeVisible();
    await expect(page.getByText(steps[index].resultEn, { exact: true })).toBeVisible();
    await next(page);
    if (index < steps.length - 1) await next(page);
  }

  for (let index = 0; index < 4; index += 1) await next(page);
  await next(page, "結果を見る");
  await expect(page.getByText("QUEST COMPLETE")).toBeVisible();
  await expect(page.getByText("目下への依頼")).toBeVisible();
  await expect(page.getByText("同僚への依頼")).toBeVisible();
  await expect(page.getByText("目上への依頼")).toBeVisible();
  expect(await page.evaluate((key) => localStorage.getItem(key), storageKey)).toBeNull();
});

test("tutorial uses its three backgrounds and saves resumable progress", async ({ page }, testInfo) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.getByLabel("騎士の名前").fill("ミナ");
  await page.getByRole("button", { name: "男性" }).click();
  await page.getByRole("button", { name: "語句を選ぶ" }).click();
  await page.getByRole("button", { name: "START", exact: true }).click();
  const introStage = page.locator(".story-page > .interactive-stage");
  await expect(introStage).toBeVisible();
  await expect(introStage.locator(":scope > .dialogue-panel")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollHeight <= window.innerHeight)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath("intro-overlay-layout.png"), fullPage: false });
  await next(page);
  await page.getByRole("button", { name: "受ける", exact: true }).click();

  for (let index = 0; index < tutorial.length; index += 1) {
    await next(page);
    if (index === 1) {
      const bubbleImage = page.locator(".bubble-art img");
      const characterImage = page.locator(".stage-character img");
      await expect(bubbleImage).toBeVisible();
      await expect.poll(() => bubbleImage.evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(0);
      await expect(characterImage).toBeVisible();
      await expect.poll(() => characterImage.evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(0);
      expect(await page.evaluate(() => document.documentElement.scrollHeight <= window.innerHeight)).toBe(true);
      await page.screenshot({ path: testInfo.outputPath("tutorial-bag-layout.png"), fullPage: false });
    }
    await chooseWords(page, correctPrefix(tutorial[index]));
    await expect(page.getByText(tutorial[index].resultJa, { exact: true })).toBeVisible();
    await next(page);
  }
  for (let index = 0; index < 9; index += 1) await next(page);
  await next(page);
  await chooseWords(page, correctPrefix(steps[0]));
  await next(page);
  await page.reload();
  await page.getByRole("button", { name: /保存した場面 2 \/ 18 から再開/ }).click();
  await expect(page.locator(".chapter-bar > span")).toContainText("02 / 18");
});

test("audio defaults on and speaks English through an English voice", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(() => {
    const spoken: Array<{ text: string; lang: string; voiceLang: string; voiceName: string }> = [];
    const voices = [
      { name: "Japanese", lang: "ja-JP" },
      { name: "Alex", lang: "en-US" },
      { name: "Google UK English Male", lang: "en-GB" },
      { name: "Samantha", lang: "en-US" },
    ];
    class MockUtterance {
      text: string;
      lang = "";
      rate = 1;
      pitch = 1;
      voice: { name: string; lang: string } | null = null;
      constructor(text: string) { this.text = text; }
    }
    Object.defineProperty(window, "SpeechSynthesisUtterance", { value: MockUtterance, configurable: true });
    Object.defineProperty(window, "speechSynthesis", {
      configurable: true,
      value: {
        cancel() {},
        getVoices() { return voices; },
        addEventListener() {},
        removeEventListener() {},
        speak(utterance: MockUtterance) {
          spoken.push({ text: utterance.text, lang: utterance.lang, voiceLang: utterance.voice?.lang || "", voiceName: utterance.voice?.name || "" });
        },
      },
    });
    Object.assign(window, { spoken });
  });

  await page.goto("/");
  await expect(page.getByRole("switch")).toHaveAttribute("aria-checked", "true");
  await page.getByRole("button", { name: "男性" }).click();
  await page.getByRole("button", { name: "START", exact: true }).click();
  await expect.poll(() => page.evaluate(() => (window as unknown as { spoken: unknown[] }).spoken.length)).toBe(1);
  const spoken = await page.evaluate(() => (window as unknown as { spoken: Array<{ text: string; lang: string; voiceLang: string; voiceName: string }> }).spoken[0]);
  expect(spoken.text).toBe("This is the Kingdom of Eldoria. I am a young knight serving at the royal castle.");
  expect(spoken.lang).toBe("en-US");
  expect(spoken.voiceLang).toBe("en-GB");
  expect(spoken.voiceName).toBe("Google UK English Male");

  await next(page);
  await page.getByRole("button", { name: "今回は受けない" }).click();
  for (let index = 0; index < 7; index += 1) await next(page);
  await expect(page.locator(".dialogue-en")).toContainText("Leon, Elena");
  await expect(page.locator(".dialogue-ja")).toContainText("レオン、エレナ");
});

test("Would you plus a base verb is a choice issue except for a colleague", async ({ page }) => {
  await quiet(page);
  await startMainStory(page);
  await chooseWords(page, "Would you check");
  await expect(page.locator(".dialogue-ja")).toContainText("戸惑います");
  const stored = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), storageKey);
  expect(stored.stats.choiceMistakes).toBe(1);
  expect(stored.stats.grammarMistakes).toBe(0);
});

test("speech recognition accepts English and replies bilingually", async ({ page }) => {
  await quiet(page, "voice");
  await page.addInitScript(() => {
    const host = window as unknown as Record<string, unknown>;
    class MockRecognition {
      lang = "";
      interimResults = false;
      continuous = false;
      maxAlternatives = 1;
      onresult: ((event: unknown) => void) | null = null;
      onerror: ((event: unknown) => void) | null = null;
      onend: (() => void) | null = null;
      start() { host.recognitionMock = this; }
      stop() { this.onend?.(); }
      abort() { this.onend?.(); }
    }
    host.SpeechRecognition = MockRecognition;
  });
  await startMainStory(page);
  await page.getByRole("button", { name: "マイクで話す", exact: true }).click();
  await expect(page.getByLabel("音声認識の文字起こし")).toHaveText("");
  await page.evaluate(() => {
    const recognition = (window as unknown as { recognitionMock: { onresult: (event: unknown) => void } }).recognitionMock;
    recognition.onresult({ results: [[{ transcript: "CHECK THE FLOOR!" }]] });
  });
  await expect(page.getByLabel("音声認識の文字起こし")).toHaveText("CHECK THE FLOOR!");
  await page.getByRole("button", { name: /次へ/ }).click();
  await expect(page.getByText(steps[0].resultEn, { exact: true })).toBeVisible();
  await expect(page.getByText(steps[0].resultJa, { exact: true })).toBeVisible();
  await expect(page.locator(".speaker-line strong")).toHaveText(people.thomas.ja);
});
