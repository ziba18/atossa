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
    m = {"BODY": g._BODY_RX, "SKFACE": g._SK_FACE, "SKFACEFX": g._SK_FACE_FX, "SKSPEECH": g._SK_SPEECH, "SKSPEECHFX": g._SK_SPEECH_FX, "SKLIMB": g._SK_LIMB, "SKLIMBFX": g._SK_LIMB_FX, "SKSIDE": g._SK_SIDE, "RGFEV": g._RG_FEV, "RGUNC": g._RG_UNC, "RGVETO": g._RG_VETO, "CEBACK": g._CE_BACK, "CEZONE": g._CE_ZONE, "CEDEF": g._CE_DEF, "CECTRL": g._CE_CTRL, "CEVETO": g._CE_VETO, "SKONSET": g._SK_ONSET, "SKBENIGN": g._SK_BENIGN, "SKNEG": g._SK_NEG, "SKSAG": g._SK_SAG, "MSPREG": g._MS_PREG, "MSBLEED": g._MS_BLEED, "MSSHOULDER": g._MS_SHOULDER, "MSFUNC": g._MS_FUNC, "MSNOT": g._MS_NOT, "MSNEGB": g._MS_NEGB, "FSFLOW": g._FS_FLOW, "FSCOLD": g._FS_COLD, "FSSHAKY": g._FS_SHAKY, "FSWEAK": g._FS_WEAK, "FSBENIGN": g._FS_BENIGN, "PFFINE": g._PF_FINE, "PFSTRICT": g._PF_STRICT, "PFGASTRO": g._PF_GASTRO, "PFPAIN": g._PF_PAIN, "PFFEVER": g._PF_FEVER, "PFSICK": g._PF_SICK, "PFPERIOD": g._PF_PERIOD, "PFNEG": g._PF_NEG, "PDFAM": g._PD_FAMILY, "PDCTX": g._PD_CTX, "PDSECOND": g._PD_SECOND, "PDSICK": g._PD_SICK, "PDFEVER": g._PD_FEVER, "PDUSUAL": g._PD_USUAL, "PDRES": g._PD_RESOLVED, "EMERG": g._EMERGENCY, "SELF": g._SELF_RX, "SELF2": g._SELF_HARM_RX, "NEG": g._NEG,
         "S364CTX": g._S364_CTX, "S364HEAVY": g._S364_HEAVY, "S364QUIET": g._S364_QUIET, "S365": g._S365, "S365QUIET": g._S365_QUIET, "PAST": g._PAST, "OTHER": g._OTHER, "OTHERNOW": g._OTHER_NOW, "REPORTED": g._REPORTED, "AGEPAST": g._AGE_PAST, "INCARE": g._IN_CARE, "RES": g._RESOLVED, "LASTREL": g._LASTREL, "PRESENT": g._PRESENT, "CLAUSE": g._CLAUSE, "IDIOM": g._IDIOM, "WHOLE": g._WHOLE, "SELFW": g._SELF_WHOLE, "THIRD": g._THIRD_NOW, "THIRDC": g._THIRD_CHILD, "LEADIN": g._LEADIN, "LEGBREATH": g._LEG_BREATH, "PROCFEVER": g._PROC_FEVER, "FEVER": re.compile(g._FEVER), "PROCFQ": re.compile(g._PROC_FEVER_QUIET), "OTHERHIST": g._OTHER_HIST_SENT, "PROCWORD": g._PROC_WORD, "LIVEREPORT": g._LIVE_REPORT, "FAINTWORD": g._FAINT_WORD, "FAINTREC": g._FAINT_RECOVERY, "HEAVYPHRASE": g._HEAVY_PHRASE, "HEAVYUSUALQ": g._HEAVY_USUAL_Q, "HEAVYUSUALCTRL": g._HEAVY_USUAL_CTRL, "BLOOD346": g._BLOOD346, "SIGN346": g._SIGN346, "PASTQ346": g._PAST_Q346, "BAD346": g._BAD346, "CANTSTAND346": g._CANTSTAND346, "WAKE342": g._WAKE342, "EYES342": g._EYES342, "HOT342": g._HOT342, "SIGN342": g._SIGN342, "NEG342": g._NEG342, "MORN342": g._MORN342, "S343": g._S343, "S343SIGN": g._S343_SIGN, "QUIET347": g._QUIET347, "PROCTIME": re.compile(g._PROC + r"[^.;!?\n,]{0,30}?\b(?:last (?:week|night|month)|(?:\w+ ){1,2}(?:days?|weeks?) ago|yesterday|on (?:mon|tues|wednes|thurs|fri|satur|sun)day)\b")}
    return HEAD + "".join(f"export const {k}_SRC = String.raw`{v.pattern}`;\n" for k, v in m.items())


if __name__ == "__main__":
    OUT.write_text(render())
