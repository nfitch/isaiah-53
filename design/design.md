# Isaiah 53 Study Page: Design

## Goal

A single webpage for studying a biblical chapter verse by verse. It shows the Hebrew text, the KJV English, the differences between Isaiah 53 and its Book of Mormon parallel (Mosiah 14), a Hebrew-to-English phrase alignment, and a phrase-level deep dive. The page is data-driven: any chapter in the same JSON format can be displayed.

## Layout

### Desktop: two panes, side by side

Approved layout. Example: verse 11, Mosiah toggle on, "amal" pinned.

```
+------------------------------------------------------------+----------------------------------------+
|  [ < ]      Isaiah 53:11   Mosiah 14 [x]       [ > ]       |  amal                         [pinned] |
|------------------------------------------------------------|  "the travail"                         |
|                                                            |                                        |
|     be*da'to    yisba    yir'eh    nafsho    me*[[amal]]   |  Root: amal "to toil, to labor, to     |
|                  la*rabbim    avdi    tsaddiq    yatsdiq   |  suffer, to be weary."                 |
|                              yisbol    hu    va*avonotam   |                                        |
|                                                            |  The noun means toil, labor, trouble,  |
|------------------------------------------------------------|  suffering, misery, weariness. KJV     |
|                                                            |  "travail" captures the labor          |
|   He shall see -of- [[the travail]] of his soul, and       |  dimension but the word is broader:    |
|   shall be satisfied: by his knowledge shall my            |  exhausting toil, grinding suffering,  |
|   righteous servant justify many; for he shall bear        |  miserable labor. ...                  |
|   their iniquities.                                        |                                        |
|                                                            |  ------------------------------------  |
|                                                            |  Mosiah 14:11                          |
|                                                            |  Mosiah omits "of": "He shall see      |
|                                                            |  the travail of his soul..."           |
+------------------------------------------------------------+----------------------------------------+
```

Notation used in the mock (ASCII only):

| Notation | Meaning on the real page |
|----------|--------------------------|
| Transliterations (`nafsho`, `yisba`, ...) | Hebrew script, rendered right-to-left. Words are listed right-to-left here. |
| `*` inside a Hebrew word | Boundary between segments of one word (for example the prefix `me` + `amal`). Each segment can be hovered on its own. |
| `[[...]]` | The highlighted alignment (Hebrew `amal` corresponds to English "the travail"). |
| `-of-` | KJV text that Mosiah omits (strikethrough). |
| `{+word+}` | Text that Mosiah adds (distinct color). Verse 11 has none. |
| `[x]` | Mosiah toggle is on. |
| `[pinned]` | The deep dive is pinned by a click. |
| Empty space under the text | Not on the real page: the Hebrew and English font sizes grow to fill the pane. |

- Left pane:
  - Control bar:
    - `<` (previous verse) on the left.
    - Chapter/verse title in the middle, with the Mosiah 14 toggle.
    - `>` (next verse) on the right.
  - Hebrew verse below the control bar.
  - English (KJV) verse below the Hebrew.
- Right pane: the deep dive for the active phrase.
- The text scales to fill each pane. Only vertical scrolling is allowed.

### Mobile (later)

- Planned approach: on small screens, split the panes vertically (text on top, deep dive below). To be refined by iteration.
- Priority: desktop first. GitHub Pages and mobile may come after the first usable version.

## Behavior

### Verse navigation
- `<` and `>` step through the verses. They are disabled at the chapter boundaries.
- The left and right arrow keys do the same.
- Changing the verse clears the pin and keeps the Mosiah toggle state.

### Mosiah diff toggle
- Off: plain KJV text.
- On: KJV words that Mosiah omits or replaces are shown with strikethrough. Words that Mosiah adds are shown in a distinct color. Unchanged text is styled normally.
- Every difference is shown, including punctuation.

### KJV italics
- Italicized KJV words (supplied by the translators) are rendered in italics.

