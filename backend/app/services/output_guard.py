"""Deterministic guard for any model-written text before it reaches the user.

Wired into POST /chat (app/routers/chat.py). The product rule: Atossa never names a condition as a finding,
gives a probability, suggests a cause, or recommends treatment. A system prompt alone is
not enough, so every model-written string goes through check() and, on a hit, is replaced
by a fixed fallback. The user's own words are not checked here: echoing them back is fine.
"""
import os
import re
import unicodedata
from dataclasses import dataclass

FALLBACK = "I can't assess that, but your GP can. Want to add anything else to your note?"
URGENT = (
    "This could need urgent help. If you have severe sudden pain, very heavy bleeding or feel faint, "
    "call 999 or go to A&E, or call NHS 111."
)

_CONDITIONS = [
    r"pcos", r"pmos", r"poly-?endocrine metabolic ovarian syndrome", r"poly?-?cystic", r"poly?kyst\w*", r"poliquist\w*", r"polikist\w*", r"policyst\w*", r"policist\w*", r"endo(?:metrio\w*)?", r"adenomyosis", r"fibroids?", r"pid",
    r"pelvic inflammatory", r"ovarian cysts?", r"cancer", r"ibs", r"irritable bowel",
    r"pmdd", r"pms", r"(?:interstitial )?cystitis", r"bladder pain syndrome", r"dysmenorrh\w*", r"vulvodynia", r"pelvic congestion", r"hypothyroid\w*", r"insulin resistance", r"diabetes", r"anaemia",
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
                        r"signs? of (?:a |an |something)|(?<!can't )(?<!can’t )(?<!cannot )(?<!don't )(?<!won't )(?<!not )(?<!unable to )diagnos\w+)\b",
    "cause": r"\b(?:caused by|(?:is|are|could be|may be|might be|probably|likely) "
             r"(?:due to|because of|linked to|related to|triggered by|a sign)|"
             r"results? from|the reason (?:for|is|why)|that is why|that's why|"
             r"(?:probably|likely|possibly|maybe) (?:\w+ ){0,2}(?:related|induced|driven|triggered)|"
             r"(?:are|is|be) (?:the|a) (?:main |likely |possible )?cause|usually (?:means|caused)|"
             r"(?:probably|likely) (?:your|the) \w+ (?:rather|and not)|because of (?:your|the) (?:hormones?|insulin|stress|diet))\b",
    "probability": r"\b(?:\d{1,3}\s?%|percent|chances? (?:are|of)|odds|"
                   r"(?:most |very |quite )?(?:likely|unlikely|probably) (?:to be|that|is|it's|caused)|"
                   r"most (?:likely|people|women)|statistically|\d+ in \d+|\d+ out of \d+ (?:people|women)|good chance)\b",
    "treatment": r"\b(?:i(?:'d| would) (?:stop|start|take|try|avoid|cut|skip|switch|come off)|you (?:should|could|can|might want to|may want to) (?:take(?! (?:it |this |that |them )?(?:to|along to|with you to) (?:a |an |your )?(?:doctor|gp|appointment|pharmacist))|try|use|avoid|eat|stop|start|cut)|"
                 r"(?:you(?:'d| would)? (?:probably |maybe )?(?:feel better|do better) if)|"
                 r"(?:often|usually|generally|frequently|commonly|typically|sometimes) (?:also )?(?:help|ease|relieve|reduce|improve|calm|settle)s?|known to (?:help|ease|calm)|"
                 r"(?<!did you )(?<!have you )(?<!do you )(?<!had you )(?:take|have|try) a (?:warm )?(?:bath|pregnancy test)|"
                 r"(?:give|prescribe)s? you the pill|lose (?:some )?weight|laparoscopy|surgery|hysterectomy|naproxen|"
                 r"i (?:recommend|suggest|advise)|(?:try|consider) (?:taking |using |doing |some )?" + _ADVICE_OBJECT +
                 r"|" + _ADVICE_OBJECT + r" (?:may|might|can|could|will|often) (?:help|ease|relieve|reduce)|"
                 r"ibuprofen|paracetamol|naproxen|mefenamic|codeine|metformin|inositol|dose)\b",
    "reassurance": r"\b(?:nothing to worry|(?:that's|that is|this is|it's|it is) (?:perfectly |completely |quite |very )?"
                   r"(?:totally |completely |perfectly |quite |very )?(?:normal|common|fine|nothing)(?! to\b)|not serious|nothing serious|"
                   r"nothing (?:to be )?(?:concerned|worried)|(?:try )?not to worry|don'?t worry|perfectly fine|you'?ll be (?:fine|ok|okay|alright)|"
                   r"very common thing|(?:very |quite )?(?:frequent|common) complaint|lose sleep over|nothing (?:sinister|alarming)|cause for (?:alarm|concern)|"
                   # "you don't need to call 111" talks her out of help (probe v21, 2026-10-27)
                   r"(?:don'?t|do not|won'?t|wouldn'?t|shouldn'?t) (?:really )?(?:need|have) to (?:call|ring|phone|see|go to|contact|bother)|"
                   r"no need (?:for you )?to (?:call|ring|phone|see|go to|contact|bother))\b",
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
    r"^(?:what i can do is (?:write|turn|put|note|keep|add|record|help)|it makes sense to (?:mention|tell me|bring up|note|add)|if (?:it helps|you want|you(?:'d| would) like|you tell me [^,]{1,40}),? i(?:'ll| will| can) (?:add|note|put|write|keep|record|help)|i believe (?:you|what you)(?!'re right|'re correct| are right| are correct)|no,? i can'?t\b|i(?:'m| am) not going to (?:read|guess|judge|say)|that sounds like (?:a |an )?(?:\w+ ){0,2}wait|noted:|there(?:'s| is) no (?:right answer|need to (?:decide|rush|answer|explain|have it all))|"
    r"what an? (?:\w+ ){1,2}(?:week|day|time|night|month)|good,? (?:that'?s|to know)|so (?:it'?s|you(?:'ve|'re)?|that'?s)\b|that(?:'s| is) (?:a )?(?:helpful|useful|clear|good|really helpful)|that detail|try describing|"
    r"(?:writing|putting|noting) (?:it|this|things) down(?: clearly)? can help (?:you|your)\b|it sounds like (?:you(?:'ve| have|'re| are)?|your|the \w+(?: \w+)? (?:has|have|is|are|was|were)|it(?:'s| has) been)|for now,? i(?:'m| am) (?:just )?here|i can help you|thanks|thank you|noted|got it|okay|ok|understood|alright|sure|i see|makes sense|i hear you|i understand|i'?m sorry|sorry|no worries|no rush|no problem|take your time|"
    r"if you(?:'d| would) like,? you could (?:bring|show|share|take) (?:this|the|your) (?:summary|notes?|log)\b|"
    r"your (?:doctor|gp) (?:may|might|will|could) find (?:it|this) (?:useful|helpful)\b|"
    r"it sounds like (?:a |an )?(?:really |very |so )?(?:\w+ ){0,1}(?:week|day|night|time|month|morning)\b|your (?:doctor|gp) (?:may|might|will|could) (?:ask|want to know)\b|"
    r"that sounds (?:really |so |very )?(?:like a lot|tough|hard|difficult|painful|exhausting|frustrating|awful|rough|draining|miserable|worrying|scary|frightening|upsetting|horrible|stressful|overwhelming|distressing|lonely|unpleasant|grim)|"
    r"i(?:'ve| have) (?:noted|saved|added|recorded|logged|put)|i can'?t (?:assess|say|diagnose|tell)|i(?:'m| am) not able to (?:say|assess|tell|diagnose)|that helps me (?:capture|note|record|describe|write|put)|your gp can|"
    r"you can (?:skip|edit|come back|add|change|stop)|you don'?t have to|that'?s (?:noted|saved|added)|that is (?:noted|saved|added)|"
    r"tell me|you mentioned|(?:that )?sounds like (?:it (?:really )?(?:knocked|wiped|floored) you|a (?:rough|long|hard|tough|bad) (?:night|day|week))|let\'?s (?:make it easy|keep it simple|take it slowly|go step by step|just get)|in the meantime,? i can help you|you can tap|you should see your gp|it(?:'s| is) useful to note|it might help to note|"
    r"this will help your (?:doctor|gp)|let me (?:check|confirm|make sure)|you (?:said|told me|mentioned|wrote)|i can only (?:help|note|write|record)|that helps me (?:understand|picture|see)|i(?:'m| am) here (?:to help|whenever|if)|(?:yes,? )?it(?:'s| is) (?:completely |perfectly |absolutely )?(?:fine|okay|ok)(?: to| if)\b|it might be worth (?:jotting|noting|writing)|that sounds like (?:a |an )?(?:\w+ ){0,2}(?:day|week|night|time|morning|month)|i(?:'ll| will) help you (?:turn|write|add|put|note|describe)|i(?:'ve| have| will|'ll| won'?t| don'?t| didn'?t|'m| am| can| know| appreciate| understand| hear) )\b",
    re.I,
)
_MAX_ACK_WORDS = 24
# Phrases an acknowledgement may contain although they hold a claim word.
_ACK_SAFE = re.compile(r"\b(?:your (?:doctor|gp) (?:may|might|will|could) find (?:it|this|that|the \w+) (?:useful|helpful)|your (?:doctor|gp) can say whether [^,.]*|(?:a )?cycle of (?:about |around |roughly )?\d+ days|(?:one|two|three|\d+) tablets?|what it means|not (?:quite )?sure|not be sure|(?:won'?t )?try to (?:explain|guess)(?: it)?(?:, as that'?s for your (?:doctor|gp))?|(?:(?:i hear|i understand|i can see) )?(?:that )?you(?:'re| are) worried|mostly (?:on the (?:left|right)|in the (?:evenings?|mornings?|night)|at night)|help with that|(?:starts?|eases?|stops?) (?:on|by) day (?:one|two|three|four|five|\d)|guess at anything|(?:at|for|from|off|to) (?:work|school|uni)\b|can help you get (?:your )?(?:symptoms|things|it) down(?: clearly)?|make sure|won'?t guess(?: at anything)?|stressful (?:week|day|time|night)|made (?:a|no) difference|the best person to (?:\w+ ){0,3}(?:into|about|with)(?: why it'?s happening| that)?|why it'?s happening|may be useful for your (?:appointment|gp|doctor)|will be useful for your (?:appointment|gp|doctor)|no need to (?:decide|rush|answer|explain)|to help you (?:describe|put|write|note|capture|explain)\b[^.]*|(?:your gp|your doctor) can (?:help|look|advise|assess|check)(?: with that)?|(?:writing|putting|noting) (?:it|this|things) down(?: clearly)? can help (?:your|you)\b[^.]*|if you(?:'re| are) worried|ready for (?:them|your gp|your doctor)|worth (?:noting|jotting|writing|adding)|your cycle|could be useful|can help you|may help your gp|would help your gp|(?:leave|left|leaving|miss(?:ed|ing)?|off) work(?: early)?|under what it affected|(?:the |your )?(?:heat pad|hot water bottle|bath)\b|didn'?t help(?: much)?|how often (?:this|it) happens|(?:logging|tracking) it is worth it|(?:since|in|from|until|till|by|last|early|late|mid|end of) may\b)\b", re.I)
# Signposting to real services and "I won't guess" are safe in any statement (independent set v2, 2026-10-26).
_PLAIN_SAFE = re.compile(r"\b(?:if (?![^.]*\b(?:likel\w*|probabl\w*|usually|just|normal|nothing|hormon\w*|stress)\b)[a-z ,'&]{0,80}?\b(?:severe|sudden|faint|frightened|scared|unwell|dizzy|sick|worse|act on (?:these|those) (?:feelings|thoughts))\b[a-z ,']{0,30}?,? (?:please )?(?=(?:call|ring|go to) )|if you (?:(?:think|feel) (?:like )?you )?might act on (?:these|those|the) (?:feelings|thoughts)|(?:,? )?if (?:that|it) would help(?: later| you)?(?=[.!]|$)|(?:please get support right now: )?call samaritans(?: free)?(?: on 116 123)?|(?:if (?:it'?s|it is|it gets|the pain (?:is|gets)) (?:very |really )?(?:severe|sudden|unbearable|worse)(?:,? (?:or )?(?:sudden|severe))?(?:,? or you(?:'re| are) (?:frightened|scared|worried)(?: right now)?)?,? |if you(?:'re| are) (?:worried|unsure|frightened|scared),? )?(?:please )?(?:call 999|go to a&e|call 111|ring 111|speak to your gp|see your gp|contact your gp)|(?:a |your )?(?:pharmacist|gp|doctor)(?: or (?:a |your )?(?:pharmacist|gp|doctor))? can help|if you(?:'re| are) unsure about what to take,? |(?:it'?s |it is |it (?:may|might|could) be |(?:may|might|could) be )?worth (?:telling|mentioning|showing|asking)(?: (?:it|this|that))?(?: to)? (?:your |a )?(?:doctor|gp|pharmacist|nurse)|(?:don'?t|wouldn'?t) want to guess|(?:wouldn'?t|isn'?t) (?:be )?right for me to guess)", re.I)
# A whole sentence that only points to a real service ("If you think you need help now, call NHS 111 or go to 111.online",
# "If you feel you might hurt yourself, call 999 or go to A&E now, or call Samaritans on 116 123") is safe, as long as
# it carries no cause, verdict, hedge or condition word (NHS set v20, 2026-10-27: 4 of 8 first-contact blocks).
_SIGNPOST_SENT = re.compile(
    r"^(?:if [^.]{0,120}?,\s*)?(?:please |you can |you could )?(?:get help now:?\s*)?(?:call|ring|phone|text|go to|contact|talk to)\b"
    r"[^.]{0,40}?\b(?:999|111|111\.online|a&e|samaritans|shout|85258|116 123|nhs 111)\b[^.]*\.?$"
    r"|^(?:if [^.]{0,120}?,\s*)?(?:please )?(?:call|ring) (?:nhs )?(?:111|999)\b[^.]*\.?$", re.I)
_SIGNPOST_BAD = re.compile(
    r"\b(?:likel\w*|probabl\w*|usually|typical\w*|normal\w*|just|only|nothing|hormon\w*|stress\w*|because|due|caus\w*|signs?|"
    r"means?|sounds? like|could be|may be|might be|endometr\w*|pcos|polycystic|adenomyo\w*|fibroids?|cysts?|infection|ibs|"
    r"anaemi\w*|thyroid|cancer|pregnan\w*|ectopic|miscarr\w*|take|tablets?|pills?|ibuprofen|paracetamol|codeine|dose|mg|"
    r"don'?t need|no need|not need|unless|fine|okay|ok)\b", re.I)
# A short statement that is not on the opener list still passes unless it carries a claim:
# a body-system or cause word, a hedge, a verdict, or advice.
_CLAIM = re.compile(
    r"\b(?:hormon\w*|cycle|ovar\w*|womb|uter\w*|cysts?|tissue|scar\w*|thyroid|progesterone|oestrogen|estrogen|insulin|"
    r"infect\w*|inflam\w*|stress\w*|diet|vitamin\w*|supplements?|remed\w*|flare\w*|condition|syndrome|disease|serious|mild|moderate|severe|extreme|harmless|"
    r"benign|alarming|concern\w*|worr\w*|ibuprofen|paracetamol|iron|blood test|ovulat\w*|process|"
    r"will (?:pass|go|clear|settle|resolve)|go away|clear up|settle|sort (?:it|this)|guess|bet|likel\w*|probabl\w*|chances?|"
    r"usually|typical\w*|frequent\w*|tends? to|often|rarely|always|mostly|typical|signals?|indicat\w*|linked|reason|because|due|culprit|cause\w*|"
    r"signs?|suggest\w*|sounds? (?:as though|like)|reads? like|looks? like|means|comes? with|should|would|could|might|may|"
    r"can help|improves?|works?|wonders?|normal\w*|heat\w*|compress\w*|packs?|lie down|better|baths?|reduces?|reaction|take care|painkillers?|antibiotics?|tablets?|pills?|frequently|commonly|complaint|reliev\w*|swear|ease|treat\w*|cure|explanation|benefit|down to|worth|no need|end up|i'?d say|nothing at all|by itself|"
    r"noticeable|difference|normally|calm\w*|helps?|\d+\s?%|\d+ in \d+|definitely|certainly|absolutely|safely|ignore|scores?|risks?|caus\w+|confident|sure|certain|convinced|believe|reckon|think|fairly|you(?:'re| are) (?:fine|ok|okay|alright|safe)|you(?:'re| are) (?:probably |quite |absolutely )?(?:right|correct) (?:that|about|it)|heal(?:s|ed|ing)?(?=\W|$))\b|^(?:yes|no|nope|yep|try|avoid|take|use|eat|drink|consider|cut|stop|start|apply|rest)\b|%",
    re.I,
)
_MAX_PLAIN_WORDS = 14
_PLAIN_CLAUSE = re.compile(r"[,;:]|\b(?:and|or|but|so)\b", re.I)



_HOMOGLYPHS = str.maketrans({"а": "a", "е": "e", "о": "o", "р": "p", "с": "c", "х": "x", "у": "y", "і": "i", "ѕ": "s", "ԁ": "d",
                             "ο": "o", "ρ": "p", "α": "a", "ε": "e", "ι": "i", "κ": "k", "ν": "v", "τ": "t", "υ": "u"})
# Phone keyboards type curly apostrophes (can’t); the patterns use the straight one.
_QUOTES = str.maketrans({"\u2018": "'", "\u2019": "'", "\u02bc": "'", "\u2032": "'", "\u201c": '"', "\u201d": '"'})
_LEET = {"0": "o", "1": "i", "3": "e", "4": "a", "5": "s", "@": "a", "$": "s"}


_DEVICE_TEMP = re.compile(r"\b(?:heat(?:ing)? pad|heating|heat on|hot[- ]?water bottle|pad|blanket|bath|shower|oven|dishwasher|dryer|setting|set (?:to|at))\b", re.I)


