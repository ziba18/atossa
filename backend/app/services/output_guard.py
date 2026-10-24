"""Deterministic guard for any model-written text before it reaches the user.

Prototype (not wired in). The product rule: Atossa never names a condition as a finding,
gives a probability, suggests a cause, or recommends treatment. A system prompt alone is
not enough, so every model-written string goes through check() and, on a hit, is replaced
by a fixed fallback. The user's own words are not checked here: echoing them back is fine.
"""
import re
from dataclasses import dataclass

FALLBACK = "I can't assess that, but your GP can. Want to add anything else to your note?"
URGENT = (
    "This could need urgent help. If you have severe sudden pain, very heavy bleeding or "
    "feel faint, call 999 or go to A&E, or call NHS 111."
)

_CONDITIONS = [
    r"pcos", r"polycystic", r"endo(?:metriosis)?", r"adenomyosis", r"fibroids?", r"pid",
    r"pelvic inflammatory", r"ovarian cysts?", r"cancer", r"ibs", r"irritable bowel",
    r"pmdd", r"pms", r"hypothyroid\w*", r"insulin resistance", r"diabetes", r"anaemia",
    r"anemia", r"ectopic", r"miscarriage", r"infertility", r"menopause", r"perimenopause",
]
_PATTERNS = {
    "condition": r"\b(?:" + "|".join(_CONDITIONS) + r")\b",
    "hedged_diagnosis": r"\b(?:you (?:may|might|could|probably|likely) (?:have|be suffering)|"
                        r"this (?:sounds|looks|seems) like|consistent with|suggests?|indicat\w+|"
                        r"signs? of|symptoms? of|points? to|typical of|diagnos\w+)\b",
    "cause": r"\b(?:caused by|because of|due to|results? from|is (?:often )?a sign|"
             r"the reason|that is why|triggered by|linked to|related to)\b",
    "probability": r"\b(?:\d{1,3}\s?%|percent|likely|unlikely|probabl\w+|chances? (?:are|of)|odds)\b",
    "treatment": r"\b(?:you (?:should|could|can|might want to) (?:take|try|use|avoid|eat|stop)|"
                 r"i (?:recommend|suggest|advise)|try taking|ibuprofen|paracetamol|naproxen|"
                 r"mefenamic|codeine|metformin|inositol|contraceptive|the pill|hormone therapy|"
                 r"supplements?|vitamin\s?\w+|magnesium|turmeric|heat pad|hot water bottle|"
                 r"exercise|diet|medication|dose)\b",
    "reassurance": r"\b(?:nothing to worry|normal|not serious|don'?t worry|perfectly fine)\b",
}
_COMPILED = {k: re.compile(v, re.I) for k, v in _PATTERNS.items()}

_EMERGENCY = re.compile(
    r"\b(?:can'?t breathe|chest pain|faint(?:ed|ing)?|passed out|collaps\w+|soaking (?:a )?pad (?:an|every) hour|"
    r"(?:very |really )?heavy bleeding|severe (?:sudden )?pain|worst pain|suicid\w+|kill myself|"
    r"self[- ]harm|want to die|pregnan\w+ and (?:bleeding|pain))\b",
    re.I,
)


@dataclass
class GuardResult:
    ok: bool
    text: str
    reasons: list[str]


def is_emergency(user_text: str) -> bool:
    """Run on the USER's text; a hit means show URGENT instead of any model output."""
    return bool(_EMERGENCY.search(user_text))


def check(model_text: str, user_text: str = "") -> GuardResult:
    """Return the text unchanged if clean, else the fixed fallback (or URGENT).

    Words the user themselves wrote are allowed back (e.g. their doctor's diagnosis quoted
    by them), so a hit that is a verbatim substring of user_text is ignored.
    """
    if user_text and is_emergency(user_text):
        return GuardResult(False, URGENT, ["emergency_input"])
    user_low = user_text.lower()
    reasons = []
    for name, rx in _COMPILED.items():
        for m in rx.finditer(model_text):
            if m.group(0).lower() not in user_low:
                reasons.append(name)
                break
    if reasons:
        return GuardResult(False, FALLBACK, reasons)
    return GuardResult(True, model_text, [])