### Phrase alignment highlighting
- Hovering a Hebrew word or phrase highlights it and its corresponding English, and the reverse also works.
- Hover: highlights the phrase and updates the deep dive. Moving the pointer off a phrase clears it, except when it moves into the deep-dive pane: then the phrase stays, so the reader can scroll the deep dive.
- In the English, the spaces inside a phrase are highlighted too, so the phrase reads as one block.
- Click: pins the phrase. While a phrase is pinned, hovering does not change the deep dive. Clicking the pinned phrase again, or pressing Esc, unpins it. Pinning is how mobile (tap) will work.
- Every KJV word belongs to a phrase. KJV words with no direct Hebrew counterpart (for example "a portion" in 12) join the adjacent phrase they belong with.
- Mosiah replacements join the phrase of the KJV text they replace (for example "has borne" in 4). Pure additions with no Hebrew counterpart (for example "Yea," in 1) are the only unmapped text.
- Alignments can be:
  - many-to-many: one Hebrew word may map to several English words.
  - discontinuous: an English rendering may be split across a sentence.

### Deep dive
- The right pane shows the deep dive for the active phrase.
- With nothing hovered or pinned, the right pane is empty.
- "Straightforward" entries still get a short deep dive: Hebrew, transliteration, English rendering, and "straightforward".
- While a phrase is active, the verse's Mosiah note is shown at the bottom of the right pane (as in the mock).
- The same deep-dive entry may be referenced from more than one verse.

## Source Material

Files in `design/source/`:

| File | Contents |
|------|----------|
| `transcript.md` | Word-by-word breakdowns of all 12 verses. Each breakdown has the KJV text, the Hebrew (MT, with vowel points), one entry per Hebrew segment (Hebrew, transliteration, English rendering, explanation or "straightforward"), and a Mosiah note. |
| `hebrew-verse-breakdown.skill` | A zip that contains `SKILL.md`, which defines the breakdown format above. Its example is verse 1. |

How the content maps to the page:
- Each word-by-word entry becomes one alignment: Hebrew segment, then English rendering, then the deep dive (the explanation).
- Entries are sub-word: prefixes (`ve`, `la`, `me`, ...) are separate entries. So one Hebrew word can contain several hoverable segments.
- "Straightforward" entries have no explanation; their deep dive is the short form (see Deep dive).
- The Mosiah notes are prose and are not reliable: they report "identical" for verses 1-8 and 12, and the note on verse 11 is muddled. From memory, Mosiah 14:1 begins "Yea," 14:4 has "has borne" for "hath borne", 14:9 has "evil" for "violence", and 14:11 omits "of". For now the transcript is used as-is. A later rework (done by a subagent) will verify the Mosiah differences and KJV italics against authoritative texts.
- KJV italics are not in the transcript and must come from a KJV source that records them.
- The Mosiah note for verse 11 repeats an error that the critique corrected in the v11-4 deep dive: KJV did not supply "of the travail of his soul"; that phrase is in the Hebrew. Fix it in Phase 6.
- The transliterations do not follow one consistent rule for aleph and ayin (critique item H17, not applied). Revisit in Phase 6.

## Architecture

- The deliverable is contained in `static/`:
  - `static/index.html`, with inline CSS and JS.
  - `static/old-testament-isaiah-53.json`.
- No framework, no build step, no server-side code, no Docker.
- `tools/` holds the data pipeline, which is not part of the deliverable:

  | File | Purpose |
  |------|---------|
  | `parse_transcript.py` | Parses the transcript. |
  | `build_data.py` | Holds the English alignments and builds `static/old-testament-isaiah-53.json`. |
  | `revisions.json` | Reviewed edits applied on top of the transcript. Each edit records its source and reason. |
  | `report.py` | Writes the alignment and deep-dive review report. |
  | `changes_report.py` | Writes a before/after view of every revision. |

- `design/critique/` keeps the critique rounds (the proposals and reviews from each critic) and `changes.md`, the before/after view nf approved.
- nf serves `static/` with a static file server of their choice. A server is needed because browsers block `fetch` from `file://`.
- Test tooling (Playwright run with `npx`, plus a JSON validation script) lives outside `static/` and is not part of the deliverable.

## Data Model (draft)

This is the shape used by the Phase 1 sample data. It is finalized in Phase 2.

