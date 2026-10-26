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
    "This could need urgent help. If you have severe sudden pain, very heavy bleeding or "
    "feel faint, call 999 or go to A&E, or call NHS 111."
)

_CONDITIONS = [
    r"pcos", r"poly?-?cystic", r"poly?kyst\w*", r"poliquist\w*", r"polikist\w*", r"policyst\w*", r"policist\w*", r"endo(?:metrio\w*)?", r"adenomyosis", r"fibroids?", r"pid",
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
    "treatment": r"\b(?:i(?:'d| would) (?:stop|start|take|try|avoid|cut|skip|switch|come off)|you (?:should|could|can|might want to|may want to) (?:take|try|use|avoid|eat|stop|start|cut)|"
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
    r"^(?:there(?:'s| is) no (?:right answer|need to (?:decide|rush|answer|explain|have it all))|"
    r"what an? (?:\w+ ){1,2}(?:week|day|time|night|month)|good,? (?:that'?s|to know)|so (?:it'?s|you(?:'ve|'re)?|that'?s)\b|that(?:'s| is) (?:a )?(?:helpful|useful|clear|good|really helpful)|that detail|try describing|"
    r"(?:writing|putting|noting) (?:it|this|things) down(?: clearly)? can help (?:you|your)\b|it sounds like (?:you(?:'ve| have|'re| are)?|your|the \w+(?: \w+)? (?:has|have|is|are|was|were)|it(?:'s| has) been)|for now,? i(?:'m| am) (?:just )?here|i can help you|thanks|thank you|noted|got it|okay|ok|understood|alright|sure|i see|makes sense|i hear you|i understand|i'?m sorry|sorry|no worries|no rush|no problem|take your time|"
    r"if you(?:'d| would) like,? you could (?:bring|show|share|take) (?:this|the|your) (?:summary|notes?|log)\b|"
    r"your (?:doctor|gp) (?:may|might|will|could) find (?:it|this) (?:useful|helpful)\b|"
    r"that sounds (?:really |so |very )?(?:like a lot|tough|hard|difficult|painful|exhausting|frustrating|awful|rough|draining|miserable|worrying|scary|frightening|upsetting|horrible|stressful|overwhelming|distressing|lonely|unpleasant|grim)|"
    r"i(?:'ve| have) (?:noted|saved|added|recorded|logged|put)|i can'?t (?:assess|say|diagnose|tell)|i(?:'m| am) not able to (?:say|assess|tell|diagnose)|that helps me (?:capture|note|record|describe|write|put)|your gp can|"
    r"you can (?:skip|edit|come back|add|change|stop)|you don'?t have to|that'?s (?:noted|saved|added)|that is (?:noted|saved|added)|"
    r"tell me|you mentioned|(?:that )?sounds like (?:it (?:really )?(?:knocked|wiped|floored) you|a (?:rough|long|hard|tough|bad) (?:night|day|week))|let\'?s (?:make it easy|keep it simple|take it slowly|go step by step|just get)|in the meantime,? i can help you|you can tap|you should see your gp|it(?:'s| is) useful to note|it might help to note|"
    r"this will help your (?:doctor|gp)|let me (?:check|confirm|make sure)|you (?:said|told me|mentioned|wrote)|i can only (?:help|note|write|record)|that helps me (?:understand|picture|see)|i(?:'m| am) here (?:to help|whenever|if)|it(?:'s| is) (?:completely |perfectly )?(?:fine|okay|ok)(?: to| if)\b|it might be worth (?:jotting|noting|writing)|that sounds like (?:a |an )?(?:\w+ ){0,2}(?:day|week|night|time|morning|month)|i(?:'ll| will) help you (?:turn|write|add|put|note|describe)|i(?:'ve| have| will|'ll| won'?t| don'?t| didn'?t|'m| am| can| know| appreciate| understand| hear) )\b",
    re.I,
)
_MAX_ACK_WORDS = 20
# Phrases an acknowledgement may contain although they hold a claim word.
_ACK_SAFE = re.compile(r"\b(?:what it means|not (?:quite )?sure|not be sure|(?:won'?t )?try to (?:explain|guess)(?: it)?(?:, as that'?s for your (?:doctor|gp))?|(?:(?:i hear|i understand|i can see) )?(?:that )?you(?:'re| are) worried|mostly (?:on the (?:left|right)|in the (?:evenings?|mornings?|night)|at night)|help with that|(?:starts?|eases?|stops?) (?:on|by) day (?:one|two|three|four|five|\d)|guess at anything|(?:at|for|from|off|to) (?:work|school|uni)\b|can help you get (?:your )?(?:symptoms|things|it) down(?: clearly)?|make sure|won'?t guess(?: at anything)?|stressful (?:week|day|time|night)|made (?:a|no) difference|the best person to (?:\w+ ){0,3}(?:into|about|with)(?: why it'?s happening| that)?|why it'?s happening|may be useful for your (?:appointment|gp|doctor)|will be useful for your (?:appointment|gp|doctor)|no need to (?:decide|rush|answer|explain)|to help you (?:describe|put|write|note|capture|explain)\b[^.]*|(?:your gp|your doctor) can (?:help|look|advise|assess|check)(?: with that)?|(?:writing|putting|noting) (?:it|this|things) down(?: clearly)? can help (?:your|you)\b[^.]*|if you(?:'re| are) worried|ready for (?:them|your gp|your doctor)|worth (?:noting|jotting|writing|adding)|your cycle|could be useful|can help you|may help your gp|would help your gp|(?:leave|left|leaving|miss(?:ed|ing)?|off) work(?: early)?|under what it affected|(?:the |your )?(?:heat pad|hot water bottle|bath)\b|didn'?t help(?: much)?|how often (?:this|it) happens|(?:logging|tracking) it is worth it)\b", re.I)
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
    return re.sub(r"\b(?:[A-Za-z][ .\-]){2,}[A-Za-z]\b", lambda m: re.sub(r"[ .\-]", "", m.group(0)), t)


