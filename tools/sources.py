"""Read Isaiah 53 (WLC Hebrew, KJV with italics) and Mosiah 14 from design/source/texts/."""
import re, unicodedata
from pathlib import Path

TEXTS = Path(__file__).resolve().parent.parent / "design/source/texts"
PUNCT = ",:;.?!"

def _strip_marks(s):
    """Drop cantillation (U+0591-U+05AF) and meteg (U+05BD); write holam-on-vav as plain holam."""
    s = "".join(ch for ch in s if not ("\u0591" <= ch <= "\u05af" or ch == "\u05bd"))
    return unicodedata.normalize("NFC", s.replace("\u05ba", "\u05b9"))

def hebrew(n):
    """WLC Hebrew line for Isaiah 53:n: words separated by spaces, maqaf joining, sof pasuq at the end."""
    xml = (TEXTS / "isaiah-53-wlc.xml").read_text()
    verse = re.search(rf'<verse osisID="Isa\.53\.{n}">(.*?)</verse>', xml, re.S).group(1)
    out = ""
    for word, seg in re.findall(r'<w[^>]*>(.*?)</w>|<seg type="x-(?:maqqef|sof-pasuq)">(.*?)</seg>', verse):
        if word:
            out += ("" if not out or out.endswith("\u05be") else " ") + word.replace("/", "")
        else:
            out += seg
    return _strip_marks(out)

def tokenize(text):
    """Split English into word and punctuation tokens."""
    return re.findall(rf"[^\s{re.escape(PUNCT)}]+|[{re.escape(PUNCT)}]", text)

def kjv(n):
    """KJV Isaiah 53:n as tokens: [{"text", "italic", "punct"}]. Italics come from \\add markup."""
    usfm = (TEXTS / "isaiah-53-kjv.usfm").read_text()
    raw = re.search(rf"\\v {n} (.*?)(?=\\v {n + 1} |\Z)", usfm, re.S).group(1)
    raw = re.sub(r"\\f .*?\\f\*", "", raw)                       # footnotes
    raw = re.sub(r"\\\+?w ([^|\\]*)\|[^\\]*\\\+?w\*", r"\1", raw)  # Strong's-tagged words
    raw = re.sub(r"\\nd\*?|\\p|¶", "", raw)                      # divine-name style, paragraphs
    tokens = []
    for part, italic in re.findall(r"\\add (.*?)\\add\*|([^\\]+)", raw):
        text, is_italic = (part, True) if part else (italic, False)
        for t in tokenize(text):
            tokens.append({"text": t, "italic": is_italic and t not in PUNCT, "punct": t in PUNCT})
    return tokens

def mosiah(n):
    """Mosiah 14:n as plain text."""
    for line in (TEXTS / "mosiah-14.txt").read_text().splitlines():
        num, text = line.split(" ", 1)
        if int(num) == n:
            return text
    raise KeyError(n)

def join(tokens):
    """Rebuild text from tokens (no space before punctuation)."""
    return re.sub(rf" ([{re.escape(PUNCT)}])", r"\1", " ".join(tokens))

if __name__ == "__main__":
    for n in range(1, 13):
        print(n, join(t["text"] for t in kjv(n)))
        print("  italic:", [t["text"] for t in kjv(n) if t["italic"]])
