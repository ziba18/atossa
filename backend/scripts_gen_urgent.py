"""Writes lib/urgentPatterns.generated.ts from the chat guard's lists. Run from backend/: python scripts_gen_urgent.py"""
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import app.services.output_guard as g

OUT = Path(__file__).resolve().parents[1] / "lib" / "urgentPatterns.generated.ts"
HEAD = ("// GENERATED from backend/app/services/output_guard.py (the regex sources of the emergency / self-harm lists and the\n"
        "// negation, past-tense, third-person and resolved checks). Regenerate with `python scripts_gen_urgent.py` in backend/.\n")


def render() -> str:
    m = {"BODY": g._BODY_RX, "EMERG": g._EMERGENCY, "SELF": g._SELF_RX, "SELF2": g._SELF_HARM_RX, "NEG": g._NEG,
         "PAST": g._PAST, "OTHER": g._OTHER, "OTHERNOW": g._OTHER_NOW, "REPORTED": g._REPORTED, "AGEPAST": g._AGE_PAST, "INCARE": g._IN_CARE, "RES": g._RESOLVED, "LASTREL": g._LASTREL, "PRESENT": g._PRESENT, "CLAUSE": g._CLAUSE, "IDIOM": g._IDIOM, "WHOLE": g._WHOLE, "SELFW": g._SELF_WHOLE, "THIRD": g._THIRD_NOW, "THIRDC": g._THIRD_CHILD, "LEADIN": g._LEADIN, "LEGBREATH": g._LEG_BREATH, "PROCFEVER": g._PROC_FEVER, "FEVER": re.compile(g._FEVER), "PROCFQ": re.compile(g._PROC_FEVER_QUIET), "OTHERHIST": g._OTHER_HIST_SENT, "PROCWORD": g._PROC_WORD, "PROCTIME": re.compile(g._PROC + r"[^.;!?\n,]{0,30}?\b(?:last (?:week|night|month)|(?:\w+ ){1,2}(?:days?|weeks?) ago|yesterday|on (?:mon|tues|wednes|thurs|fri|satur|sun)day)\b")}
    return HEAD + "".join(f"export const {k}_SRC = String.raw`{v.pattern}`;\n" for k, v in m.items())


if __name__ == "__main__":
    OUT.write_text(render())
