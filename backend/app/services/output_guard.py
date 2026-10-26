"""Deterministic guard for any model-written text before it reaches the user.

Wired into POST /chat (app/routers/chat.py). The product rule: Atossa never names a condition as a finding,
gives a probability, suggests a cause, or recommends treatment. A system prompt alone is
not enough, so every model-written string goes through check() and, on a hit, is replaced
by a fixed fallback. The user's own words are not checked here: echoing them back is fine.
"""
import re
import unicodedata
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
# Questions Sage is meant to ask ("does it get worse with exercise?", "are you taking any
# medication?", "is it related to your period?") must pass, so bare topic words only count
# inside advice, assertion or reassurance phrasing.
_ADVICE_OBJECT = (r"(?:medication|medicine|painkillers?|supplements?|vitamin\s?\w+|magnesium|"
                  r"turmeric|heat pads?|hot water bottles?|exercis\w*|yoga|diet|cutting out \w+|"
                  r"the pill|contraceptives?|hormone therapy)")
_PATTERNS = {
    "condition": r"\b(?:" + "|".join(_CONDITIONS) + r")\b",
    "hedged_diagnosis": r"\b(?:you (?:may|might|could|probably|likely) (?:have|be suffering)|"
                        r"(?:this|that|it) (?:sounds|looks|seems) like (?:a |an )?(?:condition|disorder|"
                        r"syndrome|disease|infection|problem with)|consistent with|"
                        r"(?:this|that|it|which) (?:suggests?|indicates?|points? to)|typical of|"
                        r"signs? of (?:a |an |something)|diagnos\w+)\b",
    "cause": r"\b(?:caused by|(?:is|are|could be|may be|might be|probably|likely) "
             r"(?:due to|because of|linked to|related to|triggered by|a sign)|"
             r"results? from|the reason (?:for|is|why)|that is why|that's why)\b",
    "probability": r"\b(?:\d{1,3}\s?%|percent|chances? (?:are|of)|odds|"
                   r"(?:most |very |quite )?(?:likely|unlikely|probably) (?:to be|that|is|it's|caused))\b",
    "treatment": r"\b(?:you (?:should|could|can|might want to|may want to) (?:take|try|use|avoid|eat|stop|start|cut)|"
                 r"i (?:recommend|suggest|advise)|(?:try|consider) (?:taking |using |doing |some )?" + _ADVICE_OBJECT +
                 r"|" + _ADVICE_OBJECT + r" (?:may|might|can|could|will|often) (?:help|ease|relieve|reduce)|"
                 r"ibuprofen|paracetamol|naproxen|mefenamic|codeine|metformin|inositol|dose)\b",
    "reassurance": r"\b(?:nothing to worry|(?:that's|that is|this is|it's|it is) (?:perfectly |completely |quite |very )?"
                   r"(?:normal|common|fine|nothing)|not serious|don'?t worry|perfectly fine)\b",
}
_COMPILED = {k: re.compile(v, re.I) for k, v in _PATTERNS.items()}

SELF_HARM = (
    "I'm really sorry you're feeling this way, and I'm glad you said so. If you might act on these "
    "thoughts, call 999 now. You can also call Samaritans free, any time, on 116 123, or call NHS 111."
)

_SELF_HARM_RX = re.compile(
    r"\b(?:suicid\w+|kill(?:ing)? myself|end(?:ing)? my (?:own )?life|self[- ]harm\w*|want(?:ed)? to die|"
    r"don'?t want to (?:be here|live|wake up)|end it all|hurt(?:ing)? myself|overdos\w+|"
    r"(?:took|taken|swallowed) (?:too many|a lot of|all (?:my|the)) (?:pills|tablets|painkillers))\b",
    re.I,
)
_EMERGENCY = re.compile(
    r"\b(?:can'?t breathe?|can'?t breath\b|can'?t (?:catch|get) my breath|struggling to breathe|chest pain|coughing up blood|"
    r"faint(?:ed|ing)?|passed out|passing out|(?:going|about) to pass out|blacked out|black(?:ing)? out|collaps\w+|"
    r"soaking (?:a |through (?:a )?)?pads? (?:an|every|each) hour|"
    r"bleeding (?:through|heavily|badly)|(?:very |really |so )?heavy bleeding|bleeding (?:really |very |so )(?:heavily|badly)|"
    r"severe (?:sudden )?(?:\w+ ){0,2}pain|worst pain|unbearable pain|excruciating|in agony|agony|gushing blood|pool of blood|(?:can'?t|can hardly|hardly) breathe?|"
    r"worst (?:pain )?(?:i'?ve|i have) ever|pain so bad|(?:big )?clots? (?:the size of|bigger than)|pain (?:is |was )?unbearable|pain (?:is |was )?(?:a )?(?:10|ten)(?:/| out of )10|"
    r"sudden (?:sharp |stabbing )?pain|\bi(?:'?m| am| think i'?m)? (?:\w+ ){0,3}miscarr\w+|"
    r"pregnan\w+ and (?:bleeding|pain|cramp\w*)|(?:i'?m|i am|am) pregnant.{0,40}(?:bleeding|pain|cramp\w*))\b",
    re.I,
)


_QUOTES = str.maketrans({"\u2018": "'", "\u2019": "'", "\u02bc": "'", "\u2032": "'", "\u201c": '"', "\u201d": '"'})


def _norm(text: str) -> str:
    """Make typed text match the patterns: phone keyboards type curly apostrophes (can’t),
    and model output can carry full-width letters or invisible characters inside a word."""
    text = unicodedata.normalize("NFKC", text)
    text = "".join(ch for ch in text if unicodedata.category(ch) != "Cf")
    return text.translate(_QUOTES)


@dataclass
class GuardResult:
    ok: bool
    text: str
    reasons: list[str]


def is_emergency(user_text: str) -> bool:
    """Run on the USER's text; a hit means show URGENT instead of any model output."""
    user_text = _norm(user_text)
    return bool(_EMERGENCY.search(user_text) or _SELF_HARM_RX.search(user_text))


def emergency_message(user_text: str) -> str:
    """The fixed signpost for an emergency hit: self-harm gets support lines, the rest 999/A&E/111."""
    return SELF_HARM if _SELF_HARM_RX.search(user_text) else URGENT


def check(model_text: str, user_text: str = "") -> GuardResult:
    """Return the text unchanged if clean, else the fixed fallback (or URGENT).

    Words the user themselves wrote are allowed back (e.g. their doctor's diagnosis quoted
    by them), so a hit that is a verbatim substring of user_text is ignored.
    """
    if user_text and is_emergency(user_text):
        return GuardResult(False, emergency_message(user_text), ["emergency_input"])
    model_text = _norm(model_text)
    user_low = _norm(user_text).lower()
    reasons = []
    for name, rx in _COMPILED.items():
        for m in rx.finditer(model_text):
            if m.group(0).lower() not in user_low:
                reasons.append(name)
                break
    if reasons:
        return GuardResult(False, FALLBACK, reasons)
    return GuardResult(True, model_text, [])
