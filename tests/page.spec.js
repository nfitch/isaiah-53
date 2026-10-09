// @ts-check
const { test, expect } = require("@playwright/test");
const fs = require("fs");
const path = require("path");

const heb = (g) => `#hebrew .tok[data-g="${g}"]`;
const eng = (g) => `#english .tok[data-g="${g}"]`;

let consoleProblems;
test.beforeEach(async ({ page }) => {
  consoleProblems = [];
  page.on("console", (m) => { if (["error", "warning"].includes(m.type())) consoleProblems.push(m.text()); });
  page.on("pageerror", (e) => consoleProblems.push(String(e)));
  await page.goto("index.html");
  await expect(page.locator("#title")).toHaveText("Isaiah 53:1");
  await page.evaluate(() => document.fonts.ready);
});

/** Navigate with the arrow keys from the current verse to verse n. */
async function gotoVerse(page, n) {
  const current = async () => Number((await page.locator("#title").textContent()).split(":")[1]);
  while ((await current()) !== n) await page.keyboard.press((await current()) < n ? "ArrowRight" : "ArrowLeft");
}

// F11: checked after every test, so it covers load and all interactions.
test.afterEach(() => expect(consoleProblems).toEqual([]));

/** Replace the page's data with a modified copy of verse 11 alone (for cases the transcript lacks). */
async function loadFixture(page, edit) {
  await page.evaluate((src) => {
    const data = structuredClone(window.studyPage.state.data);
    data.verses = data.verses.filter((v) => v.number === 11);
    new Function("data", src)(data);
    window.studyPage.load(data);
  }, edit);
}

test("F1 layout: 60/40 panes, control bar order, Hebrew above English", async ({ page }) => {
  const vw = page.viewportSize().width;
  const left = await page.locator("#left").boundingBox();
  const right = await page.locator("#right").boundingBox();
  expect(Math.abs(left.width - vw * 0.6)).toBeLessThan(2);
  expect(Math.abs(right.width - vw * 0.4)).toBeLessThan(2);
  expect(right.x).toBeGreaterThanOrEqual(left.x + left.width - 1);

  await expect(page.locator("#toggle-label")).toHaveText(/Mosiah 14/);
  const x = async (sel) => (await page.locator(sel).boundingBox()).x;
  expect(await x("#prev")).toBeLessThan(await x("#title"));
  expect(await x("#title")).toBeLessThan(await x("#toggle"));
  expect(await x("#toggle")).toBeLessThan(await x("#next"));

  const y = async (sel) => (await page.locator(sel).boundingBox()).y;
  expect(await y("#controls")).toBeLessThan(await y("#hebrew"));
  expect(await y("#hebrew")).toBeLessThan(await y("#english"));
});

test("F2 Hebrew is RTL in Noto Serif Hebrew; word segments join but hover separately", async ({ page }) => {
  await gotoVerse(page, 11);
  const hebrew = page.locator("#hebrew");
  await expect(hebrew).toHaveCSS("direction", "rtl");
  expect(await hebrew.evaluate((el) => getComputedStyle(el).fontFamily)).toContain("Noto Serif Hebrew");
  expect(await page.evaluate(() => document.fonts.check('20px "Noto Serif Hebrew"', "א"))).toBe(true);

  // First word מֵעֲמַל is two segments with nothing between them.
  const firstWord = page.locator("#hebrew .word").first();
  expect(await firstWord.evaluate((w) => [...w.childNodes].map((n) => n.textContent))).toEqual(["מֵ", "עֲמַל"]);

  await page.hover(heb("v11-2"));
  await expect(page.locator(heb("v11-2"))).toHaveClass(/hl/);
  await expect(page.locator(heb("v11-1"))).not.toHaveClass(/hl/);
  await page.hover(heb("v11-1"));
  await expect(page.locator(heb("v11-1"))).toHaveClass(/hl/);
  await expect(page.locator(heb("v11-2"))).not.toHaveClass(/hl/);
});

test("F3 KJV italic tokens render in italics", async ({ page }) => {
  await loadFixture(page, `data.verses[0].english[5].italic = true;`); // "travail"
  const tok = page.locator("#english .tok").nth(5);
  await expect(tok).toHaveText("travail");
  await expect(tok).toHaveCSS("font-style", "italic");
  await expect(page.locator("#english .tok").nth(4)).toHaveCSS("font-style", "normal");
});