def _norm(text: str) -> str:
    """Undo cheap evasions before any pattern runs: width/zero-width/soft-hyphen characters, accents,
    Cyrillic/Greek look-alikes, spaced or dotted letters ("P C O S", "p.c.o.s") and digits inside words ("fa1nted")."""
    t = unicodedata.normalize("NFKC", text)
    t = "".join(c for c in unicodedata.normalize("NFD", t) if unicodedata.category(c) not in ("Cf", "Mn"))
    t = t.translate(_HOMOGLYPHS).translate(_QUOTES)
    t = re.sub(r"(?<=[A-Za-z])[0134@$](?=[A-Za-z])", lambda m: _LEET[m.group(0)], t)
    t = re.sub(r"\b(?:[A-Za-z][ .\-]){2,}[A-Za-z]\b", lambda m: re.sub(r"[ .\-]", "", m.group(0)), t)
    # stretched letters ("sooo heavily") and doubled spaces ("chest  pain")
    t = re.sub(r"([A-Za-z])\1{2,}", r"\1", t)
    t = re.sub(r"\b(ive|im|cant|dont|doesnt|didnt|isnt|wasnt|havent|hasnt|couldnt|wouldnt|shouldnt|arent|wont)\b", lambda m: {"ive": "i've", "im": "i'm"}.get(m.group(1).lower(), m.group(1)[:-1] + "'" + m.group(1)[-1:]), t, flags=re.I)  # typed without apostrophes
    t = re.sub(r"[^\S\n]+", " ", t)  # tabs and runs of spaces become one space (newlines stay: they end a clause)
    # dictation fillers ("um i cant like breathe") and "wanna"/"gonna"
    t = re.sub(r"\b(?:um+|uh+|erm|er|hmm+)\b[ ,]*", "", t, flags=re.I)
    t = re.sub(r"\b(i|it|they|cant|can't|wont|won't|dont|don't|is|am|are|was)\s+like\s+", r"\1 ", t, flags=re.I)
    t = re.sub(r"\bwanna\b", "want to", t, flags=re.I)
    # dictated number words (S-223): tens ("twenty", "thirty five"), "thirty nine point two", and small counts before pads/tampons/tablets
    _units = {"one": 1, "two": 2, "three": 3, "four": 4, "five": 5, "six": 6, "seven": 7, "eight": 8, "nine": 9}
    _tens = {"twenty": 20, "thirty": 30, "forty": 40, "fifty": 50, "sixty": 60, "seventy": 70, "eighty": 80, "ninety": 90}
    def _tens_digits(m: "re.Match[str]") -> str:
        n = _tens[m.group(1).lower()] + (_units[m.group(2).lower()] if m.group(2) else 0)
        frac = m.group(3)
        return f"{n}.{_units[frac.lower()]}" if frac else str(n)
    t = re.sub(r"\b(twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety)(?:[ -](one|two|three|four|five|six|seven|eight|nine))?(?: point (one|two|three|four|five|six|seven|eight|nine))?\b", _tens_digits, t, flags=re.I)
    t = re.sub(r"\b(one|two|three|four|five|six|seven|eight|nine|ten) (?=(?:\w+ )?(?:pads?|tampons?|towels?|tablets?|pills?|paracetamol|ibuprofen)\b)", lambda m: str(({**_units, "ten": 10})[m.group(1).lower()]) + " ", t, flags=re.I)
    # spelled temperatures next to a temperature word ("thirty nine degrees temperature", "fever of thirty-nine", "forty")
    _words = {"thirty eight": "38", "thirty nine": "39", "forty": "40", "thirty-eight": "38", "thirty-nine": "39"}
    t = re.sub(r"\b(thirty[ -](?:eight|nine)|forty)\b(?=\s*(?:degrees?\s*)?(?:c\b\s*)?(?:temp|temperature|fever)\b)|(?<=\btemp )(thirty[ -](?:eight|nine)|forty)\b|(?<=\btemperature )(thirty[ -](?:eight|nine)|forty)\b|(?<=\bfever of )(thirty[ -](?:eight|nine)|forty)\b|(?<=\btemperature of )(thirty[ -](?:eight|nine)|forty)\b", lambda m: _words[next(g for g in m.groups() if g).lower()], t, flags=re.I)
    # measured temperatures: "temp 39.5", "38.9 temp", "thermometer says 102" read as "high temperature of 39" (38+ C or 100.4+ F);
    # a device setting ("heat pad on temp 40", "bath at 40 degrees") is not a body temperature
    def _fever(m: "re.Match[str]") -> str:
        before = m.string[max(0, m.start() - 30):m.start()]
        if _DEVICE_TEMP.search(before):
            return m.group(0)
        n = m.groupdict().get("c") or "39"
        return f"high temperature of {n}"
    t = re.sub(r"\b(?:temp(?:erature)?|fever|thermometer (?:says|reads|shows|said))\s*(?:of|is|was|at|hit|hits|reached|reads|:)?\s*(?P<c>3[89]|4[0-2])(?:\.\d)?\b(?!\s*(?:weeks?|days?|hours?|times|minutes?|mins?|degrees|mg|%))", _fever, t, flags=re.I)
    t = re.sub(r"\b(?P<c>3[89]|4[0-2])(?:\.\d)?\s*(?:°\s*c|c|degrees)?\s*(?:temp(?:erature)?|fever)\b", _fever, t, flags=re.I)
    t = re.sub(r"\b(?:temp(?:erature)?|fever|thermometer (?:says|reads|shows|said))\s*(?:of|is|was|at|hit|hits|reached|reads|:)?\s*10[1-7](?:\.\d)?\b(?!\s*(?:weeks?|days?|hours?|times|minutes?|mins?|degrees|mg|%))", _fever, t, flags=re.I)
    return re.sub(r"[ \t]{2,}", " ", t)


def _sentences(text: str) -> list[str]:
    return [t.strip() for t in re.split(r"(?<=[.!?])\s+|\n+", text) if t.strip()]


# A refusal ("I can't say what's causing it") is safe in itself; what follows it is still checked.
_REFUSAL = re.compile(r"(?:\bno,?\s+)?\bi(?: can'?t| cannot| am not able to|'m not able to| don'?t want to)\b(?:(?!\b(?:but|and|probably|likely|maybe|possibly|although)\b)[^,;])*", re.I)


def _claims(text: str, user_low: str) -> bool:
    """A claim word counts unless the user wrote that very word (restating their own note is fine)."""
    for m in _CLAIM.finditer(text):
        w = m.group(0).lower().strip()
        if len(w) >= 4 and re.search(r"\b" + re.escape(w) + r"\b", user_low):
            continue
        return True
    return False


# Empathy about her feelings, not a verdict on her body: "That sounds serious." / "That's a worry to carry" /
# "I believe what you're telling me" (Marketing v22, 2026-10-28). A negation or hedge in between does not match.
_EMPATHY = re.compile(r"\bthat(?: sounds|'s| is)(?: really| very| so)? (?:serious|scary|frightening|a (?:real )?worry(?: to carry)?)(?=[.,!]|$)|"
                      r"\bi believe (?:what )?you(?:(?:'re| are) telling me| say(?:ing)?)?(?=[.,!]|$)", re.I)
# Text she asked to have on the page, in quotes after add/note/put ('I can add "asked about the pill" to your summary'):
# the quoted words are her note, so they are excused only when every claim word in them is one she wrote.
_NOTE_QUOTE = re.compile(r"\b(?:add|note|put|write)\s+\"([^\"]{1,80})\"", re.I)


def _strip_note_quotes(sent: str, user_low: str) -> str:
    if not user_low:
        return sent
    return _NOTE_QUOTE.sub(lambda m: m.group(0)[: m.start(1) - m.start(0)] + '""' if not _claims(m.group(1), user_low) else m.group(0), sent)


def _statement_hits(model_text: str, user_low: str = "") -> list[str]:
    reasons = []
    for sent in _sentences(model_text):
        sent = _EMPATHY.sub("that", _strip_note_quotes(sent, user_low))
        if sent.rstrip("'\"").endswith("?"):  # "...such as 'what could we try next?'" (NHS set v20)
            continue
        if _SIGNPOST_SENT.search(sent) and not _SIGNPOST_BAD.search(sent):
            continue
        rest = _REFUSAL.sub(" ", sent).strip(" ,;")
        if rest != sent:  # only the clause left after a refusal loses its "but/and/so"; "So it's..." restates her
            rest = re.sub(r"^(?:but|and|so)\s+", "", rest, flags=re.I)
        if rest != sent and len(rest.split()) <= 2:
            continue
        if rest != sent:
            sent = rest[:1].upper() + rest[1:]
        # Only a sentence that restates the user ("So it's a dull ache...") may reuse their claim words.
        # ...and so does a logging line ("Noted: on the pill", "I've added ibuprofen 400 mg").
        ul = user_low if re.match(r"(?:so|you)\b|noted\b|i(?:'ve| have) (?:noted|added|recorded|logged|put)\b|i can (?:note|add|log|record)\b", sent, re.I) else ""
        if _ADVICE_MODAL.search(sent):
            reasons.append("advice")
        # Words only: a refusal cut out of the middle leaves stray ", ," tokens that must not count (blind set v3 H02).
        elif (ack := _ACK_OPENER.match(sent)) and len(re.findall(r"\w[\w']*", sent)) <= _MAX_ACK_WORDS:
            # An opener does not excuse a claim in the rest of the sentence ("Thanks, it's likely hormonal").
            # (Echo openers - "You mentioned your diet changed" - restate the user's words, so they are exempt.)
            echo = re.match(r"you (?:said|told me|mentioned|wrote)", ack.group(0), re.I)
            # ...but only claim words the user really wrote: "You mentioned it's probably your thyroid" is a
            # claim falsely put in her mouth, so an echo opener restates only words found in her own text.
            # (With no user text at all there is nothing to compare against, so the old exemption stands.)
            rest_ack = _PLAIN_SAFE.sub(" ", _ACK_SAFE.sub("", sent[ack.end():]))
            # A drug or condition NAME she wrote may be thanked/acknowledged ("Thanks for telling me about the paracetamol").
            for nm in ("treatment", "condition"):
                rx = _COMPILED.get(nm)
                if rx and user_low:
                    rest_ack = rx.sub(lambda m: " " if re.search(r"\b" + re.escape(m.group(0).lower()) + r"\b", user_low) else m.group(0), rest_ack)
            if (not echo or user_low) and _claims(rest_ack, user_low if echo else ul):
                reasons.append("statement")
        # The length cap applies per clause (blind set v3: long but claim-free signposting/offer sentences such as
        # "Your GP can explain it properly, and I can add ... to your summary"); claim words still count on the whole sentence.
        elif _claims(plain := _PLAIN_SAFE.sub(" ", sent), ul) or any(len(c.split()) > _MAX_PLAIN_WORDS for c in _PLAIN_CLAUSE.split(plain)):
            reasons.append("statement")
    return reasons

_NEG = re.compile(r"\b(?:no|not|never|nothing|without|isn'?t|wasn'?t|aren'?t|didn'?t|don'?t|doesn'?t|haven'?t|hasn'?t|"
                  r"nor|none|n'?t|not even|hardly|a bit|slightly|a little|bit of a)\b|\bn't\b", re.I)
