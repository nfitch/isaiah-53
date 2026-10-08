# Isaiah 53 Study Page

A single webpage for studying Isaiah 53 verse by verse: the Hebrew, the KJV, the Mosiah 14 differences, Hebrew-to-English phrase highlighting, and a deep dive for each phrase. See `design/design.md`.

## Layout

| Path | Contents |
|------|----------|
| `static/` | The deliverable: `index.html` (and, from Phase 3, `old-testament-isaiah-53.json`). |
| `design/` | The design doc, plus the source material in `design/source/`. |
| `tools/` | Python scripts that turn the transcript into chapter data. |
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
npx playwright install chromium
npm test 2>&1 | tee tmp/test-output.txt
```

The tests start their own server on port 8053. It serves the project root, so the page is loaded from the `/static/` subpath.

## Build chapter data

```bash
python3 tools/build_data.py 11 12 > out.json
```

This parses `design/source/transcript.md` and combines it with the hand-made English alignments in `tools/build_data.py`. It fails if the Hebrew segments do not rejoin into the verse's Hebrew line, or if the English tokens do not rebuild the KJV text.