test("F4 Mosiah toggle: removed struck through, added shown in the Mosiah color", async ({ page }) => {
  await loadFixture(page, `
    const en = data.verses[0].english;
    en.splice(1, 0, { text: "surely", align: "v11-4", diff: "added" });`);
  const removed = page.locator("#english .tok.removed[data-g]"); // the removed word "of"
  const added = page.locator('#english .tok.added[data-g="v11-4"]'); // the fixture's added word
  await expect(removed).toHaveText("of");

  // Off
  await expect(page.locator("#toggle")).not.toBeChecked();
  expect(await removed.evaluate((el) => getComputedStyle(el).textDecorationLine)).toBe("none");
  await expect(added).toBeHidden();

  // On
  await page.locator("#toggle").check();
  expect(await removed.evaluate((el) => getComputedStyle(el).textDecorationLine)).toBe("line-through");
  await expect(added).toBeVisible();
  const addedColor = await page.evaluate(() => {
    const probe = document.createElement("span");
    probe.style.color = "var(--added)";
    document.body.append(probe);
    const c = getComputedStyle(probe).color;
    probe.remove();
    return c;
  });
  await expect(added).toHaveCSS("color", addedColor);
  await expect(page.locator("#english .tok:not(.added):not(.removed)").first()).not.toHaveCSS("color", addedColor);
});

test("F5 hover highlights the group in both languages and shows its deep dive", async ({ page }) => {
  await gotoVerse(page, 11);
  // Hebrew -> English
  await page.hover(heb("v11-2"));
  await expect(page.locator(".tok.hl")).toHaveCount(3); // עֲמַל + "the" + "travail"
  await expect(page.locator(eng("v11-2"))).toHaveText(["the", "travail"]);
  await expect(page.locator(eng("v11-2")).first()).toHaveClass(/hl/);
  await expect(page.locator("#dive-rendering")).toHaveText("“the travail”");
  await expect(page.locator('#english .gap[data-gap="v11-2"]')).toHaveClass(/hl/); // space inside the phrase

  // English -> Hebrew, discontinuous group ("shall ... justify")
  await page.hover(`${eng("v11-8")} >> nth=1`);
  await expect(page.locator(".tok.hl")).toHaveCount(3);
  await expect(page.locator(eng("v11-8"))).toHaveText(["shall", "justify"]);
  await expect(page.locator(heb("v11-8"))).toHaveClass(/hl/);
  await expect(page.locator("#dive-hebrew")).toHaveText("יַצְדִּיק");

  // Off a token clears it
  await page.hover("#title");
  await expect(page.locator(".tok.hl")).toHaveCount(0);
  await expect(page.locator("#right")).toBeEmpty();
});

test("F5 moving into the deep-dive pane keeps the hovered group", async ({ page }) => {
  await gotoVerse(page, 11);
  await page.hover(heb("v11-2"));
  await page.hover("#right");
  await expect(page.locator("#dive-rendering")).toHaveText("“the travail”");
});

test("F6 click pins, hover is ignored while pinned, click again or Esc unpins, click elsewhere moves the pin", async ({ page }) => {
  await gotoVerse(page, 11);
  await page.click(heb("v11-2"));
  await expect(page.locator("#dive-pin")).toHaveText("Pinned (Esc to clear)");
  await page.hover(heb("v11-3"));
  await expect(page.locator("#dive-rendering")).toHaveText("“the travail”");
  await expect(page.locator(heb("v11-3"))).not.toHaveClass(/hl/);

  // Click the pinned group again (through its English token) to unpin
  await page.click(`${eng("v11-2")} >> nth=1`);
  await expect(page.locator("#dive-pin")).toHaveCount(0);

  // Esc unpins
  await page.click(heb("v11-3"));
  await expect(page.locator("#dive-pin")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator("#dive-pin")).toHaveCount(0);

  // Clicking a different group moves the pin
  await page.click(heb("v11-3"));
  await page.click(heb("v11-7"));
  await page.hover("#title");
  await expect(page.locator("#dive-pin")).toBeVisible();
  await expect(page.locator("#dive-rendering")).toHaveText("“his knowledge”");
});