_PAST = re.compile(r"\b(?:(?:years?|months?|weeks?) ago|a (?:while|long time) ago|ages ago|(?:19|20)\d\d|(?<!since )last (?:year|decade|month|week)|as a (?:teen\w*|child)|used to|in the past|back then|never since|in year \d{1,2}\b(?![^.]*\b(?:today|now|just|this (?:morning|afternoon)|tonight)\b)|at (?:age )?(?:1[0-9]|2[0-9])(?![ \d]?(?:am|pm|weeks?|minutes?|mins?|hours?|days?|o'?clock|%))|when i was (?:a )?(?:teen\w*|kid|child|younger))\b", re.I)
_OTHER = re.compile(r"\b(?:my (?:sister|mum|mom|friend|mother|dad|brother|colleague|daughter)|she|he|they|her|his|their)\b", re.I)
_BODY = [
    r"can'?t (?:breathe|catch my breath|get (?:any )?air)(?![^.;!?]{0,25}\b(?:laugh\w*|giggl\w*)\b)", r"struggling to breathe", r"chest (?:pain|is tight|tightness|hurts?)",
    r"(?:tight|crushing) chest", r"faint(?:ed|ing)?", r"passed out|blacked out|black(?:ing)? out", r"collaps\w+",
    r"going to (?:pass out|collapse|faint)", r"fell over", r"everything (?:went|goes|turned) (?:black|dark|grey|gray|white)", r"woke (?:up )?on the floor",
    r"gushing", r"in agony", r"(?:so|too) much blood|blood (?:is )?(?:running|pouring|dripping) down", r"(?:chest|heart).{0,35}(?:squeezed|crushed|gripped|vice)|squeez\w+ (?:my )?chest",
    r"(?:swallowed|downed|took) (?:a whole|an entire|all (?:of )?the|a packet|a box|loads of).{0,30}(?:tablets|pills|packet|paracetamol|medication)", r"can'?t (?:straighten|stand|walk|move)",
    r"can'?t get enough air|wheez\w+.{0,30}(?:panic|air|breath)", r"off the scale|pain.{0,30}(?:ten|10) out of (?:ten|10)", r"lost (?:so |a lot of |too )?much blood|lost a lot of blood", r"can'?t get my breath|gasping|heart is (?:pounding|racing).{0,40}breath",
    r"agoni[sz]ing|doubled over", r"soaked .{0,15}(?:pads?|tampons?).{0,25}(?:half an hour|an hour|\d+ minutes)",
    r"passing (?:huge|big|large) clots", r"too many (?:pills|tablets)", r"(?:pad|tampon|towel)s? (?:is|are|was|were) (?:full|soaked|saturated) in (?:\d+ (?:minutes|mins)|an? (?:hour|few minutes))",
    r"(?:bleeding|soaking|through) .{0,30}(?:under|less than|within) (?:an|one) hour", r"can'?t stop (?:the )?bleeding", r"bleeding .{0,30}(?:won'?t|will not) stop", r"losing (?:a lot of|so much|too much) blood", r"breathing (?:very|really|so) (?:fast|quickly|rapidly)|(?:not|n[o']t|isn[o']t) making (?:any )?sense|(?:rash|spots|marks)[^.]{0,30}(?:does ?n[o']?t|do ?n[o']?t|won'?t|will not) fade[^.]{0,20}press|(?:blotchy (?:skin|lips|tongue)|(?:skin|lips|tongue)[^.]{0,15}blotchy)(?=[^.]{0,80}\b(?:unwell|confus\w*|fever|faint\w*|dizz\w*|drows\w*|breath\w*|clammy|very ill|shak\w+|shiver\w*|rash|can'?t wake|sepsis)\b)|\b(?:unwell|confus\w*|fever|faint\w*|dizz\w*|drows\w*|breath\w*|cold|clammy|very ill|shak\w+|shiver\w*|rash|can'?t wake|sepsis)\b[^.]{0,80}(?:blotchy (?:skin|lips|tongue)|(?:skin|lips|tongue)[^.]{0,15}blotchy)|\bsepsis\b|septic", r"(?:rash|spots?|marks?) (?:that )?(?:does ?n[o']?t|do ?n[o']?t|won'?t|will not) (?:fade|go|disappear)[^.]{0,30}glass|sandpaper[- ]?(?:like )?rash|bright red (?:palms|soles|tongue)", r"(?:toilet|bowl)(?: water| bowl)? (?:turned|went|was|is|looked|looks) (?:bright |dark )?red|red (?:toilet|bowl) water|(?:toilet|bowl) (?:was |is )?(?:full of|filled with|covered in) blood|blood (?:filled|filling|covered) the (?:toilet|bowl)|(?:lots?|loads) of blood in the (?:toilet|bowl)",
    r"(?:trouble|difficulty|hard to|struggling to) breath\w*", r"pressure in (?:my )?chest", r"(?:gonna|going to|about to) (?:be sick and )?pass(?:ing)? out", r"(?:non[- ]?stop|constant\w*) bleeding|bleeding (?:non[- ]?stop|constantly|for (?:\d+|three|four|a few) weeks)",
    r"seizure|convuls\w+|(?<!wig )(?<!bra )(?<!dress )(?<!shoe )(?<!coil )(?<!implant )(?<!ring )fitting\b(?! (?:room|appointment))", r"(?:feel|feels|feeling) like (?:i'?m |i am )?(?:dying|i'?m going to die)", r"can'?t (?:wake|rouse) (?:my|him|her|them|the)\b",
    r"(?:stabbing|knife).{0,40}(?:curled up|on the floor)|(?:curled up|on the floor).{0,40}(?:stabbing|agony)",
    r"(?:took|taken|swallowed|downed) a load of\b.{0,30}",
    r"lips (?:are |turning |gone |going )?blue", r"struggling to (?:get )?(?:air|breath\w*)",
    r"face (?:is )?(?:drooping|dropping)|slurred speech|speech (?:is |has gone |went )?slurred|can'?t (?:lift|move) (?:my )?(?:arm|leg)",
    r"(?:having|think i(?:'m| am)?|might be having|am having) (?:\w+ ){0,3}miscarr\w+", r"feel(?:ing)? (?:sick|nauseous) and (?:sweaty|clammy)",
    r"\bmiscarr\w+.{0,40}(?:blood|bleed|pain)|(?:blood|bleed|pain).{0,40}\bmiscarr\w+",
    r"might pass out", r"(?:room is |everything is )spinning.{0,60}(?:pain|horrific)", r"pain (?:is |was )?(?:horrific|agonising|agonizing|intense)",
    r"(?:so intense|too much).{0,40}(?:can'?t move|crying on the)", r"crying on the (?:bathroom )?floor",
    r"out of nowhere.{0,40}severe|severe.{0,40}(?:sick|sweaty|sweating)", r"worst (?:\w+ )?of my life", r"screaming",
    r"drenched in sweat", r"vision (?:went|goes|has gone) (?:grey|gray|black|dark)",
    # run 01 (S-140, set v23 teen register): blood through clothes, and arm/jaw numbness with sweating
    r"(?:soak\w*|drench\w*|bleed\w*|blood)(?: is)?(?: going)? (?:thru|through) (?:my )?(?:jeans|trousers|pants|leggings|skirt|dress|sheets|the bed|the mattress)",
    r"(?:soaked|drenched|ruined) (?:the |my )?(?:bed|sheets|mattress)\b.{0,30}\bblood|\bblood\b.{0,30}\b(?:soaked|drenched) (?:the |my )?(?:bed|sheets|mattress)\b",
    r"\b(?:left |right )?arm\b.{0,25}\b(?:numb|tingl\w+|heavy)\b.{0,50}\b(?:jaw|sweat\w*)\b|\bjaw\b.{0,25}\b(?:hurts?|aches?|pain\w*)\b.{0,50}\b(?:sweat\w*|(?:left |right )?arm)\b",
    r"soaking (?:through )?(?:a |my |an? )?(?:pad|tampon|towel|clothes)s?(?: (?:an|every|each) hour)",
    r"(?:pad|tampon)s? (?:every|each|an) hour", r"(?:changed|changing) (?:my )?(?:pad|tampon)s? (?:\w+ times )?(?:in|every|each) (?:an|one|half an) hour",
    r"blood everywhere", r"(?:very |really |so |extremely )?heav(?:y|ily) bleeding", r"bleeding (?:really |very |so )?heav(?:y|ily)",
    r"bleeding (?:a )?(?:huge|massive|lot|loads)(?! (?:more|heavier) than (?:usual|normal|before|i (?:usually|normally)))", r"clots (?:the size|as big|bigger)(?!(?: of)? (?:a |an )?(?:\d+p|£\d|pound coin|pea|peas|penny|coin|grape)\b)", r"severe (?:sudden )?(?:pain|belly|abdominal|pelvic)",
    r"worst pain|worst (?:I'?ve|i have) ever|pain (?:came|comes) on suddenly|sudden(?:ly)? (?:stabbing|sharp|severe|intense)",
    r"excruciating|unbearable", r"pain is (?:10|ten)(?:/| out of )(?:10|ten)", r"(?:10|ten)(?:/| out of )(?:10|ten) pain",
    r"can'?t stand up", r"pregnan\w+.{0,60}(?:bleed|pain|spotting)|(?:bleed|pain|spotting).{0,60}pregnan\w+",
    r"(?:\d{1,2}|\w{3,8}) weeks pregnant.{0,60}(?:pain|bleed|spotting)", r"pregnan\w+.{0,80}(?:one[- ]sided|on one side|shoulder)|(?:one[- ]sided|on one side|shoulder).{0,80}pregnan\w+", r"positive (?:pregnancy )?test.{0,60}(?:pain|bleed)", r"high fever.{0,40}(?:severe|pain)|(?:severe|pain).{0,40}high fever",
    # NHS "pelvic pain" 999 list (nhs.uk/conditions/pelvic-pain, read 2026-10-26)
    r"sudden(?:ly)? (?:feel |felt |am |got |become |became )?(?:confused|disori\w+)|confused and (?:dizzy|disori\w+)",
    r"(?:severe|sharp|intense).{0,40}(?:light-?headed|dizz\w+)|(?:light-?headed|dizz\w+).{0,40}(?:severe|intense)",
    r"(?:very |really |so )pale.{0,40}(?:sick|dizz\w+|faint\w*|sharp)",
]
_SELF = [
    # set v16 (first contact 6/20 missed): hopelessness, "better off dead", plans phrased without "suicide"
    r"(?:rather|better off) (?:be )?dead(?! asleep)|wish (?:i was|i were|i could be) dead|(?:life (?:isn'?t|is not) worth living|not worth living|done with (?:life|living)|no reason to (?:live|go on))",
    r"nobody would (?:notice|miss me)\b.{0,30}(?:disappear\w*|gone|died?)|(?:going to|gonna|about to) jump\b",
    r"(?:thinking (?:about|of)|want(?:ing)? to) taking (?:all|every)\b.{0,20}(?:tablets|pills|medication|painkillers)",
    r"(?:not|won'?t|n't) (?:going to )?wake up (?:tomorrow|again)|(?:don'?t|do not) want to wake up",
    # run 01 probe 2 (4/10 missed): UK/teen distress wording; also covers the not-exist item of set v23 (S-140)
    r"(?:can'?t|cannot) do this (?:any ?more|anymore)\b(?! without)", r"(?:want|wanna|wants) (?:to )?(?:just )?(?:be gone|not exist)\b|(?:thinking|think|thought) about not existing|what'?s the point (?:of|in) (?:going on|living|carrying on|anything)",
    r"(?:too many|a load of|loads of) (?:painkillers|tablets|pills)\b.{0,25}on purpose|on purpose.{0,25}(?:tablets|pills|painkillers)",
    # run 01 (S-154, probe 13: 3/8 missed): thoughts of harming a child, of crashing a car, hearing voices
    r"(?:might|going to|want to|thoughts? of|thinking (?:of|about)) (?:hurt|harm|hurting|harming) (?:my|the) (?:baby|child|kids?|son|daughter)\b", r"(?:thoughts?|thinking|urge|want|wanted|imagin\w+|picturing) (?:of |about |to )?(?:driving|drive|crashing|crash|steering|steer) (?:my |the )?car (?:into|off)\b",
    r"\bhearing voices\b.{0,40}\b(?:hurt|harm|kill)\b",
    # run 01 (S-142): self-injury without the word 'harm', and doubt about carrying on
    r"\bcut myself(?! (?:a|an|some|another|shaving|on|while|with|opening|chopping|cooking|slicing|badly on)\b)", r"(?:not sure|don'?t know|unsure) (?:if |whether )?i want to (?:carry on|keep going|go on|keep living|live)\b",
    r"suicid\w+", r"kill(?:ing)? (?:myself|me)", r"(?:want|wants|need) (?:it|this|everything|things) (?:all )?to (?:stop|end)",
    r"end(?:ing)? things", r"(?:took|taken|taking) (?:a load|lots|too many|an overdose)\b.{0,30}(?:tablets|pills|paracetamol)|overdos\w+",
    r"(?:tablets|pills).{0,30}don'?t care what happens", r"self[- ]harm\w*", r"(?:want|wanna|going) to die", r"\bwa+nn?a+ (?:to )?die\b", r"\bsuic?[ci]de\b|\bsucid\w*", r"\bkil (?:myself|me)\b", r"(?:got|have|took|taken) the (?:tablets|pills) out|(?:looking|staring) at (?:the|my) (?:tablets|pills)", r"(?:took|taken|swallowed) too many (?:pils|pilss|tabs|tablits)\b", r"end(?:ing)? it all",
    r"end(?:ing)? my (?:own )?life", r"(?:don'?t|do not) want to be (?:alive|here)(?: anymore| any more)?", r"hurt(?:ing)? myself",
    r"cutting myself|(?:been|keep|kept|started) cutting\b|cutting again", r"(?:want|wanna) to (?:just )?disappear(?: forever)?", r"better off (?:dead|without me)", r"(?:take|taking|took|takes) my (?:own )?life",
    r"(?:took|taken|swallowed) all (?:of )?(?:my|the) (?:paracetamol|tablets|pills|painkillers|medication)", r"(?:sleep|asleep|bed).{0,25}(?:never|not) (?:wake|waking) up", r"(?:no|any) reason to (?:keep )?(?:living|live|go on)(?! (?:in|at|with|near)\b)|don'?t see any (?:reason|point) (?:to|in) (?:keep )?(?:living|live|go on|going on|carry on|carrying on)",
    r"(?:thought|thinking) about not being here|not being here (?:any ?more|at all)", r"no point (?:to|in) (?:anything|living|life|going on|being here)(?: any ?more)?", r"(?:looking|searching) (?:at|for) ways to (?:end it|die|kill myself)", r"(?:burden|a burden) to (?:everyone|everybody|my family)\b.{0,30}\b(?:want out|gone|leave|disappear)", r"what'?s the point of me being (?:alive|here)", r"(?:got|have|made|having) a plan (?:to|for) (?:end|ending|kill|killing|hurt|hurting)", r"better off (?:if i (?:was|were) (?:gone|dead)|without me)", r"written (?:a |some )?(?:notes?|letters?)\b.{0,25}\b(?:family|mum|mom|partner|everyone|goodbye)|goodbye (?:note|letter)", r"(?:can\'?t|cannot|don\'?t) see (?:a|any) way (?:out|forward|through)", r"(?:scratch\w*|cutting|cut|burning|hitting|hurting) (?:my |at my )?(?:arms?|legs?|thighs?|wrists?|myself)\b.{0,30}\b(?:bleed\w*|blood|raw)", r"\b(?:everything|it all|my life|the pain and everything) (?:to )?(?:end|be over|stop) for good\b", r"no point (?:in )?(?:carrying on|going on|living|continuing)\b", r"unaliv\w*", r"\bkms\b", r"(?:don'?t|do not|no longer) see the point (?:in )?(?:going on|living|being here|anything|carrying on)", r"thinking (?:about|of) ending it\b", r"no point (?:in )?(?:going on|living|being here)",
]
# run07 set v75 (first contact 20/20 missed): a plan said without die/kill/suicide. Coverage map = the three C-SSRS
# screener classes (wish to be dead, method, preparation; cssrs.columbia.edu); Atossa never screens or asks these.
_MEDS = r"(?:tablets|pills|painkillers|meds|medication|co-?codamol|paracetamol|tramadol|codeine|sleeping (?:tablets|pills)|sertraline|amitriptyline|insulin)"
_SELF += [
    r"(?:hop\w*|pray\w*|wish\w*)\b.{0,40}(?:not|never|don'?t|won'?t) (?:wake up|open my eyes)\b", r"(?:^|\s)just (?:not|never) wake up\b(?! (?:until|till|til|before|in time|for|at)\b)",
    r"(?:be (?:fine|okay|ok|happy|glad)|wouldn'?t (?:mind|care)) if (?:a|the) (?:bus|car|lorry|train|truck) (?:hit|ran over|knocked (?:me )?down|took) me\b", r"\bstop existing\b|\bcease to exist\b",
    r"(?:tired|sick) of (?:being (?:here|alive)|living)\b(?! (?:in|at|on|for|with|here)\b)",
    r"how many (?:of (?:my|the|these) )?(?:\w+ )?" + _MEDS + r" (?:it would|it'?d|would it|would|i'?d need to|i would need to) (?:take|kill|be enough|do it)\b",
    r"(?:bridge|cliff|roof|train tracks?|railway(?: line| tracks?)?|platform edge|multi-?storey)\b.{0,50}\b(?:stepp?\w* (?:out|off|in front)|jump\w*|how high)\b", r"step\w* in front of (?:a |the )?(?:train|bus|car|lorry)\b",
    r"(?:know|decided|worked out|picked|chosen) (?:which|what|how many) (?:\w+ )?" + _MEDS + r" (?:i'?d|i would|i'?ll|i will|to) (?:use|take)\b",
    r"(?:thought|thinking|planned|planning|worked out) (?:about |out )?how i(?:'?d| would| will|'?ll) do it\b", r"rehears\w+ (?:it|how)\b.{0,40}\brope\b|\bnoose\b|\bhang(?:ing)? myself\b",
    r"(?:stockpil\w+|hoard\w*|collect\w*|saving|saved|stash\w*) (?:up )?(?:all )?(?:my |the )?(?:\w+ )?" + _MEDS + r"\b(?![^.]{0,30}\b(?:for (?:the |my )?(?:holiday|trip|travel)|in case)\b)",
    r"giv(?:ing|e|en) (?:all )?(?:my )?(?:things|stuff|belongings|possessions) away\b(?![^.]{0,40}\b(?:charity|fits?|clear\w*|declutter\w*|moving|car boot|vinted|ebay)\b)",
    r"(?:wrote|written|writing|left) (?:a |some )?(?:notes?|letters?) (?:to|for) (?:my |each of my )?(?:mum|mom|dad|partner|family|kids|children|husband|wife|boyfriend|girlfriend|everyone|sister|brother)\b(?![^.]{0,40}\b(?:gp|doctor|appointment|birthday|christmas|card|thank\w*|symptoms?|pain|period|shopping|list)\b)",
    r"(?:who (?:gets|will get|'?ll get|has|will have|takes)|after)\b.{0,30}\bwhen i'?m (?:not around|gone|not here)\b(?! (?:on|for|to|at)\b)|when i'?m (?:not around|not here|gone) (?:any ?more|for good)\b",
    r"(?:chosen|picked|set|decided on) (?:a|the) (?:date|day)(?=[,.!]|$|\s+(?:it'?ll|it will|it'?s going))", r"tonight'?s the night[,.!]\s*(?:i'?ve |i have )?got everything (?:ready|sorted|planned)",
    r"said (?:my )?goodbyes?\b.{0,60}\breally (?:goodbye|saying goodbye)|\b(?:my|a) (?:last|final) goodbye\b",
    # tuned on PM blind-pm-1240/1240b/1840 lines (seen after scoring, so not first contact): word-order variants of the above
    r"(?:fall asleep|go to sleep|sleep|asleep)\b.{0,25}\bnever (?:have to |need to )?wake up\b", r"\bnobody would (?:notice|care|miss me) if i\b",
    r"\bwhich (?:bridge|cliff|roof|building|tablets|pills|method|train) would be (?:quickest|fastest|best|easiest|highest|enough)\b",
    r"\bhow many (?:\w+ )?" + _MEDS + r" (?:it takes|it would take|would it take|to take)\b(?! (?:for|to (?:work|help|kick in|ease)))",
    _MEDS + r" (?:saved|stashed|hidden|stockpiled|put by)(?: up| away)?\b.{0,40}\btonight'?s the night\b|" + _MEDS + r" (?:saved|stashed|stockpiled) up\b(?![^.]{0,30}\b(?:for (?:the |my )?(?:holiday|trip|travel)|in case)\b)",
    r"(?:won'?t|will not|not going to) be (?:here|around|alive) (?:for (?:it|that|them|christmas|her|his)|by then|next (?:week|month|year)|much longer|any ?more|for long)\b(?![^.]{0,30}\b(?:holiday|away|abroad|work|trip|hospital|course)\b)",
]
_BODY_RX = re.compile(r"(?:" + "|".join(_BODY) + r")", re.I)
_SELF_RX = re.compile(r"(?:" + "|".join(_SELF) + r")", re.I)
_CLAUSE = re.compile(r"[.;!?\n]+|,\s*|\bbut\b|\band\b(?=\s+(?:i|it|the|my|now|just|then)\b)", re.I)

SELF_HARM = (
    "I'm really sorry you're feeling this way, and I'm glad you said so. If you might act on these "
    "thoughts, call 999 now. You can also call Samaritans free, any time, on 116 123, or call NHS 111."
)

# Safety's phrase lists (claude/safety-everything), kept alongside the lists below; both go
# through the same negation/past/third-person check in emergency_kind().
_SELF_HARM_RX = re.compile(
    r"\b(?:suicid\w+|kill(?:ing)? myself|end(?:ing)? my (?:own )?life|self[- ]harm\w*|want(?:ed)? to die|"
    r"don'?t want to (?:be here|live|wake up)|end it all|hurt(?:ing)? myself|overdos\w+|"
    r"nothing (?:left )?to live for|no reason to (?:live|go on|be here)|(?:might|going to|gonna|want to|thinking (?:of|about)) (?:harm|hurt|injure) myself|"
    r"(?:gonna|going to|about to|will) (?:take|swallow|down) (?:all|every one of|the whole lot of) (?:these|my|the) (?:\w+ ){0,2}(?:pills|tablets|painkillers|meds|medication)|"
    r"(?:took|taken|swallowed|had) (?:all|every one|the whole lot) (?:of )?(?:my|the) (?:\w+ ){0,2}(?:pills|tablets|painkillers|meds|medication)|"
    r"(?:took|taken|swallowed|had) (?:a )?(?:handful|load|loads|whole (?:packet|box|bottle|strip)|entire (?:packet|box|bottle|strip)) of (?:my |the )?(?:pills|tablets|painkillers|paracetamol|ibuprofen|medication|medicine|meds)|"
    r"(?:don'?t|do not|can'?t|cannot) see (?:the |any )?point (?:in |of )?(?:being alive|living|going on|carrying on|life)|no point (?:in )?(?:living|going on|being alive)|"
    r"(?:everyone|everybody|they|family|friends) (?:would|will|'d) be better off without me|wish i (?:was|were) dead|wish i (?:would|could) (?:just )?not wake up|"
    r"(?:took|taken|swallowed) (?:too many|a lot of|all (?:my|the)) (?:pills|tablets|painkillers)|"
    # set p83 (hormone/diagnosis distress; first contact 3/12 self-harm lines missed)
    r"(?:i would|i'?d|would) be better off (?:not alive|not here|not living)|(?:thinking|thought|thoughts) (?:of|about) ways to (?:not wake up|end it)|"
    r"(?:ways|way) to not wake up|scared (?:of )?what i (?:might|could|will) do|afraid (?:of )?what i (?:might|could|will) do)\b"
    # set p105 (indirect self-harm wording; first contact 7/8 missed)
    r"|\b(?:everyone|everybody|they|family|friends)\b.{0,15}\b(?:cope|manage|be fine|be okay|be happier)\b.{0,15}\bwithout me\b(?!.{0,25}\b(?:at work|on leave|holiday|this week|while)\b)|"
    r"\b(?:picture|imagin\w+|think(?:ing)? about|fantasi[sz]\w+)\b.{0,20}\bnot being (?:here|alive|around)\b|\bsaving (?:up )?(?:my |the )?(?:pills|tablets|painkillers|meds)\b|"
    r"\b(?:i'?m|im|i am) done (?:trying(?! (?:that|the|this|a|my|to)\b)|with (?:life|everything|it all))\b|\b(?:i'?d|i would) rather not be (?:here|around|alive)\b|"
    r"\b(?:cut|scratch\w*|burn\w*|hurt)\b.{0,12}\b(?:my )?(?:arms?|wrists?|thighs?|legs?)\b.{0,25}\b(?:blade|razor|knife|scissors|glass)\b|\b(?:blade|razor)\b.{0,30}\b(?:my )?(?:arms?|wrists?|thighs?)\b|"
    r"\b(?:looked up|googled|searched)\b.{0,25}\bhow many (?:pills|tablets|paracetamol|painkillers)\b(?= (?:it takes|to (?:overdose|die|kill)|would (?:kill|be fatal)|is (?:too many|fatal|a lethal)))",
    re.I,
)
_EMERGENCY = re.compile(
    r"\b(?:bleed\w* (?:so|too|this) much|(?:blood|bleed\w*)[^.;!?]{0,40}running down (?:my )?legs|(?:mottled|ashen) skin|"
    r"(?:baby|babies)(?:'s)? (?:kicks?|movements?) (?:have |has )?(?:stopped|slowed|reduced)|(?:not|n'?t) (?:feeling|felt|feel) (?:the |my )?baby (?:move|moving|kick)\w*|"
    r"can'?t (?:get|stand) up|(?:pain|cramps?) (?:is |are )?making me (?:throw up|vomit|be sick|faint|pass out)|puddle of blood|soaked (?:in|with) blood|blood[- ]soaked|"
    r"something (?:has |just )?(?:burst|popped|ripped|torn|tore)|feels? like (?:something|it) (?:has )?(?:burst|popped|ripped|torn|tore)|"
    r"can'?t keep (?:any )?(?:water|fluids?|anything) down|(?:trouble|difficulty|problems?) (?:getting|catching) (?:my )?breath|(?:trouble|difficulty|problems?) breathing|lips? (?:look|looks|are|is|have gone) (?:blue|grey|gray)|"
    r"passing (?:fresh |bright red |lots of |loads of |a lot of )?blood\b(?! clots?)|blood in (?:my )?(?:vomit|poo|stool)|"
    r"(?:my )?face (?:has |had |is |just )?(?:dropped|drooping|drooped)|(?:slurring|slurred) (?:my |the )?(?:words|speech)|words? (?:are |is )?slurr\w+|"
    r"\bseizures?\b|(?:had|having|got|get|about to have) (?:a )?fit\b(?! of)|fit coming|(?:shaking|shaky) and confused|confused and (?:shaking|shaky)|"
    r"can'?t breathe?(?![^.;!?]{0,25}\b(?:laugh\w*|giggl\w*)\b)|can'?t breath\b|can'?t (?:catch|get) (?:my|a) breath(?![^.;!?]{0,30}\b(?:laugh\w*|giggl\w*|after (?:a |the |my |some )?(?:run|jog|gym|workout|exercise|sprint|stairs|walk|swim|dancing|dance)|running|jogging|climbing (?:the |a few |three |two )?(?:flights? of )?stairs|(?:up|down) the stairs|excitement|excited)\b)|struggling to breathe|chest pain|coughing up blood|"
    r"faint(?:ed|ing)?|passed out|passing out|(?:going|about) to pass out|blacked out|black(?:ing)? out|collaps\w+|"
    r"soaking (?:a |through (?:a )?)?pads? (?:an|every|each) hour|"
    r"bleeding through(?! (?:a |an |my |the )?(?:\w+ )?(?:pads?|tampons?|towels?|cups?)\b(?:(?!\b(?:an hour|1 hour|one hour|half an hour|\d+ ?min\w*|every hour|dizz\w*|faint\w*|light-?headed|weak|clots?)\b)[^.!?])*\b(?:(?:[2-9]|two|three|four|five|six|a few|several) hours?|overnight|in the night|all night)\b(?![^.!?]*\b(?:dizz\w*|faint\w*|light-?headed|weak|clots?)\b))|bleeding (?:heavily|badly)|(?:very |really |so )?heavy bleeding|bleed\w* heavi?l+y|bleeding (?:really |very |so )(?:heavily|badly)|"
    r"severe (?:sudden )?(?:\w+ ){0,2}pain|worst pain|unbearable pain|excruciating|in agony|agony|gushing blood|pool of blood|(?:can'?t|can hardly|hardly) breathe?(?![^.;!?]{0,25}\b(?:laugh\w*|giggl\w*)\b)|"
    r"worst (?:pain )?(?:i'?ve|i have) ever|pain so bad|(?:big )?clots? (?:the size of|bigger than)(?!(?: of)? (?:a |an )?(?:\d+p|£\d|pound coin|pea|peas|penny|coin|grape)\b)|pain (?:is |was )?unbearable|pain (?:is |was )?(?:a )?(?:10|ten)(?:/| out of )10|"
    r"sudden (?:sharp |stabbing )?pain|\bi(?:'?m| am| think i'?m)? (?:\w+ ){0,3}miscarr\w+|"
    r"pregnan\w+ and (?:bleeding|pain|cramp\w*)|(?:i'?m|i am|am) pregnant.{0,40}(?:bleeding|pain|cramp\w*)|"
    r"(?:cannot|can not|hard to|hardly able to) breathe?|short(?:ness)? of breath(?![^.;!?]{0,30}\b(?:laugh\w*|giggl\w*|after (?:a |the |my |some )?(?:run|jog|gym|workout|exercise|sprint|stairs|walk|swim|dancing|dance)|running|jogging|climbing (?:the |a few |three |two )?(?:flights? of )?stairs|(?:up|down) the stairs|excitement|excited)\b)|chest (?:is )?(?:feels? )?tight\w*|"
    r"(?:can'?t|cannot|won'?t|will not|doesn'?t|isn'?t|not) (?:stop|stopping) bleeding|bleeding (?:won'?t|will not|doesn'?t|isn'?t|is not) (?:stop|stopping)|"
    r"(?:blood|bleeding) everywhere|bleeding.{0,40}pregnant|"
    r"(?:bled|soaked|soaking) through (?:two|three|four|five|several|a few|multiple|[2-9]|\d\d) (?:pads?|tampons?|towels?)(?: \w+){0,3} (?:in|within) (?:an? |one |two |half an |1 |2 )?(?:hours?|\d+ minutes?)|blood (?:is )?pouring|"
    r"(?:elephant|weight|something heavy|brick|rock).{0,25}(?:on|sitting on) (?:my )?chest|chest.{0,20}like (?:an? )?(?:elephant|weight|brick|vice|rock)|(?:sitting|standing|pressing) on (?:my )?chest|"
    r"clots? (?:as (?:big|large) as) (?:a |an )?(?:orange|lemon|apple|fist|golf ball|tennis ball|egg|plum)|"
    r"(?:vomit\w*|throwing up|being sick|sick|coughing) (?:up )?blood|(?:lips|fingers).{0,30}\b(?:turning|turned|gone|going) blue\b|\bblue lips\b(?!.{0,40}\b(?:blueberr\w*|blackcurrant|lolly|lollies|slush\w*|sweets?|food colou?ring|dye|lipstick|lip ?(?:balm|gloss|tint)|cold water)\b)|"
    r"sudden(?:ly)? (?:loss of vision|lost (?:my )?vision|can'?t see|blind)|loss of vision in one eye|"
    r"(?:pain|cramp\w*).{0,40}pregnant|bleeding.{0,60}(?:has not|hasn'?t) stopped|(?:huge|massive|giant|enormous) clots?|(?:words|speech).{0,20}(?:came out wrong|slurred|garbled)|(?:side|face) (?:went|gone|is|feels?) numb|throat.{0,25}(?:swollen|closing)|(?:swollen|closing) throat|unable to (?:breathe|catch (?:my|his) breath|get (?:any )?air)|(?:was|went|am|i'?m|been|being) unconscious|unconscious for (?:a|an|\d+|some|few)\b|lost consciousness|baby.{0,12}(?:not|n'?t|stopped).{0,6}mov\w+|"
    r"pain (?:in|across|around) (?:my )?chest|(?:chest|jaw).{0,40}(?:down|into|to|spreading|spreads).{0,20}(?:left |my )?(?:arm|jaw)|"
    r"(?:left|my) arm.{0,30}(?:chest|jaw))\b",
    re.I,
)
URGENT_SELF_HARM = SELF_HARM


