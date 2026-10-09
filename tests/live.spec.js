// @ts-check
// Smoke test against the deployed site. Runs only when LIVE_URL is set, e.g.
//   LIVE_URL=https://nfitch.github.io/isaiah-53/ npx playwright test tests/live.spec.js
const { test, expect } = require("@playwright/test");

const LIVE_URL = process.env.LIVE_URL;

test("live site renders and shows a deep dive on hover", async ({ page }) => {
  test.skip(!LIVE_URL, "LIVE_URL not set");
  const json = await page.request.get(new URL("old-testament-isaiah-53.json", LIVE_URL).href);
  expect(json.status()).toBe(200);
  await page.goto(LIVE_URL);
  await expect(page.locator("#title")).toHaveText("Isaiah 53:1");
  await page.hover('#hebrew .tok[data-g="v1-2"]');
  await expect(page.locator("#dive-translit")).toHaveText("heʾemin");
});