```jsonc
{
  "chapter": { "id": "isaiah-53", "book": "Isaiah", "chapterNumber": 53,
               "parallel": { "book": "Mosiah", "chapterNumber": 14 } },
  "verses": [
    {
      "number": 11,
      "hebrew": [
        { "text": "מֵ", "align": "v11-1" },
        { "text": "עֲמַל", "align": "v11-2", "joined": true },
        // ...
        { "text": "׃", "align": null, "joined": true }
      ],
      "english": [
        { "text": "He", "align": "v11-4" },
        { "text": "of", "align": "v11-1", "diff": "removed" },
        { "text": ",", "align": null, "punct": true },
        // ...
      ],
      "alignments": [ { "id": "v11-1", "deepDive": "v11-1" } ],
      "mosiahNote": "..."
    }
  ],
  "deepDives": {
    "v11-2": { "hebrew": "עֲמַל", "translit": "amal", "rendering": "the travail",
               "body": "Root: ...", "straightforward": false }
  }
}
```

- Each word-by-word entry in the transcript is one alignment group and one deep dive. The ids are `v<verse>-<entry number>`.
- Hebrew tokens:
  - `joined: true` attaches a token to the previous one with no space (a prefix plus its word, or a word after a maqaf).
  - A maqaf stays at the end of the token before it.
  - The sof pasuq is an unaligned, joined token.
- English tokens:
  - `punct: true` marks punctuation. Punctuation is unaligned and has no space before it.
  - `italic: true` marks KJV italics.
  - `diff` is `"removed"` (KJV only) or `"added"` (Mosiah only, rendered only when the toggle is on). A replacement is a `"removed"` token followed by an `"added"` token in the same group.
- Every English word belongs to a group. Some groups are Hebrew-only: particles the KJV does not translate, such as `et` (the direct object marker) and `asher` in 12, and `la` in 11.
- A deep dive's `rendering` may be `null` (for example `et`). `straightforward` is true when the transcript's explanation ends with "straightforward".
- `deepDives` is a top-level map so entries can be shared across verses.

## Phases

Status: `[x]` done, `[ ]` not started. The phase in progress is marked "(in progress)".

- [x] 0. Design: this document
- [x] 1. UI mock: static HTML with hardcoded sample data (see Phase 1 Implementation Checklist)
- [x] 2. Transcript ingestion and wiring: convert the Claude transcript into the JSON format for all 12 verses, refine it through subagent critique, and render it in the UI (see Phase 2 Implementation Checklist)
- [x] 3. Wiring: folded into Phase 2.
- [x] 4. Deployment: GitHub Pages, live at https://nfitch.github.io/isaiah-53/ (see Phase 4 Implementation Checklist)
- [ ] 5. Mobile: responsive layout and touch interaction.
- [ ] 6. Transcript rework (subagent): verify the Mosiah differences, the KJV italics, and the Hebrew against the authoritative texts, then regenerate the JSON.

## Phase 1 Implementation Checklist

Scope: `static/index.html` with every behavior in this document, rendering hardcoded sample data for verses 11 and 12, taken from the transcript as-is. The sample data is a JS object in the draft JSON shape, so Phase 3 only swaps it for a `fetch`. Two verses are needed to exercise navigation.

### Success criteria

Functional correctness. Each item is verified by a Playwright test unless marked "visual".

- [x] F1. Layout matches the approved mock: left pane 60% and right pane 40%, a control bar with `<`, the title "Isaiah 53:11", the Mosiah 14 toggle, and `>`, then the Hebrew, then the English.
- [x] F2. The Hebrew renders right-to-left in Noto Serif Hebrew. Segments of one word (for example `me` + `amal`) render with no space between them and can be hovered separately.
- [x] F3. KJV italic tokens render in italics. Tested with a fixture, because the transcript does not record italics.
- [x] F4. Toggle off: `removed` tokens render as plain text, and `added` tokens are not rendered. Toggle on: `removed` tokens have strikethrough, and `added` tokens use the Mosiah color.
- [x] F5. Hovering any Hebrew or English token highlights every token in its alignment group, in both languages, and shows that group's deep dive. Moving the pointer off clears it, except when it moves into the deep-dive pane (approved by nf).
- [x] F6. Clicking a token pins its group, and hovering then changes nothing. Clicking the pinned group again unpins it, and so does pressing Esc. Clicking a different group moves the pin.
- [x] F7. Right pane:
  - With nothing active, it is empty.
  - An entry with an explanation shows its Hebrew, transliteration, rendering, and body.
  - A "straightforward" entry shows its Hebrew, transliteration, rendering, and "straightforward".
  - While a group is active, the verse's Mosiah note appears at the bottom.
