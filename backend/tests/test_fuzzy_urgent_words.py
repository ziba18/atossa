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


def test_mouth_dropped_open_in_surprise_is_quiet_one_sided_drop_urgent():
    from app.services import output_guard as g
    assert g.emergency_kind("my jaw dropped and mouth dropped open at the news") is None
    assert g.emergency_kind("my mouth has dropped on one side") is not None


def test_relative_swallowed_pills_and_sleepy_urgent_normal_dose_quiet():
    from app.services import output_guard as g
    assert g.emergency_kind("my little brother swallowed my pills and is sleepy") is not None
    assert g.emergency_kind("my mum took her pills as normal and is a bit sleepy after lunch is fine") is None
    assert g.emergency_kind("my friend took her tablets and was drowsy so we napped, ok now") is None


def test_weeks_of_bleeding_with_dizziness_s516():
    from app.services import output_guard as g
    assert g.emergency_kind("omg my period wont stop its been 2 weeks and im so dizzy") == "medical"
    assert g.emergency_kind("been bleeding for weeks and feel faint") == "medical"
    assert g.emergency_kind("my period lasts about a week and i feel a bit dizzy when i stand, its usual") is None
    assert g.emergency_kind("my period wont stop its been 2 weeks") is None
    assert g.emergency_kind("im dizzy and had a period last month for 3 weeks") is None


def test_blade_to_hand_with_no_point_s516():
    from app.services import output_guard as g
    assert g.emergency_kind("everything is pointless and i have a blade in my hand") == "self_harm"
    assert g.emergency_kind("i have a razor in my hand and everything feels hopeless") == "self_harm"
    assert g.emergency_kind("i have a razor in my hand and im shaving my legs, such a pointless chore") is None
    assert g.emergency_kind("blade in my hand while cooking, the recipe is hopeless") is None


def test_hard_bump_with_bleeding_late_pregnancy_s516():
    from app.services import output_guard as g
    assert g.emergency_kind("my bump is rock hard and i have bad pain and bleeding, 30 weeks") == "medical"
    assert g.emergency_kind("my bump is hard when the baby kicks, 30 weeks, no pain no bleeding") is None


def test_stiff_neck_rash_vision_loss_s517():
    from app.services import output_guard as g
    assert g.emergency_kind("my daughter is 6 and her neck is stiff and she hates the light and has a rash") == "medical"
    assert g.emergency_kind("i saw a flash of light and now half my vision is gone") == "medical"
    assert g.emergency_kind("i slept funny and my neck is stiff, no rash") is None
    assert g.emergency_kind("my vision went blurry for a second when i stood up, back to normal") is None
    assert g.emergency_kind("half my vision is gone on this tiny phone screen because of the crack") is None


def test_sleep_forever_with_pills_and_no_way_out_s517():
    from app.services import output_guard as g
    assert g.emergency_kind("i took my pills and a bottle of wine because i want to sleep forever") == "self_harm"
    assert g.emergency_kind("i feel like theres no way out and i have everything ready") == "self_harm"
    assert g.emergency_kind("i want to sleep forever after this exam week, so tired") is None
    assert g.emergency_kind("there is no way out of this traffic, everything is ready for the party") is None


def test_high_temp_newborn_hot_overdose_early_waters_s518():
    from app.services import output_guard as g
    assert g.emergency_kind("the pain in my side is unreal and i have been sick and have a temp of 40") == "medical"
    assert g.emergency_kind("my baby is 3 weeks old and feels hot and wont feed") == "medical"
    assert g.emergency_kind("i was told not to take ibuprofen and i took 12 by accident") == "medical"
    assert g.emergency_kind("there was a gush of fluid and im only 28 weeks") == "medical"
    assert g.emergency_kind("had a temp of 39 last year with the flu, all fine, my knee has some pain") is None
    assert g.emergency_kind("my baby is 3 months old and feels warm after a bath, no fever") is None
    assert g.emergency_kind("my son is 6 weeks old and was hot yesterday but now fine") is None
    assert g.emergency_kind("i took 12 steps by accident into the pool") is None
    assert g.emergency_kind("my waters leaked a tiny bit at 39 weeks and midwife said fine") is None


def test_not_exist_in_a_meeting_is_quiet_s518():
    from app.services import output_guard as g
    assert g.emergency_kind("ngl i just wanna not exist in this meeting its so boring") is None
    assert g.emergency_kind("ngl i just wanna not exist anymore") == "self_harm"


def test_tight_throat_puffy_face_and_sleeping_pills_with_drink_s520():
    from app.services import output_guard as g
    assert g.emergency_kind("i ate a prawn and now my throat is tight and my face is puffy") == "medical"
    assert g.emergency_kind("i cant keep my eyes open and took a few of my sleeping pills with whisky") == "medical"
    assert g.emergency_kind("my throat is tight from nerves before the presentation") is None
    assert g.emergency_kind("i took one sleeping pill with a cup of tea and slept great") is None
    assert g.emergency_kind("had some tablets for my headache and a beer, so sleepy but fine") is None


def test_hot_swollen_joint_with_fever_s521():
    from app.services import output_guard as g
    assert g.emergency_kind("hot swollen painful joint and a fever of 38.9 after my injection") == "medical"
    assert g.emergency_kind("my knee is a bit swollen after football, no fever") is None
    assert g.emergency_kind("my ankle is red and painful after a sprain") is None


