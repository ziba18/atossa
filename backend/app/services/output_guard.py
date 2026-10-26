"""Deterministic guard for any model-written text before it reaches the user.

Wired into POST /chat (app/routers/chat.py). The product rule: Atossa never names a condition as a finding,
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
# Questions Sage is meant to ask ("does it get worse with exercise?", "are you taking any
# medication?", "is it related to your period?") must pass, so bare topic words only count
# inside advice, assertion or reassurance phrasing.
_ADVICE_OBJECT = (r"(?:medication|medicine|painkillers?|supplements?|vitamin\s?\w+|magnesium|"
                  r"turmeric|(?:heat|heating) pads?|dairy|gluten|sugar|caffeine|alcohol|(?:low-?carb |keto |vegan )?diet|hot water bottles?|exercis\w*|yoga|cutting out \w+|"
                  r"the pill|contraceptives?|hormone therapy)")
_PATTERNS = {
    "condition": r"\b(?:" + "|".join(_CONDITIONS) + r")\b",
    "hedged_diagnosis": r"\b(?:you (?:may|might|could|probably|likely) (?:have|be suffering)|"
                        r"(?:this|that|it) (?:sounds|looks|seems) like (?:a |an )?(?:condition|disorder|"
                        r"syndrome|disease|infection|problem with)|consistent with|"
                        r"(?:this|that|it|which) (?:suggests?|indicates?|points? to)|typical of|(?:this|that|it|which|these|those) points? (?:to|towards)|underlying (?:condition|problem|issue|cause)|"
                        r"fits? the picture|(?:classic|textbook|common) (?:presentation|signs?|symptoms?)|"
                        r"(?:is|are) an? (?:symptom|sign) of|looks? like you (?:may|might|could)|"
                        r"(?:you(?:'re| are) )?(?:probably|likely|possibly) \w*(?:pausal|ic|emic)\b|"
                        r"signs? of (?:a |an |something)|diagnos\w+)\b",
    "cause": r"\b(?:caused by|(?:is|are|could be|may be|might be|probably|likely) "
             r"(?:due to|because of|linked to|related to|triggered by|a sign)|"
             r"results? from|the reason (?:for|is|why)|that is why|that's why|"
             r"(?:probably|likely|possibly|maybe) (?:\w+ ){0,2}(?:related|induced|driven|triggered)|"
             r"(?:are|is|be) (?:the|a) (?:main |likely |possible )?cause|usually (?:means|caused)|"
             r"(?:probably|likely) (?:your|the) \w+ (?:rather|and not)|because of (?:your|the) (?:hormones?|insulin|stress|diet))\b",
    "probability": r"\b(?:\d{1,3}\s?%|percent|chances? (?:are|of)|odds|"
                   r"(?:most |very |quite )?(?:likely|unlikely|probably) (?:to be|that|is|it's|caused)|"
                   r"most (?:likely|people|women)|statistically|\d+ in \d+|\d+ out of \d+ (?:people|women)|good chance)\b",
    "treatment": r"\b(?:i(?:'d| would) (?:stop|start|take|try|avoid|cut|skip|switch|come off)|you (?:should|could|can|might want to|may want to) (?:take|try|use|avoid|eat|stop|start|cut)|"
                 r"(?:you(?:'d| would)? (?:probably |maybe )?(?:feel better|do better) if)|"
                 r"(?:often|usually|generally|frequently|commonly|typically|sometimes) (?:also )?(?:help|ease|relieve|reduce|improve|calm|settle)s?|known to (?:help|ease|calm)|"
                 r"(?:take|have|try) a (?:warm )?(?:bath|pregnancy test)|"
                 r"(?:give|prescribe)s? you the pill|lose (?:some )?weight|laparoscopy|surgery|hysterectomy|naproxen|"
                 r"i (?:recommend|suggest|advise)|(?:try|consider) (?:taking |using |doing |some )?" + _ADVICE_OBJECT +
                 r"|" + _ADVICE_OBJECT + r" (?:may|might|can|could|will|often) (?:help|ease|relieve|reduce)|"
                 r"ibuprofen|paracetamol|naproxen|mefenamic|codeine|metformin|inositol|dose)\b",
    "reassurance": r"\b(?:nothing to worry|(?:that's|that is|this is|it's|it is) (?:perfectly |completely |quite |very )?"
                   r"(?:totally |completely |perfectly |quite |very )?(?:normal|common|fine|nothing)(?! to\b)|not serious|nothing serious|"
                   r"nothing (?:to be )?(?:concerned|worried)|(?:try )?not to worry|don'?t worry|perfectly fine|you'?ll be (?:fine|ok|okay|alright)|"
                   r"very common thing|(?:very |quite )?(?:frequent|common) complaint|lose sleep over|nothing (?:sinister|alarming)|cause for (?:alarm|concern))\b",
}
_COMPILED = {k: re.compile(v, re.I) for k, v in _PATTERNS.items()}

# Advice phrased as an instruction only counts in statements: "Did you have to stop?" is a fair question.
_ADVICE_MODAL = re.compile(
    r"\b(?:you )?(?:ought to|need to|must|have to|might want to|may want to|should|will want to|can try|could try|worth trying|avoid) "
    r"(?:\w+ ){0,2}(?:take|try|use|avoid|eat|stop|start|cut|begin|ask for|get a|have a|lose|drink|do a|reduce)\b",
    re.I,
)

# Sage's job is to ask questions. A statement is only let through if it is a short acknowledgement
# or a pointer to the GP; every other statement (explanations, tips, reassurance in new words) is
# swapped for the fallback, so a paraphrase the regexes above never saw still cannot get through.
_ACK_OPENER = re.compile(
    r"^(?:thanks|thank you|noted|got it|okay|ok|understood|alright|sure|i see|makes sense|i hear you|i understand|i'?m sorry|sorry|no worries|take your time|"
    r"that sounds (?:really |so |very )?(?:like a lot|tough|hard|difficult|painful|exhausting|frustrating|awful|rough|draining|miserable|worrying)|"
    r"i(?:'ve| have) (?:noted|saved|added|recorded|logged|put)|i can'?t (?:assess|say|diagnose|tell)|i(?:'m| am) not able to (?:say|assess|tell|diagnose)|that helps me (?:capture|note|record|describe|write|put)|your gp can|"
    r"you can (?:skip|edit|come back|add|change|stop)|you don'?t have to|that'?s (?:noted|saved|added)|that is (?:noted|saved|added)|"
    r"tell me|you mentioned|you can tap|you should see your gp|it(?:'s| is) useful to note|it might help to note|"
    r"this will help your (?:doctor|gp)|let me (?:check|confirm|make sure)|you (?:said|told me|mentioned|wrote)|i can only (?:help|note|write|record)|that helps me (?:understand|picture|see)|i(?:'m| am) here (?:to help|whenever|if)|it(?:'s| is) (?:completely |perfectly )?fine to |it might be worth (?:jotting|noting|writing)|that sounds like (?:a |an )?(?:\w+ ){0,2}(?:day|week|night|time|morning|month)|i(?:'ll| will) help you (?:turn|write|add|put|note|describe))\b",
    re.I,
)
_MAX_ACK_WORDS = 20
# Phrases an acknowledgement may contain although they hold a claim word.
_ACK_SAFE = re.compile(r"\b(?:what it means|worth (?:noting|jotting|writing|adding)|your cycle|could be useful|can help you|may help your gp|would help your gp)\b", re.I)
# A short statement that is not on the opener list still passes unless it carries a claim:
# a body-system or cause word, a hedge, a verdict, or advice.
_CLAIM = re.compile(
    r"\b(?:hormon\w*|cycle|ovar\w*|womb|uter\w*|cysts?|tissue|scar\w*|thyroid|progesterone|oestrogen|estrogen|insulin|"
    r"infect\w*|inflam\w*|stress\w*|diet|vitamin\w*|supplements?|remed\w*|flare\w*|condition|syndrome|disease|serious|harmless|"
    r"benign|alarming|concern\w*|worr\w*|ibuprofen|paracetamol|iron|blood test|ovulat\w*|process|"
    r"will (?:pass|go|clear|settle|resolve)|go away|clear up|settle|sort (?:it|this)|guess|bet|likel\w*|probabl\w*|chances?|"
    r"usually|typical\w*|frequent\w*|tends? to|often|rarely|always|mostly|typical|signals?|indicat\w*|linked|reason|because|due|culprit|cause\w*|"
    r"signs?|suggest\w*|sounds? (?:as though|like)|reads? like|looks? like|means|comes? with|should|would|could|might|may|"
    r"can help|improves?|works?|wonders?|normal\w*|heat\w*|compress\w*|packs?|lie down|better|baths?|reduces?|reaction|take care|painkillers?|antibiotics?|tablets?|pills?|frequently|commonly|complaint|reliev\w*|swear|heal\w*|ease|treat\w*|cure|explanation|benefit|down to|worth|no need|end up|i'?d say|nothing at all|by itself|"
    r"noticeable|difference|normally|calm\w*|helps?|\d+\s?%|\d+ in \d+)\b|^(?:try|avoid|take|use|eat|drink|consider|cut|stop|start|apply|rest)\b|%",
    re.I,
)
_MAX_PLAIN_WORDS = 14


def _sentences(text: str) -> list[str]:
    return [t.strip() for t in re.split(r"(?<=[.!?])\s+|\n+", text) if t.strip()]


def _statement_hits(model_text: str) -> list[str]:
    reasons = []
    for sent in _sentences(model_text):
        if sent.endswith("?"):
            continue
        if _ADVICE_MODAL.search(sent):
            reasons.append("advice")
        elif (ack := _ACK_OPENER.match(sent)) and len(sent.split()) <= _MAX_ACK_WORDS:
            # An opener does not excuse a claim in the rest of the sentence ("Thanks, it's likely hormonal").
            # (Echo openers - "You mentioned your diet changed" - restate the user's words, so they are exempt.)
            echo = re.match(r"you (?:said|told me|mentioned|wrote)", ack.group(0), re.I)
            if not echo and _CLAIM.search(_ACK_SAFE.sub("", sent[ack.end():])):
                reasons.append("statement")
        elif len(sent.split()) > _MAX_PLAIN_WORDS or _CLAIM.search(sent):
            reasons.append("statement")
    return reasons

_NEG = re.compile(r"\b(?:no|not|never|nothing|without|isn'?t|wasn'?t|aren'?t|didn'?t|don'?t|doesn'?t|haven'?t|hasn'?t|"
                  r"nor|none|n'?t|not even|hardly)\b|\bn't\b", re.I)
_PAST = re.compile(r"\b(?:years? ago|(?:19|20)\d\d|last (?:year|decade)|as a (?:teen|child)|used to|in the past|back then|when i was (?:a )?(?:teen|kid|child|younger))\b", re.I)
_OTHER = re.compile(r"\b(?:my (?:sister|mum|mom|friend|mother|dad|brother|colleague|daughter)|she|he|they|her|his|their)\b", re.I)
_BODY = [
    r"can'?t (?:breathe|catch my breath|get (?:any )?air)", r"struggling to breathe", r"chest (?:pain|is tight|tightness|hurts?)",
    r"(?:tight|crushing) chest", r"faint(?:ed|ing)?", r"passed out|blacked out|black(?:ing)? out", r"collaps\w+",
    r"going to (?:pass out|collapse|faint)", r"fell over", r"everything (?:went|goes|turned) (?:black|dark|grey|gray|white)", r"woke (?:up )?on the floor",
    r"gushing", r"lost (?:so |a lot of |too )?much blood|lost a lot of blood", r"can'?t get my breath|gasping|heart is (?:pounding|racing).{0,40}breath",
    r"agoni[sz]ing|doubled over", r"soaked .{0,15}(?:pads?|tampons?).{0,25}(?:half an hour|an hour|\d+ minutes)",
    r"passing (?:huge|big|large) clots", r"too many (?:pills|tablets)", r"(?:pad|tampon|towel)s? (?:is|are|was|were) (?:full|soaked|saturated) in (?:\d+ (?:minutes|mins)|an? (?:hour|few minutes))",
    r"(?:bleeding|soaking|through) .{0,30}(?:under|less than|within) (?:an|one) hour", r"can'?t stop bleeding",
    r"(?:trouble|difficulty|hard to|struggling to) breath\w*", r"pressure in (?:my )?chest", r"lips (?:are |turning |gone )?blue",
    r"might pass out", r"(?:room is |everything is )spinning.{0,60}(?:pain|horrific)", r"pain (?:is |was )?(?:horrific|agonising|agonizing|intense)",
    r"(?:so intense|too much).{0,40}(?:can'?t move|crying on the)", r"crying on the (?:bathroom )?floor",
    r"out of nowhere.{0,40}severe|severe.{0,40}(?:sick|sweaty|sweating)", r"worst (?:\w+ )?of my life", r"screaming",
    r"drenched in sweat", r"vision (?:went|goes|has gone) (?:grey|gray|black|dark)",
    r"soaking (?:through )?(?:a |my |an? )?(?:pad|tampon|towel|clothes)s?(?: (?:an|every|each) hour)?",
    r"(?:pad|tampon)s? (?:every|each|an) hour", r"(?:changed|changing) (?:my )?(?:pad|tampon)s? (?:\w+ times )?(?:in|every|each) (?:an|one|half an) hour",
    r"blood everywhere", r"(?:very |really |so |extremely )?heav(?:y|ily) bleeding", r"bleeding (?:really |very |so )?heav(?:y|ily)",
    r"bleeding (?:a )?(?:huge|massive|lot|loads)", r"clots (?:the size|as big|bigger)", r"severe (?:sudden )?(?:pain|belly|abdominal|pelvic)",
    r"worst pain|worst (?:I'?ve|i have) ever|pain (?:came|comes) on suddenly|sudden(?:ly)? (?:stabbing|sharp|severe|intense)",
    r"excruciating|unbearable", r"pain is (?:10|ten)(?:/| out of )(?:10|ten)", r"(?:10|ten)(?:/| out of )(?:10|ten) pain",
    r"can'?t stand up", r"pregnan\w+.{0,60}(?:bleed|pain|spotting)|(?:bleed|pain|spotting).{0,60}pregnan\w+",
    r"(?:\d+|\w+) weeks pregnant.{0,60}(?:pain|bleed|spotting)", r"high fever.{0,40}(?:severe|pain)|(?:severe|pain).{0,40}high fever",
]
_SELF = [
    r"suicid\w+", r"kill(?:ing)? (?:myself|me)", r"(?:want|wants|need) (?:it|this|everything|things) (?:all )?to (?:stop|end)",
    r"end(?:ing)? things", r"(?:took|taken|taking) (?:a load|lots|too many|an overdose)\b.{0,30}(?:tablets|pills|paracetamol)|overdos\w+",
    r"(?:tablets|pills).{0,30}don'?t care what happens", r"self[- ]harm\w*", r"(?:want|wanna|going) to die", r"end(?:ing)? it all",
    r"end(?:ing)? my (?:own )?life", r"(?:don'?t|do not) want to be (?:alive|here)(?: anymore| any more)?", r"hurt(?:ing)? myself",
    r"cutting myself", r"better off (?:dead|without me)", r"take my own life",
]
_BODY_RX = re.compile(r"(?:" + "|".join(_BODY) + r")", re.I)
_SELF_RX = re.compile(r"(?:" + "|".join(_SELF) + r")", re.I)
_CLAUSE = re.compile(r"[.;!?\n]+|,\s*|\bbut\b|\band\b(?=\s+(?:i|it|the|my)\b)", re.I)

URGENT_SELF_HARM = (
    "I'm really sorry you're feeling this way. You don't have to cope alone: please call Samaritans free on "
    "116 123 any time, or call 999 if you might act on these thoughts."
)


def _hits(rx, text: str) -> bool:
    """A match counts unless its clause is negated, in the past, or about someone else."""
    for clause in _CLAUSE.split(text):
        for m in rx.finditer(clause):
            before = clause[: m.start()]
            if _NEG.search(before[-40:]) or _PAST.search(clause) or _OTHER.search(before):
                continue
            return True
    return False


_PREG_WHOLE = re.compile(r"\bpregnan\w+\b", re.I)
_PREG_SYMPTOM = re.compile(r"\b(?:bleeding|spotting|cramps? (?:are |is )?(?:getting )?worse|severe|sharp pain|one-sided)\b", re.I)


def emergency_kind(user_text: str):
    """None, 'self_harm' or 'medical'. Negated, past or third-person mentions do not count."""
    if _hits(_SELF_RX, user_text):
        return "self_harm"
    if _hits(_BODY_RX, user_text):
        return "medical"
    if _PREG_WHOLE.search(user_text) and _hits(_PREG_SYMPTOM, user_text) and not re.search(r"\bnot pregnant\b|\bpregnancy test\b", user_text, re.I):
        return "medical"
    return None


def urgent_text(user_text: str) -> str:
    return URGENT_SELF_HARM if emergency_kind(user_text) == "self_harm" else URGENT


@dataclass
class GuardResult:
    ok: bool
    text: str
    reasons: list[str]


def is_emergency(user_text: str) -> bool:
    """Run on the USER's text; a hit means show URGENT instead of any model output."""
    return emergency_kind(user_text) is not None


_ECHO_OK = {"condition", "treatment"}


def check(model_text: str, user_text: str = "", check_emergency: bool = True) -> GuardResult:
    """Return the text unchanged if clean, else the fixed fallback (or URGENT).

    Words the user themselves wrote are allowed back (e.g. their doctor's diagnosis quoted
    by them), so a hit that is a verbatim substring of user_text is ignored.
    """
    if check_emergency and user_text and is_emergency(user_text):
        return GuardResult(False, urgent_text(user_text), ["emergency_input"])
    user_low = user_text.lower()
    reasons = []
    for name, rx in _COMPILED.items():
        for m in rx.finditer(model_text):
            # Only a condition or drug name the user wrote as a whole word may come back; a
            # probability, cause or reassurance phrase is never excused ("percentage" in the
            # user's text must not excuse "15 percent").
            echoed = name in _ECHO_OK and re.search(r"\b" + re.escape(m.group(0).lower()) + r"\b", user_low)
            if not echoed:
                reasons.append(name)
                break
    reasons += [r for r in _statement_hits(model_text) if r not in reasons]
    if reasons:
        return GuardResult(False, FALLBACK, reasons)
    return GuardResult(True, model_text, [])