- [x] F8. Navigation:
  - `<` and `>`, and the left and right arrow keys, move between verses 11 and 12.
  - `<` is disabled on 11 and `>` is disabled on 12.
  - Changing the verse clears the pin and keeps the toggle state.
- [x] F9. Text fills the pane: the Hebrew and English font sizes grow to use the pane's height. There is no horizontal scrolling at 1280x800 or 1920x1080. Vertical scrolling is allowed only when the text cannot fit at the minimum font size. Verified with a test plus a visual check.
- [x] F10. Dark mode follows `prefers-color-scheme`. Verified with a test using Playwright color-scheme emulation, plus a visual check.
- [x] F11. No console errors or warnings on load or during interaction.
- [x] F12. Every local asset reference in `index.html` is relative, so the page works from a subpath (needed for GitHub Pages in Phase 4). The Google Fonts stylesheet is the one external, absolute URL.

Documentation is up to date and consistent:
- [x] D1. This document reflects any change to the behavior or the data model made during implementation.
- [x] D2. A root `README.md` covers how to serve `static/` and how to run the tests.
- [x] D3. No stale references (for example, file names in the docs match the files on disk).

All tests pass:
- [x] T1. The Playwright tests live in `tests/`, with `package.json` and `playwright.config` at the root, outside `static/`.
- [x] T2. Every test passes. The output is captured to `./tmp/` and verified from the file.

Paths and conventions:
- [x] P1. There is no `design/technical/path-conventions.md` in this project, and the `@lib` and API rules do not apply (there is no build step and no API). The convention here is F12: relative paths only.

Human review:
- [x] H1. nf reviews the page in a browser and approves the UI before any commit.
- [x] H2. Git: nf decides whether to `git init` and commit at the end of the phase. Nothing is committed without nf asking.

### Close-out
- [x] Run `/nf-check-work` to verify that every success criterion is met.
- [x] Meticulously review every checklist item. Do not skim. Read each item and verify it was actually completed -- not "probably done" or "I think I did that." Actually check.
- [x] Check off every box. If a box cannot be checked, explain why and resolve it before closing.

## Phase 2 Implementation Checklist

Scope: generate `static/old-testament-isaiah-53.json` for verses 1-12 from the transcript, refine the content through subagent critique rounds, and wire `index.html` to the file (Phase 3, folded in).

### Success criteria

Functional correctness:
- [x] C1. `python3 tools/build_data.py` (with no verse arguments, meaning all verses) writes `static/old-testament-isaiah-53.json`. The file is generated only; nobody edits it by hand.
- [x] C2. For all 12 verses, the build fails unless the Hebrew segments rejoin into the transcript's Hebrew line and the English tokens rebuild the transcript's KJV text exactly.
- [x] C3. Hand-made English alignments for verses 1-10, following the rules used for 11 and 12:
  - Every English word belongs to a group, except pure Mosiah additions.
  - A word with no Hebrew counterpart joins the adjacent phrase it belongs with.
  - Punctuation is unaligned.
- [x] C4. Mosiah differences are encoded from the transcript's notes as-is. That gives verse 9 ("violence" becomes "evil", as a removed token plus an added token) and verse 11 ("of" removed). Every other verse has no differences. The rework in Phase 6 corrects this.
- [x] C5. A validation test checks the JSON's rules:
  - ids are unique, and every `align` and `deepDive` reference resolves;
  - every alignment has at least one Hebrew token;
  - every English word is aligned, except punctuation and `added` tokens;
  - `joined` never appears on a verse's first Hebrew token;
  - the verse numbers run 1-12 in order.
- [x] C7. Critique rounds: subagents critique (a) how each verse is carved into phrases and how they align, (b) the English renderings, and (c) the deep-dive text. They run for several rounds until they reach consensus.
  - Changes stay small. The transcript is "good enough"; nothing drastically different.
  - The Mosiah notes are out of scope (Phase 6).
  - Accepted changes live in `tools/revisions.json` and are applied on top of the transcript at build time. The transcript itself is not edited, so every change can be traced.
- [x] C8. Wiring: `index.html` loads `old-testament-isaiah-53.json` with a relative `fetch` and the embedded sample data is removed. The Phase 1 tests run against the real file.
- [x] C6. An alignment report, `tmp/alignment-report.md`, lists each verse's groups (Hebrew, then transliteration, then English words) so nf can review the alignments without the UI.

