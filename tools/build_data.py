"""Build chapter data from the transcript, hand-made English alignments, and reviewed revisions.

Usage:
  python3 tools/build_data.py            # all verses -> static/old-testament-isaiah-53.json
  python3 tools/build_data.py 11 12      # selected verses -> stdout
"""
import json, re, sys
from pathlib import Path
from parse_transcript import parse, SRC

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "static/old-testament-isaiah-53.json"
REVISIONS = ROOT / "tools/revisions.json"
DIVE_FIELDS = {"translit", "rendering", "body"}

MAQAF, SOF_PASUQ = "־", "׃"

# English alignment per verse, one "word:group" pair per token, in KJV order.
# group = 1-based entry number in the transcript's word-by-word list; "-" = punctuation (unaligned).
# A trailing "-" on the group marks a KJV-only token (removed in Mosiah); a trailing "+" marks a
# Mosiah-only token (added). Words with no Hebrew counterpart join an adjacent phrase.
ENGLISH = {
    1: "Who:1 hath:2 believed:2 our:3 report:3 ?:- and:4 to:7 whom:7 is:8 the:5 arm:5 of:6 the:6 "
       "LORD:6 revealed:8 ?:-",
    2: "For:1 he:2 shall:2 grow:2 up:2 before:5 him:5 as:3 a:4 tender:4 plant:4 ,:- and:6 as:7 a:8 "
       "root:8 out:9 of:9 a:10 dry:11 ground:10 ::- he:14 hath:14 no:12 form:13 nor:15 comeliness:17 "
       ";:- and:18 when:19 we:19 shall:19 see:19 him:19 ,:- there:21 is:21 no:21 beauty:22 that:23 "
       "we:24 should:24 desire:24 him:24 .:-",
    3: "He:1 is:1 despised:1 and:2 rejected:3 of:4 men:4 ;:- a:5 man:5 of:6 sorrows:6 ,:- and:7 "
       "acquainted:8 with:8 grief:9 ::- and:10 we:12 hid:12 as:11 it:11 were:11 our:13 faces:13 "
       "from:14 him:14 ;:- he:15 was:15 despised:15 ,:- and:16 we:18 esteemed:18 him:18 not:17 .:-",
    4: "Surely:1 he:3 hath:4 borne:4 our:2 griefs:2 ,:- and:5 carried:7 our:6 sorrows:6 ::- yet:8 "
       "we:9 did:10 esteem:10 him:10 stricken:11 ,:- smitten:12 of:13 God:13 ,:- and:14 afflicted:15 .:-",
    5: "But:1 he:2 was:3 wounded:3 for:4 our:5 transgressions:5 ,:- he:6 was:6 bruised:6 for:7 our:8 "
       "iniquities:8 ::- the:9 chastisement:9 of:10 our:10 peace:10 was:11 upon:11 him:11 ;:- and:12 "
       "with:13 his:14 stripes:14 we:16 are:15 healed:15 .:-",
    6: "All:1 we:1 like:2 sheep:3 have:4 gone:4 astray:4 ;:- we:8 have:8 turned:8 every:5 one:5 to:6 "
       "his:7 own:7 way:7 ;:- and:9 the:10 LORD:10 hath:11 laid:11 on:12 him:12 the:14 iniquity:14 "
       "of:15 us:15 all:15 .:-",
    7: "He:1 was:1 oppressed:1 ,:- and:2 he:3 was:4 afflicted:4 ,:- yet:5 he:7 opened:7 not:6 his:8 "
       "mouth:8 ::- he:13 is:13 brought:13 as:9 a:10 lamb:10 to:11 the:11 slaughter:12 ,:- and:14 as:15 "
       "a:16 sheep:16 before:17 her:18 shearers:18 is:19 dumb:19 ,:- so:20 he:22 opened:22 not:21 "
       "his:23 mouth:23 .:-",
    8: "He:6 was:6 taken:6 from:1 prison:2 and:3 from:4 judgment:5 ::- and:7 who:10 shall:11 "
       "declare:11 his:9 generation:9 ?:- for:12 he:13 was:13 cut:13 off:13 out:14 of:14 the:15 land:15 "
       "of:16 the:16 living:16 ::- for:17 the:18 transgression:18 of:19 my:19 people:19 was:20 he:21 "
       "stricken:20 .:-",
    9: "And:1 he:2 made:2 his:5 grave:5 with:3 the:4 wicked:4 ,:- and:6 with:7 the:8 rich:8 in:9 "
       "his:10 death:10 ;:- because:11 he:14 had:14 done:14 no:12 violence:13- evil:13+ ,:- neither:15 "
       "was:16 any:16 deceit:17 in:18 his:19 mouth:19 .:-",
    10: "Yet:1 it:3 pleased:3 the:2 LORD:2 to:4 bruise:4 him:4 ;:- he:5 hath:5 put:5 him:5 to:5 "
        "grief:5 ::- when:6 thou:7 shalt:7 make:7 his:9 soul:9 an:8 offering:8 for:8 sin:8 ,:- he:10 "
        "shall:10 see:10 his:11 seed:11 ,:- he:12 shall:12 prolong:12 his:13 days:13 ,:- and:14 the:15 "
        "pleasure:15 of:16 the:16 LORD:16 shall:19 prosper:19 in:17 his:18 hand:18 .:-",
    11: "He:4 shall:4 see:4 of:1- the:2 travail:2 of:3 his:3 soul:3 ,:- and:5 shall:5 be:5 "
        "satisfied:5 ::- by:6 his:7 knowledge:7 shall:8 my:10 righteous:9 servant:10 justify:8 many:12 "
        ";:- for:13 he:15 shall:16 bear:16 their:14 iniquities:14 .:-",
    12: "Therefore:1 will:2 I:2 divide:2 him:3 a:2 portion:2 with:4 the:5 great:5 ,:- and:6 he:9 "
        "shall:9 divide:9 the:10 spoil:10 with:7 the:8 strong:8 ;:- because:11 he:13 hath:13 poured:13 "
        "out:13 his:16 soul:16 unto:14 death:15 ::- and:17 he:20 was:20 numbered:20 with:18 the:19 "
        "transgressors:19 ;:- and:21 he:22 bare:25 the:23 sin:23 of:24 many:24 ,:- and:26 made:29 "
        "intercession:29 for:27 the:28 transgressors:28 .:-",
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
    for pair in ENGLISH[v["number"]].split():
        text, g = pair.rsplit(":", 1)
        if g == "-":
            toks.append({"text": text, "align": None, "punct": True})
            continue
        tok = {"text": text, "align": gid(int(g.rstrip("+-")))}
        if g[-1] in "+-":
            tok["diff"] = "added" if g[-1] == "+" else "removed"
        toks.append(tok)
    kjv = " ".join(t["text"] for t in toks if t.get("diff") != "added")
    kjv = re.sub(r" ([,:;.?!])", r"\1", kjv)
    if kjv != v["kjv"]:
        sys.exit(f"verse {v['number']}: English tokens do not rebuild the KJV:\n{kjv}\n{v['kjv']}")
    return toks

def apply_revisions(verses):
    """Apply tools/revisions.json to the parsed transcript entries.

    Each revision is {"id": "v<verse>-<entry>", "field": "translit"|"rendering"|"body",
    "from": <substring>, "to": <replacement>, "reason": ...}. "from" must occur exactly once in
    the current text, so a revision cannot silently apply to content that has changed.
    """
    if not REVISIONS.exists():
        return
    by_id = {f"v{v['number']}-{n}": e for v in verses for n, e in enumerate(v["entries"], 1)}
    for r in json.loads(REVISIONS.read_text())["revisions"]:
        e = by_id.get(r["id"])
        if e is None or r["field"] not in DIVE_FIELDS:
            sys.exit(f"revision {r['id']}/{r['field']}: unknown entry or field")
        current = e[r["field"]] or ""
        if current.count(r["from"]) != 1:
            sys.exit(f"revision {r['id']}/{r['field']}: 'from' must occur exactly once in {current!r}")
        e[r["field"]] = current.replace(r["from"], r["to"])

def build(numbers):
    verses, dives = [], {}
    parsed = parse(SRC.read_text())
    apply_revisions(parsed)
    for v in parsed:
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
    if sys.argv[1:]:
        print(json.dumps(build({int(a) for a in sys.argv[1:]}), ensure_ascii=False, indent=1))
    else:
        data = build(set(ENGLISH))
        OUT.write_text(json.dumps(data, ensure_ascii=False, indent=1) + "\n")
        print(f"wrote {OUT.relative_to(ROOT)}: {len(data['verses'])} verses, {len(data['deepDives'])} deep dives")
