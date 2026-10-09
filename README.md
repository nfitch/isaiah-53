# Isaiah 53 Study Page

A single webpage for studying Isaiah 53 verse by verse: the Hebrew, the KJV, the Mosiah 14 differences, Hebrew-to-English phrase highlighting, and a deep dive for each phrase. See `design/design.md`.

Live site: https://nfitch.github.io/isaiah-53/

## Layout

| Path | Contents |
|------|----------|
| `static/` | The deliverable: `index.html` and the generated `old-testament-isaiah-53.json`. |
| `design/` | The design doc; the transcript and skill in `design/source/`; the scripture texts in `design/source/texts/`; critique records in `design/critique/`. |
| `tools/` | Python scripts that build the chapter data from the transcript, plus `revisions.json` (reviewed edits applied on top of the transcript). |
| `tests/` | Playwright tests. |

## View the page

Serve `static/` (or the project root) with any static file server, for example:

```bash
python3 -m http.server 8000 -d static
```

Then open http://localhost:8000/.

## Run the tests

```bash
npm install
npx playwright install chromium webkit
npm test 2>&1 | tee tmp/test-output.txt
```

Desktop tests run in Chromium. Phone tests (`tests/mobile.spec.js`) run in WebKit and Chromium, in portrait and landscape.

The tests start their own server on port 8053. It serves the project root, so the page is loaded from the `/static/` subpath.

## Build chapter data

```bash
python3 tools/build_data.py        # writes static/old-testament-isaiah-53.json
python3 tools/report.py            # writes tmp/alignment-report.md for review
```

The build combines:
- the source texts in `design/source/texts/`, read by `tools/sources.py`:
  - the Westminster Leningrad Codex Hebrew;
  - the 1769 KJV, with italics;
  - Mosiah 14.
- the word-by-word entries in `design/source/transcript.md`, parsed by `tools/parse_transcript.py`;
- the hand-made English alignments in `tools/build_data.py` (`ENGLISH`);
- the reviewed edits in `tools/revisions.json`;
- the Mosiah notes in `tools/mosiah_notes.json`.

The Mosiah differences are computed by comparing the KJV with Mosiah 14 word by word, punctuation included and capitalization ignored.

The build fails if:
- the Hebrew segments do not rejoin into the WLC line;
- the English tokens do not rebuild the KJV source, or the Mosiah tokens do not rebuild Mosiah 14;
- a revision's `from` text does not occur exactly once.

Do not edit the JSON file by hand.

## Adding another chapter

The page renders whatever chapter its JSON file describes: the title, verses, Hebrew, English, Mosiah differences, and deep dives all come from the data. The format is documented in `design/design.md` (Data Model). Some chapter-specific values are still hard-coded in the page and the tools, so adding a chapter takes these steps:

1. **Breakdown:** produce a word-by-word transcript for the chapter in the same format as `design/source/transcript.md`, using `design/source/hebrew-verse-breakdown.skill`.
2. **Source texts:** save the chapter's WLC Hebrew, the KJV (USFM with `\add` italics), and the parallel text (if any) in `design/source/texts/`, and record where each came from in that folder's README.
3. **Readers:** in `tools/sources.py`, point the readers at the new files. The file names and the `Isa.53` verse ids are hard-coded there today.
4. **English alignment:** in `tools/build_data.py`, write the `ENGLISH` alignment for every verse (one `word:group` pair per KJV token), and update `OUT` and the `chapter` block (id, book, chapter number, parallel).
5. **Parallel notes:** write the parallel-text notes (the equivalent of `tools/mosiah_notes.json`). Optionally, run the critique rounds and record accepted edits in `tools/revisions.json`.
6. **Build:** run `python3 tools/build_data.py`, then `python3 tools/report.py` to review the alignments.
7. **Page:** in `static/index.html`, update `DATA_URL` and the `<title>`.

Limitations today:
- The page shows one chapter. Choosing between chapters, or putting the verse in the URL, is not built (Decision 9).
- The page expects a parallel text (`chapter.parallel`) for the toggle. A chapter without one needs the toggle hidden.

## Deployment

Every push to `main` runs `.github/workflows/pages.yml`, which publishes `static/` to GitHub Pages. To check the live site:

```bash
LIVE_URL=https://nfitch.github.io/isaiah-53/ npx playwright test tests/live.spec.js
```

## License

The code is MIT licensed (see `LICENSE`). The scripture texts in `design/source/texts/` keep their own terms; see `design/source/texts/README.md`.
