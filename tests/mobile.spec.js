// @ts-check
// Phase 5: phone layouts (portrait and landscape), scrolling, readable text, and touch.
const { test, expect } = require("@playwright/test");

let consoleProblems;
test.beforeEach(async ({ page }) => {
  consoleProblems = [];
  page.on("console", (m) => { if (["error", "warning"].includes(m.type())) consoleProblems.push(m.text()); });
  page.on("pageerror", (e) => consoleProblems.push(String(e)));
  await page.goto("index.html");
  await expect(page.locator("#title")).toHaveText("Isaiah 53:1");
  await page.evaluate(() => document.fonts.ready);
});
test.afterEach(() => expect(consoleProblems).toEqual([]));

const portrait = (page) => page.viewportSize().width < page.viewportSize().height;

async function gotoVerse(page, n) {
  for (let i = 1; i < n; i++) await page.tap("#next");
  await expect(page.locator("#title")).toHaveText(`Isaiah 53:${n}`);
}

/** Scrolls an element to its bottom and reports whether it moved. */
const scrollsToBottom = (page, sel) => page.locator(sel).evaluate((el) => {
  el.scrollTop = el.scrollHeight;
  return { overflow: el.scrollHeight > el.clientHeight + 1, moved: el.scrollTop > 0, style: getComputedStyle(el).overflowY };
});

test("M1/M2 layout: panes fill the visible screen, split by orientation, page does not scroll sideways", async ({ page }) => {
  const vp = page.viewportSize();
  const left = await page.locator("#left").boundingBox();
  const right = await page.locator("#right").boundingBox();
  if (portrait(page)) {
    expect(left.width).toBeCloseTo(vp.width, 0);
    expect(right.width).toBeCloseTo(vp.width, 0);
    expect(right.y).toBeGreaterThanOrEqual(left.y + left.height - 1); // deep dive below the text
    expect(left.height + right.height).toBeCloseTo(vp.height, 0);
  } else {
    expect(right.x).toBeGreaterThanOrEqual(left.x + left.width - 1); // side by side
    expect(left.height).toBeCloseTo(vp.height, 0);
    expect(right.height).toBeCloseTo(vp.height, 0);
  }
  const page_ = await page.evaluate(() => ({
    overflowX: document.documentElement.scrollWidth - innerWidth,
    overflowY: document.documentElement.scrollHeight - innerHeight,
  }));
  expect(page_.overflowX).toBeLessThanOrEqual(0);
  expect(page_.overflowY).toBeLessThanOrEqual(0);
});

test("M1/M2 the text pane scrolls when the verse overflows, and the controls stay visible", async ({ page }) => {
  // A verse with its English tripled overflows at the minimum font size on any phone.
  await page.evaluate(() => {
    const data = structuredClone(window.studyPage.state.data);
    const v = data.verses.find((x) => x.number === 7);
    v.english = [...v.english, ...v.english, ...v.english];
    data.verses = [v];
    window.studyPage.load(data);
  });
  const r = await scrollsToBottom(page, "#text-area");
  expect(r.style).toBe("auto");
  expect(r.overflow).toBe(true);
  expect(r.moved).toBe(true);
  const controls = await page.locator("#controls").boundingBox();
  expect(controls.y).toBeGreaterThanOrEqual(0);
  await expect(page.locator("#next")).toBeInViewport();
  await expect(page.locator("#prev")).toBeInViewport();
  const overflowX = await page.locator("#text-area").evaluate((el) => el.scrollWidth - el.clientWidth);
  expect(overflowX).toBeLessThanOrEqual(0);
});

test("M1/M2 the deep-dive pane scrolls when the entry overflows", async ({ page }) => {
  await gotoVerse(page, 10);
  await page.tap('#hebrew .tok[data-g="v10-7"]'); // a long deep dive
  await expect(page.locator("#dive-pin")).toBeVisible();
  const r = await scrollsToBottom(page, "#right");
  expect(r.style).toBe("auto");
  expect(r.overflow).toBe(true);
  expect(r.moved).toBe(true);
});

test("M3 text never renders below the readable minimum on a phone", async ({ page }) => {
  for (let v = 1; v <= 12; v++) {
    const fs = await page.locator("#english").evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
    expect(fs, `verse ${v}`).toBeGreaterThanOrEqual(18);
    if (v < 12) await page.tap("#next");
  }
});

test("M4 tap pins a phrase and shows its deep dive; tapping again unpins and clears", async ({ page }) => {
  await page.tap('#hebrew .tok[data-g="v1-2"]');
  await expect(page.locator("#dive-pin")).toHaveText("Pinned (tap again to clear)");
  await expect(page.locator("#dive-translit")).toHaveText("heʾemin");
  await expect(page.locator('#english .tok[data-g="v1-2"]').first()).toHaveClass(/hl/);

  // Tapping another phrase moves the pin
  await page.tap('#english .tok[data-g="v1-5"] >> nth=1');
  await expect(page.locator("#dive-translit")).toHaveText("zeroaʿ");

  await page.tap('#english .tok[data-g="v1-5"] >> nth=1');
  await expect(page.locator("#right")).toBeEmpty();
  await expect(page.locator(".tok.hl")).toHaveCount(0);
});
