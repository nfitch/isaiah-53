"""Parse design/source/transcript.md into per-verse word-by-word entries.

Output (stdout): JSON list of verses:
  {number, kjv, hebrew, entries: [{hebrew, translit, rendering, body}], mosiahNote}
"""
import json, re, sys
from pathlib import Path

SRC = Path(__file__).resolve().parent.parent / "design/source/transcript.md"
ENTRY = re.compile(r'^\((?P<translit>[^)]*)\)\s*—\s*(?:"(?P<rendering>[^"]*)"\s*(?:—\s*)?)?(?P<body>.*)$')

def parse(text):
    verses = []
    for block in re.split(r'^Verse (\d+)\.?\s*$', text, flags=re.M)[1:]:
        if block.strip().isdigit():
            verses.append({"number": int(block)})
            continue
        v = verses[-1]
        lines = [l.strip() for l in block.splitlines()]
        it = iter(range(len(lines)))
        i = lines.index("KJV:")
        v["kjv"] = lines[i + 1].strip('"')
        i = lines.index("Hebrew (MT):")
        v["hebrew"] = lines[i + 1]
        start = lines.index("Word by Word:") + 1
        end = next(k for k, l in enumerate(lines) if l.startswith("Mosiah 14:"))
        v["mosiahNote"] = " ".join(l for l in lines[end + 1:] if l)
        body = [l for l in lines[start:end] if l]
        entries = []
        k = 0
        while k < len(body):
            heb, meta = body[k], body[k + 1]
            m = ENTRY.match(meta)
            if not m:
                sys.exit(f"verse {v['number']}: cannot parse entry line: {meta!r}")
            entries.append({"hebrew": heb, "translit": m["translit"],
                            "rendering": m["rendering"], "body": m["body"].strip()})
            k += 2
        v["entries"] = entries
    return verses

if __name__ == "__main__":
    print(json.dumps(parse(SRC.read_text()), ensure_ascii=False, indent=1))
