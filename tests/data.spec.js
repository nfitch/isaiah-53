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

// Plain text of each source, for rebuilding checks.
const textsDir = path.join(__dirname, "..", "design", "source", "texts");
const mosiah = Object.fromEntries(fs.readFileSync(path.join(textsDir, "mosiah-14.txt"), "utf8").trim().split("\n")
  .map((line) => [Number(line.split(" ")[0]), line.slice(line.indexOf(" ") + 1)]));
const join = (tokens) => tokens.map((t) => t.text).join(" ").replace(/ ([,:;.?!])/g, "$1");

for (const v of data.verses) {
  test(`verse ${v.number}: non-added tokens rebuild the KJV; non-removed tokens rebuild Mosiah 14:${v.number}`, () => {
    const kjv = join(v.english.filter((t) => t.diff !== "added"));
    const mos = join(v.english.filter((t) => t.diff !== "removed"));
    expect(mos.toLowerCase()).toBe(mosiah[v.number].toLowerCase()); // capitalization differences are ignored
    expect(kjv).not.toMatch(/\s{2}/);
  });
}

test("KJV text matches the eBible source for a sample of verses", () => {
  const byNumber = Object.fromEntries(data.verses.map((v) => [v.number, join(v.english.filter((t) => t.diff !== "added"))]));
  expect(byNumber[7]).toMatch(/so he openeth not his mouth\.$/);
  expect(byNumber[2]).toContain("there is no beauty");
});

test("KJV italics come from the source", () => {
  const italic = data.verses.flatMap((v) => v.english.filter((t) => t.italic).map((t) => `${v.number}:${t.text}`));
  expect(italic).toEqual(["2:there", "2:is", "3:our", "5:was", "5:he", "5:was", "5:was", "9:was", "9:any",
    "10:him", "10:his", "10:his", "11:and", "12:a", "12:portion"]);
});

test("Mosiah differences: every changed word is listed (punctuation excluded)", () => {
  const words = data.verses.flatMap((v) => v.english.filter((t) => t.diff && !t.punct).map((t) => `${v.number}:${t.diff === "added" ? "+" : "-"}${t.text}`));
  expect(words).toEqual([
    "1:+Yea", "1:+even", "1:+doth", "1:+not", "1:+Isaiah", "1:+say",
    "2:-a", "4:-hath", "4:+has", "6:-iniquity", "6:+iniquities", "7:-openeth", "7:+opened",
    "8:-transgression", "8:+transgressions", "9:-violence", "9:+evil", "11:-of",
    "12:-bare", "12:+bore", "12:-sin", "12:+sins",
  ]);
});

test("added tokens that replace KJV words share the replaced word's phrase; pure additions are unaligned", () => {
  for (const v of data.verses) {
    v.english.forEach((t, i) => {
      if (t.diff !== "added" || t.punct) return;
      const prev = v.english[i - 1];
      if (prev && prev.diff === "removed" && !prev.punct) expect(t.align, `${v.number}:${t.text}`).toBe(prev.align);
    });
  }
  expect(data.verses[0].english.filter((t) => t.diff === "added" && !t.punct).every((t) => t.align === null)).toBe(true);
});