Documentation:
- [x] D1. This document's data model and the README match the generated file and the build command.
- [x] D2. No stale references.

Tests:
- [x] T1. All tests pass (the Phase 1 tests plus C5). The output is captured to `./tmp/` and verified from the file.

Human review:
- [x] H1. nf reviews the consolidated critique changes, and reviews the alignments in the browser, before the commit. (Approved by nf.)

### Close-out
- [x] Run `/nf-check-work` to verify that every success criterion is met.
- [x] Meticulously review every checklist item. Do not skim. Read each item and verify it was actually completed -- not "probably done" or "I think I did that." Actually check.
- [x] Check off every box. If a box cannot be checked, explain why and resolve it before closing.

## Phase 4 Implementation Checklist

Scope: publish `static/` to GitHub Pages from a public `nfitch/isaiah-53` repository.

### Success criteria
- [x] G1. The public repository `nfitch/isaiah-53` exists, and `main` (with all commits) is pushed.
- [x] G2. `.github/workflows/pages.yml` deploys only `static/` to GitHub Pages on every push to `main`. It can also be run manually.
- [x] G3. https://nfitch.github.io/isaiah-53/ serves the page and `old-testament-isaiah-53.json`. A Playwright smoke test against the live URL shows Isaiah 53:1, and hovering a word shows a deep dive.
- [x] T1. All local tests pass, with the output captured to `./tmp/`.
- [x] D1. The README has the live URL and explains how deployment works; this document is updated.

### Close-out
- [x] Run `/nf-check-work` to verify that every success criterion is met.
- [x] Meticulously review every checklist item. Do not skim. Read each item and verify it was actually completed -- not "probably done" or "I think I did that." Actually check.
- [x] Check off every box. If a box cannot be checked, explain why and resolve it before closing.

## Decisions

| # | Question | Decision |
|---|----------|----------|
| 1 | Source of the content | nf's Claude chat transcript, plus the breakdown skill from that chat |
| 2 | Text sources | English: KJV Isaiah 53. Parallel: Book of Mormon, Mosiah 14. Hebrew: Westminster Leningrad Codex, with vowel points and without cantillation marks |
| 3 | Scope | All of Isaiah 53 (verses 1-12) |
| 4 | What the toggle does | Adds the diff overlay to the KJV text |
| 5 | KJV italics | Shown |
| 6 | Deep-dive trigger | Hover updates the deep dive; click pins a phrase |
| 7 | Mobile | Vertical split on small screens; refine later. Desktop first |
| 8 | Diff granularity | Show every difference, including punctuation |
| 9 | Verse in the URL | Not now |
| 10 | Tech stack | One HTML page and one JSON file |
| 11 | Desktop layout | Approved as shown in the ASCII mock |
| 12 | Transcript accuracy | Use the transcript as-is now; verify it in a later rework (Phase 6) |
| 13 | Right pane when idle | Empty |
| 14 | Mosiah note | Kept; shown at the bottom of the right pane while a phrase is active |
| 15 | "Straightforward" entries | Shown with a short deep dive that says "straightforward" |
| 16 | Testing | Test tooling is allowed outside the deliverable |
| 17 | Docker | Not used |
| 18 | File layout | `static/index.html` and `static/old-testament-isaiah-53.json` |
| 19 | Phrase coverage | Every KJV word maps to a phrase; only pure Mosiah additions are unmapped |
| 20 | Unpin | Click the pinned phrase again, or press Esc |
| 21 | Verse change | Clears the pin and keeps the toggle state; the arrow keys navigate |
| 23 | Phase 3 | Folded into Phase 2 |
| 25 | Deep-dive font size | Scales with the window: `clamp(20px, 1.45vw, 30px)` for the body text (increased at nf's request) |
| 26 | Repository | Public `nfitch/isaiah-53`, including the design docs and transcript |
| 24 | Content refinement | Subagent critique rounds on the phrasing, renderings, and deep dives; small changes only, kept in `tools/revisions.json` |
| 22 | Look | Panes 60/40, Noto Serif Hebrew, light theme plus dark mode that follows the system setting, one shared highlight color |

## Open Questions

None.