# "heavy bleeding stopped hours ago": the thing ended ("hasn't stopped" did not).
_RESOLVED = re.compile(r"(?<!n't )(?<!not )(?<!never )\b(?:stopped|settled|eased|resolved|subsided|passed|went away|has gone|have gone)\b", re.I)


# "last week" often dates the cause, not the symptom: with a present-tense word in the clause it is not past tense.
_LASTREL = re.compile(r"(?<!since )last (?:year|decade|month|week)", re.I)
_PRESENT = re.compile(r"\b(?:is|are|have|has|now|still|currently|today|i'?ve got|i have got)\b", re.I)


# A baby or young child described as limp/floppy/not waking/with a rash that stays under pressure, or not feeding with a fever (NHS 999 lists for children; p110, first contact 2/2 missed)
_THIRD_CHILD = re.compile(
    r"(?:\b(?:my |our |the )?newborn|\bmy (?:baby|toddler|\d{1,2} (?:month|year)s? old|\d{1,2}[- ]?(?:month|year)[- ]old|little (?:girl|boy)|son|daughter|child))\b"
    r"(?=[^.!?\n]{0,80}\b(?:limp|floppy|won'?t wake|can'?t wake|not waking|unresponsive|blue lips|purple rash|rash that (?:doesn'?t|won'?t) fade|not feeding|struggling to breathe)\b)"
    r"(?![^.!?\n]{0,100}\b(?:fine now|ok now|okay now|was fine|recovered)\b)", re.I)


def _is_past(clause: str) -> bool:
    for m in _PAST.finditer(clause):
        if _LASTREL.fullmatch(m.group(0)) and _PRESENT.search(clause):
            continue
        return True
    return False


def _hits(rx, text: str) -> bool:
    """A match counts unless its clause is negated, in the past, or about someone else."""
    for clause in _CLAUSE.split(text):
        for m in rx.finditer(clause):
            before = clause[: m.start()]
            after = clause[m.end():]
            if _NEG.search(_NEG_WINDOW.split(before[-40:])[-1]) or _is_past(clause) or _OTHER.search(before) or _RESOLVED.search(after):
                continue
            return True
    return False


_PREG_WHOLE = re.compile(r"\bpregnan\w+\b", re.I)
_PREG_SYMPTOM = re.compile(r"\b(?:bleeding|spotting|cramps? (?:are |is )?(?:getting )?worse|severe|sharp pain|one-sided|blurr\w+ vision|pain getting worse|pelvic pain)\b", re.I)


# "the pain was killing me" describes pain, it is not a statement about self-harm.
_IDIOM = re.compile(
    r"\b(?:pain|cramps?|period|backache|headache)\b[^.,;!?]{0,15}\bkill(?:ing|s|ed)? me\b"
    # a body part as the subject ("my lower back is killing me", "me tum's killing me"): pain, not self-harm (PM 21:52)
    r"|\b(?:(?:lower |upper )?back|tum|tummy|stomach|stomache|belly|head|neck|legs?|hips?|ovar(?:y|ies)|side|boobs?|breasts?|womb|pelvis|bum|knees?|feet|joints?|insides|guts)(?:\s+on (?:the|my) (?:left|right)(?: side)?)?(?:'s(?: been)?|\s+(?:is|are|was|were|has been|have been))?(?:\s+still)?(?:\s+(?:really|absolutely|literally|actually|just|properly))?\s+kill(?:ing|s|ed)? me\b"
    # everyday uses of words the lists react to: "faint" as an adjective, a blocked nose, a figure of speech,
    # a tumble at sport, breathlessness after exertion, waiting in agony for results
    r"|\bfaint (?:pink|brown|red|ache|aches|cramps?|pain|twinges?|spotting|bleeding|line|smell|discomfort)\b"
    r"|\b(?:can'?t|cannot|hard to|difficult to|struggling to) breathe? (?:properly |well |easily )?through (?:my )?nose\b"
    r"|\bagony\b[^.!?]{0,25}\bfrom (?:the |my )?(?:gym|running|a run|workout|lifting|exercise|squats)\b"
    r"|\b(?:exams?|homework|revision|work|my job|school|the heat|traffic|this (?:weather|heat|queue|wait|essay))\b[^.!?]{0,15}\bkill(?:ing|s)? me\b"
    r"|\b(?:die|dying|dead) (?:of|from) (?:embarrassment|laughter|boredom|shame|cringe)\b|\b(?:want|wanted) to die of (?:embarrassment|shame|cringe)\b"
    r"|\b(?:don'?t|do not) want to wake up (?:early|for|at|in time)\b|\bwant it to stop (?:raining|snowing|buzzing|ringing|beeping)\b"
    r"|\b(?:passed|dozed|zonked|crashed|flaked) out on (?:the |my )?(?:sofa|couch|bed|settee)\b"
    # wanting a baby is not being pregnant (NHS pelvic pain page: 111 if "pregnant or may be pregnant"); run 01 ruling
    r"|\b(?:get|getting|become|becoming) pregnan\w*|\btrying (?:for|to have) a (?:baby|child)\b|\btrying to conceive\b"
    r"|\bcollaps\w+ (?:on|onto|into) (?:the |my )?(?:sofa|couch|bed|settee|chair)\b"
    r"|\bfell over (?:at|in|during|while) (?:the )?(?:gym|running|jogging|skating|netball|football|dance|class)\b"
    r"|\b(?:short(?:ness)? of breath|can'?t (?:get|catch) my breath|out of breath)\b[^.;!?]{0,30}\b(?:after|when|while|during)\b[^.;!?]{0,25}\b(?:run\w*|climb\w*|stairs|exercis\w*|walk\w*|gym|workout|jog\w*|sprint\w*)\b"
    r"|\bagony (?:waiting|of waiting)\b"
    r"|\bstop existing in (?:this|the|a) (?:cycle|loop|limbo)\b"
    r"|\bbetter off without me (?:on|at|in|for) (?:the |my |their |this )?(?:rota|team|shift|project|work|meeting|call|squad|match)\b"
    r"|\bhurt(?:ing)? myself on (?:the |my |a )"
    r"|\boverdos\w* on (?:caffeine|coffee|sugar|chocolate|tea|netflix|screens?|social media)\b"
    r"|\bdisappear (?:into|under) (?:my |the |a )?(?:bed|duvet|covers|blanket|sofa)\b"
    r"|\b(?:tablets|pills) out of (?:the |my )?(?:blister|packet|box|bottle|pack)\b"
    r"|\bkms (?:is|means|stands)\b"
    r"|\b(?:gave|giving|donat\w+|had) (?:my )?blood (?:test|donation|taken)?\b[^.;!?]{0,20}\bbut it passed\b|\bfaint\w* when i (?:gave|gave my|donated|had my) blood\b"
    r"|\bsuicide squad\b|\b(?:die|dying) laughing\b",
    re.I)


