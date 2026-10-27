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
    r"^(?:what i can do is (?:write|turn|put|note|keep|add|record|help)|it makes sense to (?:mention|tell me|bring up|note|add)|if (?:it helps|you want|you(?:'d| would) like|you tell me [^,]{1,40}),? i(?:'ll| will| can) (?:add|note|put|write|keep|record|help)|i believe (?:you|what you)|no,? i can'?t\b|i(?:'m| am) not going to (?:read|guess|judge|say)|that sounds like (?:a |an )?(?:\w+ ){0,2}wait|noted:|there(?:'s| is) no (?:right answer|need to (?:decide|rush|answer|explain|have it all))|"
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
_PLAIN_SAFE = re.compile(r"\b(?:if (?![^.]*\b(?:likel\w*|probabl\w*|usually|just|normal|nothing|hormon\w*|stress)\b)[a-z ,'&]{0,80}?\b(?:severe|sudden|faint|frightened|scared|unwell|dizzy|sick|worse|act on (?:these|those) (?:feelings|thoughts))\b[a-z ,']{0,30}?,? (?:please )?(?=(?:call|ring|go to) )|if you might act on (?:these|those|the) (?:feelings|thoughts)|(?:please get support right now: )?call samaritans(?: free)?(?: on 116 123)?|(?:if (?:it'?s|it is|it gets|the pain (?:is|gets)) (?:very |really )?(?:severe|sudden|unbearable|worse)(?:,? (?:or )?(?:sudden|severe))?(?:,? or you(?:'re| are) (?:frightened|scared|worried)(?: right now)?)?,? |if you(?:'re| are) (?:worried|unsure|frightened|scared),? )?(?:please )?(?:call 999|go to a&e|call 111|ring 111|speak to your gp|see your gp|contact your gp)|(?:a |your )?(?:pharmacist|gp|doctor)(?: or (?:a |your )?(?:pharmacist|gp|doctor))? can help|if you(?:'re| are) unsure about what to take,? |(?:it'?s |it is )?worth (?:telling|mentioning|showing|asking) (?:your |a )?(?:doctor|gp|pharmacist|nurse)|(?:don'?t|wouldn'?t) want to guess|(?:wouldn'?t|isn'?t) (?:be )?right for me to guess)", re.I)
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
    r"can help|improves?|works?|wonders?|normal\w*|heat\w*|compress\w*|packs?|lie down|better|baths?|reduces?|reaction|take care|painkillers?|antibiotics?|tablets?|pills?|frequently|commonly|complaint|reliev\w*|swear|heal\w*|ease|treat\w*|cure|explanation|benefit|down to|worth|no need|end up|i'?d say|nothing at all|by itself|"
    r"noticeable|difference|normally|calm\w*|helps?|\d+\s?%|\d+ in \d+|definitely|certainly|absolutely|safely|ignore|scores?|risks?|caus\w+|confident|sure|certain|convinced|believe|reckon|think|fairly|you(?:'re| are) (?:fine|ok|okay|alright|safe))\b|^(?:yes|no|nope|yep|try|avoid|take|use|eat|drink|consider|cut|stop|start|apply|rest)\b|%",
    re.I,
)
_MAX_PLAIN_WORDS = 14
_PLAIN_CLAUSE = re.compile(r"[,;:]|\b(?:and|or|but|so)\b", re.I)



_HOMOGLYPHS = str.maketrans({"а": "a", "е": "e", "о": "o", "р": "p", "с": "c", "х": "x", "у": "y", "і": "i", "ѕ": "s", "ԁ": "d",
                             "ο": "o", "ρ": "p", "α": "a", "ε": "e", "ι": "i", "κ": "k", "ν": "v", "τ": "t", "υ": "u"})
# Phone keyboards type curly apostrophes (can’t); the patterns use the straight one.
_QUOTES = str.maketrans({"\u2018": "'", "\u2019": "'", "\u02bc": "'", "\u2032": "'", "\u201c": '"', "\u201d": '"'})
_LEET = {"0": "o", "1": "i", "3": "e", "4": "a", "5": "s", "@": "a", "$": "s"}


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
    # dictation fillers ("um i cant like breathe") and "wanna"/"gonna"
    t = re.sub(r"\b(?:um+|uh+|erm|er|hmm+)\b[ ,]*", "", t, flags=re.I)
    t = re.sub(r"\b(i|it|they|cant|can't|wont|won't|dont|don't|is|am|are|was)\s+like\s+", r"\1 ", t, flags=re.I)
    t = re.sub(r"\bwanna\b", "want to", t, flags=re.I)
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