def _sentences(text: str) -> list[str]:
    return [t.strip() for t in re.split(r"(?<=[.!?])\s+|\n+", text) if t.strip()]


# A refusal ("I can't say what's causing it") is safe in itself; what follows it is still checked.
_REFUSAL = re.compile(r"\bi (?:can'?t|cannot|(?:am|'m) not able to)\b(?:(?!\b(?:but|and|probably|likely|maybe|possibly|although)\b)[^,;])*", re.I)


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
        if sent.endswith("?"):
            continue
        rest = _REFUSAL.sub(" ", sent).strip(" ,;")
        if rest != sent:  # only the clause left after a refusal loses its "but/and/so"; "So it's..." restates her
            rest = re.sub(r"^(?:but|and|so)\s+", "", rest, flags=re.I)
        if rest != sent and len(rest.split()) <= 2:
            continue
        if rest != sent:
            sent = rest[:1].upper() + rest[1:]
        # Only a sentence that restates the user ("So it's a dull ache...") may reuse their claim words.
        ul = user_low if re.match(r"(?:so|you)\b", sent, re.I) else ""
        if _ADVICE_MODAL.search(sent):
            reasons.append("advice")
        elif (ack := _ACK_OPENER.match(sent)) and len(sent.split()) <= _MAX_ACK_WORDS:
            # An opener does not excuse a claim in the rest of the sentence ("Thanks, it's likely hormonal").
            # (Echo openers - "You mentioned your diet changed" - restate the user's words, so they are exempt.)
            echo = re.match(r"you (?:said|told me|mentioned|wrote)", ack.group(0), re.I)
            # ...but only claim words the user really wrote: "You mentioned it's probably your thyroid" is a
            # claim falsely put in her mouth, so an echo opener restates only words found in her own text.
            # (With no user text at all there is nothing to compare against, so the old exemption stands.)
            rest_ack = _ACK_SAFE.sub("", sent[ack.end():])
            # A drug or condition NAME she wrote may be thanked/acknowledged ("Thanks for telling me about the paracetamol").
            for nm in ("treatment", "condition"):
                rx = _COMPILED.get(nm)
                if rx and user_low:
                    rest_ack = rx.sub(lambda m: " " if re.search(r"\b" + re.escape(m.group(0).lower()) + r"\b", user_low) else m.group(0), rest_ack)
            if (not echo or user_low) and _claims(rest_ack, user_low if echo else ul):
                reasons.append("statement")
        elif len(sent.split()) > _MAX_PLAIN_WORDS or _claims(sent, ul):
            reasons.append("statement")
    return reasons