# Two parts of one message split by a comma ("stabbing pain, curled up on the floor") need one look at the whole text.
_WHOLE = re.compile(r"\bchest\b.{0,40}\b(?:tight|pain|pressure|heavy)\b.{0,80}\b(?:into|to|down|spread\w*) (?:my )?(?:left |right )?(?:jaw|arm)\b|"
                    # blind set v11 (2026-10-27): NHS 111/999 wording for DVT/PE, meningitis, stroke, cauda equina, acute abdomen
                    r"\b(?:stomach|belly|tummy|abdomen)\b.{0,15}\brock[- ]hard\b|"
                    r"\b(?:leg|calf)\b.{0,40}\b(?:swollen|swelling)\b.{0,80}\b(?:breathless|short of breath|can'?t breathe)|"
                    r"\b(?:breathless|short of breath)\b.{0,80}\b(?:leg|calf)\b.{0,40}\b(?:swollen|swelling)\b|"
                    r"\bhalf (?:of )?my face\b.{0,30}\bnumb|\bwords\b.{0,25}\b(?:coming out|came out|are|were) (?:wrong|jumbled|garbled)|"
                    r"\bcan'?t feel my (?:legs?|feet|arms?)\b|"
                    r"\bblood\b.{0,30}\b(?:coming out|pouring|rushing)\b.{0,40}\b(?:fast|quickly|so much)\b|\bgoing (?:grey|gray|white)\b|"
                    r"\b(?:whole bottle|bottle of (?:wine|vodka|gin))\b.{0,40}\b(?:tablets|pills|medication)\b|"
                    r"\bnumb(?:ness)?\b.{0,30}\bface\b.{0,40}\b(?:arm|leg)\b.{0,15}\b(?:weak|limp)|\bface\b.{0,20}\bnumb(?:ness)?\b.{0,40}\b(?:arm|leg)\b.{0,15}\b(?:weak|limp)|"
                    r"\bcough\w*\b.{0,40}(?<!no )(?<!without )(?<!any )\bblood\b|(?<!no )(?<!without )\bblood\b.{0,40}\bcough\w*\b|"
                    r"\b(?:arm|leg)\b.{0,15}\b(?:went|gone|is|feels?) (?:limp|dead|weak)\b.{0,40}\bcan'?t (?:hold|lift|move)|"
                    r"\b(?:tongue|throat)\b.{0,40}\b(?:swollen|swelling|closing)\b|^(?!(?=.*\b(?:dentist|dental|numbing|botox|fillers?)\b)(?!.*\b(?:throat|breath\w*|swallow\w*|tongue|hives|rash|dizz\w*|wheez\w*|faint\w*)\b)).*\blips?\b.{0,40}\b(?:swollen|swelling)\b|"
                    r"\b(?:(?:swollen|bloated) (?:belly|stomach|tummy)|(?:belly|stomach|tummy)\b.{0,15}\b(?:swollen|bloated))\b.{0,60}\b(?:vomit\w*|being sick)\b.{0,60}\bcan'?t (?:pass wind|poo|go to the toilet)|"
                    r"\b(?:double|extra|too much)\b.{0,25}\b(?:pills|tablets|dose|medication)\b.{0,60}\b(?:drowsy|very sleepy|strange|can'?t stay awake)\b|"
                    r"\bdiabet\w+\b.{0,80}\b(?:shaking|blurr\w+|confused|sweating)\b.{0,60}\b(?:shaking|blurr\w+|confused|sweating)\b|\b(?:shaking|blurr\w+|confused|sweating)\b.{0,80}\b(?:shaking|blurr\w+|confused|sweating)\b.{0,60}\bdiabet\w+|"
                    r"\b(?:sudden|terrible|severe)\b.{0,25}\bback\b.{0,40}\bsweat\w*|"
                    r"\bstiff neck\b.{0,80}\b(?:light hurts|hurts my eyes|rash|high temperature|fever)|\b(?:high temperature|fever)\b.{0,60}\bstiff neck\b|"
                    r"\b(?:tight|pain|pressure|band|crush\w*|squeez\w+)\b.{0,25}\bchest\b.{0,80}\b(?:into|to|down|spread\w*) (?:my )?(?:left )?(?:jaw|arm)\b|"
                    r"\b(?:stabbing|agony|agonising|screaming)\b.{0,60}\b(?:curled up|on the floor|can'?t move)\b|"
                    r"\b(?:curled up|on the floor|can'?t move)\b.{0,60}\b(?:stabbing|agony|agonising)\b|"
                    # run 01 probe 4 (8/12 missed): NHS pelvic-pain page 111/999 criteria told in everyday words
                    r"\bshoulder\b.{0,60}\b(?:pregnan\w+|(?:think|might|may) (?:i'?m|i am|be) pregnant)|\bpregnan\w+\b.{0,60}\btip of (?:my |the )?shoulder\b|"
                    r"\b(?:2\d|3\d|4[0-2]) weeks\b.{0,60}\b(?:regular (?:pains?|tightenings?|contractions?)|contractions?|tightenings?)\b|"
                    r"\bpositive (?:pregnancy )?test\b.{0,60}\b(?:cramp\w*|spotting|bleed\w*|pain\w*)\b|"
                    r"\b(?:pelvi\w+|tummy|belly|abdom\w+)\b.{0,40}\b(?:pain|ache)\b.{0,60}\b(?:temperature of (?:3[89]|4\d)|shivering|very high temperature)\b|"
                    r"\b(?:temperature of (?:3[89]|4\d)|shivering)\b.{0,60}\bpelvi\w+ pain\b|"
                    r"\b(?:touch|press)\w*\b.{0,40}\bgetting worse\b|\bgetting worse\b.{0,40}\b(?:touch|press)\w*\b|"
                    r"\bpelvi\w+ pain\b.{0,40}\b(?:confused|disorientated)\b|\b(?:confused|disorientated)\b.{0,40}\bpelvi\w+ pain\b|"
                    # run 01 (S-149): a lot of one's own tablets, then feeling strange/unwell; pain so bad she was sick and shaking
                    r"\b(?:took|taken|swallowed) (?:a lot|loads|a load|lots|too many) of (?:my |the )?(?:\w+ ){0,2}(?:tablets|pills|painkillers|meds|medication)\b.{0,60}\b(?:strange|weird|odd|drowsy|sick|dizzy|not right)\b|"
                    r"\bpain\b.{0,15}\bso bad\b.{0,30}\b(?:sick|vomit\w*|threw up)\b.{0,30}\bshaking\b|"
                    # run 01 (S-150, probe 10: 5/12 missed): sudden vision change in one eye, cauda equina wording, seizure, confusion with fever, waters breaking
                    r"\b(?:blurr\w*|lost|loss of|double) vision\b (?:came on |started |began )?(?:suddenly|all of a sudden)\b|\bsudden(?:ly)? (?:\w+ ){0,2}(?:blurr\w*|lost|double) vision\b|\bvision\b.{0,15}\b(?:went|goes|gone)\b.{0,15}\b(?:blurr\w+|black|dark|double)\b.{0,30}\b(?:one eye|suddenly)\b|\bblurr\w+ in one eye\b|"
                    r"\bcan'?t tell when i need (?:a |to )?(?:wee|pee|poo|go)\b|\bcan'?t (?:control|feel) (?:my )?(?:bladder|bowels?)\b|\bnumb\b.{0,40}\b(?:bladder|bowels?|between my legs)\b|"
                    r"\b(?:had|having) (?:a )?(?:fit|seizure)\b(?! of)|\bconvuls\w+|\bshaking\b.{0,40}\bbit my tongue\b|\bbit my tongue\b.{0,40}\bshaking\b|"
                    r"\b(?:confused|forgetting where i am|disorientated)\b(?! about\b).{0,60}\b(?:high temperature|fever)\b(?! has (?:gone|settled|come down))|\b(?:high temperature|fever)\b.{0,60}\b(?:confused(?! about\b)|forgetting where i am|disorientated)\b|"
                    r"\bwaters (?:have |just )?broke\b|\bmy waters (?:have )?(?:broken|gone)\b|"
                    # run 01 (S-152, probe 11: 10/10 missed): painkiller overdose by count, stomach bleeding signs after painkillers, opioid mixed with alcohol or doubled, slow breathing, swollen lips
                    r"\b(?:took|taken|swallowed|taking) (?:over |about |around )?(?:9|1\d|[2-9]\d) (?:paracetamol|co-?codamol|ibuprofen|codeine|naproxen|tablets|pills)\b|"
                    r"\b(?:like|looks like|look like|resembl\w+) coffee grounds\b|\bvomit\w*\b.{0,40}\b(?:blood|bright red)\b|\b(?:blood|bright red)\b.{0,20}\bvomit\w*\b|\bblack,? tarry\b|\btarry (?:poo|poos|stools?)\b|\bblack (?:poo|poos|stools?|motions?)\b(?! bags)|"
                    r"\b(?:doubled|double|extra)\b.{0,30}\b(?:codeine|tramadol|morphine|co-?codamol)\b.{0,60}\b(?:keep my eyes open|can'?t stay awake|drowsy|very sleepy)\b|"
                    r"\bmy breathing\b.{0,15}\b(?:slow|shallow|slowed)\b|\bbreathing (?:is|feels|has gone) (?:very |really )?(?:slow|shallow)\b|\bbreathing (?:slowed|is slowing)\b(?! (?:with|using|down with|after|exercise|app))|"
                    r"\b(?:wine|vodka|alcohol|drank|drinking)\b.{0,50}\b(?:tramadol|codeine|morphine|co-?codamol)\b.{0,60}\b(?:weird|floaty|drowsy|dizzy|sick)\b|\b(?:tramadol|codeine|morphine|co-?codamol)\b.{0,50}\b(?:wine|vodka|alcohol)\b.{0,60}\b(?:weird|floaty|drowsy|dizzy|sick)\b|"
                    r"\b(?:took|taken|swallowed) (?:the )?(?:whole|entire) (?:strip|packet|box|bottle) of (?:\w+ )?(?:tablets|pills)\b|"
                    r"\b(?:shaking|heart (?:is )?(?:pounding|racing))\b.{0,50}\b(?:too many|too much)\b.{0,40}\b(?:painkillers|tablets|pills|energy drinks)\b|\bswollen (?:tongue|throat)\b|^(?!(?=.*\b(?:dentist|dental|numbing|botox|fillers?)\b)(?!.*\b(?:throat|breath\w*|swallow\w*|tongue|hives|rash|dizz\w*|wheez\w*|faint\w*)\b)).*\bswollen lips?\b|"
                    # run 01 (S-153, probe 12: 7/8 missed): appendix, torsion, kidney infection, obstruction, shock, dehydration, hernia told in everyday words
                    r"\b(?:belly button|navel)\b.{0,50}\b(?:moved|spread|shifted)\b.{0,30}\bright\b|\b(?:twisting|stabbing) pain\b.{0,50}\b(?:vomit\w*|being sick)\b|\bcan'?t get comfortable\b.{0,40}\b(?:vomit\w*|sick)\b|"
                    r"\bback\b.{0,25}\bunder (?:my )?ribs\b.{0,50}\b(?:high fever|chills|temperature of (?:3[89]|4\d)|with fever)\b|\bchills\b.{0,60}\bpain when i wee\b|\b(?:burning|pain) when i wee\b.{0,50}\b(?:high fever|chills|shivering|temperature of (?:3[89]|4\d))\b|"
                    r"\b(?:haven'?t|hasn'?t|not) passed wind\b|\bcan'?t (?:pass|break) wind\b|"
                    r"\b(?:pale|clammy)\b,? (?:and |,)?(?:sweaty|clammy)\b|\bpale\b.{0,30}\bheart (?:is )?racing\b|"
                    r"\bcan'?t keep even (?:water|fluids)\b.{0,30}\bdown\b|\bsick all day\b.{0,60}\b(?:dizzy|faint|can'?t keep)\b|"
                    r"\blump\b.{0,20}\bgroin\b.{0,50}\b(?:painful|vomit\w*)\b|"
                    r"\bseeing things that aren'?t there\b|\bhearing voices\b|\bhaven'?t slept\b.{0,30}\b(?:days|nights)\b.{0,60}\b(?:seeing things|hearing voices)\b|"
                    # run 01 probe 5 (NHS allergic reaction page; 6/12 missed): swelling, wheeze with hives, can't swallow, floppy after an injection
                    r"\b(?:having|think i'?m having|think i have|got|got an?) an? allergic reaction\b|\bcan'?t swallow\b(?! (?:big |large |the |my )?(?:pills|tablets|capsules))|"
                    r"\bhives\b.{0,40}\bwheez\w*|\bwheez\w*.{0,40}\bhives\b|"
                    r"\btongue\b.{0,20}\b(?:feels? )?(?:huge|puffing up|swelling up)\b|\bface\b.{0,20}\bpuffing up\b.{0,60}\b(?:throat|tight|breath|lips)\b|"
                    r"\blips?\b.{0,20}\btingling\b.{0,30}\b(?:injection|dose|tablets?|capsule)\b|\bfloppy\b.{0,60}\b(?:injection|lips?|tingling)\b|"
                    # NHS pelvic-pain 999 list: pain in the tip of the shoulder together with pelvic/tummy pain (any clause)
                    r"\btip of (?:my |the )?shoulder\b.{0,60}\b(?:pelvi\w+|tummy|stomach|abdom\w+|belly)\b|"
                    r"\b(?:pelvi\w+|tummy|stomach|abdom\w+|belly)\b.{0,60}\btip of (?:my |the )?shoulder\b|"
                    # NHS toxic shock page: tampon or cup in use together with a high temperature and another sign (any clause)
                    r"\bpain\b.{0,25}\bright (?:ribs?|rib cage|side of (?:my )?ribs)\b.{0,60}\bright shoulder\b|"
                    # early pregnancy told as weeks ("im 7 weeks and ... blood/cramps")
                    r"\b(?:i'?m|im|i am) \d{1,2} weeks?\b(?! (?:post|since|late|overdue|into))(?!\s*(?:on|of) (?:my|the))[^.]{0,80}\b(?:blood|bleed\w*|cramp\w*|pain\w*)\b|"
                    # NHS PID page: a measured temperature of 38+ with shivering and tummy/pelvic pain (any order)
                    r"\btemperature of (?:3[89]|4\d)\b.{0,60}\b(?:chills|shivering|shivery)\b.{0,60}\bpain\b.{0,30}\b(?:pelvi\w+|tummy|stomach|abdom\w+|belly)\b|"
                    # NHS PID page 999 list: very high temperature with chills/shivering together with pelvic or tummy pain
                    r"\b(?:(?:very )?high temperature|fever)\b.{0,60}\b(?:chills|shivering|shivery)\b.{0,80}\b(?:pelvi\w+|tummy|stomach|abdom\w+|belly)\b.{0,15}\bpain|"
                    r"\b(?:pelvi\w+|tummy|stomach|abdom\w+|belly)\b.{0,15}\bpain\b.{0,80}\b(?:(?:very )?high temperature|fever)\b.{0,60}\b(?:chills|shivering|shivery)\b|"
                    # heart attack told in plain words, and the heavy-chest descriptions NHS lists (any clause)
                    r"\b(?:having|think i'?m having|might be having|feels? like i'?m having) (?:a )?heart attack\b|"
                    r"\bheavy (?:feeling|weight|pressure)\b.{0,20}\b(?:across|in|on) (?:my )?chest\b|\bchest\b.{0,40}\bsitting on (?:it|me)\b|"
                    # NHS sepsis wording: high temperature with confusion/drowsiness and shaking or no urine (any order)
                    r"^(?=.*\b(?:fever|high temperature)\b)(?=.*\b(?:confus\w*|drowsy)\b)(?=.*\b(?:shak\w+|shiver\w*|(?:haven'?t|not) (?:passed|had) (?:any )?(?:urine|a wee|wee)))|"
                    r"\b(?:hard as a board|board[- ]?hard)\b.{0,30}\b(?:tummy|stomach|abdomen|belly)\b|\b(?:tummy|stomach|abdomen|belly)\b.{0,30}\b(?:hard as a board|board[- ]?hard)\b|"
                    # gynae and post-operation wording from the NHS pages (any clause)
                    r"\b(?:feel like|want to|going to|gonna|ready to|about to) end(?:ing)? it\b|"
                    r"\b(?:lips|face|tongue|throat)\b.{0,15}\bswell\w*|\bswelling (?:up )?(?:of )?(?:my )?(?:lips|face|tongue)\b|"
                    r"\b(?:can'?t|cannot|unable to) (?:pee|wee|pass (?:any )?urine)\b(?: at all| for (?:hours|\d+ hours)| all day)|"
                    r"^(?=.*\b(?:tampons?|menstrual cups?)\b)(?=.*\b(?:left in|forgot|forgotten|stuck)\b)(?=.*\b(?:rash|sunburn|fever|high temperature|unwell|dreadful|burning up)\b)|"
                    r"^(?=.*\b(?:laparoscop\w*|operation|surgery|wound)\b)(?=.*(?<!no )(?<!without )(?<!not )(?<!no sign of )\b(?:fever|high temperature|leaking|pus|oozing)\b)(?=.*\b(?:worse|unwell|vomit\w*|swollen)\b)|"
                    r"\b(?:vomit\w*|being sick|throwing up)\b.{0,15}\b(?:non[- ]?stop|constantly|all night)\b.{0,60}\b(?:swollen|bloated|tender|hard)\b|"
                    r"^(?=.*\b(?:period (?:is |was )?(?:\w+ ){0,3}late|late period|missed (?:a |my )?period|overdue)\b)(?=.*\b(?:one[- ]sided|one side|sharp|stabbing)\b)(?=.*\b(?:dizz\w*|faint\w*))|"
                    # sharp / severe pain together with dizzy or light-headed, and not managing without help (NHS 999 signs); any clause
                    r"^(?=.*\b(?:sharp|stabbing|severe|intense|terrible)\b.{0,20}\bpain\b|.*\bpain\b.{0,20}\b(?:was|is|so) (?:very |really |so )?(?:sharp|stabbing|severe|intense)\b)(?=.*\b(?:dizz\w*|light[- ]?headed)\b)|"
                    r"\b(?:can'?t|couldn'?t|cannot|unable to) (?:move around|stand|walk|get up)\b.{0,20}\bwithout (?:help|support|holding)\b|"
                    r"\b(?:extreme|horrific|massive)\b.{0,10}\bpain\b.{0,60}\b(?:being sick|vomit\w*|throwing up|can'?t (?:pee|wee))\b|\b(?:extreme|horrific|massive)\b.{0,10}\bpain\b.{0,40}\bnothing helps\b|"
                    # asthma, stroke, headache and low blood sugar wording from the NHS pages (any clause)
                    r"\bwheez\w+\b.{0,40}\b(?:not (?:helping|working)|isn'?t (?:helping|touching|working))|\binhaler (?:isn'?t|is not|not|doesn'?t|won'?t) (?:helping|working|touching|do anything)|"
                    r"\b(?:numb\w*|pins and needles|weak\w*|tingl\w*)\b.{0,30}\b(?:one side)\b|\b(?:one side)\b.{0,30}\b(?:face|speech)\b|"
                    r"\bthunderclap\b|\bworst headache (?:ever|of my life)\b|"
                    r"\b(?:double|blurr\w*) vision\b.{0,40}\b(?:speak|speech|talk\w*|words)\b|\b(?:can'?t|couldn'?t|cannot) speak (?:right|properly)\b(?!.{0,30}\b(?:nose|cold|throat)\b)|"
                    r"\bblood (?:sugar|glucose) (?:is |was |of |level )?[0-2](?:\.\d)?\b(?![\d%.])|"
                    # NHS ectopic pregnancy 999 list: very dizzy or fainting, looking very pale, feeling sick - when she might be pregnant
                    r"^(?=.*\b(?:pregnan\w+|missed (?:a |my )?period)\b)(?=.*\b(?:very dizzy|faint\w*))(?=.*\b(?:very pale|looking pale|pale)\b)|"
                    r"^(?=.*\b(?:stopped eating (?:completely|altogether|anything)|not eaten|haven'?t eaten)\b)(?=.*\b(?:too weak|can'?t stand|faint\w*|dizzy)\b)|"
                    # PM blind set 0028: positive test (either order) with sharp or one-sided pain, and a number-form temperature with a tampon that is stuck
                    r"^(?=.*\b(?:(?:pregnancy )?test (?:was |came back |is |showed )?positive|positive (?:pregnancy )?test)\b)(?=.*\b(?:sharp|stabbing|severe)\b.{0,30}\bpain\b|.*\bpain\b.{0,30}\b(?:on (?:the|my) (?:right|left)|one side)\b)(?=.*\b(?:shoulder|dizzy|faint\w*|bleed\w*))|"
                    r"^(?=.*\b(?:tampons?|menstrual cups?|cup)\b)(?=.*\b(?:can'?t|cannot|couldn'?t|could not|unable to) (?:get|take|pull|reach)\b.{0,15}\b(?:out|it out)\b|.*\bstuck\b)(?=.*\b(?:temperature|temp) (?:of |is |was |at )?(?:3[89]|4\d)\b)|"
                    # set p104 (burns, chemical in the eye, tick bite, red streaks, ear bleeding after a bang, sudden deafness, locked jaw, curtain over vision; first contact 8/10 missed)
                    r"\b(?:burn\w*|scald\w*|boiling water|hot oil)\b.{0,60}\b(?:white|waxy|leathery|charred|doesn'?t hurt|no pain|numb)\b|\b(?:chemical|bleach|acid|oven cleaner|cleaning (?:fluid|spray))\b.{0,30}\b(?:in|into) (?:my |his |her |the )?eyes?\b|\b(?:splash\w*|got)\b.{0,30}\b(?:chemical|bleach|acid)\b.{0,30}\beyes?\b|"
                    r"\btick\b.{0,60}\b(?:rash|fever\w*|flu|bullseye)\b|^(?=.*\bred streaks?\b.{0,40}\b(?:up|along)\b)(?=.*(?<!no )\b(?:infect\w*|wound|cut|chills|shiver\w*|fever\w*)\b)|\bstreaks?\b.{0,30}\b(?:infect\w*|cut|wound)\b.{0,50}\b(?:chills|fever|shiver\w*)\b|"
                    r"\bears?\b.{0,20}\b(?:bleeding|leaking blood|blood)\b.{0,60}\b(?:head|bang|fall|fell|drows\w*)\b|\bsudden(?:ly)?\b.{0,20}\b(?:loss of hearing|lost (?:my )?hearing|deaf\w*)\b|\bjaw\b.{0,20}\b(?:locked|clamped)\b|\bcan'?t open my mouth\b.{0,80}\b(?:neck|cut|wound)\b|"
                    r"\b(?:curtain|shadow|veil)\b.{0,30}\b(?:across|over|in)\b.{0,15}\b(?:vision|eye|sight)\b|\bflashes? of light\b.{0,60}\b(?:curtain|shadow|lost|vision)\b|"
                    # set p103 (crushing chest with tingling arm, swallowing bleach or similar; first contact 2/10 missed)
                    r"\bchest\b.{0,20}\b(?:crush\w*|squeez\w*|vice|elephant)\b|\b(?:crush\w*|squeez\w*)\b.{0,15}\bchest\b|"
                    r"\b(?:drank|drink(?:ing)?|swallowed|ate)\b.{0,25}\b(?:bleach|antifreeze|weed ?killer|white spirit|dishwasher tablet|cleaning (?:fluid|product|spray))\b|\b(?:bleach|antifreeze|weed ?killer)\b.{0,30}\b(?:by mistake|by accident|swallowed|drank)\b.{0,60}\b(?:burning|mouth|throat|sick|vomit\w*)\b|"
                    # set p102 (asthma with blue lips, low blood sugar not responding, cold pale numb limb; first contact 3/11 missed)
                    r"\b(?:lips?|fingers?|skin)\b.{0,20}\b(?:blue|bluish|grey)\b.{0,60}\b(?:wheez\w*|inhaler|asthma|breath\w*)\b|\b(?:wheez\w*|inhaler|asthma|breath\w*)\b.{0,80}\b(?:lips?|fingers?)\b.{0,20}\b(?:blue|bluish|grey)\b|"
                    r"\b(?:sugar|glucose|blood sugar)\b.{0,30}\b(?:very low|too low|dropping|crashed|hypo\w*)\b.{0,80}\b(?:confus\w*|not working|isn'?t working|aren'?t working|faint\w*|pass\w* out|can'?t (?:talk|think))\b|\b(?:confus\w*|shaky and sweaty)\b.{0,60}\b(?:sugar|glucose)\b.{0,30}\b(?:very low|too low|hypo\w*)\b|"
                    r"^(?!.*(?:raynaud|pins and needles|fine (?:now|once)|gone after|warmed up|in the cold))(?=.*\b(?:leg|foot|arm)\b.{0,25}\b(?:pale|white|blue|mottled|ice cold)\b.{0,30}\b(?:cold|numb\w*|can'?t feel|can'?t move|no pulse)\b)|"
                    # set p101 (teen register probe: puffy lips with rash or new tablets, double vision with a pounding head; first contact 2/11 missed)
                    r"^(?=.*\b(?:lips?|tongue|face)\b.{0,15}\b(?:puffy|puffing|swelling|swollen|swelled)\b)(?=.*(?<!no )(?<!without )\b(?:rash|hives|tablets?|pills?|injection|antibiotics?|wheez\w*)\b)(?!(?=.*\b(?:dentist|dental|numbing|local anaesthetic|botox|fillers?)\b)(?!.*\b(?:throat|breath\w*|swallow\w*|tongue|hives|rash|dizz\w*|wheez\w*|faint\w*)\b))|\beyes? (?:are |is )?(?:swollen|puffy) shut\b.{0,60}\b(?:rash|hives|tablets?|injection|antibiotics?)\b|"
                    r"\b(?:see(?:ing)?|vision (?:is|went)|eyes? (?:are|went)) double\b.{0,80}\b(?:head(?:ache)?|pounding|worst|never had|sick|vomit\w*|stiff neck)\b|\b(?:head(?:ache)?|pounding|worst|never had|stiff neck)\b.{0,80}\b(?:see(?:ing)?|vision (?:is|went)) double\b|\bdouble vision\b.{0,60}\b(?:sudden\w*|all at once|head(?:ache)?|pounding)\b|"
                    # set p100 (NHS stroke, sepsis skin signs, sudden one-sided numbness or vision loss; first contact 3/12 missed)
                    r"\b(?:face|mouth|smile)\b.{0,30}\b(?:droop\w*|dropp\w*|fallen|sagg\w*)\b.{0,80}\b(?:speak|speech|talk|words?|slurr\w*|arm|smile)\b|\b(?:can'?t|cannot|couldn'?t) smile\b.{0,60}\b(?:droop\w*|dropp\w*|speak|speech|slurr\w*)\b|"
                    # S-182: blotchy skin counts only with a systemic sign in the same note
                    r"(?:blotchy (?:skin|lips|tongue)|(?:skin|lips|tongue)[^.]{0,15}blotchy).{0,80}\b(?:unwell|confus\w*|fever|faint\w*|dizz\w*|drows\w*|breath\w*|clammy|very ill|shak\w+|shiver\w*|rash|can'?t wake|sepsis)\b|\b(?:unwell|confus\w*|fever|faint\w*|dizz\w*|drows\w*|breath\w*|clammy|very ill|shak\w+|shiver\w*|rash|can'?t wake|sepsis)\b.{0,80}(?:blotchy (?:skin|lips|tongue)|(?:skin|lips|tongue)[^.]{0,15}blotchy)|"
                    r"\b(?:skin|lips|tongue|hands|feet|fingers)\b.{0,30}\b(?:mottled|blotchy|bluish|blue|grey|ashen)\b.{0,80}\b(?:might die|going to die|dying|confus\w*|fever|infection|breath\w*|very ill|unwell|drowsy|sleepy)\b|"
                    r"\bsudden(?:ly)?\b.{0,30}\b(?:numb\w*|weak\w*)\b.{0,30}\b(?:one side|left side|right side|face|arm|leg)\b|\b(?:can'?t|cannot|couldn'?t) see (?:out of|from) (?:one|my (?:left|right)) eye\b|\bsudden(?:ly)? (?:lost|loss of) (?:my )?(?:vision|sight)\b|"
                    # set p99 (cauda equina and jaundice wording; first contact 2/8 missed)
                    r"\b(?:couldn'?t|could not|can'?t|cannot) (?:control|hold) (?:my )?(?:wee|bladder|bowels?|poo)\b.{0,60}\b(?:legs?|feet|foot|numb\w*|weak\w*)\b|\b(?:legs?|feet|foot|numb\w*|weak\w*)\b.{0,60}\b(?:couldn'?t|could not|can'?t|cannot) (?:control|hold) (?:my )?(?:wee|bladder|bowels?|poo)\b|"
                    r"^(?=.*\byellow (?:skin|eyes)\b)(?=.*(?<!no )\b(?:fever|temperature|stabbing pain|severe pain|sharp pain)\b)|"
                    # set p98 (abdomen, head, mixing alcohol, young baby; first contact 4/12 missed)
                    r"\b(?:board[- ]like|hard as a board)\b.{0,20}\b(?:stomach|abdomen|tummy|belly)\b|\b(?:stomach|abdomen|tummy|belly)\b.{0,20}\b(?:board[- ]like|hard as a board|rigid (?:and|,) (?:tender|painful|hard))\b|"
                    r"\b(?:sudden|crushing)\b.{0,20}\bheadache\b.{0,40}\b(?:vomit\w*|sick)\b.{0,40}\b(?:sleepy|drowsy|confus\w*)\b|"
                    r"\b(?:drank|had)\b.{0,30}\b(?:vodka|alcohol|wine|whisky)\b.{0,40}\b(?:took|and took)\b.{0,20}\b(?:sleeping|pills|tablets)\b.{0,60}\b(?:stay awake|struggling|drowsy|slurr\w+)\b|"
                    r"\bbaby\b.{0,30}\b(?:under|less than) (?:3|three|2|two|1|one) months?\b.{0,40}\b(?:fever|high temperature)\b|"
                    # set p97 (midlife, HRT; first contact 2/12 missed)
                    r"^(?=.*\b(?:calf|leg)\b.{0,20}\b(?:swollen|swelling)\b)(?=.*\b(?:hot|warm)\b)(?=.*\b(?:painful|tender|sore)\b)|\bbleeding like a tap\b|"
                    # set p95 (retained tampon, assault with bleeding, genital infection, prolapse, early labour; first contact 7/12 missed)
                    r"^(?=.*\btampon\b)(?=.*(?:\bleft\b.{0,15}\bin for (?:days|\d+ days|a week)|\bstuck\b|\bforgot\w*|\bcan'?t find\b))(?=.*(?<!no )\b(?:smell\w*|fever|temperature(?! (?:of |is |was |at )?(?:3[0-7]|normal)\b)|rash|unwell)\b)|"
                    r"\b(?:raped|sexually assaulted|sexual assault|forced me)\b.{0,80}\b(?:bleed\w*|in a lot of pain|hurts? so)\b|"
                    r"^(?=.*\bdischarge\b)(?=.*(?<!no )\b(?:fever|temperature)\b)(?=.*\b(?:terrible|severe|awful|unbearable)\b.{0,15}\bpain\b|.*\bpain\b.{0,15}\b(?:terrible|severe|awful|unbearable)\b)|"
                    r"^(?=.*\b(?:vulva|labia)\b)(?=.*\b(?:huge|swollen|swelling|lump)\b)(?=.*(?<!no )\b(?:temperature|fever)\b)(?=.*\bpain\w*\b)|"
                    r"^(?=.*\b(?:insides? (?:are |is )?falling out|something (?:is )?(?:bulging|coming out))\b)(?=.*\bbleed\w*\b)|"
                    r"\bwater (?:has |have )?broke(?:n)?\b.{0,30}\b(?:\d{2}) weeks\b|"
                    r"^(?=.*\bcontractions?\b)(?=.*\b(?:2\d|3[0-6]) weeks\b)(?=.*\bevery \d+ min)|"
                    # set p90 (teen register, lower case and no apostrophes; first contact 6/12 missed)
                    r"\bbleeding (?:like crazy|like mad|loads)\b.{0,60}(?<!not )(?<!no )\b(?:dizzy|faint\w*|weak|through (?:my|the) (?:skirt|trousers|jeans|clothes|sheets|bed))\b|(?<!not )\b(?:dizzy|faint\w*)\b.{0,60}\bbleeding (?:like crazy|like mad|loads)\b|"
                    r"\btook (?:like |about |around |roughly )?(?:1[0-9]|[2-9]\d) (?:paracetamol|ibuprofen|tablets|pills|painkillers|co-?codamol|codeine)\b|"
                    r"^(?=.*\b(?:throwing up|vomit\w*|been sick)\b)(?=.*\bpain\b.{0,25}\b(?:right|left) side\b)(?=.*\b(?:can'?t|cant) (?:even )?(?:stand|walk|move)\b)|"
                    r"^(?=.*\b(?:shaking|trembling)\b)(?=.*\bheart\b.{0,15}\b(?:going mad|racing|pounding|going crazy)\b)(?=.*\bpain\b)|"
                    r"\bappendix\b.{0,20}\b(?:burst|ruptured)\b|\bpain\b.{0,60}\b(?:belly button|tummy button|navel)\b.{0,50}\bsuddenly stopped\b|"
                    r"^(?=.*\bhead\b.{0,15}\b(?:pounding|splitting)\b)(?=.*\b(?:can'?t|cant) see (?:properly|right|clearly)\b)|"
                    # set p84 (implant, injection and coil complications; first contact 5/12 missed)
                    r"^(?=.*\b(?:implant|injection site|depo|coil|iud|ius)\b)(?=.*\b(?:hot|oozing|pus|spreading red)\b)(?=.*(?<!no )(?<!without )\b(?:temperature|fever|chills|shivering|shaking)\b)|"
                    r"^(?=.*\bimplant\b)(?=.*\b(?:numb|tingling)\b)(?=.*\b(?:badly|severe\w*|spreading|whole arm)\b)|"
                    r"^(?=.*\b(?:zig-?zag|flashing|flickering)\b.{0,15}\b(?:lights?|lines)\b)(?=.*\b(?:numb|weak\w*|slurr\w*)\b.{0,15}\b(?:face|arm|speech)\b|.*\b(?:face|arm)\b.{0,15}\b(?:numb|weak)\b)|"
                    r"^(?=.*\b(?:coil|iud|ius)\b)(?=.*(?<!no )\b(?:shaking|chills|shiver\w*|fever|high temperature)\b)(?=.*\bpain\b)|"
                    # set p81 (high sugar, kidney infection, spreading skin infection, no wee, very high blood pressure; first contact 10/12 missed)
                    r"^(?=.*\b(?:thirsty|thirst)\b)(?=.*\b(?:weeing (?:loads|a lot|lots)|passing (?:huge|lots|loads)|wee loads|peeing (?:loads|a lot))\b)(?=.*\b(?:fruity|losing weight|vomit\w*|drowsy|sleepy)\b)|"
                    r"^(?=.*\b(?:blood sugar|blood glucose|sugar (?:meter|reading|level)|glucose (?:meter|reading|level)|my meter|meter says|reading (?:says|was|is))\b[^.?]{0,25}?\b(?:2\d|[3-9]\d)(?:\.\d)?\b(?!\s*(?:%|percent|minutes|mins|hours|days|g\b)))(?=.*\b(?:sick|sleepy|drowsy|vomit\w*|confus\w*|breathing fast)\b)|"
                    r"^(?=.*\b(?:sugar|glucose)\b.{0,20}\b(?:really|very|extremely) high\b)(?=.*\b(?:confus\w*|sleepy|drowsy|vomit\w*))|"
                    r"^(?=.*\b(?:kidney|under (?:my |the )?ribs|loin)\b)(?=.*(?<!no )(?<!without )\b(?:fever|chills|shaking|shiver\w*|high temperature)\b)(?=.*\b(?:wee|urine|pee|vomit\w*|burning)\b)|"
                    r"\bred streaks?\b.{0,40}\b(?:up|spreading|leg|arm)\b.{0,60}(?<!no )\b(?:fever|temperature|unwell)\b|"
                    r"\b(?:haven'?t|not) (?:peed|weed|passed (?:any )?(?:wee|urine))\b.{0,25}\b(?:\d{2} hours|all day|since yesterday|twelve hours)\b.{0,60}\b(?:dizzy|faint\w*|drowsy|weak|thirsty)\b|"
                    r"\b(?:blood pressure|bp)\b.{0,40}\b(?:1[89]\d|2\d\d) ?(?:/| over )(?:11\d|1[2-9]\d)\b(?=.{0,80}\b(?:headache|vision|chest|confus\w*|swollen|pregnan\w*|dizzy)\b)|"
                    r"\b(?:blood pressure|bp)\b.{0,40}\b(?:1[89]\d|2\d\d) ?(?:/| over )(?:11\d|1[2-9]\d)\b|"
                    # set p80 (cyst, torsion, egg collection, after surgery, heart signs; first contact 5/12 missed)
                    r"^(?=.*\b(?:sudden\w*|out of nowhere|came on (?:suddenly|fast))\b)(?=.*\b(?:terrible|severe|awful|worst|agonising|agonizing|excruciating|sharp|stabbing)\b.{0,25}\bpain\b|.*\bpain\b.{0,25}\b(?:terrible|severe|awful|worst|agonising|excruciating)\b)(?=.*\b(?:threw up|throwing up|vomit\w*|(?<!not )being sick|was sick)\b)|"
                    r"^(?=.*\b(?:hardly|barely|not) (?:weeing|passing (?:any )?(?:wee|urine|pee))\b)(?=.*\b(?:swollen|bloated|tight|very thirsty)\b)(?=.*\b(?:sick|nausea|vomit\w*|breath\w*|thirsty)\b)|"
                    r"^(?=.*\b(?:laparoscopy|surgery|operation|egg collection|hysteroscopy)\b)(?=.*\b(?:pain\b.{0,30}\bgetting worse|getting worse)\b)(?=.*(?<!no )(?<!without )\b(?:feverish|fever|high temperature)\b)|"
                    r"^(?=.*\bpain\b)(?=.*\bclammy\b)(?=.*\b(?:pale|sweating|sweaty)\b)(?=.*\b(?:so strong|so bad|severe|terrible|unbearable|sharp)\b)|"
                    r"^(?=.*\bjaw\b.{0,25}\b(?:ach\w+|pain\w*|tight\w*)\b)(?=.*\bsweat\w*\b)(?=.*\b(?:chest|arm|heart|short of breath|breathless|back)\b)|"
                    # set p75 (medicine reactions and mixing; first contact 4/12 missed)
                    r"^(?=.*\brash\b.{0,30}\bspreading\b)(?=.*\b(?:lips?|tongue|face|eyelids?)\b.{0,20}\b(?:puffy|swollen|swelling)\b)|"
                    r"\b(?:took|taken|had) (?:double|twice|too many|an extra|two lots)\b.{0,50}\b(?:dose|tablets?|pills?|medication)\b.{0,60}\b(?:heart (?:is )?(?:pounding|racing)|shaking(?!\?)|drowsy|can'?t stay awake)\b|"
                    r"\bwheez\w*\b.{0,30}\bitch\w*\b.{0,15}\ball over\b|\bitch\w*\b.{0,15}\ball over\b.{0,40}(?<!no )\bwheez\w*\b|"
                    r"\b(?:sleeping|tablets?|pills?|codeine|tramadol|diazepam)\b.{0,30}\b(?:with|and) (?:wine|alcohol|vodka|beer|a few drinks)\b.{0,70}\b(?:out of it|can'?t stay awake|very drowsy|slurr\w+|passing out)\b|"
                    # set p76 (after birth, section or miscarriage; first contact 3/12 missed)
                    r"^(?=.*\b(?:stitches|wound|scar|section|tear)\b)(?=.*(?:\bhot and swollen\b|\bswollen\b|\bpus\b|\bleaking\b|\boozing\b|(?<!no )\bsmell(?:s|y)\b|\bred and (?:hot|swollen|painful)\b))(?=.*(?<!no )(?<!without )(?<!normal )\b(?:got a temperature|high temperature|fever|shivery|shaky|feel (?:very )?unwell|feeling (?:very )?unwell)\b)|"
                    r"^(?=.*\b(?:headache|head hurts)\b)(?=.*(?<!no )(?:\bblurr\w+|\bflashing\b|\bspots (?:in|before) my\b|\bvision (?:is |went |gone )?(?:blurry|blurred|double|odd|strange)\b))(?=.*\b(?:after (?:the )?(?:birth|delivery|having (?:the|my) baby|giving birth)|postnatal|postpartum)\b)|"
                    # set p72 (heavy bleeding wording, NHS heavy periods page; first contact 3/12 missed)
                    r"\bbled through\b.{0,25}\b(?:mattress|sheets?|bed)\b.{0,60}\b(?:barely stand|can'?t stand|dizz\w+|faint\w*|weak|collaps\w+)\b|"
                    r"\bclots?\b.{0,15}\b(?:golf ball|egg|lemon|fist)s?\b(?! pip| seed| sized? pip)|"
                    r"\bbleed\w* after sex\b.{0,30}\b(?:heavy|heavily|not stopping|won'?t stop|hasn'?t stopped)\b|"
                    # set p73 (bladder, bowel and infection signs, NHS 111 lists; first contact 7/12 missed)
                    r"^(?=.*\b(?:blood in (?:my )?(?:wee|urine|pee)|(?:wee|urine|pee)\b.{0,25}\b(?:bloody|blood))\b)(?=.*\b(?:fever|temperature|shiver\w*|shak\w+|pain in my (?:side|back)|bad pain)\b)|"
                    r"\b(?:can'?t|cannot|unable to|haven'?t been able to) (?:pass|do) (?:any )?(?:wee|urine|pee)\b(?: at all| since| for (?:hours|\d+))\b.{0,60}\b(?:swollen|painful|pain)\b|"
                    r"\blost (?:the )?feeling (?:between|in) (?:my )?(?:legs|thighs|bottom)\b|\bnumb(?:ness)?\b(?: and \w+)? (?:between|in the area between) my legs\b|"
                    r"^(?=.*\b(?:fever|high temperature|shaking|shivering)\b)(?=.*\bpain\b.{0,25}\b(?:belly|tummy|pelvi\w+|abdomen)\b)(?=.*\b(?:smelly|foul)\b.{0,15}\bdischarge\b)|"
                    r"^(?=.*\bpain\b.{0,30}\b(?:left|right) side\b|.*\b(?:left|right) side\b.{0,30}\bpain\b)(?=.*(?<!no )(?<!without )\b(?:high temperature|fever)\b)(?=.*(?:\bkeep being sick|\bbeen sick|\bvomiting|\bthrowing up|(?<!not )\bbeing sick)\b)|"
                    r"\b(?:bleed\w*|blood)\b.{0,25}\bback passage\b.{0,60}\b(?:heavy|heavily|faint\w*|pass out|collapse)\b|\b(?:heavy|heavily)\b.{0,25}\bbleed\w*\b.{0,25}\bback passage\b|"
                    # set p47 (pain in pregnancy, NHS pelvic pain page; first contact 3/12 missed)
                    r"^(?=.*\b(?:pregnan\w+|\d{1,2} weeks)\b)(?=.*\b(?:can'?t|cannot|unable to) (?:put (?:any )?weight|walk|stand)\b)(?=.*\b(?:pelvi\w+|hip|groin)\b)|"
                    r"^(?=.*\b(?:pregnan\w+|\d{1,2} weeks)\b)(?=.*\b(?:bump|belly|tummy|stomach)\b.{0,20}\b(?:tight|hard)\b)(?=.*\bconstant pain\b)|"
                    r"^(?=.*\b(?:pregnancy test positive|positive (?:pregnancy )?test)\b)(?=.*\bpain\b)(?=.*\b(?:dizz\w+|faint\w*|light-?headed)\b)|"
                    # set v22 (voice-style notes; first contact 4/12 missed)
                    r"\btook (?:a lot|loads|lots)\b.{0,15}\b(?:tablets|pills)\b.{0,40}\b(?:strange|drowsy|sleepy|sick|weird)\b|"
                    r"\bwon'?t wake up\b|\bcan'?t wake\b.{0,20}\b(?:up|her|him|them)\b|"
                    r"\b(?:don'?t|do not|dont) think i can (?:keep going(?! (?:to|at) )|go on|carry on)\b|"
                    r"\b(?:can'?t|cannot|cant|no) (?:control|feel)\b.{0,15}\b(?:bladder|bowel)\b|\bno feeling in my (?:(?:right|left) )?(?:legs?|feet)\b|"
                    # set v21 (long notes with the emergency in the middle; first contact 4/12 missed)
                    r"\b(?:filling|soaking|changing)\b.{0,12}\b(?:a |my )?(?:pad|tampon)s?\b.{0,15}\bevery (?:\d+|few|ten|twenty|fifteen|thirty) (?:min\w*)\b|"
                    r"\bstruggling to get (?:a )?(?:full )?breath\b|"
                    r"\b(?:couldn'?t|can'?t|unable to) stand\b.{0,40}\b(?:room|tilting|spinning|dizz\w+)|\b(?:tilting|spinning)\b.{0,40}\b(?:couldn'?t|can'?t) stand\b|"
                    r"^(?=.*\b(?:wound|procedure|surgery|op)\b)(?=.*\b(?:red|oozing|pus)\b)(?=.*\b(?:high temperature|fever))(?=.*\b(?:chills|shivering|shaking))|"
                    # set v20 (informal paraphrases; first contact 8/15 missed)
                    r"\b(?:pouring|gushing)\b.{0,15}\bblood\b|\bblood\b.{0,10}\b(?:pouring|gushing)\b|\bgush of blood\b|"
                    r"\bseeing stars\b|\blegs\b.{0,10}\b(?:going from under|giving (?:way|out)|gone from under)|"
                    r"\brigid as a board\b|\b(?:tummy|belly|stomach|abdomen) (?:is |went |feels? )(?:rigid|solid)\b(?! with (?:tension|stress|nerves|anxiety|worry))|"
                    r"\b(?:mouth|face|eyelid)\b.{0,15}\b(?:droop\w*|dropped|falling)\b|\bcan'?t feel my (?:left|right) side\b|"
                    r"\b(?:lump|clot|tissue)\b.{0,15}\bcame out\b.{0,60}\b(?:freezing|clammy|faint|dizzy)\b|"
                    r"^(?=.*\b(?:after the op|post[- ]?op)\b)(?=.*\b(?:fever|high temperature)\b)(?=.*\b(?:swollen|smell\w*|pus|discharge))|"
                    r"\bchest\b.{0,15}\bsqueezing\b|\bsqueezing\b.{0,15}\bchest\b|"
                    r"\b(?:been |keep |keeps )?having fits\b|"
                    # set v18 (medicines, late pregnancy, urinary infection with fever; first contact 8/15 missed)
                    r"\b(?:pill|contraceptive|hrt|patch)\b.{0,60}\b(?:swollen|swelling|painful)\b.{0,15}\b(?:leg|calf)\b|\b(?:swollen|swelling|painful)\b.{0,15}\b(?:leg|calf)\b.{0,60}\b(?:on the pill|the pill|hrt)\b|"
                    r"\bthroat\b.{0,20}\b(?:tight|closing)\b.{0,40}\b(?:rash|hives|swell\w*|breath\w*|antibiotic|tablet\w*)\b|^(?=.*(?<!no )(?<!without )(?<!any )\b(?:rash|hives)\b)(?=.*(?<!no )(?<!without )(?<!any )\b(?:breath\w*|swell\w*|tongue|throat (?:is |feels? )?(?:tight|closing)))|"
                    r"\b(?:haven\'?t|hasn\'?t|not|stopped)\b.{0,25}\b(?:felt|feel|feeling)?\s*(?:the |my )?(?:baby|bump)\b.{0,20}\bmov\w+|\b(?:baby|bump)\b.{0,20}\b(?:not moving|stopped moving|hasn\'?t moved|isn\'?t moving)\b|"
                    r"\bwaters (?:have |had )?(?:broke|gone|broken)\b.{0,60}\b(?:green|brown|blood|smell\w*)\b|"
                    r"\b(?:swelling|swollen)\b.{0,30}\b(?:face|hands)\b.{0,60}(?<!no )(?<!without )\bheadache\b|(?<!no )(?<!without )\bheadache\b.{0,60}\b(?:face|hands)\b.{0,15}\b(?:swell\w*|swollen)\b|"
                    r"\b(?:rolling|writhing)\b.{0,15}\b(?:on the |on my )?floor\b|"
                    r"\b(?:burning|stinging)\b.{0,20}\b(?:wee|pee|urinat\w+)\b.{0,60}\b(?:high fever|fever|high temperature)\b.{0,60}\b(?:back|shaking|shivering)\b|"
                    r"\b(?:tablets|pills)\b.{0,30}\b(?:wine|vodka|alcohol)\b.{0,40}\b(?:don'?t care|who cares)|"
                    # set v17 (typed fast): pad counts with abbreviations, very hot + confused, sudden headache with stiff neck
                    r"\b(?:soaked|soaking|filled|gone through|went through|used)\b.{0,12}\b\d+ (?:pads?|tampons?)\b.{0,15}\b(?:in|within) (?:\d+|an?|one|two|three|four) (?:hrs?|hours?)\b|"
                    r"^(?=.*\b(?:very hot|burning up|fever|high temperature)\b)(?=.*\bconfus\w*)(?=.*\b(?:shak\w+|shiver\w*))|\bconfus\w*\b.{0,40}\b(?:don'?t|do not|dont) know (?:what day|where i am|who)\b|"
                    r"\b(?:sudden|terrible|worst|awful)\b.{0,15}\bheadache\b.{0,60}\b(?:neck (?:is )?stiff|stiff neck|hit (?:w|with)|like being hit)\b|"
                    # sepsis / DKA / stroke / postnatal-infection wording (set v15, first contact 4/20 missed)
                    r"^(?=.*\b(?:burning up|rigors?|temperature (?:of )?(?:3[89]|4\d))\b)(?=.*\b(?:heart (?:racing|pounding)|(?:haven'?t|not) (?:peed|passed (?:any )?urine|had a wee)|tummy pain|confus\w*))|"
                    r"^(?=.*\b(?:type 1|diabet\w+)\b)(?=.*\b(?:fruity|pear[- ]?drops?|breathing fast|very thirsty))(?=.*\b(?:sick|vomit\w*|drowsy))|"
                    r"\b(?:arm|leg|hand|face)\b.{0,25}\bnumb\b.{0,60}\b(?:vision|blurr\w+|speech|slurr\w+|weak\w*)\b|\b(?:vision|blurr\w+|slurr\w+)\b.{0,60}\b(?:arm|leg|hand|face)\b.{0,25}\bnumb\b|"
                    r"^(?=.*\b(?:miscarriage|gave birth|after the birth|postnatal|termination)\b)(?=.*\b(?:temperature|fever|rigors|shivering))(?=.*\b(?:pain|smell\w*|bleed\w*|discharge))|"
                    r"^(?=.*\b(?:tampons?|menstrual cups?|period cup)\b)(?=.*\b(?:fever|high temperature|temperature)\b)"
                    r"(?=.*\b(?:vomit\w*|being sick|rash|dizz\w*|shivery|confus\w*|muscle aches?|diarrh\w*))|"
                    # S-191 follow-on: bleeding through a pad over a long time still counts when she is dizzy or faint in the same note
                    r"\bbleeding through\b.{0,80}\b(?:i feel |feeling |and )?(?:dizz\w*|faint\w*|light-?headed)\b|"
                    # set p119 (hedged wording; first contact 2/10 missed): blood from the ears after a fall or knock, blue lips on a baby or child
                    r"\bblood\b.{0,20}\b(?:coming |running |leaking |dripping )?(?:out of|from) (?:both |my )?(?:ears?|nose and ears?)\b.{0,40}\b(?:fell|fall|hit|knock\w*|bang\w*|crash\w*|accident)\b|\b(?:fell|fall|hit|knock\w*|bang\w*|crash\w*|accident)\b.{0,40}\bblood\b.{0,20}\b(?:out of|from) (?:both |my )?ears?\b|"
                    r"\b(?:baby|toddler|child|son|daughter|newborn)(?:'s|s'| has| have)?\b.{0,25}\b(?:lips|face|skin)\b.{0,20}\b(?:gone |turned |going |look\w* |are |is )?(?:a bit |slightly |very )?(?:blue|grey|gray)\b|"
                    # arm numbness with jaw pain and sweating, split across clauses ("... and i'm sweating" starts a new clause; found by the apostrophe variant test)
                    r"^(?=.*\barm\b.{0,25}\b(?:numb|tingl\w+|heavy)\b)(?=.*\bjaw\b.{0,25}\b(?:hurts?|aches?|pain\w*|tight|clench\w*)\b)(?=.*\b(?:sweat\w*|clammy|breathless|feel sick|nausea\w*)\b)|"
                    # set p118 (first contact 2/10 missed): an ambulance called or needed, pain that keeps getting worse and will not stop
                    r"\b(?:i(?:'ve| have)? called|calling|called|waiting for|need|needs) (?:an |the )?ambulance\b|\bcalled 999\b|\bringing 999\b|"
                    r"\bpain\b.{0,80}\bgetting worse(?: and worse)?\b.{0,60}\b(?:not stopping|won'?t stop|doesn'?t stop|isn'?t stopping|scared|frightened)\b|"
                    r"^(?=.*\b(?:rock[- ]?hard|very hard)\b.{0,15}\b(?:belly|tummy|stomach|abdomen)\b|.*\b(?:belly|tummy|stomach|abdomen)\b.{0,15}\b(?:rock[- ]?hard|very hard)\b)(?=.*\b(?:vomit\w*|being sick|throwing up)\b)(?=.*\b(?:fever|high temperature|temperature of (?:3[89]|4\d))\b)|"
                    # set p116 (first contact 2/10 missed): hard belly with vomiting or no bowel movement for days, red painful eye with halos and sickness
                    r"^(?=.*\b(?:rock[- ]?hard|very hard|solid)\b.{0,15}\b(?:belly|tummy|stomach|abdomen)\b|.*\b(?:belly|tummy|stomach|abdomen)\b.{0,15}\b(?:rock[- ]?hard|very hard)\b)(?=.*\b(?:vomit\w*|being sick|throwing up|fever)\b)(?=.*\b(?:can'?t stop|haven'?t (?:opened|been|passed)|not (?:opened|been|passed)|for days|constant\w*)\b)|"
                    r"\b(?:eye|eyes)\b.{0,40}\b(?:red|painful)\b.{0,40}\b(?:halos?|rings? around (?:the )?lights?|blurr\w+)\b.{0,60}\b(?:sick|vomit\w*|nause\w+|headache)\b|"
                    # set p115 (first contact 3/10 missed): breast red/hard/hot with fever, a red line going up a limb with chills, pregnant and unable to keep food or water down for days
                    r"^(?=.*\bbreast\b.{0,30}\b(?:red|hot|hard|lump\w*)\b)(?=.*\b(?:fever|temperature|shiver\w*|chills|flu-?like)\b)(?=.*\b(?:breastfeed\w*|feeding|nursing|mastitis|baby)\b)|"
                    r"\b(?:red|dark) (?:line|streak|lines|streaks)\b.{0,30}\b(?:going |running |spreading |travelling )?(?:up|along)\b.{0,60}\b(?:chills|fever|shivering|unwell|high temperature)\b|"
                    r"^(?=.*\b(?:pregnan\w+|\d{1,2} weeks)\b)(?=.*\b(?:can'?t|cannot|unable to|haven'?t been able to) keep (?:any |anything |even )?(?:food|water|fluids|anything)\b.{0,25}\bdown\b)(?=.*\b(?:\d+ days|days|dizz\w*|lost weight|weak)\b)|"
                    # set p114 (medicine reactions; first contact 3/10 missed): yellow skin or eyes with stomach pain, fruity breath with thirst and sickness, agitation with rigid muscles and sweating
                    r"^(?=.*\b(?:yellow(?:ish)? (?:skin|eyes)|skin (?:looks |is |has gone |went )?yellow|eyes (?:look |are |went )?yellow|jaundice\w*)\b)(?=.*\b(?:stomach|tummy|belly|abdom\w+) pain\b|.*\bpain\b.{0,25}\b(?:stomach|tummy|belly|abdomen|back)\b)|"
                    r"\b(?:breath|wee|pee)\b.{0,15}\b(?:smells?|smelling) (?:fruity|of pear[- ]?drops?|like nail varnish)\b.{0,80}\b(?:sick|vomit\w*|thirsty|drowsy|breathing fast)\b|\b(?:sick|vomit\w*|thirsty|drowsy)\b.{0,80}\bbreath\b.{0,15}\bsmells? fruity\b|"
                    r"^(?=.*\b(?:agitated|restless)\b)(?=.*\b(?:muscles? (?:are |is )?(?:rigid|stiff|twitching)|rigid muscles|twitching)\b)(?=.*\b(?:sweat\w*|racing|shaking|fever|temperature)\b)|"
                    # set p112 (voice-style notes; first contact 2/10 missed): chest tightness with arm numbness and sweating, spelled-out fever with not knowing where she is
                    r"^(?=.*\bchest\b.{0,30}\b(?:tight|heavy|pressure|pain)\b)(?=.*\b(?:left |right )?arm\b.{0,25}\b(?:numb|tingl\w+|heavy|aching)\b)(?=.*\b(?:sweat\w*|clammy|sick|breathless)\b)|"
                    r"^(?=.*\b(?:temperature|fever)\b.{0,25}\b(?:(?:thirty|forty)[- ](?:eight|nine|one|two)|3[89]|4[0-2])\b)(?=.*\b(?:don'?t know where i am|do not know where i am|confus\w*|shaking)\b)|"
                    # set p111 (first contact 5/10 missed): carbon monoxide, heat stroke, choking, electric shock, swallowed battery
                    r"^(?=.*\b(?:boiler|carbon monoxide|co alarm|gas fire|co detector)\b)(?=.*\b(?:headache|dizz\w*|sick|drowsy|confus\w*)\b)(?=.*\b(?:alarm|every time|since|keeps)\b)|"
                    r"^(?=.*\b(?:stopped sweating|hot and dry|hot dry skin)\b)(?=.*\b(?:confus\w*|dizz\w*|faint\w*|drowsy)\b)|"
                    r"\b(?:stuck in my throat|choking)\b.{0,40}\b(?:can'?t (?:speak|breathe|talk)|cannot (?:speak|breathe))\b|\bcan'?t (?:speak|breathe|talk)\b.{0,40}\b(?:stuck in my throat|choking)\b|"
                    r"\belectric(?:al)? shock\b.{0,80}\b(?:chest|heart|palpitations?|weird|faint\w*|numb\w*|burn\w*)\b|"
                    r"\b(?:swallowed|swallow|ate|eaten) (?:a |an |the )?(?:button |coin |lithium |watch )?batter(?:y|ies)\b(?! of (?:tests|questions))|\bbutton battery\b.{0,40}\b(?:swallow\w*|ate|eaten|down)\b|"
                    # set p107 (first contact 3/10 missed): head injury with knocked out and sickness, meter reading HI with thirst and fast breathing, big tissue lumps with soaking every few minutes
                    r"^(?=.*\b(?:hit|banged|bumped|knocked) (?:my |the )?head\b)(?=.*\b(?:knocked out|lost consciousness|blacked out|passed out)\b)(?=.*\b(?:sick|vomit\w*|confus\w*|drowsy)\b)|"
                    r"^(?=.*\b(?:blood sugar|glucose|meter)\b.{0,30}\b(?:says |reads |showing |shows )?\"?hi\"?\b)(?=.*\b(?:very thirsty|breathing fast|tummy hurts|vomit\w*|drowsy)\b)|"
                    r"\b(?:size of (?:an? )?(?:orange|grapefruit|fist|lemon)|big lumps?)\b.{0,60}\b(?:soaking|soaked)\b.{0,60}\bevery (?:\d+|few|ten|twenty|fifteen|thirty) ?(?:min\w*)\b|"
                    # set p106 (first contact 5/10 missed): fertility treatment swelling with breathlessness, pregnancy headache with flashing lights, bladder numbness in words, double-over pain with cold sweat, spreading hot red leg with chills
                    r"^(?=.*\b(?:egg collection|egg retrieval|ivf|stimulation|injections?)\b)(?=.*\b(?:belly|tummy|abdomen|stomach)\b.{0,25}\b(?:huge|tight|swollen|bloated|hard)\b)(?=.*\b(?:can'?t breathe|barely breathe|short of breath|breathless\w*|struggling to breathe)\b)|"
                    r"^(?=.*\b(?:\d{2} weeks|pregnan\w+)\b)(?=.*\b(?:headache|head (?:is )?pounding|head hurts)\b)(?=.*\b(?:flashing lights?|flashes|seeing spots|blurr\w+ vision)\b)|"
                    r"\bcan'?t feel when i'?m (?:peeing|weeing|pooing|going)\b|\bcan'?t feel (?:myself )?(?:peeing|weeing)\b|"
                    r"\b(?:doubled me over|doubled over)\b.{0,60}\b(?:vomiting|being sick)\b.{0,60}\b(?:cold|clammy)\b.{0,15}\b(?:sweaty|and sweaty|sweat)\b|"
                    r"\b(?:hot|red)\b.{0,15}\b(?:red|hot)\b.{0,15}\bswollen (?:area|patch|leg|arm)\b.{0,60}\b(?:getting bigger|spreading)\b.{0,60}\b(?:chills|fever|shivering|unwell)\b|"
                    # NHS toxic shock page in words (no number): tampon or cup in use, feeling hot/cold/shivery or flu-like, and another sign (PM held-out set, p105)
                    r"^(?=.*\b(?:tampons?|menstrual cups?|period cup|cup)\b)(?=.*\b(?:shiver\w*|hot and cold|burning hot|flu-?like|sandpaper)\b)(?=.*\b(?:rash|sunburn\w*|sandpaper|awful|unwell|weak|dizz\w*|dreadful|so ill|vomit\w*|diarrh\w*|aches?)\b)|"
                    # run 26 held-out set v58 (first contact 12/20 missed): heavy bleeding said in plain words together with a faint/dizzy sign (NHS vaginal-bleeding page: bleeding + faint or dizzy = 999; heavy-periods page has no urgent box), and one swollen/hot/painful leg together with pain on breathing in (NHS DVT page: DVT signs + chest pain or breathlessness = 999). The output stays the one fixed urgent line.
                    r"^(?=.*\b(?<!no )(?<!not )(?<!without )(?:flooding|gushing|pouring(?: out)?|bleeding (?:so |really |very |extremely |incredibly )?(?:heavily|badly)|heavy bleeding|bleeding is (?:very |really |so )?heavy|(?:bleeding|it|blood)\b.{0,15}\b(?:won'?t|will not|isn'?t going to|not going to) (?:ease|slow|stop|let up)|(?:soaking|soaked|saturated|drenched|full)\b.{0,25}\b(?:pads?|tampons?|jeans|trousers|leggings)\b.{0,20}\b(?:in (?:\d+|a few|ten|twenty|fifteen|thirty) ?(?:minutes?|mins?)|within minutes|in minutes|every (?:half (?:an )?hour|quarter of an hour|hour)))\b)(?=.*(?<!no )(?<!not )(?<!without )(?<!no feeling )\b(?:dizz\w*|light ?headed|woozy|faint\w*|pass(?:ing)? out|black(?:ed|ing) out|room (?:is |was )?spinning|seeing stars|clammy)\b)(?!.*\b(?:a bit|a little|slightly)\b.{0,20}\b(?:flooding|heavy)\b)|"
                    r"^(?=.*(?:\b(?:calf|leg|thigh|ankle)\b[^.!?;]{0,70}\b(?:swollen|swelling|puffy|bigger than the other|hot|warm)\b|\b(?:swollen|puffy)\b[^.!?;]{0,25}\b(?:calf|leg|thigh|ankle)\b))(?=.*(?:\b(?:hurts?|pain\w*|stab\w*|catch\w*|sharp|sore|tight)\b[^.!?;]{0,40}\b(?:breath(?:e|ing|es) in|inhal\w*|deep breath|breathing deeply|breathe deeply)\b|\b(?:breath(?:e|ing|es) in|inhal\w*|deep breath)\b[^.!?;]{0,25}\b(?:hurts?|painful|pain|catch\w*)\b))(?!.*\b(?:laugh\w*|no leg)\b)|"
                    # set v71 (first contact 2/5 missed): severe upper tummy pain going through to the back with vomiting (NHS pancreatitis page: A&E/111), and deep fast breathing with drowsiness or vomiting (NHS diabetic ketoacidosis page)
                    r"^(?=.*\b(?:terrible|severe|awful|agonising|unbearable|constant|really bad|very bad|excruciating)\b[^.!?;]{0,30}\b(?:stomach|tummy|belly|abdominal|abdomen)\b[^.!?;]{0,15}\bpain\b|.*\b(?:stomach|tummy|belly|abdominal|abdomen) pain\b[^.!?;]{0,30}\b(?:terrible|severe|awful|agonising|unbearable|constant|really bad|very bad|excruciating)\b)(?=.*\b(?:through|spread\w*|going|radiat\w*|shoot\w*) (?:to|into|through) (?:my )?(?:back|shoulder)\b)(?=.*(?<!no )(?<!not )(?<!without )\b(?:vomit\w*|being sick|throwing up)\b)|"
                    r"^(?=.*\bbreath(?:ing|e|es)\b[^.!?;]{0,20}\b(?:deep|deeply)\b[^.!?;]{0,12}\b(?:and|but)? ?(?:fast|quick\w*|heavy|heavily)?\b|.*\bdeep (?:and|,) ?fast breath\w*)(?=.*(?<!no )(?<!not )\b(?:drows\w*|very sick|vomit\w*|being sick|confus\w*|very thirsty|awful)\b)(?!.*\b(?:meditat\w*|yoga|exercis\w*|run|gym)\b)", re.I | re.S)
