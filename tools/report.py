"""Write tmp/alignment-report.md: each verse's phrases (Hebrew, transliteration, rendering, English)
and deep-dive text, for human and subagent review. Reads the generated chapter JSON."""
import json, re
from build_data import OUT, ROOT

def main():
    data = json.loads(OUT.read_text())
    out = ["# Isaiah 53: alignment and deep-dive report", ""]
    for v in data["verses"]:
        kjv = re.sub(r" ([,:;.?!])", r"\1", " ".join(t["text"] for t in v["english"] if t.get("diff") != "added"))
        out += [f"## Verse {v['number']}", "", f"KJV: {kjv}", "",
                "Hebrew: " + "".join(("" if t.get("joined") or i == 0 else " ") + t["text"]
                                      for i, t in enumerate(v["hebrew"])), ""]
        out += ["| Group | Hebrew | Translit | Rendering | English words (KJV order) | Mosiah diff |",
                "|-------|--------|----------|-----------|---------------------------|-------------|"]
        for a in v["alignments"]:
            d = data["deepDives"][a["deepDive"]]
            words = [t for t in v["english"] if t["align"] == a["id"]]
            eng = " ".join(t["text"] for t in words if t.get("diff") != "added") or "(none)"
            diff = "; ".join(f"{t['diff']}: {t['text']}" for t in words if t.get("diff"))
            out.append(f"| {a['id']} | {d['hebrew']} | {d['translit']} | {d['rendering'] or ''} | {eng} | {diff} |")
        out += ["", "### Deep dives", ""]
        for a in v["alignments"]:
            d = data["deepDives"][a["deepDive"]]
            out += [f"- **{a['id']}** {d['hebrew']} ({d['translit']}): {d['body']}"]
        out += ["", f"Mosiah note: {v['mosiahNote']}", ""]
    path = ROOT / "tmp/alignment-report.md"
    path.write_text("\n".join(out))
    print(f"wrote {path.relative_to(ROOT)}")

if __name__ == "__main__":
    main()