_NEG = re.compile(r"\b(?:no|not|never|nothing|without|isn'?t|wasn'?t|aren'?t|didn'?t|don'?t|doesn'?t|haven'?t|hasn'?t|"
                  r"nor|none|n'?t|not even|hardly|a bit|slightly|a little|bit of a)\b|\bn't\b", re.I)
_PAST = re.compile(r"\b(?:(?:years?|months?|weeks?) ago|a (?:while|long time) ago|ages ago|(?:19|20)\d\d|(?<!since )last (?:year|decade|month|week)|as a (?:teen|child)|used to|in the past|back then|when i was (?:a )?(?:teen|kid|child|younger))\b", re.I)
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
    r"(?:bleeding|soaking|through) .{0,30}(?:under|less than|within) (?:an|one) hour", r"can'?t stop bleeding",
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
    r"bleeding (?:a )?(?:huge|massive|lot|loads)", r"clots (?:the size|as big|bigger)(?!(?: of)? (?:a |an )?(?:1p|2p|5p|10p|20p|pea|peas|penny|coin|grape)\b)", r"severe (?:sudden )?(?:pain|belly|abdominal|pelvic)",
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
    r"suicid\w+", r"kill(?:ing)? (?:myself|me)", r"(?:want|wants|need) (?:it|this|everything|things) (?:all )?to (?:stop|end)",
    r"end(?:ing)? things", r"(?:took|taken|taking) (?:a load|lots|too many|an overdose)\b.{0,30}(?:tablets|pills|paracetamol)|overdos\w+",
    r"(?:tablets|pills).{0,30}don'?t care what happens", r"self[- ]harm\w*", r"(?:want|wanna|going) to die", r"end(?:ing)? it all",
    r"end(?:ing)? my (?:own )?life", r"(?:don'?t|do not) want to be (?:alive|here)(?: anymore| any more)?", r"hurt(?:ing)? myself",
    r"cutting myself", r"(?:want|wanna) to (?:just )?disappear(?: forever)?", r"better off (?:dead|without me)", r"take my own life",
    r"unaliv\w*", r"\bkms\b", r"(?:don'?t|do not|no longer) see the point (?:in )?(?:going on|living|being here|anything|carrying on)", r"thinking (?:about|of) ending it\b", r"no point (?:in )?(?:going on|living|being here)",
]
_BODY_RX = re.compile(r"(?:" + "|".join(_BODY) + r")", re.I)
_SELF_RX = re.compile(r"(?:" + "|".join(_SELF) + r")", re.I)
_CLAUSE = re.compile(r"[.;!?\n]+|,\s*|\bbut\b|\band\b(?=\s+(?:i|it|the|my|now)\b)", re.I)

SELF_HARM = (
    "I'm really sorry you're feeling this way, and I'm glad you said so. If you might act on these "
    "thoughts, call 999 now. You can also call Samaritans free, any time, on 116 123, or call NHS 111."
)