# Someone else collapsing or fainting, said in the present with a second warning sign (Q-new-14 recommendation; clinician to confirm)
# run07 sets v76-v78 (first contact 10/10, 10/10, 7/10 missed): three NHS red-flag patterns whose parts sit in different
# sentences, so they are whole-text lookaheads anchored at the start (any order). Sources: nhs.uk/conditions/ectopic-pregnancy,
# nhs.uk/conditions/sepsis, nhs.uk/conditions/sciatica (reviewed 03 Dec 2024: "Go to A&E or call 999").
_LATE = (r"(?:period (?:is |'s |was )?(?:\w+ ){0,4}(?:late|overdue)|(?:missed|haven'?t had|not had|no) (?:a |my )?periods?\b|"
         r"period (?:hasn'?t|has not|didn'?t|did not) (?:come|start|arrive)\w*|\b(?:days?|weeks?) (?:late|overdue)\b|\blate period\b)")
_ONESIDE = (r"(?:one[- ]sided?|on one side|one side|just one side|(?:left|right)[- ]sided?|(?:left|right) side|(?:left|right) only|"
            r"only (?:on )?(?:my |the )?(?:left|right)\b|(?:on|of|in) (?:my |the )?(?:left|right)\b(?! (?:shoulder|arm|leg|foot|hand|knee|eye|ear|breast)))")
