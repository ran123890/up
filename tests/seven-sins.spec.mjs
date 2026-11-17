import { expect, test } from "@playwright/test";

test("the 21 randomized questions require answers and score all seven dimensions", async ({ page }) => {
  await page.addInitScript(() => {
    Math.random = () => 0;
  });
  await page.goto("/up/seven-sins-test/");
  await page.getByRole("button", { name: /开始 21 题/ }).click();

  await expect(page.getByRole("heading", { level: 1 })).toHaveText("别人指出我的问题时，我第一反应通常是解释自己为什么没错。");
  const progress = page.getByRole("progressbar", { name: "答题进度" });
  await expect(progress).toHaveAttribute("aria-valuenow", "1");
  await page.locator('[data-answer="1"]').click();
  await expect(progress).toHaveAttribute("aria-valuenow", "2");

  for (let question = 1; question < 21; question += 1) {
    await page.locator(`[data-answer="${(Math.floor(question / 3) % 5) + 1}"]`).click();
    if (question === 20) {
      await expect(page.locator("#result-title")).toHaveText("贪婪 · 占有欲");
    } else {
      await expect(progress).toHaveAttribute("aria-valuenow", String(question + 2));
    }
  }

  await expect(page.locator(".score-row")).toHaveCount(7);
  for (const [dimension, score] of [
    ["贪婪｜占有欲：14 分", 14],
    ["懒惰｜拖延逃避：11 分", 11],
    ["暴怒｜情绪爆点：8 分", 8],
    ["暴食｜即时享乐：7 分", 7],
    ["嫉妒｜比较心：5 分", 5],
    ["色欲｜心动与亲密关系：5 分", 5],
    ["傲慢｜自我优越感：4 分", 4],
  ]) {
    await expect(page.locator(`.score-row[aria-label="${dimension}"] .score-value`)).toHaveText(String(score));
  }

  await page.getByRole("button", { name: "重测" }).click();
  await page.getByRole("button", { name: /开始 21 题/ }).click();
  await expect(progress).toHaveAttribute("aria-valuenow", "1");
});

test("the result can be shared with the native share sheet", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "share", {
      configurable: true,
      value: async (payload) => {
        window.sharedResult = payload;
      },
    });
  });
  await page.goto("/up/seven-sins-test/");
  await page.getByRole("button", { name: /开始 21 题/ }).click();
  for (let question = 0; question < 21; question += 1) {
    await page.locator('[data-answer="3"]').click();
  }

  await page.getByRole("button", { name: /分享我的结果/ }).click();
  await expect(page.getByRole("status")).toContainText("分享面板已打开。");
  expect(await page.evaluate(() => window.sharedResult.text)).toContain("娱乐自测，不是心理诊断");
});