# Safety's phrase lists (claude/safety-everything), kept alongside the lists below; both go
# through the same negation/past/third-person check in emergency_kind().
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
    r"worst (?:pain )?(?:i'?ve|i have) ever|pain so bad|(?:big )?clots? (?:the size of|bigger than)(?!(?: of)? (?:a |an )?(?:1p|2p|5p|10p|20p|pea|peas|penny|coin|grape)\b)|pain (?:is |was )?unbearable|pain (?:is |was )?(?:a )?(?:10|ten)(?:/| out of )10|"
    r"sudden (?:sharp |stabbing )?pain|\bi(?:'?m| am| think i'?m)? (?:\w+ ){0,3}miscarr\w+|"
    r"pregnan\w+ and (?:bleeding|pain|cramp\w*)|(?:i'?m|i am|am) pregnant.{0,40}(?:bleeding|pain|cramp\w*)|"
    r"(?:cannot|can not|hard to|hardly able to) breathe?|short(?:ness)? of breath|chest (?:is )?(?:feels? )?tight\w*|"
    r"(?:can'?t|cannot|won'?t|will not|doesn'?t|isn'?t|not) (?:stop|stopping) bleeding|bleeding (?:won'?t|will not|doesn'?t|isn'?t|is not) (?:stop|stopping)|"
    r"(?:blood|bleeding) everywhere|bleeding.{0,40}pregnant)\b",
    re.I,
)
URGENT_SELF_HARM = SELF_HARM


# "heavy bleeding stopped hours ago": the thing ended ("hasn't stopped" did not).
_RESOLVED = re.compile(r"(?<!n't )(?<!not )(?<!never )\b(?:stopped|settled|eased|resolved|subsided|passed|went away|has gone|have gone)\b", re.I)


def _hits(rx, text: str) -> bool:
    """A match counts unless its clause is negated, in the past, or about someone else."""
    for clause in _CLAUSE.split(text):
        for m in rx.finditer(clause):
            before = clause[: m.start()]
            after = clause[m.end():]
            if _NEG.search(before[-40:]) or _PAST.search(clause) or _OTHER.search(before) or _RESOLVED.search(after):
                continue
            return True
    return False


_PREG_WHOLE = re.compile(r"\bpregnan\w+\b", re.I)
_PREG_SYMPTOM = re.compile(r"\b(?:bleeding|spotting|cramps? (?:are |is )?(?:getting )?worse|severe|sharp pain|one-sided)\b", re.I)


# "the pain was killing me" describes pain, it is not a statement about self-harm.
_IDIOM = re.compile(r"\b(?:pain|cramps?|period|backache|headache)\b[^.,;!?]{0,15}\bkill(?:ing|s|ed)? me\b", re.I)


# Two parts of one message split by a comma ("stabbing pain, curled up on the floor") need one look at the whole text.
_WHOLE = re.compile(r"\b(?:stabbing|agony|agonising|screaming)\b.{0,60}\b(?:curled up|on the floor|can'?t move)\b|"
                    r"\b(?:curled up|on the floor|can'?t move)\b.{0,60}\b(?:stabbing|agony|agonising)\b|"
                    # NHS pelvic-pain 999 list: pain in the tip of the shoulder together with pelvic/tummy pain (any clause)
                    r"\btip of (?:my |the )?shoulder\b.{0,60}\b(?:pelvi\w+|tummy|stomach|abdom\w+|belly)\b|"
                    r"\b(?:pelvi\w+|tummy|stomach|abdom\w+|belly)\b.{0,60}\btip of (?:my |the )?shoulder\b", re.I | re.S)


def _hits_whole(rx, text: str) -> bool:
    m = rx.search(text)
    return bool(m) and not (_NEG.search(text[max(0, m.start() - 40):m.start()]) or _PAST.search(text) or _OTHER.search(text[:m.start()]))


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


_SAFE_REFUSAL = re.compile(r"\bi (?:can'?t|cannot|(?:am|'m) not able to) (?:say|tell you|assess|know|judge)\b(?:(?!\b(?:but|and|probably|likely|maybe|possibly|although)\b)[^,;.?!])*", re.I)


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