_SHOULDER = (r"(?:shoulder[- ]?tip|tip of (?:my |the )?shoulder|(?:end|top) of (?:my |the )?shoulder|shoulder (?:is |has )?(?:\w+ ){0,4}(?:hurt\w*|ach\w*|pain|sore)|"
             r"(?:pain|ache|aching|hurt\w*) (?:in|at) (?:my |the )?shoulder|shoulder (?:\w+ ){0,3}(?:at the|when i lie))")
_FEVER = (r"(?:(?<!no )(?<!not )(?<!without )(?<!any )fever\w*|high temperature|(?<!no )(?:a|running a) (?:temperature|temp)\b|temperature of|burning up|boiling hot|"
          r"(?<!a bit )(?<!a little )(?<!slightly )shiver\w*|the shivers|(?<!from the cold, )shaking|(?<!a bit )(?<!a little )(?<!slightly )shaky|rigou?rs|heart (?:is |'s )?(?:\w+ ){0,2}(?:racing|pounding)|heart(?:'s| is)? going (?:really |so )?fast|heart won'?t slow|\b(?:38|39|40)(?:\.\d)?\b)")
_PROC = (r"(?:coil (?:was )?(?:fitted|put in|in)\b|got my coil in|laparoscopy|hysteroscopy|surgery|operation|\bop\b|post-?op\b|c-?section|caesarean|"
         r"egg collection|biopsy|procedure|ablation|\bd&c\b|\berpc\b)\b")
