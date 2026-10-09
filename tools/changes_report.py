"""Write tmp/critique/changes.md: every deep-dive field the revisions changed, before and after,
plus the alignment edits, for human review."""
import json, sys
from build_data import ROOT
from parse_transcript import parse, SRC

orig = {f"v{v['number']}-{n}": e for v in parse(SRC.read_text()) for n, e in enumerate(v["entries"], 1)}
new = json.loads((ROOT / "static/old-testament-isaiah-53.json").read_text())["deepDives"]
revs = json.loads((ROOT / "tools/revisions.json").read_text())["revisions"]
order = sorted({(r["id"], r["field"]) for r in revs}, key=lambda k: (int(k[0][1:].split("-")[0]), int(k[0].split("-")[1]), k[1]))

out = ["# Critique changes for review", "",
       f"{len(order)} fields changed in {len({i for i, _ in order})} entries, from {len(revs)} revisions. "
       "Reasons are the critics' own; see tools/revisions.json for sources.", "",
       "## Alignment edits (English word to Hebrew phrase)", "",
       "| Verse | Before | After | Why |", "|---|---|---|---|",
       "| 2 | `a:11 dry:11 ground:10` (\"a\" with *dry*) | `a:10` (\"a\" with *ground*) | The article goes with the noun |",
       "| 8 | `was:21 he:21` (with lamo) | `was:20 he:21` | *negaʿ* is a noun rendered \"was stricken\"; only \"he\" comes from *lamo* |",
       "| 12 | `with:8` (with *the strong*) | `with:7` (with *et*) | *et* is the preposition \"with\" here |",
       "| 12 | `with:19` (with *the transgressors*) | `with:18` (with *et*) | Same; passive *nimnah* takes no object |", ""]
cur_verse = None
for id_, field in order:
    verse = id_.split("-")[0][1:]
    if verse != cur_verse:
        out += [f"## Verse {verse}", ""]
        cur_verse = verse
    reasons = " / ".join(r["reason"] for r in revs if r["id"] == id_ and r["field"] == field)
    out += [f"### {id_} {orig[id_]['hebrew']} ({orig[id_]['translit']}): {field}", "",
            f"- Before: {orig[id_][field] or '(empty)'}", f"- After: {new[id_][field]}", f"- Why: {reasons}", ""]
(ROOT / "tmp/critique/changes.md").write_text("\n".join(out))
print("wrote tmp/critique/changes.md")
