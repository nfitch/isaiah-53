"""Build chapter data (draft JSON shape) from the transcript plus hand-made English alignments.

Usage: python3 tools/build_data.py 11 12 > out.json
"""
import json, re, sys
from parse_transcript import parse, SRC

MAQAF, SOF_PASUQ = "־", "׃"

# English alignment per verse: (text, entry number or None, extra token fields).
# Entry numbers are 1-based positions in the transcript's word-by-word list.
# None = punctuation (unaligned). Words with no Hebrew counterpart join an adjacent phrase.
ENGLISH = {
    11: [("He", 4), ("shall", 4), ("see", 4), ("of", 1, {"diff": "removed"}),
         ("the", 2), ("travail", 2), ("of", 3), ("his", 3), ("soul", 3), (",", None),
         ("and", 5), ("shall", 5), ("be", 5), ("satisfied", 5), (":", None),
         ("by", 6), ("his", 7), ("knowledge", 7), ("shall", 8), ("my", 10),
         ("righteous", 9), ("servant", 10), ("justify", 8), ("many", 12), (";", None),
         ("for", 13), ("he", 15), ("shall", 16), ("bear", 16), ("their", 14),
         ("iniquities", 14), (".", None)],
    12: [("Therefore", 1), ("will", 2), ("I", 2), ("divide", 2), ("him", 3), ("a", 2),
         ("portion", 2), ("with", 4), ("the", 5), ("great", 5), (",", None), ("and", 6),
         ("he", 9), ("shall", 9), ("divide", 9), ("the", 10), ("spoil", 10), ("with", 8),
         ("the", 8), ("strong", 8), (";", None), ("because", 11), ("he", 13), ("hath", 13),
         ("poured", 13), ("out", 13), ("his", 16), ("soul", 16), ("unto", 14), ("death", 15),
         (":", None), ("and", 17), ("he", 20), ("was", 20), ("numbered", 20), ("with", 19),
         ("the", 19), ("transgressors", 19), (";", None), ("and", 21), ("he", 22),
         ("bare", 25), ("the", 23), ("sin", 23), ("of", 24), ("many", 24), (",", None),
         ("and", 26), ("made", 29), ("intercession", 29), ("for", 27), ("the", 28),
         ("transgressors", 28), (".", None)],
}

def hebrew_tokens(v, gid):
    """Split the verse's Hebrew line into the transcript's segments, in order."""
    line, pos, toks = v["hebrew"], 0, []
    for n, e in enumerate(v["entries"], 1):
        seg = e["hebrew"]
        joined = pos > 0 and line[pos] != " "
        if line[pos] == " ":
            pos += 1
        if not line.startswith(seg, pos):
            sys.exit(f"verse {v['number']} entry {n}: {seg!r} not found at {line[pos:]!r}")
        pos += len(seg)
        if pos < len(line) and line[pos] == MAQAF:
            seg += MAQAF
            pos += 1
        toks.append({"text": seg, "align": gid(n), **({"joined": True} if joined else {})})
    if line[pos:] == SOF_PASUQ:
        toks.append({"text": SOF_PASUQ, "align": None, "joined": True})
    elif line[pos:]:
        sys.exit(f"verse {v['number']}: unconsumed Hebrew {line[pos:]!r}")
    return toks

def english_tokens(v, gid):
    toks = []
    for t in ENGLISH[v["number"]]:
        text, n, extra = t[0], t[1], (t[2] if len(t) > 2 else {})
        tok = {"text": text, "align": gid(n) if n else None}
        if n is None:
            tok["punct"] = True
        tok.update(extra)
        toks.append(tok)
    kjv = " ".join(t["text"] for t in toks if t.get("diff") != "added")
    kjv = re.sub(r" ([,:;.?!])", r"\1", kjv)
    if kjv != v["kjv"]:
        sys.exit(f"verse {v['number']}: English tokens do not rebuild the KJV:\n{kjv}\n{v['kjv']}")
    return toks

def build(numbers):
    verses, dives = [], {}
    for v in parse(SRC.read_text()):
        if v["number"] not in numbers:
            continue
        gid = lambda n, num=v["number"]: f"v{num}-{n}"
        for n, e in enumerate(v["entries"], 1):
            dives[gid(n)] = {"hebrew": e["hebrew"], "translit": e["translit"],
                             "rendering": e["rendering"], "body": e["body"],
                             "straightforward": bool(re.search(r"straightforward\.?$", e["body"]))}
        verses.append({
            "number": v["number"],
            "hebrew": hebrew_tokens(v, gid),
            "english": english_tokens(v, gid),
            "alignments": [{"id": gid(n), "deepDive": gid(n)} for n in range(1, len(v["entries"]) + 1)],
            "mosiahNote": v["mosiahNote"],
        })
    return {"chapter": {"id": "isaiah-53", "book": "Isaiah", "chapterNumber": 53,
                        "parallel": {"book": "Mosiah", "chapterNumber": 14}},
            "verses": verses, "deepDives": dives}

if __name__ == "__main__":
    print(json.dumps(build({int(a) for a in sys.argv[1:]}), ensure_ascii=False, indent=1))