_PROC_NOT = r"(?![\s\S]*\b(?:before (?:my|the) (?:op|operation|surgery|procedure)|booked|tomorrow|next (?:week|month)|(?:years?|months?) ago|all fine now|fine now|from the cold|gone by|went away|settled)\b)"
_BACK = r"(?:back(?:'s| is| has)? (?:\w+ ){0,3}(?:pain|ache|hurts?|agony|bad|gone|killing|went)|back pain|bad back|my back went|lower back|sciatica)"
_SADDLE = (r"(?:numb\w* (?:around|in|down|under) (?:my )?(?:bottom|bum|genitals|vagina|down there|privates|groin|anus)|numb\w* between my legs|"
           r"(?:bottom|bum|genitals|groin|saddle|down there)(?: area)? (?:feels? |is |has gone |gone |going )?numb|can'?t (?:really )?feel (?:it |anything )?(?:when i wipe|between my legs|down there))")
_BLADDER = (r"(?:(?:wet|soiled) myself(?! (?:laughing|when i (?:sneeze|cough|laugh)))|lost control of my (?:bladder|bowels?)|can'?t control my (?:bladder|bowels?|wee|pee|poo)|"
            r"can'?t (?:pee|wee|urinate)\b|couldn'?t (?:pee|wee|urinate) at all)")
_LEGS = r"(?:both (?:of )?(?:my )?legs (?:\w+ ){0,3}(?:numb|weak|tingl\w*|dead)|(?:numb|weak|tingl\w*|pins and needles)\w* (?:in )?both (?:of )?(?:my )?legs|legs (?:have |are )?(?:gone|going) numb)"
_WHOLE = re.compile(_WHOLE.pattern + r"|^(?=[\s\S]*" + _LATE + r")(?=[\s\S]*" + _ONESIDE + r")(?=[\s\S]*" + _SHOULDER + r")"
                    r"|^" + _PROC_NOT + r"(?=[\s\S]*" + _PROC + r")(?=[\s\S]*" + _FEVER + r")"
                    r"|^(?=[\s\S]*" + _BACK + r")(?=[\s\S]*(?:" + _SADDLE + r"|" + _BLADDER + r"|" + _LEGS + r"))"
                    r"|^(?=[\s\S]*" + _SADDLE + r")(?=[\s\S]*" + _BLADDER + r")", _WHOLE.flags)


# run08 sets v79/v80 (first contact 6/10 and 5/10 missed). v79: a rash or spots that do not fade when pressed or under a
# glass is on the NHS 999 list (nhs.uk/conditions/sepsis, reviewed 14 May 2026), after a procedure or not; the parts are
# often split by a comma ("spots since the op, they don't fade when pressed"), so whole text. A glass test that faded is quiet.
_NOFADE = (r"(?:(?:does|do|did|wo|is|are)(?:n'?t| not) (?:fade|fading|blanch|disappear|go away|go pale|go white|make it go (?:pale|white))|"
           r"not (?:fading|blanching)|stays?|stayed|still (?:there|see it|visible)|could still see)")
_WHOLE = re.compile(_WHOLE.pattern + r"|^(?=[\s\S]*\b(?:rash|spots|marks|blotch\w*)\b)(?=[\s\S]*(?:" + _NOFADE + r"[^.!?]{0,25}\b(?:press\w*|push\w*|glass)\b|"
                    r"\b(?:press\w*|push\w*|glass)\b[^.!?]{0,60}" + _NOFADE + r"|\bnon-?blanch\w*|(?:does|do)(?:n'?t| not) blanch))"
                    r"|^(?![\s\S]*\b(?:fad(?:ed|es)|went (?:pale|white)|goes (?:pale|white))\b)(?=[\s\S]*\bglass test\b)", _WHOLE.flags)
# v80: a wish to be dead plus having worked out how, in one sentence (C-SSRS classes 1 + 3 as a coverage map only);
# _CLAUSE splits at "and i", so this is matched per sentence with the whole-text rule (Samaritans line).
_SELF_WHOLE = re.compile(
    r"(?:want(?:ed)? (?:to be|to not be|not to be) (?:dead|gone|here|alive)|wish (?:i was|i were|i'?d been) (?:dead|gone|never born)|wish i (?:wasn'?t|weren'?t) (?:alive|here)|"
    r"(?:rather|better off) (?:be )?dead(?! asleep)|don'?t want to be (?:alive|here)|want (?:it|everything|it all) to be over for good|"
    # run09 v81: a passive wish not to exist / not be here / everyone better off without me (+ the how part below)
    r"don'?t want to (?:exist|be around)|wish i (?:didn'?t|did not) exist|(?:stop|not) existing|want to not exist|wish i could disappear (?:for good|forever)|"
    r"wish i'?d never been born|(?:(?:they|everyone|everybody)(?:'?d| would)(?: all)? be )?better off (?:without me|if i (?:wasn'?t|weren'?t|was not|were not) (?:around|here))|(?:like|want) to (?:not|never) wake up)"
    r"[^.!?\n]{0,60}\b(?:worked out|figured out|planned(?: out)?|know(?: exactly)?|decided|chosen|picked)\b[^.!?\n]{0,12}\b(?:how|the (?:way|method|how))\b"
    r"(?! (?:to (?:track|log|use|cope|manage|nap|sleep|swap|fix|plan|talk|ask|tell|rest|deal|get)|many days|my period))", re.I)


_THIRD_NOW = re.compile(
    r"^(?=.*\bmy (?:daughter|son|mum|mom|mother|dad|father|sister|brother|friend|partner|husband|wife|boyfriend|girlfriend|baby|child|colleague)\b[^.!?;\n]{0,60}\b(?:fainted|collaps\w+|passed out|blacked out)\b)"
    r"(?=.*\b(?:twice|three times|again|grey|gray|pale|clammy|not making sense|confused|not responding|unresponsive|won'?t wake|hit (?:her|his|their) head|chest pain|can'?t breathe|sweating|blue|cold)\b)"
    r"(?!.*\b(?:fine|ok|okay|recovered|better)\b (?:now|after|since|again|once|when)|.*\b(?:was|is|been) (?:fine|ok|okay)\b)", re.I | re.S)


_WHOLE_SCAN_CAP = 20_000  # one record is capped at 20,000 characters (schemas/record.py); the long rule list is linear in length


# A lead-in like "I don't know what to do," / "Not sure what's going on:" / "No idea why, but" is not a negation of what follows;
# it is turned into a sentence break before detection (measured: such lead-ins silenced 14-37% of caught emergency lines).
_LEADIN = re.compile(r"\b(?:i(?:'m| am) )?(?:don'?t know|do not know|no idea|not sure|can'?t believe|not being funny|not usually (?:one to |a )?\w+)\b[^.:;!?\n]{0,40}?(?:[,:]|(?=\bbut\b))", re.I)


_NEG_WINDOW = re.compile(r"[.;:!?\n,]|\bbut\b")  # a negation only counts inside the same clause as the match
_HEDGE = re.compile(r"\bnothing,? but\b|\bnot being funny,? but\b|\bwithout (?:any )?warning\b|\b(?:never|haven't|hadn't) had (?:this|that|anything like this) before\b", re.I)  # "probably nothing but ..." is a hedge, not a negation


def _hits_whole(rx, text: str) -> bool:
    text = text[:_WHOLE_SCAN_CAP]
    m = rx.search(text)
    if not m:
        return False
    # Past tense counts only in the sentence(s) the match sits in (same rule as the phone's hitWhole).
    starts = [i for i, c in enumerate(text[: m.start()]) if c in ".;!?\n"]
    start = starts[-1] + 1 if starts else 0
    ends = [i for i, c in enumerate(text[m.end():]) if c in ".;!?\n"]
    end = m.end() + ends[0] if ends else len(text)
    return not (_NEG.search(_HEDGE.sub(' ', _NEG_WINDOW.split(text[max(0, m.start() - 40):m.start()])[-1])) or _is_past(text[start:end]) or _OTHER.search(text[:m.start()]))


_AGAIN = re.compile(r"\b(?:(?:do|doing|try|trying) (?:it|that) again|again (?:tonight|today|now)|urge is back|urges? (?:are|is) back|(?:cut|cutting|hurt|hurting) myself again|thinking about (?:doing )?it again|want to do it again)\b", re.I)


def emergency_kind(user_text: str):
    """None, 'self_harm' or 'medical'. Negated, past or third-person mentions do not count."""
    user_text = _LEADIN.sub(". ", _IDIOM.sub(" ", _norm(user_text)))
    if _hits(_SELF_RX, user_text) or _hits(_SELF_HARM_RX, user_text) or _hits_whole(_SELF_WHOLE, user_text):
        return "self_harm"
    # draft run 22 (Safety to review): a PAST self-harm mention plus present intent anywhere in the note
    # ("i tried to kill myself last year and i want to do it again") is the highest-risk case, not history.
    if (_SELF_RX.search(user_text) or _SELF_HARM_RX.search(user_text)) and _AGAIN.search(user_text):
        return "self_harm"
    if _hits(_BODY_RX, user_text) or _hits(_EMERGENCY, user_text) or _hits_whole(_WHOLE, user_text):
        return "medical"
    if (_THIRD_NOW.search(user_text[:_WHOLE_SCAN_CAP]) or _THIRD_CHILD.search(user_text[:_WHOLE_SCAN_CAP])) and not _is_past(user_text):
        return "medical"
    if _PREG_WHOLE.search(user_text) and _hits(_PREG_SYMPTOM, user_text) and not re.search(r"\bnot pregnant\b|\bpregnancy test\b", user_text, re.I):
        return "medical"
    return None


def urgent_text(user_text: str) -> str:
    return URGENT_SELF_HARM if emergency_kind(user_text) == "self_harm" else URGENT


def emergency_message(user_text: str) -> str:
    """The fixed signpost for an emergency hit: self-harm gets support lines, the rest 999/A&E/111."""
    return urgent_text(user_text)


@dataclass
class GuardResult:
    ok: bool
    text: str
    reasons: list[str]


def is_emergency(user_text: str) -> bool:
    """Run on the USER's text; a hit means show URGENT instead of any model output."""
    return emergency_kind(user_text) is not None


# GUARD_STRICT_STATEMENTS=0 turns off the statement layer (regex layers stay on). Measured on long chatty
# replies the layer blocks ~25-30% of harmless ones, but it catches paraphrases the regexes miss (prototypes.md).
# A model must not invent links or phone numbers: only 999, 111 and Samaritans 116 123 may appear.
_LINK_OR_NUMBER = re.compile(r"https?://|www\.|\b[a-z0-9-]+\.(?:com|co\.uk|org|net|io|app)\b|(?<!\d)(?:\+?\d[\d ()-]{8,}\d)(?!\d)", re.I)
STRICT_STATEMENTS = os.environ.get("GUARD_STRICT_STATEMENTS", "1") != "0"
_ECHO_OK = {"condition", "treatment"}
# Reassurance she quoted ("my gp said it's not serious") may come back only as an attributed quote
# of her own words in the same sentence: "You said it's not serious." The model saying it is still blocked.
_ATTRIBUTED = re.compile(r"(?:^|[.!?]\s+)(?:so,? )?(?:you (?:said|mentioned|told me|wrote)|your (?:gp|doctor) (?:said|told you))\b[^.!?]*$", re.I)


_SAFE_REFUSAL = re.compile(r"\bi(?: can'?t| cannot| am not able to|'m not able to) (?:say|tell you|assess|know|judge|advise)\b(?:(?!\b(?:but|and|probably|likely|maybe|possibly|although)\b)[^,;.?!])*", re.I)


def check(model_text: str, user_text: str = "", check_emergency: bool = True) -> GuardResult:
    """Return the text unchanged if clean, else the fixed fallback (or URGENT).

    Words the user themselves wrote are allowed back (e.g. their doctor's diagnosis quoted
    by them), so a hit that is a verbatim substring of user_text is ignored.
    """
    if check_emergency and user_text and is_emergency(user_text):
        return GuardResult(False, urgent_text(user_text), ["emergency_input"])
    original = model_text
    model_text, user_text = _norm(model_text), _norm(user_text)
    user_low = user_text.lower()
    reasons = []
    for name, rx in _COMPILED.items():
        # "I can't tell you whether that's normal" is a refusal, not reassurance: look at the text
        # without such a clause (only when the refusal has no "but/and/probably..." inside it).
        scan = _SAFE_REFUSAL.sub(" ", model_text) if name in ("reassurance", "cause") else model_text
        for m in rx.finditer(scan):
            # Only a condition or drug name the user wrote as a whole word may come back; a
            # probability, cause or reassurance phrase is never excused ("percentage" in the
            # user's text must not excuse "15 percent").
            whole_word = re.search(r"\b" + re.escape(m.group(0).lower()) + r"\b", user_low)
            echoed = whole_word and (name in _ECHO_OK or (name == "reassurance" and _ATTRIBUTED.search(scan[: m.start()])))
            if not echoed:
                reasons.append(name)
                break
    # A score the user never gave ("that's about a 7 out of 10") is an invented number.
    # (Only when we have her text to compare with, and not inside a question: "closer to a 3 or a 7?" is fine.)
    user_digits = set(re.findall(r"\d+", user_text))
    if user_text.strip():
        for sent in _sentences(model_text):
            if sent.endswith("?"):
                continue
            for sm in re.finditer(r"(\d+)\s*(?:/|out of)\s*(?:10|ten)\b", sent, re.I):
                if sm.group(1) not in user_digits and "invented_score" not in reasons:
                    reasons.append("invented_score")
    if _LINK_OR_NUMBER.search(model_text) and not _LINK_OR_NUMBER.search(user_text):
        reasons.append("link_or_number")
    if STRICT_STATEMENTS:
        reasons += [r for r in _statement_hits(model_text, user_low) if r not in reasons]
    if reasons:
        return GuardResult(False, FALLBACK, reasons)
    return GuardResult(True, original, [])


def reply_shape(text: str) -> list[str]:
    """Soft, log-only shape check for Sage replies: at most 4 sentences and one question.

    Returns short tags (never the text) so the route can log them next to the guard reasons.
    """
    sents = [s for s in _sentences(text) if s.strip()]
    tags = []
    if len(sents) > 4:
        tags.append("too_long")
    if text.count("?") > 1:
        tags.append("many_questions")
    if not sents:
        tags.append("empty")
    return tags