def test_stabbing_myself_s523():
    from app.services import output_guard as g
    assert g.emergency_kind("im having thoughts of stabbing myself") == "self_harm"
    assert g.emergency_kind("i have thoughts of stabbing the cake with a candle for the party") is None


def test_relative_took_many_tablets_cannot_wake_and_young_baby_word_ages():
    from app.services import output_guard as g
    for line in ["my mother is not able to wake up, she took many tablets",
                 "my husband took lots of pills and will not wake",
                 "my dad took too many tablets and is unresponsive",
                 "my baby is two weeks old and has a fever",
                 "my baby is two weeks old and has a temperature and will not feed",
                 "my newborn is five days old and has a high temperature"]:
        assert g.emergency_kind(line) is not None or g.is_emergency(line), line
    for line in ["my mother took her tablets as normal and is not able to wake up before 8 so I let her sleep",
                 "my dad took many tablets over the years, now fine",
                 "my baby is two weeks old and feeding well, no fever",
                 "my baby is eleven weeks old and the health visitor took her temperature, normal",
                 "my niece is two weeks away from her due date"]:
        assert not g.is_emergency(line), line


def test_pins_and_needles_face_arm_speech_together_urgent_s522():
    from app.services import output_guard as g
    for line in ["pins and needles in my face, arm heavy, speech is odd",
                 "pins and needles in my face and my arm feels heavy and my speech is odd"]:
        assert g.is_emergency(line), line
    for line in ["pins and needles in my arm, speech is normal",
                 "my mum says pins and needles in her face and her arm is heavy and her speech is odd"]:
        assert not g.is_emergency(line), line


def test_egg_collection_massively_bloated_with_breathing_or_wee_s528():
    from app.services import output_guard as g
    for line in ["after my egg collection I am bloated massively and can barely breathe and have hardly peed",
                 "egg collection two days ago, I am so bloated and have barely any wee"]:
        assert g.is_emergency(line), line
    for line in ["after my egg collection I am a bit bloated but eating and peeing fine",
                 "ivf injections made me bloated, I peed normally and breathing is fine"]:
        assert not g.is_emergency(line), line


def test_vehicle_wish_selfinjury_with_hatred_edge_of_platform_s530():
    from app.services import output_guard as g
    for line in ["I wish a car would hit me on the way home",
                 "i hate my body so much i scratched my arms until they bled again today",
                 "can't take the pain anymore, standing at the edge of the platform"]:
        assert g.is_emergency(line), line
    for line in ["waiting for the bus on the platform, cramps bad, pain 6",
                 "scratched my arm on the rose bush until it bled, put a plaster on",
                 "I hate my body today, bloated, pain 5, wish a bus would come soon",
                 "my sister said she wishes a car would hit her ex, she was joking"]:
        assert not g.is_emergency(line), line


def test_after_birth_seeing_things_or_baby_taken_s532():
    from app.services import output_guard as g
    assert g.is_emergency("since the birth I keep seeing things and I think someone wants to take my baby")
    for line in ["since the birth I am tired and my baby is feeding well",
                 "my sister heard voices after her baby years ago, now fine",
                 "watching a programme where someone wants to take my baby name idea, funny"]:
        assert not g.is_emergency(line), line


def test_double_dose_with_heart_going_mad_and_shaking_s533():
    from app.services import output_guard as g
    for line in ["i got really hot and my heart is going mad and i cant stop shaking after taking double my meds",
                 "took double my meds and my heart is hammering"]:
        assert g.is_emergency(line), line
    for line in ["my heart is going mad at this show, taking my meds as normal", "took my usual meds, a bit hot, heart rate normal"]:
        assert not g.is_emergency(line), line


def test_relayed_hard_belly_crying_pale_s534():
    from app.services import output_guard as g
    for line in ["she has been sick all day and now her tummy is hard and she is crying with pain and has gone very pale",
                 "my daughter has been vomiting since last night, her belly is rock hard and she keeps screaming with the pain, she looks grey",
                 "my friend has had a tummy bug all day, now her stomach is rigid, she is in tears with pain and white as a sheet"]:
        assert g.is_emergency(line), line
    for line in ["my daughter's tummy is a bit hard after a big dinner but she is playing fine",
                 "he cried with pain at the dentist and went pale but he is fine now",
                 "she is crying with pain from her period cramps but heat pad helped, not pale",
                 "my belly is hard and bloated before my period, sore but ok, painkillers help"]:
        assert not g.is_emergency(line), line


def test_voice_and_relayed_wordings_s535():
    from app.services import output_guard as g
    for line in ["so my pain got really bad on my right side and then i threw up and now im shaking and burning up",
                 "I want to finish my life, I have the way, tonight I do it",
                 "my girlfriend took a bunch of her tablets and shes saying weird things and getting sleepy"]:
        assert g.is_emergency(line), line
    for line in ["my pain was really bad on my right side last week and i threw up once, shaking from the cold, fine now",
                 "i need to finish my life story book tonight",
                 "my mum took her usual tablets as prescribed and she is sleepy after lunch",
                 "i took a bunch of vitamin gummies and feel weird lol"]:
        assert not g.is_emergency(line), line
