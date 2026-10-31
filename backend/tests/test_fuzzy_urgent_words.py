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


def test_blue_lips_with_a_stated_harmless_cause_stays_quiet_s502():
    assert not g.is_emergency("my sister is struggling at work, her lips are blue from the cold sea, i felt flat, headache 3")
    assert not g.is_emergency("my lips are blue from the slush i drank, cramps 3, tired")
    for t in ["her lips are blue and she cant breathe properly", "my lips are blue", "his lips look grey and he is very drowsy"]:
        assert g.is_emergency(t), t


def test_racing_heart_with_about_to_pass_out_s503():
    for t in ["i cant stop shaking and my heart is going crazy fast and i feel like i will pass out", "my heart is pounding and i think i might black out"]:
        assert g.is_emergency(t), t
    for t in ["my heart was racing on the treadmill earlier, cramps 2, tired", "my heart was racing before the exam yesterday, cramps 3",
              "cramps 4, tired, heart racing a bit after coffee, settled"]:
        assert not g.is_emergency(t), t


def test_hedged_first_contact_gaps_s505():
    for t in ["idk if this is normal but ive soaked 6 pads since breakfast", "not sure if i should worry, my mum cant speak properly all of a sudden",
              "kinda scared, theres blood coming out when i pee and i have a high fever", "sudden terrible pain in my calf and its swollen, im on the pill"]:
        assert g.is_emergency(t), t
    for t in ["soaked 3 pads over the whole period, usually lighter, tired", "my mum cant talk properly on the phone, bad signal, cramps 3",
              "blood on the tissue when i wiped, no fever, small, cramps 2", "calf cramp in the night, gone after stretching, swollen ankle from the flight",
              "soaked a pad on day 2 as usual, cramps 4"]:
        assert not g.is_emergency(t), t


def test_relayed_and_visual_gaps_s506():
    for t in ["my sister says she cant feel her legs and has lost control of her bladder", "my friend is bleeding heavy and has gone really pale and quiet",
              "i keep seeing flashing lights then half my vision goes and my head is pounding", "cant stop vomiting for two days and havent weed since yesterday"]:
        assert g.is_emergency(t), t
    for t in ["my friend bled through her jeans once, i felt for her, my own cramps 3", "flashing lights from the phone screen made my head hurt, 3",
              "my sister cant feel her legs in this cold, we laughed, my cramps 4", "vomited once yesterday and havent had a wee since lunch because i was at work, pain 4"]:
        assert not g.is_emergency(t), t


def test_cannot_keep_myself_safe_s508():
    for t in ["i dont think i can keep myself safe tonight", "i cant keep myself safe", "i do not trust myself to keep myself safe tonight"]:
        assert g.is_emergency(t), t
    for t in ["i try to keep myself safe from the sun, factor 50, cramps 3", "i cant keep myself warm in this flat, cramps 4, tired"]:
        assert not g.is_emergency(t), t


def test_immune_medicine_fever_and_double_dose_s509():
    for t in ["im on methotrexate and have a sore mouth and fever and cough", "taken my meds twice by mistake, heart pounding and feel sick"]:
        assert g.is_emergency(t), t
    for t in ["on methotrexate, no fever, joints stiff today, cramps 3", "took my meds twice a day as prescribed, tired, cramps 2",
              "taken my meds late twice this week, felt sleepy, pain 3"]:
        assert not g.is_emergency(t), t


def test_more_one_word_slips_s510():
    for t in ["ive soked 6 pads since breakfst", "my mum sudenly cant speek properly", "i cant stop vomiting and have a stif neck and fevr", "blod in my wee and a high temprature"]:
        assert g.is_emergency(t), t
    for t in ["ive soked my pillow with sweat, hot flush, cramps 2", "my mum suddenly decided to visit, lovely, tired, cramps 3"]:
        assert not g.is_emergency(t), t


def test_infant_sleepy_and_not_feeding_is_urgent_everyday_toddler_lines_quiet():
    from app.services import output_guard as g
    for line in ["my baby is very sleepy and wont feed",
                 "my newborn won't take the bottle and is hard to wake",
                 "my 5 month old refusing feeds and drowsy"]:
        assert g.emergency_kind(line) is not None, line
    for line in ["my son won't eat veg and is sleepy after school",
                 "my baby is sleepy and feeding well",
                 "my baby is sleepy after her feed"]:
        assert g.emergency_kind(line) is None, line


def test_relayed_infant_lines_urgent_laughing_quiet():
    from app.services import output_guard as g
    for line in ["my sister's baby is sleepy and refusing the bottle",
                 "my sisters baby is limp and not waking",
                 "my niece is very sleepy and wont feed, she is 2 weeks old"]:
        assert g.emergency_kind(line) is not None, line
    for line in ["my niece is limp with laughter at the party",
                 "my sister's baby is due next week and i am excited",
                 "my friend's baby is a bit sleepy but feeding fine"]:
        assert g.emergency_kind(line) is None, line


def test_hedged_stroke_relayed_mouth_drop_insulin_eye_halos_urgent_idioms_quiet():
    from app.services import output_guard as g
    for line in ["not sure if its anything but i think i might be having a stroke, my arm wont lift",
                 "my mum cant speak properly and one side of her mouth has dropped",
                 "ive taken twice my usual insulin by mistake and im shaky and sweaty",
                 "my eye is suddenly very painful and red and the lights have halos",
                 "prob should say, i swallowd loads of paracetamol earlier"]:
        assert g.emergency_kind(line) is not None, line
    for line in ["i could be having a stroke of luck",
                 "my eyes are sore from screens and i saw halos around the moon",
                 "i took double my usual vitamin"]:
        assert g.emergency_kind(line) is None, line


def test_coil_with_fever_and_bad_smell_urgent_negated_quiet():
    from app.services import output_guard as g
    assert g.emergency_kind("Tonight I feel hot and shivery, 39.2 on the thermometer and a really bad smell down there since the coil check") is not None
    assert g.emergency_kind("coil check today, no fever and no smell, just a bit of cramping") is None
    assert g.emergency_kind("my coil was checked, i have a cold and a temperature, nothing else") is None


def test_indirect_self_harm_methods_urgent_everyday_quiet():
    from app.services import output_guard as g
    for line in ["i've been looking up ways to end it and picked a night",
                 "cant do another day of this pain, im going to take everything in the cabinet",
                 "the pain is so bad i keep thinking about jumping"]:
        assert g.emergency_kind(line) == "self_harm", line
    for line in ["i am going to take everything out of the cabinet and clean it",
                 "i keep thinking about jumping into the sea for the swim challenge",
                 "im going to take all my boxes to the house tomorrow",
                 "tonight is the night, we finally have our dinner party, cant wait"]:
        assert g.emergency_kind(line) is None, line


def test_no_point_in_tomorrow_self_harm_everyday_quiet():
    from app.services import output_guard as g
    assert g.emergency_kind("i dont see the point in tomorrow") == "self_harm"
    assert g.emergency_kind("can't see the point of carrying on") == "self_harm"
    assert g.emergency_kind("i don't see the point in going to the shops") is None
    assert g.emergency_kind("i dont see the point in the new diet app") is None
