// @ts-check
// C5: structural rules for the generated chapter data.
const { test, expect } = require("@playwright/test");
const fs = require("fs");
const path = require("path");

const data = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "static", "old-testament-isaiah-53.json"), "utf8"));

test("verses run 1-12 in order", () => {
  expect(data.verses.map((v) => v.number)).toEqual([...Array(12)].map((_, i) => i + 1));
});

test("alignment ids are unique and every deep dive reference resolves", () => {
  const ids = data.verses.flatMap((v) => v.alignments.map((a) => a.id));
  expect(new Set(ids).size).toBe(ids.length);
  for (const v of data.verses) for (const a of v.alignments) expect(data.deepDives[a.deepDive], a.id).toBeDefined();
});

for (const v of data.verses) {
  test(`verse ${v.number}: tokens reference the verse's own groups`, () => {
    const groups = new Set(v.alignments.map((a) => a.id));
    for (const t of [...v.hebrew, ...v.english]) if (t.align !== null) expect(groups.has(t.align), `${t.text} -> ${t.align}`).toBe(true);
  });

  test(`verse ${v.number}: every group has Hebrew; every English word is aligned`, () => {
    const hebrewGroups = new Set(v.hebrew.map((t) => t.align));
    for (const a of v.alignments) expect(hebrewGroups.has(a.id), a.id).toBe(true);
    for (const t of v.english) {
      if (t.punct) expect(t.align, `punctuation ${t.text}`).toBeNull();
      else if (t.diff !== "added") expect(t.align, `English word "${t.text}"`).not.toBeNull();
    }
  });

  test(`verse ${v.number}: joined never starts the verse; diff values are valid`, () => {
    expect(v.hebrew[0].joined).toBeFalsy();
    for (const t of v.english) if ("diff" in t) expect(["added", "removed"]).toContain(t.diff);
  });
}

test("deep dives have the required fields", () => {
  for (const [id, d] of Object.entries(data.deepDives)) {
    expect(typeof d.hebrew, id).toBe("string");
    expect(typeof d.translit, id).toBe("string");
    expect(d.rendering === null || typeof d.rendering === "string", id).toBe(true);
    expect(typeof d.body, id).toBe("string");
    expect(typeof d.straightforward, id).toBe("boolean");
  }
});

test("Mosiah differences match the transcript's notes (verses 9 and 11 only)", () => {
  const diffs = data.verses.flatMap((v) => v.english.filter((t) => t.diff).map((t) => `${v.number}:${t.diff}:${t.text}`));
  expect(diffs).toEqual(["9:removed:violence", "9:added:evil", "11:removed:of"]);
});
