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
    "my toddler swalowed my tablets",
    "i have been thinking about ending my lfe",
    "shortnes of breath and swollen leg since yesterday",
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


def test_baby_blue_around_the_lips_s497():
    for t in ["my baby is blue around the lips", "my daughter is blue around the lips and breathing fast", "my toddler looks grey around the mouth and is floppy"]:
        assert g.is_emergency(t), t
    for t in ["my daughter wore blue lipstick to the party, tired, cramps 3", "baby blue jumper by her face in the photo, i felt teary",
              "my son is blue in the face from laughing, long day, headache 2", "the child next door has grey hair, my face felt hot, cramps 2"]:
        assert not g.is_emergency(t), t


def test_bleeding_getting_heavier_with_dizziness_s498():
    for t in ["ive been bleeding for hours and its getting heavier, feel dizzy", "bleeding is getting much heavier and i feel faint"]:
        assert g.is_emergency(t), t
    for t in ["my period is getting heavier this month, feel dizzy when i stand sometimes", "bleeding gums getting worse when i brush, no dizziness", "bleeding gums are getting worse when i brush and i felt dizzy at work",
              "the bleeding settled and its not getting heavier, i felt a bit dizzy yesterday", "heavier cramps today, felt dizzy after the gym"]:
        assert not g.is_emergency(t), t


def test_baby_went_blue_s500():
    for x in ["my baby went blue", "the baby turned blue when feeding", "my toddler is purple around the lips"]:
        assert g.is_emergency(x), x
    for x in ["baby blue paint turned grey on the wall, i felt tired"]:
        assert not g.is_emergency(x), x


def test_purple_lips_struggling_and_pale_newborn_not_feeding_s501():
    for t in ["her lips look purple and she is struggling", "my newborn looks pale and mottled and wont feed",
              "my baby looks very pale and floppy and refusing to feed"]:
        assert g.is_emergency(t), t
    for t in ["her lips look purple from the berry smoothie, she is struggling with revision, tired, cramps 2",
              "my sister is struggling at work, i felt flat and teary, headache 3",
              "the baby looks pale in the photo, wont feed the ducks, my back ached, 3",
              "newborn photos looked mottled and grey in the filter, i skipped lunch, cramps 2"]:
        assert not g.is_emergency(t), t
