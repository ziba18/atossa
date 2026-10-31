"""S-495: one-letter slips of urgent words are corrected for detection; real words stay untouched."""
import time
from app.services import output_guard as g

URGENT = [
    "bleedng through a pad every hour", "im bleeeding really heavily and dizzy", "i cant breathee properly",
    "struggling to brethe and my lips look blue", "i am pregnnt and have sharp pain with bleeding", "i think im pregnatn and bleeding heavily",
    "he collapsd at work and is not waking", "she colapsed in the kitchen and wont wake", "had a seizre last night and lost time",
    "i keep vomitng and cant keep water down and have a fever", "i passed out unconcsious for a minute", "had a miscarrige and the bleeding wont stop",
    "thinking about suicde tonight", "i keep having thoughts of suicidee", "im breathng so fast and my chest hurts",
    "baby is not breathng",
    "my daughter is vomiting blod and looks pale",
    "i keep thinking of killing myslf tonight",
    "bleding heavily, soaked three pads", "cant breathw and chest crushing", "he is unconscius and wont wake up",
    "my mum is collapesd and not breathing", "thinking of suicid tonight and i have a plan",
]
QUIET = [
    "painted the kitchen today, period cramps 4/10", "my breath smells odd after coffee, mild cramps 3", "feeling a bit breathy after the stairs, nothing else, ache 2",
    "bleeping alarm woke me, tired, back ache 3", "the dog is breeding next month, i had mild cramps", "blending smoothies helped my nausea a bit, 2/10",
    "wreathe making at the weekend, tired and sore 4", "garden fence needs fixing, annoyed, headache 3", "tainted milk last week, fine now, mild cramps",
    "sainted aunt came round, tired, cramps 3", "the news was loud, anxious, ache 2", "breathes better outdoors, walk helped, pain 2",
    "feinted left in netball, knee ache 3", "regnant queens in my book club read, tired", "overdone it at the gym, thighs sore 5",
    "pregnancy test was negative, cramps 4", "breeding season at the farm, hay fever, tired", "miscarriages are common, my friend told me, i felt sad",
    "painter came today, headache 3, period day 2", "soap plot was grim, i switched it off, tired",
]


def test_urgent_typo_variants():
    missed = [t for t in URGENT if not g.is_emergency(t)]
    assert not missed, missed


def test_real_words_quiet():
    fired = [t for t in QUIET if g.is_emergency(t)]
    assert not fired, fired


def test_fuzz_time():
    t0 = time.time()
    g.is_emergency("bleedng " * 800)
    assert time.time() - t0 < 2.5
