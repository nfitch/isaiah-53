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

## Deployment

Every push to `main` runs `.github/workflows/pages.yml`, which publishes `static/` to GitHub Pages. To check the live site:

```bash
LIVE_URL=https://nfitch.github.io/isaiah-53/ npx playwright test tests/live.spec.js
```

## License

The code is MIT licensed (see `LICENSE`). The scripture texts in `design/source/texts/` keep their own terms; see `design/source/texts/README.md`.