test("F7 right pane: empty when idle, full and straightforward entries, Mosiah note", async ({ page }) => {
  await gotoVerse(page, 11);
  await expect(page.locator("#right")).toBeEmpty();

  await page.hover(heb("v11-2"));
  await expect(page.locator("#dive-hebrew")).toHaveText("עֲמַל");
  await expect(page.locator("#dive-translit")).toHaveText("ʿamal");
  await expect(page.locator("#dive-body")).toContainText("Root:");
  await expect(page.locator("#dive-body .he").first()).toHaveText("עָמַל");
  await expect(page.locator("#dive-mosiah h2")).toHaveText("Mosiah 14:11");
  await expect(page.locator("#dive-mosiah")).toContainText("the travail of his soul");

  await page.hover(heb("v11-13")); // וַ "for", straightforward
  await expect(page.locator("#dive-hebrew")).toHaveText("וַ");
  await expect(page.locator("#dive-translit")).toHaveText("va");
  await expect(page.locator("#dive-rendering")).toHaveText("“for”");
  await expect(page.locator("#dive-body")).toContainText("straightforward");
  await expect(page.locator("#dive-mosiah")).toBeVisible();
});

test("F8 navigation: buttons and arrow keys, disabled at the ends, pin cleared, toggle kept", async ({ page }) => {
  await expect(page.locator("#prev")).toBeDisabled();
  await expect(page.locator("#next")).toBeEnabled();
  await page.locator("#toggle").check();
  await page.click(heb("v1-2"));
  await expect(page.locator("#dive-pin")).toBeVisible();

  await page.click("#next");
  await expect(page.locator("#title")).toHaveText("Isaiah 53:2");
  await expect(page.locator("#prev")).toBeEnabled();
  await expect(page.locator("#toggle")).toBeChecked();
  await expect(page.locator("#english")).toHaveClass(/diff-on/);
  await page.hover("#title");
  await expect(page.locator("#right")).toBeEmpty();
  await expect(page.locator(".tok.hl")).toHaveCount(0);

  await page.keyboard.press("ArrowLeft");
  await expect(page.locator("#title")).toHaveText("Isaiah 53:1");
  await page.keyboard.press("ArrowLeft"); // already at the start
  await expect(page.locator("#title")).toHaveText("Isaiah 53:1");

  await gotoVerse(page, 12);
  await expect(page.locator("#next")).toBeDisabled();
  await page.keyboard.press("ArrowRight"); // already at the end
  await expect(page.locator("#title")).toHaveText("Isaiah 53:12");
});

for (const viewport of [{ width: 1280, height: 800 }, { width: 1920, height: 1080 }]) {
  test(`F9 text fills the pane without horizontal scrolling at ${viewport.width}x${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    for (let verse = 1; verse <= 12; verse++) {
      for (const diff of [false, true]) {
        await page.locator("#toggle").setChecked(diff);
        await page.waitForTimeout(100); // let the ResizeObserver settle
        const m = await page.evaluate(() => {
          const area = document.getElementById("text-area");
          const text = document.getElementById("text");
          return {
            docOverflowX: document.documentElement.scrollWidth - window.innerWidth,
            areaOverflowX: area.scrollWidth - area.clientWidth,
            areaOverflowY: area.scrollHeight - area.clientHeight,
            fill: text.offsetHeight / area.clientHeight,
            fs: parseFloat(getComputedStyle(document.getElementById("english")).fontSize),
          };
        });
        const where = `verse ${verse}, diff ${diff}: ${JSON.stringify(m)}`;
        expect(m.docOverflowX, where).toBeLessThanOrEqual(0);
        expect(m.areaOverflowX, where).toBeLessThanOrEqual(0);
        expect(m.areaOverflowY, where).toBeLessThanOrEqual(0);
        expect(m.fill, where).toBeGreaterThan(0.85);
        expect(m.fs, where).toBeGreaterThan(20);
      }
      if (verse < 12) await page.click("#next");
    }
  });
}

for (const colorScheme of ["light", "dark"]) {
  test(`F10 ${colorScheme} color scheme follows the system setting`, async ({ page }) => {
    await page.emulateMedia({ colorScheme });
    const luminance = await page.evaluate(() => {
      const [r, g, b] = getComputedStyle(document.body).backgroundColor.match(/\d+/g).map(Number);
      return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
    });
    if (colorScheme === "dark") expect(luminance).toBeLessThan(0.2);
    else expect(luminance).toBeGreaterThan(0.8);
  });
}

test("F12 every local asset reference is relative", async () => {
  const html = fs.readFileSync(path.join(__dirname, "..", "static", "index.html"), "utf8");
  const refs = [...html.matchAll(/\b(?:src|href)="([^"]*)"/g)].map((m) => m[1]);
  const rootAbsolute = refs.filter((r) => r.startsWith("/") && !r.startsWith("//"));
  expect(rootAbsolute).toEqual([]);
  expect(html).not.toMatch(/fetch\(\s*["'`]\//);
});