def _statement_hits(model_text: str, user_low: str = "") -> list[str]:
    reasons = []
    for sent in _sentences(model_text):
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
        ul = user_low if re.match(r"(?:so|you)\b|noted\b|i(?:'ve| have) (?:noted|added|recorded|logged|put)\b", sent, re.I) else ""
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
_PAST = re.compile(r"\b(?:(?:years?|months?|weeks?) ago|a (?:while|long time) ago|ages ago|(?:19|20)\d\d|(?<!since )last (?:year|decade|month|week)|as a (?:teen\w*|child)|used to|in the past|back then|when i was (?:a )?(?:teen\w*|kid|child|younger))\b", re.I)
_OTHER = re.compile(r"\b(?:my (?:sister|mum|mom|friend|mother|dad|brother|colleague|daughter)|she|he|they|her|his|their)\b", re.I)
_BODY = [
    r"can'?t (?:breathe|catch my breath|get (?:any )?air)", r"struggling to breathe", r"chest (?:pain|is tight|tightness|hurts?)",
    r"(?:tight|crushing) chest", r"faint(?:ed|ing)?", r"passed out|blacked out|black(?:ing)? out", r"collaps\w+",
    r"going to (?:pass out|collapse|faint)", r"fell over", r"everything (?:went|goes|turned) (?:black|dark|grey|gray|white)", r"woke (?:up )?on the floor",
    r"gushing", r"in agony", r"(?:so|too) much blood|blood (?:is )?(?:running|pouring|dripping) down", r"(?:chest|heart).{0,35}(?:squeezed|crushed|gripped|vice)|squeez\w+ (?:my )?chest",
    r"(?:swallowed|downed|took) (?:a whole|an entire|all (?:of )?the|a packet|a box|loads of).{0,30}(?:tablets|pills|packet|paracetamol|medication)", r"can'?t (?:straighten|stand|walk|move)",
    r"can'?t get enough air|wheez\w+.{0,30}(?:panic|air|breath)", r"off the scale|pain.{0,30}(?:ten|10) out of (?:ten|10)", r"lost (?:so |a lot of |too )?much blood|lost a lot of blood", r"can'?t get my breath|gasping|heart is (?:pounding|racing).{0,40}breath",
    r"agoni[sz]ing|doubled over", r"soaked .{0,15}(?:pads?|tampons?).{0,25}(?:half an hour|an hour|\d+ minutes)",
    r"passing (?:huge|big|large) clots", r"too many (?:pills|tablets)", r"(?:pad|tampon|towel)s? (?:is|are|was|were) (?:full|soaked|saturated) in (?:\d+ (?:minutes|mins)|an? (?:hour|few minutes))",
    r"(?:bleeding|soaking|through) .{0,30}(?:under|less than|within) (?:an|one) hour", r"can'?t stop (?:the )?bleeding", r"bleeding .{0,30}(?:won'?t|will not) stop", r"losing (?:a lot of|so much|too much) blood", r"breathing (?:very|really|so) (?:fast|quickly|rapidly)|(?:not|n[o']t|isn[o']t) making (?:any )?sense|(?:rash|spots|marks)[^.]{0,30}(?:does ?n[o']?t|do ?n[o']?t|won'?t|will not) fade[^.]{0,20}press|blotchy (?:skin|lips|tongue)|(?:skin|lips|tongue)[^.]{0,15}blotchy|\bsepsis\b|septic", r"(?:rash|spots?|marks?) (?:that )?(?:does ?n[o']?t|do ?n[o']?t|won'?t|will not) (?:fade|go|disappear)[^.]{0,30}glass|glass test|sandpaper[- ]?(?:like )?rash|bright red (?:palms|soles|tongue)", r"(?:toilet|bowl)(?: water| bowl)? (?:turned|went|was|is|looked|looks) (?:bright |dark )?red|red (?:toilet|bowl) water|(?:toilet|bowl) (?:was |is )?(?:full of|filled with|covered in) blood|blood (?:filled|filling|covered) the (?:toilet|bowl)|(?:lots?|loads) of blood in the (?:toilet|bowl)",
    r"(?:trouble|difficulty|hard to|struggling to) breath\w*", r"pressure in (?:my )?chest", r"(?:gonna|going to|about to) (?:be sick and )?pass(?:ing)? out", r"(?:non[- ]?stop|constant\w*) bleeding|bleeding (?:non[- ]?stop|constantly|for (?:\d+|three|four|a few) weeks)",
    r"seizure|convuls\w+|fitting\b", r"(?:feel|feels|feeling) like (?:i'?m |i am )?(?:dying|i'?m going to die)", r"can'?t (?:wake|rouse) (?:my|him|her|them|the)\b",
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
    r"soaking (?:through )?(?:a |my |an? )?(?:pad|tampon|towel|clothes)s?(?: (?:an|every|each) hour)?",
    r"(?:pad|tampon)s? (?:every|each|an) hour", r"(?:changed|changing) (?:my )?(?:pad|tampon)s? (?:\w+ times )?(?:in|every|each) (?:an|one|half an) hour",
    r"blood everywhere", r"(?:very |really |so |extremely )?heav(?:y|ily) bleeding", r"bleeding (?:really |very |so )?heav(?:y|ily)",
    r"bleeding (?:a )?(?:huge|massive|lot|loads)", r"clots (?:the size|as big|bigger)(?!(?: of)? (?:a |an )?(?:\d+p|£\d|pound coin|pea|peas|penny|coin|grape)\b)", r"severe (?:sudden )?(?:pain|belly|abdominal|pelvic)",
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
    r"(?:rather|better off) (?:be )?dead|wish (?:i was|i were|i could be) dead|(?:life (?:isn'?t|is not) worth living|not worth living|done with (?:life|living)|no reason to (?:live|go on))",
    r"nobody would (?:notice|miss me)\b.{0,30}(?:disappear\w*|gone|died?)|(?:going to|gonna|about to) jump\b",
    r"(?:thinking (?:about|of)|want(?:ing)? to) taking (?:all|every)\b.{0,20}(?:tablets|pills|medication|painkillers)",
    r"(?:not|won'?t|n't) (?:going to )?wake up (?:tomorrow|again)|(?:don'?t|do not) want to wake up",
    r"suicid\w+", r"kill(?:ing)? (?:myself|me)", r"(?:want|wants|need) (?:it|this|everything|things) (?:all )?to (?:stop|end)",
    r"end(?:ing)? things", r"(?:took|taken|taking) (?:a load|lots|too many|an overdose)\b.{0,30}(?:tablets|pills|paracetamol)|overdos\w+",
    r"(?:tablets|pills).{0,30}don'?t care what happens", r"self[- ]harm\w*", r"(?:want|wanna|going) to die", r"\bwa+nn?a+ (?:to )?die\b", r"\bsuic?[ci]de\b|\bsucid\w*", r"\bkil (?:myself|me)\b", r"(?:got|have|took|taken) the (?:tablets|pills) out|(?:looking|staring) at (?:the|my) (?:tablets|pills)", r"(?:took|taken|swallowed) too many (?:pils|pilss|tabs|tablits)\b", r"end(?:ing)? it all",
    r"end(?:ing)? my (?:own )?life", r"(?:don'?t|do not) want to be (?:alive|here)(?: anymore| any more)?", r"hurt(?:ing)? myself",
    r"cutting myself|(?:been|keep|kept|started) cutting\b|cutting again", r"(?:want|wanna) to (?:just )?disappear(?: forever)?", r"better off (?:dead|without me)", r"take my own life",
    r"(?:took|taken|swallowed) all (?:of )?(?:my|the) (?:paracetamol|tablets|pills|painkillers|medication)", r"(?:sleep|asleep|bed).{0,25}(?:never|not) (?:wake|waking) up", r"(?:no|any) reason to (?:keep )?(?:living|live|go on)(?! (?:in|at|with|near)\b)|don'?t see any (?:reason|point) (?:to|in) (?:keep )?(?:living|live|go on|going on|carry on|carrying on)",
    r"(?:thought|thinking) about not being here|not being here (?:any ?more|at all)", r"better off (?:if i (?:was|were) (?:gone|dead)|without me)", r"written (?:a |some )?(?:notes?|letters?)\b.{0,25}\b(?:family|mum|mom|partner|everyone|goodbye)|goodbye (?:note|letter)", r"(?:can\'?t|cannot|don\'?t) see (?:a|any) way (?:out|forward|through)", r"(?:scratch\w*|cutting|cut|burning|hitting|hurting) (?:my |at my )?(?:arms?|legs?|thighs?|wrists?|myself)\b.{0,30}\b(?:bleed\w*|blood|raw)", r"\b(?:everything|it all|my life|the pain and everything) (?:to )?(?:end|be over|stop) for good\b", r"no point (?:in )?(?:carrying on|going on|living|continuing)\b", r"unaliv\w*", r"\bkms\b", r"(?:don'?t|do not|no longer) see the point (?:in )?(?:going on|living|being here|anything|carrying on)", r"thinking (?:about|of) ending it\b", r"no point (?:in )?(?:going on|living|being here)",
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
    r"(?:took|taken|swallowed) (?:too many|a lot of|all (?:my|the)) (?:pills|tablets|painkillers))\b",
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
    r"can'?t breathe?|can'?t breath\b|can'?t (?:catch|get) (?:my|a) breath|struggling to breathe|chest pain|coughing up blood|"
    r"faint(?:ed|ing)?|passed out|passing out|(?:going|about) to pass out|blacked out|black(?:ing)? out|collaps\w+|"
    r"soaking (?:a |through (?:a )?)?pads? (?:an|every|each) hour|"
    r"bleeding (?:through|heavily|badly)|(?:very |really |so )?heavy bleeding|bleed\w* heavi?l+y|bleeding (?:really |very |so )(?:heavily|badly)|"
    r"severe (?:sudden )?(?:\w+ ){0,2}pain|worst pain|unbearable pain|excruciating|in agony|agony|gushing blood|pool of blood|(?:can'?t|can hardly|hardly) breathe?|"
    r"worst (?:pain )?(?:i'?ve|i have) ever|pain so bad|(?:big )?clots? (?:the size of|bigger than)(?!(?: of)? (?:a |an )?(?:\d+p|£\d|pound coin|pea|peas|penny|coin|grape)\b)|pain (?:is |was )?unbearable|pain (?:is |was )?(?:a )?(?:10|ten)(?:/| out of )10|"
    r"sudden (?:sharp |stabbing )?pain|\bi(?:'?m| am| think i'?m)? (?:\w+ ){0,3}miscarr\w+|"
    r"pregnan\w+ and (?:bleeding|pain|cramp\w*)|(?:i'?m|i am|am) pregnant.{0,40}(?:bleeding|pain|cramp\w*)|"
    r"(?:cannot|can not|hard to|hardly able to) breathe?|short(?:ness)? of breath|chest (?:is )?(?:feels? )?tight\w*|"
    r"(?:can'?t|cannot|won'?t|will not|doesn'?t|isn'?t|not) (?:stop|stopping) bleeding|bleeding (?:won'?t|will not|doesn'?t|isn'?t|is not) (?:stop|stopping)|"
    r"(?:blood|bleeding) everywhere|bleeding.{0,40}pregnant|"
    r"(?:bled|soaked|soaking) through (?:two|three|four|five|several|a few|multiple|[2-9]|\d\d) (?:pads?|tampons?|towels?)(?: \w+){0,3} (?:in|within) (?:an? |one |two |half an |1 |2 )?(?:hours?|\d+ minutes?)|blood (?:is )?pouring|"
    r"(?:elephant|weight|something heavy|brick|rock).{0,25}(?:on|sitting on) (?:my )?chest|chest.{0,20}like (?:an? )?(?:elephant|weight|brick|vice|rock)|(?:sitting|standing|pressing) on (?:my )?chest|"
    r"clots? (?:as (?:big|large) as) (?:a |an )?(?:orange|lemon|apple|fist|golf ball|tennis ball|egg|plum)|"
    r"(?:vomit\w*|throwing up|being sick|sick|coughing) (?:up )?blood|(?:lips|fingers).{0,30}\b(?:turning|turned|gone|going) blue\b|\bblue lips\b|"
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
_PRESENT = re.compile(r"\b(?:is|are|have|has|now|still|currently|today)\b", re.I)


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
            if _NEG.search(before[-40:]) or _is_past(clause) or _OTHER.search(before) or _RESOLVED.search(after):
                continue
            return True
    return False


_PREG_WHOLE = re.compile(r"\bpregnan\w+\b", re.I)
_PREG_SYMPTOM = re.compile(r"\b(?:bleeding|spotting|cramps? (?:are |is )?(?:getting )?worse|severe|sharp pain|one-sided)\b", re.I)


# "the pain was killing me" describes pain, it is not a statement about self-harm.
_IDIOM = re.compile(
    r"\b(?:pain|cramps?|period|backache|headache)\b[^.,;!?]{0,15}\bkill(?:ing|s|ed)? me\b"
    # everyday uses of words the lists react to: "faint" as an adjective, a blocked nose, a figure of speech,
    # a tumble at sport, breathlessness after exertion, waiting in agony for results
    r"|\bfaint (?:pink|brown|red|ache|aches|cramps?|pain|twinges?|spotting|bleeding|line|smell|discomfort)\b"
    r"|\bcan'?t breathe? through (?:my )?nose\b"
    r"|\bcollaps\w+ (?:on|onto|into) (?:the |my )?(?:sofa|couch|bed|settee|chair)\b"
    r"|\bfell over (?:at|in|during|while) (?:the )?(?:gym|running|jogging|skating|netball|football|dance|class)\b"
    r"|\b(?:short(?:ness)? of breath|can'?t (?:get|catch) my breath|out of breath)\b[^.;!?]{0,30}\b(?:after|when|while|during)\b[^.;!?]{0,25}\b(?:run\w*|climb\w*|stairs|exercis\w*|walk\w*|gym|workout|jog\w*|sprint\w*)\b"
    r"|\bagony (?:waiting|of waiting)\b"
    r"|\bhurt(?:ing)? myself on (?:the |my |a )"
    r"|\boverdos\w* on (?:caffeine|coffee|sugar|chocolate|tea|netflix|screens?|social media)\b"
    r"|\bdisappear (?:into|under) (?:my |the )?(?:bed|duvet|covers|blanket|sofa)\b"
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
                    r"\bcough\w*\b.{0,40}\bblood\b|\bblood\b.{0,40}\bcough\w*\b|"
                    r"\b(?:arm|leg)\b.{0,15}\b(?:went|gone|is|feels?) (?:limp|dead|weak)\b.{0,40}\bcan'?t (?:hold|lift|move)|"
                    r"\b(?:tongue|lips?|throat)\b.{0,40}\b(?:swollen|swelling|closing)\b|"
                    r"\b(?:(?:swollen|bloated) (?:belly|stomach|tummy)|(?:belly|stomach|tummy)\b.{0,15}\b(?:swollen|bloated))\b.{0,60}\b(?:vomit\w*|being sick)\b.{0,60}\bcan'?t (?:pass wind|poo|go to the toilet)|"
                    r"\b(?:double|extra|too much)\b.{0,25}\b(?:pills|tablets|dose|medication)\b.{0,60}\b(?:drowsy|strange|can'?t stay awake)\b|"
                    r"\bdiabet\w+\b.{0,80}\b(?:shaking|blurr\w+|confused|sweating)\b.{0,60}\b(?:shaking|blurr\w+|confused|sweating)\b|\b(?:shaking|blurr\w+|confused|sweating)\b.{0,80}\b(?:shaking|blurr\w+|confused|sweating)\b.{0,60}\bdiabet\w+|"
                    r"\b(?:sudden|terrible|severe)\b.{0,25}\bback\b.{0,40}\bsweat\w*|"
                    r"\bstiff neck\b.{0,80}\b(?:light hurts|hurts my eyes|rash|high temperature|fever)|\b(?:high temperature|fever)\b.{0,60}\bstiff neck\b|"
                    r"\b(?:tight|pain|pressure|band|crush\w*|squeez\w+)\b.{0,25}\bchest\b.{0,80}\b(?:into|to|down|spread\w*) (?:my )?(?:left )?(?:jaw|arm)\b|"
                    r"\b(?:stabbing|agony|agonising|screaming)\b.{0,60}\b(?:curled up|on the floor|can'?t move)\b|"
                    r"\b(?:curled up|on the floor|can'?t move)\b.{0,60}\b(?:stabbing|agony|agonising)\b|"
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
                    r"^(?=.*\b(?:laparoscop\w*|operation|surgery|wound)\b)(?=.*\b(?:fever|high temperature|leaking|pus|oozing)\b)(?=.*\b(?:worse|unwell|vomit\w*|swollen)\b)|"
                    r"\b(?:vomit\w*|being sick|throwing up)\b.{0,15}\b(?:non[- ]?stop|constantly|all night)\b.{0,60}\b(?:swollen|bloated|tender|hard)\b|"
                    r"^(?=.*\b(?:period (?:is |was )?(?:\w+ ){0,3}late|late period|missed (?:a |my )?period|overdue)\b)(?=.*\b(?:one[- ]sided|one side|sharp|stabbing)\b)(?=.*\b(?:dizz\w*|faint\w*))|"
                    # sharp / severe pain together with dizzy or light-headed, and not managing without help (NHS 999 signs); any clause
                    r"^(?=.*\b(?:sharp|stabbing|severe|intense|terrible)\b.{0,20}\bpain\b|.*\bpain\b.{0,20}\b(?:was|is|so) (?:very |really |so )?(?:sharp|stabbing|severe|intense)\b)(?=.*\b(?:dizz\w*|light[- ]?headed)\b)|"
                    r"\b(?:can'?t|couldn'?t|cannot|unable to) (?:move around|stand|walk|get up)\b.{0,20}\bwithout (?:help|support|holding)\b|"
                    r"\b(?:extreme|horrific|massive)\b.{0,10}\bpain\b.{0,60}\b(?:being sick|vomit\w*|throwing up|can'?t (?:pee|wee))\b|\b(?:extreme|horrific|massive)\b.{0,10}\bpain\b.{0,40}\bnothing helps\b|"
                    # asthma, stroke, headache and low blood sugar wording from the NHS pages (any clause)
                    r"\bwheez\w+\b.{0,40}\b(?:inhaler|not (?:helping|working)|isn'?t (?:helping|touching|working))|\binhaler (?:isn'?t|is not|not|doesn'?t|won'?t) (?:helping|working|touching|do anything)|"
                    r"\b(?:numb\w*|pins and needles|weak\w*|tingl\w*)\b.{0,30}\b(?:one side)\b|\b(?:one side)\b.{0,30}\b(?:face|speech)\b|"
                    r"\bthunderclap\b|\bworst headache (?:ever|of my life)\b|"
                    r"\b(?:double|blurr\w*) vision\b.{0,40}\b(?:speak|speech|talk\w*|words)\b|\b(?:can'?t|couldn'?t|cannot) speak (?:right|properly)\b(?!.{0,30}\b(?:nose|cold|throat)\b)|"
                    r"\bblood (?:sugar|glucose) (?:is |was |of |level )?[0-2](?:\.\d)?\b(?![\d%.])|"
                    # NHS ectopic pregnancy 999 list: very dizzy or fainting, looking very pale, feeling sick - when she might be pregnant
                    r"^(?=.*\b(?:pregnan\w+|missed (?:a |my )?period)\b)(?=.*\b(?:very dizzy|faint\w*))(?=.*\b(?:very pale|looking pale|pale)\b)|"
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
                    r"\bthroat\b.{0,20}\b(?:tight|closing)\b.{0,40}\b(?:rash|hives|swell\w*|breath\w*|antibiotic|tablet\w*)\b|^(?=.*\b(?:rash|hives)\b)(?=.*\b(?:breath\w*|swell\w*|tongue|throat (?:is |feels? )?(?:tight|closing)))|"
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
                    r"(?=.*\b(?:vomit\w*|being sick|rash|dizz\w*|shivery|confus\w*|muscle aches?|diarrh\w*))", re.I | re.S)


def _hits_whole(rx, text: str) -> bool:
    m = rx.search(text)
    if not m:
        return False
    # Past tense counts only in the sentence(s) the match sits in (same rule as the phone's hitWhole).
    starts = [i for i, c in enumerate(text[: m.start()]) if c in ".;!?\n"]
    start = starts[-1] + 1 if starts else 0
    ends = [i for i, c in enumerate(text[m.end():]) if c in ".;!?\n"]
    end = m.end() + ends[0] if ends else len(text)
    return not (_NEG.search(text[max(0, m.start() - 40):m.start()]) or _is_past(text[start:end]) or _OTHER.search(text[:m.start()]))


def emergency_kind(user_text: str):
    """None, 'self_harm' or 'medical'. Negated, past or third-person mentions do not count."""
    user_text = _IDIOM.sub(" ", _norm(user_text))
    if _hits(_SELF_RX, user_text) or _hits(_SELF_HARM_RX, user_text):
        return "self_harm"
    if _hits(_BODY_RX, user_text) or _hits(_EMERGENCY, user_text) or _hits_whole(_WHOLE, user_text):
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
