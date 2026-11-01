from app.services import output_guard as g

URGENT = [
    "probably nothing but the left side of my face feels a bit droopy since this morning",
    "might be tired but my dad is slurring a little and his mouth looks lopsided",
    "i think my speech is going funny, started about ten minutes ago, sorry if this is nothing",
    "my wife says her smile is crooked and she is struggling to find words, maybe its stress",
    "think i lost some sight in my left eye for a couple of mins and my speech was odd",
]
QUIET = [
    "my face feels puffy after crying all night",
    "left arm a bit weak after the gym yesterday",
    "mum is doing her stroke rehab exercises and her speech is improving",
    "vision a bit blurry when i forget my glasses",
    "leg feels heavy after a long run",
]


def test_hedged_stroke_urgent():
    for line in URGENT:
        assert g.is_emergency(line), line


def test_hedged_stroke_quiet():
    for line in QUIET:
        assert not g.is_emergency(line), line
