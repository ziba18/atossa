import type { ContentCategory } from '../types/database';

export interface Article {
  id: string;
  slug: string;
  title: string;
  category: ContentCategory;
  content_type: 'article';
  thumbnail_url: string;
  reading_time_minutes: number;
  source_name: string;
  source_url: string;
  published_date: string;
  summary: string;
  body_markdown: string;
  tags: string[];
  is_published: true;
  view_count: number;
  created_at: string;
  updated_at: string;
  video_url: null;
}

export const ARTICLES: Article[] = [
  // ─────────────────────────────────────────────────────────────────────
  {
    id: '1',
    slug: 'four-phases-menstrual-cycle',
    title: 'The Four Phases of Your Menstrual Cycle',
    category: 'cycle_basics',
    content_type: 'article',
    thumbnail_url: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=80',
    reading_time_minutes: 5,
    source_name: 'Healthline',
    source_url: 'https://www.healthline.com/health/womens-health/stages-of-menstrual-cycle',
    published_date: 'February 2024',
    summary: 'Your menstrual cycle is divided into four distinct phases — menstrual, follicular, ovulation, and luteal — each driven by a unique hormonal pattern that affects energy, mood, and fertility.',
    tags: ['cycle', 'phases', 'hormones', 'basics'],
    is_published: true,
    view_count: 0,
    created_at: '2024-02-01T00:00:00Z',
    updated_at: '2024-02-01T00:00:00Z',
    body_markdown: `# The Four Phases of Your Menstrual Cycle

Your menstrual cycle is one of the most complex — and overlooked — biological systems in the body. Far from being just the days you bleed, your cycle encompasses four distinct phases that influence your energy, mood, skin, sleep, libido, and even immune function.

Understanding each phase gives you a powerful map of your body.

---

## Phase 1: Menstrual Phase (Days 1–5)

The cycle begins on the first day of your period. When progesterone and estrogen drop, the uterine lining sheds, causing bleeding that typically lasts 3–7 days.

**What's happening hormonally:** FSH (follicle-stimulating hormone) begins to rise, signalling the ovaries to prepare a new follicle.

**How you may feel:** Fatigue, cramping, and an inward, reflective energy are common. This is a natural time to slow down.

---

## Phase 2: Follicular Phase (Days 6–13)

Overlapping with your period and extending beyond it, the follicular phase is one of rising energy. Estrogen climbs steadily as follicles in the ovary mature, and your uterine lining begins to rebuild.

**What's happening hormonally:** Rising estrogen boosts serotonin and dopamine — you may feel sharper, more social, and more creative.

**How you may feel:** Energy returns, skin may glow, and motivation peaks. Great time for new projects or social commitments.

---

## Phase 3: Ovulation (Around Day 14)

Triggered by a surge of LH (luteinising hormone), one dominant follicle releases an egg. The egg is viable for 12–24 hours, but sperm can survive for up to 5 days — making the days just before ovulation peak fertility.

**Signs of ovulation:** Clear, stretchy cervical mucus (similar to raw egg white), a slight rise in basal body temperature (0.2–0.5°C), and sometimes mild pelvic pain (mittelschmerz).

**How you may feel:** Peak energy, confidence, and libido are common around ovulation.

---

## Phase 4: Luteal Phase (Days 15–28)

After ovulation, the empty follicle becomes the corpus luteum and secretes progesterone. If no fertilisation occurs, the corpus luteum degrades, progesterone drops, and the cycle restarts.

**What's happening hormonally:** Progesterone dominates, with estrogen making a secondary smaller rise, then both falling sharply before your period.

**How you may feel:** Bloating, breast tenderness, cravings, and mood shifts (PMS) typically appear in the second half of this phase as hormones decline. A calmer, nesting energy often precedes the restlessness of PMS.

---

## Key Takeaways

- Your cycle is not just your period — it's a 21–35 day rhythm with four distinct phases.
- Tracking your cycle helps you understand your energy, mood, and fertility patterns.
- Cycle irregularities lasting more than three cycles are worth discussing with a doctor.

---

*Source: [Healthline — Stages of the Menstrual Cycle](https://www.healthline.com/health/womens-health/stages-of-menstrual-cycle) · Medically reviewed February 2024*
`,
  },

  // ─────────────────────────────────────────────────────────────────────
  {
    id: '2',
    slug: 'understanding-pcos',
    title: 'Understanding PCOS: Symptoms, Causes & Treatment',
    category: 'pcos',
    content_type: 'article',
    thumbnail_url: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?auto=format&fit=crop&w=800&q=80',
    reading_time_minutes: 7,
    source_name: 'Cleveland Clinic',
    source_url: 'https://my.clevelandclinic.org/health/diseases/8316-polycystic-ovary-syndrome-pcos',
    published_date: 'January 2024',
    summary: 'PCOS affects 1 in 10 people with ovaries and is one of the most common causes of irregular periods and infertility — yet it remains widely misunderstood and underdiagnosed.',
    tags: ['pcos', 'hormones', 'fertility', 'diagnosis'],
    is_published: true,
    view_count: 0,
    created_at: '2024-01-15T00:00:00Z',
    updated_at: '2024-01-15T00:00:00Z',
    body_markdown: `# Understanding PCOS: Symptoms, Causes & Treatment

Polycystic Ovary Syndrome (PCOS) is a hormonal disorder affecting approximately 1 in 10 people with ovaries worldwide — making it one of the most common endocrine conditions. Despite its prevalence, it takes an average of **2 years and 3 doctors** to get a diagnosis.

---

## What Is PCOS?

PCOS is characterised by a hormonal imbalance that disrupts normal ovulation. The ovaries may develop many small follicles (not true cysts) and produce excess androgens (male hormones such as testosterone).

The Rotterdam criteria — used by most clinicians — diagnose PCOS when at least **two of three** features are present:

1. Irregular or absent periods
2. Elevated androgens (in blood or visible symptoms)
3. Polycystic-appearing ovaries on ultrasound

---

## Common Symptoms

- **Irregular periods** — fewer than 8 cycles per year, or cycles longer than 35 days
- **Excess hair growth** (hirsutism) on face, chest, or back
- **Acne** — often on the jawline, chin, and chest
- **Thinning scalp hair**
- **Weight gain** or difficulty losing weight
- **Skin darkening** (acanthosis nigricans) at the neck or underarms
- **Difficulty conceiving**

Not everyone experiences all symptoms. PCOS exists on a spectrum.

---

## What Causes PCOS?

The exact cause isn't fully understood, but several factors contribute:

**Insulin resistance** — Elevated insulin stimulates the ovaries to produce more androgens. Around 70% of people with PCOS have insulin resistance, regardless of weight.

**Genetics** — PCOS runs in families. If your mother or sister has it, your risk is significantly higher.

**Low-grade inflammation** — Research shows chronic inflammation may stimulate androgen production.

---

## Treatment Options

PCOS has no cure, but symptoms are highly manageable:

### Lifestyle
- **Exercise** — Even 150 minutes of moderate activity per week can reduce androgen levels and improve insulin sensitivity.
- **Diet** — A low-glycaemic diet can reduce insulin spikes. The Mediterranean diet has the strongest evidence.
- **Weight** — Losing 5–10% of body weight (in those with overweight) can restore ovulation in many cases.

### Medications
- **Combined oral contraceptive pill** — Regulates periods and reduces androgen symptoms.
- **Metformin** — Improves insulin sensitivity; may restore ovulation.
- **Spironolactone** — Blocks androgen effects on skin and hair.
- **Letrozole / Clomifene** — First-line fertility treatments for PCOS.

---

## When to See a Doctor

See a GP or gynaecologist if you have:
- Fewer than 8 periods a year
- Been trying to conceive for 12 months without success
- Signs of excess androgens (acne, facial hair)

Early diagnosis and management can significantly reduce the long-term risks of type 2 diabetes and cardiovascular disease.

---

*Source: [Cleveland Clinic — Polycystic Ovary Syndrome (PCOS)](https://my.clevelandclinic.org/health/diseases/8316-polycystic-ovary-syndrome-pcos) · Reviewed January 2024*
`,
  },

  // ─────────────────────────────────────────────────────────────────────
  {
    id: '3',
    slug: 'estrogen-progesterone-your-cycle',
    title: 'Estrogen & Progesterone: How Hormones Shape Your Cycle',
    category: 'hormones',
    content_type: 'article',
    thumbnail_url: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=800&q=80',
    reading_time_minutes: 6,
    source_name: 'Harvard Health Publishing',
    source_url: 'https://www.health.harvard.edu/womens-health/the-hormone-guide',
    published_date: 'March 2024',
    summary: 'Estrogen and progesterone are the two main hormones that govern your cycle — but they do far more than regulate reproduction. They affect your brain, bones, heart, skin, and sleep.',
    tags: ['hormones', 'estrogen', 'progesterone', 'cycle'],
    is_published: true,
    view_count: 0,
    created_at: '2024-03-01T00:00:00Z',
    updated_at: '2024-03-01T00:00:00Z',
    body_markdown: `# Estrogen & Progesterone: How Hormones Shape Your Cycle

When most people think of sex hormones, they think of reproduction. But estrogen and progesterone are system-wide messengers — they influence your brain, gut, bones, heart, skin, and immune system every single day of your cycle.

---

## Estrogen: The Rising Star

Estrogen (primarily estradiol, or E2) is produced mainly by the ovarian follicles. It rises in the first half of your cycle, peaking just before ovulation.

### What Estrogen Does

- **Brain:** Boosts serotonin receptors, improving mood, verbal memory, and focus. This is why many people feel sharper and more confident in the follicular phase.
- **Bones:** Essential for maintaining bone density. After menopause, bone loss accelerates as estrogen falls.
- **Heart:** Supports healthy blood vessel elasticity and lipid profiles.
- **Skin:** Promotes collagen production and moisture retention — skin often looks better around ovulation.
- **Uterus:** Builds the uterine lining (endometrium) in preparation for potential implantation.

---

## Progesterone: The Calming Counter

Progesterone is produced by the corpus luteum after ovulation and dominates the luteal phase. It prepares the body for potential pregnancy and — if no implantation occurs — its drop triggers menstruation.

### What Progesterone Does

- **Brain:** Has a calming, sedative effect via GABA receptors. May cause the foggy, slower feeling of the luteal phase.
- **Temperature:** Raises basal body temperature by 0.2–0.5°C after ovulation — the basis of BBT charting.
- **Uterus:** Stabilises the lining built by estrogen, making it receptive to implantation.
- **Gut:** Slows gut motility, which can cause bloating and constipation before your period.

---

## The Balance Matters

Neither hormone works in isolation. It's the **ratio** and **rhythm** of estrogen and progesterone that matters:

- **Oestrogen dominance** — when estrogen is relatively high compared to progesterone — is linked to heavy periods, mood swings, breast tenderness, and fibroid growth.
- **Low progesterone** can cause irregular cycles, spotting, and difficulty maintaining early pregnancy.

---

## Other Key Hormones

**FSH (Follicle-Stimulating Hormone):** Triggers follicle development at the start of each cycle.

**LH (Luteinising Hormone):** The LH surge triggers ovulation — this is what at-home ovulation tests detect.

**Testosterone:** Present in small amounts throughout the cycle; peaks around ovulation and contributes to libido and energy.

**Cortisol:** The stress hormone can suppress reproductive hormones — chronic stress is a major cause of cycle disruption.

---

*Source: [Harvard Health Publishing — Women's Health Hormones](https://www.health.harvard.edu/womens-health/the-hormone-guide) · Updated March 2024*
`,
  },

  // ─────────────────────────────────────────────────────────────────────
  {
    id: '4',
    slug: 'eating-for-your-cycle',
    title: 'Eating for Your Cycle: A Phase-by-Phase Guide',
    category: 'nutrition',
    content_type: 'article',
    thumbnail_url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80',
    reading_time_minutes: 6,
    source_name: 'Medical News Today',
    source_url: 'https://www.medicalnewstoday.com/articles/period-diet',
    published_date: 'April 2024',
    summary: 'Your nutritional needs shift across the four phases of your cycle. Supporting your body with the right foods at the right time can reduce PMS, improve energy, and ease period pain.',
    tags: ['nutrition', 'diet', 'pms', 'cycle', 'food'],
    is_published: true,
    view_count: 0,
    created_at: '2024-04-01T00:00:00Z',
    updated_at: '2024-04-01T00:00:00Z',
    body_markdown: `# Eating for Your Cycle: A Phase-by-Phase Guide

Your hormones don't just affect your mood — they change your metabolism, appetite, and nutrient needs. Aligning your diet with your cycle isn't a gimmick; it's evidence-based nourishment.

---

## Menstrual Phase: Replenish & Restore

**Focus: Iron, zinc, anti-inflammatories**

Blood loss depletes iron and zinc. Inflammation causes cramps. Eating to counter both can ease your period significantly.

**Eat:**
- Red meat, lentils, spinach, tofu (iron)
- Pumpkin seeds, cashews (zinc)
- Ginger, turmeric, omega-3-rich fish (anti-inflammatory)
- Dark chocolate (magnesium — reduces cramping)

**Avoid:** Excess caffeine (constricts blood vessels, worsens cramps) and alcohol (increases prostaglandins — the chemicals that cause cramping).

---

## Follicular Phase: Light & Energising

**Focus: Fermented foods, healthy fats, protein**

Rising estrogen improves insulin sensitivity. Your metabolism is efficient. Focus on clean, energising foods.

**Eat:**
- Eggs, legumes, lean proteins
- Fermented foods (kefir, kimchi, yoghurt) — support estrogen metabolism
- Flaxseeds — contain lignans that help balance estrogen
- Leafy greens, broccoli

---

## Ovulation Phase: Antioxidants & Fibre

**Focus: Liver support, antioxidants**

Your body is working hard around ovulation. Estrogen peaks. Supporting the liver — which metabolises hormones — is key.

**Eat:**
- Colourful vegetables (antioxidants)
- Cruciferous veg (broccoli, Brussels sprouts) — support oestrogen clearance
- Almonds, sunflower seeds (vitamin E)
- Light, easily digestible foods

---

## Luteal Phase: Stabilise Blood Sugar

**Focus: Magnesium, B6, complex carbs**

Progesterone dominates, raising your basal metabolic rate slightly (you burn ~100–300 more calories). Cravings are real and biological. Blood sugar stability is everything.

**Eat:**
- Sweet potato, oats, brown rice (complex carbs — steady blood sugar)
- Salmon, walnuts (omega-3 — reduces PMS inflammation)
- Avocado, dark leafy greens (magnesium — reduces bloating, anxiety, cramps)
- Chickpeas, poultry (B6 — supports progesterone and reduces PMS mood symptoms)

**Why you crave sugar:** Serotonin dips in the late luteal phase. Carbohydrates temporarily boost serotonin — your body is asking for a reason.

---

## Key Nutrients for Cycle Health

| Nutrient | Role | Best Sources |
|---|---|---|
| Iron | Replaces blood loss | Red meat, lentils, spinach |
| Magnesium | Reduces cramps & anxiety | Dark chocolate, avocado, nuts |
| Omega-3 | Anti-inflammatory | Salmon, walnuts, flaxseeds |
| Vitamin B6 | Supports progesterone, reduces PMS | Chickpeas, poultry, banana |
| Zinc | Hormone production | Pumpkin seeds, meat, legumes |

---

*Source: [Medical News Today — Period Diet: Foods to Eat and Avoid](https://www.medicalnewstoday.com/articles/period-diet) · Medically reviewed April 2024*
`,
  },

  // ─────────────────────────────────────────────────────────────────────
  {
    id: '5',
    slug: 'identifying-your-fertile-window',
    title: 'How to Identify Your Fertile Window',
    category: 'fertility',
    content_type: 'article',
    thumbnail_url: 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?auto=format&fit=crop&w=800&q=80',
    reading_time_minutes: 5,
    source_name: 'Mayo Clinic',
    source_url: 'https://www.mayoclinic.org/healthy-lifestyle/getting-pregnant/in-depth/ovulation/art-20045544',
    published_date: 'March 2024',
    summary: 'You can only conceive during a short window each cycle. Understanding when you ovulate — and the five days before it — is the key to both achieving and avoiding pregnancy naturally.',
    tags: ['fertility', 'ovulation', 'cycle tracking', 'conception'],
    is_published: true,
    view_count: 0,
    created_at: '2024-03-10T00:00:00Z',
    updated_at: '2024-03-10T00:00:00Z',
    body_markdown: `# How to Identify Your Fertile Window

An egg is only viable for 12–24 hours after ovulation. But sperm can survive in the female reproductive tract for up to **5 days**. This means your fertile window is approximately **6 days** per cycle: the five days before ovulation, and ovulation day itself.

Understanding this window is essential whether you're trying to conceive, or trying to avoid pregnancy naturally.

---

## When Do You Ovulate?

Ovulation typically occurs **14 days before your next period** — not necessarily 14 days after your last. This distinction matters especially if your cycle length varies.

**Example:**
- 28-day cycle: ovulation around day 14
- 35-day cycle: ovulation around day 21
- 24-day cycle: ovulation around day 10

Tracking your cycle length over 3+ months gives you a much better estimate than any generic calculator.

---

## Signs of Ovulation

### 1. Cervical Mucus Changes
This is the most reliable physical sign. Leading up to ovulation, discharge shifts from:
- Dry or absent → creamy/white → clear, stretchy, and slippery (like raw egg white)

The egg-white consistency indicates peak fertility. It creates an environment where sperm can survive and travel to the egg.

### 2. Basal Body Temperature (BBT)
Your resting temperature rises by **0.2–0.5°C** after ovulation due to progesterone. You must measure immediately upon waking (before any movement) with a basal thermometer.

*Important:* BBT confirms ovulation has already occurred — it doesn't predict it. Use it to learn your pattern over several months.

### 3. LH Surge (Ovulation Predictor Kits)
OPKs detect the surge in LH that triggers ovulation 24–36 hours later. A positive OPK means ovulation is imminent — this is the most actionable real-time signal.

### 4. Mittelschmerz
Some people feel a brief twinge or cramp on one side of the lower abdomen at ovulation. It's caused by the follicle rupturing.

### 5. Libido Spike
Studies show libido peaks around ovulation — your body's way of encouraging conception.

---

## Tracking Methods Compared

| Method | Predicts Ovulation? | Accuracy | Best For |
|---|---|---|---|
| Cervical mucus | Yes (1–5 days before) | High | Daily awareness |
| BBT charting | Confirms (after) | High over time | Pattern learning |
| OPKs | Yes (24–36h before) | Very high | Active trying |
| Cycle apps | Estimates based on past data | Moderate | General tracking |

---

## A Note on Irregular Cycles

If your cycles vary by more than 7–8 days, calendar-based methods are unreliable. OPKs and mucus tracking are better tools. Significant irregularity (fewer than 8 periods per year) warrants medical evaluation.

---

*Source: [Mayo Clinic — Ovulation Signs: When Am I Most Fertile?](https://www.mayoclinic.org/healthy-lifestyle/getting-pregnant/in-depth/ovulation/art-20045544) · Updated March 2024*
`,
  },

  // ─────────────────────────────────────────────────────────────────────
  {
    id: '6',
    slug: 'mood-hormones-menstrual-cycle',
    title: 'Mood, Anxiety & Your Hormones: The Brain-Cycle Link',
    category: 'mental_health',
    content_type: 'article',
    thumbnail_url: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=800&q=80',
    reading_time_minutes: 5,
    source_name: 'Verywell Health',
    source_url: 'https://www.verywellhealth.com/mood-changes-during-menstrual-cycle-5271143',
    published_date: 'January 2024',
    summary: 'Mood swings across your cycle are not "just hormones" — they reflect real changes in brain chemistry. Understanding why they happen is the first step to managing them.',
    tags: ['mental health', 'mood', 'pms', 'pmdd', 'anxiety'],
    is_published: true,
    view_count: 0,
    created_at: '2024-01-20T00:00:00Z',
    updated_at: '2024-01-20T00:00:00Z',
    body_markdown: `# Mood, Anxiety & Your Hormones: The Brain-Cycle Link

"It's just PMS" is a phrase that has dismissed real suffering for decades. The mood changes that many people experience across their cycle are not imagined — they reflect genuine, measurable shifts in brain chemistry driven by hormonal fluctuations.

---

## How Hormones Affect the Brain

Estrogen and progesterone have direct effects on neurotransmitters — the chemical messengers of the brain.

**Estrogen:**
- Increases serotonin production and sensitivity (the "wellbeing" neurotransmitter)
- Boosts dopamine (reward, motivation)
- Supports GABA (the calming neurotransmitter)

When estrogen rises in the follicular phase, many people feel lifted, social, and energised. When it drops sharply before a period, these effects reverse rapidly.

**Progesterone:**
- Its metabolite (allopregnanolone) modulates GABA receptors — with a calming, sedative effect in moderate amounts
- In the late luteal phase, as progesterone falls, this calming effect disappears abruptly — contributing to anxiety and irritability

---

## Mood Patterns Across the Cycle

| Phase | Typical Mood |
|---|---|
| Menstrual (days 1–5) | Low energy, reflective, sometimes tearful |
| Follicular (days 6–13) | Rising energy, optimism, sociability |
| Ovulation (day 14 ±2) | Confidence, high libido, extroversion |
| Early luteal (days 15–21) | Calm, focused, productive |
| Late luteal (days 22–28) | Irritability, anxiety, low mood, cravings |

These are patterns, not rules — individual experience varies significantly.

---

## PMS vs PMDD

**Premenstrual Syndrome (PMS)** affects up to 75% of people with cycles. Symptoms appear in the week or two before a period and resolve within a few days of bleeding starting.

**Premenstrual Dysphoric Disorder (PMDD)** is a severe form affecting 3–8% of people. It involves:
- Severe mood swings, despair, or rage
- Significant anxiety or panic
- Symptoms severe enough to disrupt work, relationships, and daily life

PMDD is a recognised psychiatric condition listed in the DSM-5. It is **not** simply "bad PMS" and typically requires treatment.

---

## What Helps

### Lifestyle
- **Regular exercise** — the most evidence-backed intervention for PMS mood symptoms; increases endorphins and serotonin
- **Sleep** — sleep deprivation dramatically worsens emotional regulation
- **Reducing caffeine and alcohol** in the luteal phase
- **Magnesium and B6 supplementation** — both have RCT evidence supporting mood improvement in PMS

### Therapeutic
- **SSRIs** — particularly effective for PMDD; can be taken continuously or just in the luteal phase
- **CBT** — helps with cognitive patterns triggered by hormonal mood shifts
- **The combined pill** — can stabilise hormonal fluctuations for some

---

## When to Seek Help

If premenstrual mood changes are affecting your relationships, work, or quality of life, speak to your GP. PMDD in particular is frequently underdiagnosed and highly treatable.

---

*Source: [Verywell Health — Mood Changes During the Menstrual Cycle](https://www.verywellhealth.com/mood-changes-during-menstrual-cycle-5271143) · Reviewed January 2024*
`,
  },

  // ─────────────────────────────────────────────────────────────────────
  {
    id: '7',
    slug: 'pcos-insulin-resistance',
    title: 'PCOS & Insulin Resistance: Breaking the Cycle',
    category: 'pcos',
    content_type: 'article',
    thumbnail_url: 'https://images.unsplash.com/photo-1579154341098-e4e158cc7f55?auto=format&fit=crop&w=800&q=80',
    reading_time_minutes: 6,
    source_name: 'Endocrine Society',
    source_url: 'https://www.endocrine.org/patient-engagement/endocrine-library/pcos',
    published_date: 'February 2024',
    summary: 'Around 70% of people with PCOS have insulin resistance — even those without overweight. Understanding this link is key to managing PCOS symptoms from the root.',
    tags: ['pcos', 'insulin resistance', 'metabolic health', 'treatment'],
    is_published: true,
    view_count: 0,
    created_at: '2024-02-10T00:00:00Z',
    updated_at: '2024-02-10T00:00:00Z',
    body_markdown: `# PCOS & Insulin Resistance: Breaking the Cycle

For many years, PCOS was thought of primarily as a reproductive disorder. We now understand it is a **metabolic and endocrine condition** — and insulin resistance sits at the heart of it for the majority of people affected.

---

## What Is Insulin Resistance?

Insulin is the hormone that allows cells to absorb glucose from the bloodstream for energy. In insulin resistance, cells don't respond normally — they need **more insulin** to do the same job.

The pancreas compensates by producing more insulin. These elevated insulin levels (hyperinsulinaemia) directly stimulate the ovaries to produce excess androgens (testosterone), disrupting ovulation and causing many hallmark PCOS symptoms.

---

## How Insulin Drives PCOS Symptoms

**Excess insulin →** ovaries produce more androgens (testosterone)

**Excess androgens →**
- Disrupted ovulation (irregular or absent periods)
- Acne (androgens stimulate sebum production)
- Excess facial/body hair (hirsutism)
- Male-pattern hair thinning
- Difficulty with weight management

This is why PCOS is not just "a period problem" — it's a systemic hormonal cascade rooted in how the body processes glucose.

---

## Who Has Insulin Resistance With PCOS?

Around **70% of people with PCOS** have insulin resistance — and this is **not** dependent on body weight. Thin people with PCOS commonly have insulin resistance, making weight-based assumptions particularly harmful.

Markers of insulin resistance include:
- Fasting glucose and insulin levels (HOMA-IR score)
- Skin darkening at the neck or armpits (acanthosis nigricans)
- Skin tags
- Energy crashes after meals high in refined carbs

---

## Breaking the Cycle: Treatment

### Diet
- **Low-glycaemic index diet** — reduces insulin spikes; strongest evidence for PCOS management
- **Mediterranean diet** — associated with reduced androgens and improved insulin sensitivity
- **Reducing ultra-processed foods and added sugar**
- **Adequate protein** — slows glucose absorption and reduces post-meal insulin demand

### Exercise
Both **aerobic exercise** (30 min, 5x/week) and **strength training** improve insulin sensitivity independently of weight loss. Even a 5% reduction in weight in those with overweight can restore ovulation.

### Inositol
**Myo-inositol** (and the combination myo + D-chiro-inositol) has strong evidence as a supplement for insulin resistance in PCOS. It improves egg quality, restores ovulation, and lowers androgens with minimal side effects.

### Metformin
A diabetes medication now widely used for PCOS. Directly reduces hepatic glucose production, lowers insulin, and can restore menstrual regularity. Often used alongside lifestyle changes.

---

## Monitoring Long-Term Health

People with PCOS and insulin resistance have a significantly elevated risk of:
- Type 2 diabetes (3–7x increased risk)
- Cardiovascular disease
- Non-alcoholic fatty liver disease
- Endometrial cancer (due to anovulation and unopposed estrogen)

Annual metabolic screening — including fasting glucose, lipids, and blood pressure — is recommended.

---

*Source: [Endocrine Society — Polycystic Ovary Syndrome (PCOS)](https://www.endocrine.org/patient-engagement/endocrine-library/pcos) · Published February 2024*
`,
  },

  // ─────────────────────────────────────────────────────────────────────
  {
    id: '8',
    slug: 'period-pain-when-to-worry',
    title: 'Period Pain: What Is Normal, and When to Seek Help',
    category: 'cycle_basics',
    content_type: 'article',
    thumbnail_url: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=800&q=80',
    reading_time_minutes: 5,
    source_name: 'ACOG',
    source_url: 'https://www.acog.org/womens-health/faqs/dysmenorrhea-painful-periods',
    published_date: 'April 2024',
    summary: 'Some period pain is normal — but pain that disrupts daily life, requires high doses of pain relief, or has worsened over time may signal an underlying condition like endometriosis.',
    tags: ['period pain', 'dysmenorrhea', 'endometriosis', 'cramps'],
    is_published: true,
    view_count: 0,
    created_at: '2024-04-05T00:00:00Z',
    updated_at: '2024-04-05T00:00:00Z',
    body_markdown: `# Period Pain: What Is Normal, and When to Seek Help

Up to **80% of people** with periods experience menstrual pain (dysmenorrhea) at some point in their lives. For most, it's a mild to moderate inconvenience. For some, it is debilitating — and that is not something to simply endure.

---

## Primary vs Secondary Dysmenorrhea

**Primary dysmenorrhea** is pain caused by the natural process of menstruation itself — specifically, the release of prostaglandins, which cause uterine contractions to expel the lining. It typically:
- Begins 1–2 days before or at the start of the period
- Lasts 1–3 days
- Responds to NSAIDs (ibuprofen, naproxen)
- Is present since your first periods

**Secondary dysmenorrhea** is pain caused by an underlying medical condition. It tends to:
- Worsen over time (progressive pain is a red flag)
- Begin earlier in the cycle or persist beyond the period
- Not fully respond to standard pain relief
- Be accompanied by other symptoms

---

## Conditions That Cause Secondary Dysmenorrhea

### Endometriosis
Tissue similar to the uterine lining grows outside the uterus — on the ovaries, fallopian tubes, bladder, bowel. It bleeds monthly with nowhere to go, causing inflammation, adhesions, and severe pain.

**Key signs:** Severe cramps, pain during sex (dyspareunia), pain with bowel movements or urination during period, infertility, chronic pelvic pain.

Average time to diagnosis: **7–10 years**. If you suspect it, advocate for specialist referral.

### Adenomyosis
The uterine lining grows into the muscle wall of the uterus itself. Often causes heavy, painful periods and an enlarged, tender uterus.

### Uterine Fibroids
Non-cancerous growths in the uterine wall that can cause heavy bleeding and pressure pain.

### Pelvic Inflammatory Disease (PID)
Infection of the reproductive organs — usually from untreated STIs. Causes pelvic pain, fever, and unusual discharge.

---

## Managing Primary Dysmenorrhea

**NSAIDs (most effective first-line treatment):**
Ibuprofen (400–600mg) or naproxen should be started 1–2 days before the period begins and taken regularly (not just when pain peaks). They block prostaglandin production, reducing cramp severity.

**Heat:** A heating pad or warm bath reduces cramping as effectively as low-dose ibuprofen in some studies.

**Exercise:** Regular aerobic exercise reduces prostaglandin levels over time.

**Hormonal contraception:** The combined pill, hormonal IUS (Mirena), or the contraceptive injection can significantly reduce or eliminate period pain by thinning the lining and suppressing ovulation.

**Supplements with evidence:** Magnesium, omega-3 fatty acids, and vitamin D have all shown benefit in reducing dysmenorrhea severity in RCTs.

---

## When to See a Doctor

Seek medical advice if:
- Pain is not controlled by standard NSAIDs at recommended doses
- Pain is worsening cycle by cycle
- You experience pain between periods
- Sex is painful
- You have heavy bleeding (soaking a pad/tampon every 1–2 hours)
- You suspect you may have endometriosis

Do not let pain be dismissed. It is not "just part of being a woman."

---

*Source: [American College of Obstetricians and Gynecologists — Dysmenorrhea: Painful Periods](https://www.acog.org/womens-health/faqs/dysmenorrhea-painful-periods) · Updated April 2024*
`,
  },

  // ─────────────────────────────────────────────────────────────────────
  {
    id: '9',
    slug: 'gynecological-emergency-warning-signs',
    title: 'Gynaecological Emergencies: Warning Signs You Should Never Ignore',
    category: 'emergency_care',
    content_type: 'article',
    thumbnail_url: 'https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?auto=format&fit=crop&w=800&q=80',
    reading_time_minutes: 5,
    source_name: 'Royal College of Obstetricians & Gynaecologists',
    source_url: 'https://www.rcog.org.uk/for-the-public/browse-our-patient-information/pelvic-pain/',
    published_date: 'March 2024',
    summary: 'Some gynaecological symptoms require urgent medical attention. Knowing the difference between normal discomfort and a potential emergency can save your life.',
    tags: ['emergency', 'ectopic pregnancy', 'ovarian torsion', 'pelvic pain', 'safety'],
    is_published: true,
    view_count: 0,
    created_at: '2024-03-15T00:00:00Z',
    updated_at: '2024-03-15T00:00:00Z',
    body_markdown: `# Gynaecological Emergencies: Warning Signs You Should Never Ignore

Most pelvic pain is not dangerous — but some symptoms are red flags that require immediate emergency care. Knowing which is which can be life-saving.

---

## Call Emergency Services (999/911) Immediately For:

- **Sudden, severe pelvic or abdominal pain** — especially if it came on rapidly and is unlike anything you have felt before
- **Heavy vaginal bleeding soaking more than one pad per hour** for two or more consecutive hours
- **Fainting, dizziness, or signs of shock** (rapid weak pulse, pale clammy skin, confusion) alongside pelvic pain or bleeding
- **Shoulder tip pain combined with pelvic pain** — a classic sign of internal bleeding from a ruptured ectopic pregnancy

---

## Conditions That Cause Gynaecological Emergencies

### Ectopic Pregnancy
A pregnancy implanted outside the uterus — usually in a fallopian tube. As it grows, it can rupture, causing life-threatening internal bleeding.

**Symptoms:**
- Sharp, sudden pain on one side of the lower abdomen
- Shoulder tip pain (blood irritating the diaphragm)
- Vaginal bleeding (can be light)
- Nausea, dizziness, fainting

**Risk:** Highest in those with a history of ectopic pregnancy, PID, IUD use, or tubal surgery.

**Action:** This is a medical emergency. Go to A&E immediately if you are or could be pregnant and have these symptoms.

---

### Ovarian Torsion
The ovary twists on its ligaments, cutting off blood supply. Without treatment within hours, the ovary can die.

**Symptoms:**
- Sudden, severe one-sided pelvic pain (often described as the worst pain imaginable)
- Nausea and vomiting
- Pain may come in waves initially, then become constant

**Action:** Go to A&E immediately. Diagnosis requires ultrasound; treatment is surgery.

---

### Ruptured Ovarian Cyst
Most ovarian cysts are harmless and resolve on their own. A ruptured cyst can cause significant internal bleeding.

**When it becomes an emergency:**
- Sudden sharp pain followed by dull ache that doesn't improve
- Symptoms of internal bleeding: rapid heart rate, dizziness, shoulder pain

**Note:** Many ruptured cysts resolve without intervention, but those causing haemodynamic instability require emergency surgery.

---

### Sepsis from Pelvic Infection
Untreated pelvic inflammatory disease (PID) or post-surgical infection can progress to sepsis — a life-threatening systemic response to infection.

**Sepsis warning signs (Think SEPSIS):**
- **S**lurred speech or confusion
- **E**xtreme shivering or fever above 38°C
- **P**assing no urine in a day
- **S**evere breathlessness
- **I**t feels like you might die
- **S**kin mottled or discoloured

**Action:** If you suspect sepsis, call 999 or go to A&E. Do not wait to see if it improves.

---

## Symptoms That Need Urgent (Same Day) Attention

See a GP or urgent care today for:
- Pelvic pain severe enough to prevent normal activity
- Fever above 38°C with pelvic pain or unusual discharge
- Abnormal bleeding if you have a confirmed pregnancy
- Suspected miscarriage

---

## Trust Your Body

You know what is normal for you. If something feels dramatically wrong — especially sudden severe pain — do not wait. Seek emergency care first and answer questions later.

---

*Source: [Royal College of Obstetricians & Gynaecologists — Pelvic Pain](https://www.rcog.org.uk/for-the-public/browse-our-patient-information/pelvic-pain/) · Updated March 2024*
`,
  },

  // ─────────────────────────────────────────────────────────────────────
  {
    id: '10',
    slug: 'toxic-shock-syndrome',
    title: 'Toxic Shock Syndrome: What Every Period User Needs to Know',
    category: 'emergency_care',
    content_type: 'article',
    thumbnail_url: 'https://images.unsplash.com/photo-1631815588090-d4bfec5b1ccb?auto=format&fit=crop&w=800&q=80',
    reading_time_minutes: 4,
    source_name: 'NHS',
    source_url: 'https://www.nhs.uk/conditions/toxic-shock-syndrome/',
    published_date: 'January 2024',
    summary: 'Toxic Shock Syndrome (TSS) is rare but can be fatal within hours. Understanding the symptoms and risk factors is essential for anyone who uses tampons or menstrual cups.',
    tags: ['toxic shock syndrome', 'tampons', 'menstrual cup', 'emergency', 'safety'],
    is_published: true,
    view_count: 0,
    created_at: '2024-01-10T00:00:00Z',
    updated_at: '2024-01-10T00:00:00Z',
    body_markdown: `# Toxic Shock Syndrome: What Every Period User Needs to Know

Toxic Shock Syndrome (TSS) is rare — approximately 1–3 cases per 100,000 people per year — but it is serious. It can progress from mild flu-like symptoms to organ failure and death within 24–48 hours. Being able to recognise it early is potentially life-saving.

---

## What Is TSS?

TSS is caused by toxins produced by two bacteria: **Staphylococcus aureus** (staph) and, less commonly, **Streptococcus pyogenes** (strep). These bacteria are normally harmless on the skin or in the body — but in certain conditions, they release toxins that trigger a severe immune response.

Although TSS became associated with tampon use in the 1980s, it can also occur after surgery, burns, wounds, or with any retained foreign body.

---

## Recognising TSS: Symptoms

TSS can escalate rapidly. Learn these warning signs:

**Early symptoms** (flu-like, easily dismissed):
- Sudden high fever (38.9°C / 102°F or above)
- Vomiting or diarrhoea
- Muscle aches
- Headache

**Progressing symptoms:**
- A flat, red rash resembling sunburn — often covering the trunk, palms, and soles
- Dizziness or fainting (blood pressure dropping)
- Confusion or disorientation
- Redness of the eyes, mouth, or throat

**If you experience these symptoms while using a tampon or menstrual cup:** Remove it immediately and go to A&E. Tell medical staff you may have TSS.

---

## Risk Factors

- Using **high-absorbency tampons** (super or super-plus)
- Leaving a tampon in for **more than 8 hours**
- Using tampons overnight
- Using a **menstrual cup** left in too long
- A forgotten tampon or cup

---

## Reducing Your Risk

**For tampon users:**
- Use the **lowest absorbency** for your flow — never use super tampons on light days
- Change tampons every **4–8 hours** — never leave one in overnight
- Alternate tampons with pads or period underwear, especially overnight
- Wash hands before and after insertion

**For menstrual cup users:**
- Follow manufacturer instructions — most recommend emptying every 8–12 hours
- Sterilise the cup between cycles

---

## Treatment

TSS is treated in hospital with intravenous antibiotics and fluids. In severe cases, intensive care is required. The earlier treatment begins, the better the outcome. Do not wait to see if symptoms improve — go straight to A&E.

---

## The Bottom Line

TSS is rare, and you should not be frightened of using tampons — but you should be informed. Change tampons regularly, use the right absorbency, and know the signs.

---

*Source: [NHS — Toxic Shock Syndrome](https://www.nhs.uk/conditions/toxic-shock-syndrome/) · Reviewed January 2024*
`,
  },

  // ─────────────────────────────────────────────────────────────────────
  {
    id: '11',
    slug: 'your-first-period',
    title: 'Your First Period: What to Expect and How to Prepare',
    category: 'teen_health',
    content_type: 'article',
    thumbnail_url: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=800&q=80',
    reading_time_minutes: 5,
    source_name: 'American Academy of Pediatrics',
    source_url: 'https://www.healthychildren.org/English/ages-stages/gradeschool/puberty/Pages/Menstruation-What-to-Expect.aspx',
    published_date: 'February 2024',
    summary: 'Getting your first period can feel overwhelming — but it is a normal, healthy part of growing up. Here is everything you need to know about what to expect and how to feel prepared.',
    tags: ['teen health', 'first period', 'puberty', 'menarche', 'periods'],
    is_published: true,
    view_count: 0,
    created_at: '2024-02-20T00:00:00Z',
    updated_at: '2024-02-20T00:00:00Z',
    body_markdown: `# Your First Period: What to Expect and How to Prepare

Getting your first period — called **menarche** — is a major milestone in puberty. For many people, it arrives somewhere between ages 10 and 16, with 12–13 being most common. Whenever yours arrives, knowing what to expect makes it a lot less daunting.

---

## Signs That Your Period Is Coming Soon

Your first period usually arrives about **2–3 years after your breasts start developing** and around **6–12 months after you notice white or clear vaginal discharge** (which is completely normal).

Other signs puberty is progressing:
- Pubic and underarm hair growing
- Hips widening
- Growth spurt
- Skin becoming oilier

---

## What Your First Period Is Actually Like

Every person's experience is different, but first periods are often:

- **Light** — Just a few spots or a pinkish-brown discharge. It may not look like what you expected.
- **Short** — Often just 2–3 days at first.
- **Irregular** — Your cycle may not become regular for 1–2 years. Cycles varying between 21 and 45 days are normal in the first year.
- **Possibly crampy** — Some mild cramping is common; if pain is severe, talk to a doctor.

---

## Period Products: Your Options

**Pads (sanitary towels)**
The easiest option to start with. They stick to your underwear. Come in different sizes for different flow levels. Change every 3–4 hours.

**Tampons**
Inserted into the vagina. Safe to use from your very first period if you are comfortable. Use the lowest absorbency for your flow. Change every 4–8 hours. Never leave in for longer than 8 hours.

**Menstrual cups**
A small silicone cup inserted into the vagina that collects rather than absorbs blood. Reusable and eco-friendly. Can feel more complex at first but becomes easy with practice.

**Period underwear**
Looks like regular underwear but has built-in absorbent layers. Great for overnight or as backup.

---

## How to Track Your Cycle

Once your period starts, note:
- The date it starts (Day 1 of your cycle)
- How long it lasts
- How heavy it is

Even if your cycle is irregular at first, this data will help you and your doctor understand your pattern over time. Apps like Attosa make this easy.

---

## Talking to Someone

It is completely okay — and helpful — to talk to a trusted adult, parent, guardian, school nurse, or doctor about your period. If you feel you cannot talk to anyone at home, your GP or a school counsellor can help.

---

## When to See a Doctor

Speak to a doctor if:
- You are 15 or older and have not yet had a period
- Your periods are very heavy (soaking a pad every 1–2 hours)
- You have severe cramping that does not improve with painkillers
- Your period stops for 3+ months (and you are not pregnant)
- You feel very anxious or distressed about your period

---

*Source: [American Academy of Pediatrics — Menstruation: What to Expect](https://www.healthychildren.org/English/ages-stages/gradeschool/puberty/Pages/Menstruation-What-to-Expect.aspx) · Updated February 2024*
`,
  },

  // ─────────────────────────────────────────────────────────────────────
  {
    id: '12',
    slug: 'irregular-periods-teens',
    title: 'Irregular Periods in Teens: What Is Normal and What Is Not',
    category: 'teen_health',
    content_type: 'article',
    thumbnail_url: 'https://images.unsplash.com/photo-1601233749202-95d04d5b3c00?auto=format&fit=crop&w=800&q=80',
    reading_time_minutes: 5,
    source_name: 'Mayo Clinic',
    source_url: 'https://www.mayoclinic.org/diseases-conditions/amenorrhea/symptoms-causes/syc-20369299',
    published_date: 'March 2024',
    summary: 'Irregular cycles in the first 1–2 years after your first period are completely normal. But some irregularities — especially beyond year two — can signal an underlying condition worth investigating.',
    tags: ['teen health', 'irregular periods', 'pcos', 'amenorrhea', 'puberty'],
    is_published: true,
    view_count: 0,
    created_at: '2024-03-05T00:00:00Z',
    updated_at: '2024-03-05T00:00:00Z',
    body_markdown: `# Irregular Periods in Teens: What Is Normal and What Is Not

The first few years after your period begins is a time of hormonal adjustment. The brain-ovary communication system (the HPG axis) takes time to mature — and until it does, cycles can be unpredictable. Understanding what is expected versus what needs attention saves unnecessary worry — and prevents real problems from being dismissed.

---

## What Is Normal in the First 1–2 Years

In the year after your first period, cycles ranging from **21 to 45 days** are considered normal. Your period may:
- Skip months
- Be very light one month and heavier the next
- Last anywhere from 2 to 7 days
- Come with varying levels of cramping

This is because the hypothalamus, pituitary gland, and ovaries are still fine-tuning their communication. Ovulation may not happen every cycle initially, making timing unpredictable.

**After 2–3 years,** most people settle into a more regular pattern of 21–35 days.

---

## What Can Make Teen Periods Irregular

**Normal causes:**
- The first 1–2 years post-menarche (expected)
- Significant stress (exams, life events)
- Dramatic changes in weight
- Intense athletic training
- Illness

**Medical causes worth investigating:**
- PCOS (Polycystic Ovary Syndrome)
- Thyroid disorders (both overactive and underactive)
- Hyperprolactinaemia (elevated prolactin from the pituitary gland)
- Primary ovarian insufficiency (rare)
- Eating disorders affecting hormonal function

---

## PCOS in Teenagers

PCOS is one of the most common reasons for persistent irregular periods in teens. However, diagnosing it in adolescents is complex — the normal irregularity of early puberty can overlap with PCOS symptoms.

**Features that raise suspicion in teens:**
- Cycles remaining irregular (longer than 35–40 days) beyond 2–3 years post-menarche
- Signs of excess androgens: persistent acne, unwanted hair growth on the face/body, or scalp hair thinning
- Difficulty maintaining weight

If your GP suspects PCOS, they may order blood tests (hormones, glucose, insulin) and a pelvic ultrasound.

---

## Hypothalamic Amenorrhea: When Your Period Stops

If periods stop for 3+ months (and pregnancy is not the cause), this is called **secondary amenorrhea**. In teens, a common cause is **hypothalamic amenorrhea** — where the brain suppresses reproductive hormones in response to:

- Significant calorie restriction or low energy availability
- Excessive exercise
- Very low body weight
- Chronic stress

This is the body's protective mechanism. But long-term, it affects bone density significantly — bones need estrogen to stay strong, and the teenage years are the most critical window for bone development.

**If your periods have stopped, speak to your doctor.** This is not something to wait out.

---

## Tracking Helps — Even When Cycles Are Irregular

Writing down when your period starts and ends — even if it is all over the place — gives you and your doctor real data. Even noting "no period this month" is useful information.

After 12 months of tracking, patterns (or consistent absence of patterns) become much clearer.

---

## When to See a Doctor

Make an appointment if:
- Your period has not started by age 15
- You had regular periods and they have now been absent for 3+ months
- Cycles are consistently shorter than 21 days or longer than 45 days, two years after your first period
- You have signs of excess androgens (acne on jaw/chest, unwanted facial hair)
- Your periods are so heavy they impact daily life
- You are concerned about your eating or exercise habits in relation to your period

---

*Source: [Mayo Clinic — Amenorrhea](https://www.mayoclinic.org/diseases-conditions/amenorrhea/symptoms-causes/syc-20369299) · Updated March 2024*
`,
  },

  // ─────────────────────────────────────────────────────────────────────
  {
    id: '13',
    slug: 'perimenopause-transition',
    title: 'Perimenopause: Understanding the Transition Before Menopause',
    category: 'menopause',
    content_type: 'article',
    thumbnail_url: 'https://images.unsplash.com/photo-1559757175-5700dde675bc?auto=format&fit=crop&w=800&q=80',
    reading_time_minutes: 6,
    source_name: 'The Menopause Society',
    source_url: 'https://menopause.org/patient-education/menopause-faqs-understanding-the-menopausal-transition',
    published_date: 'April 2024',
    summary: 'Perimenopause — the transition to menopause — can begin up to 10 years before your last period. Understanding what is happening hormonally helps make sense of the often confusing symptoms.',
    tags: ['perimenopause', 'menopause', 'hormones', 'transition', 'midlife'],
    is_published: true,
    view_count: 0,
    created_at: '2024-04-10T00:00:00Z',
    updated_at: '2024-04-10T00:00:00Z',
    body_markdown: `# Perimenopause: Understanding the Transition Before Menopause

Menopause — defined as 12 consecutive months without a period — gets much of the attention. But the transition leading up to it, **perimenopause**, is where most of the symptoms occur, and it can last anywhere from **2 to 10 years**.

---

## What Is Perimenopause?

Perimenopause begins when the ovaries start to wind down egg production and estrogen levels become erratic. It typically starts in the **mid-to-late 40s**, though it can begin as early as 35–40 for some people.

During perimenopause, cycles become unpredictable. Ovulation is irregular. Estrogen fluctuates — sometimes surging, sometimes dropping — before ultimately declining. This hormonal volatility is responsible for most symptoms.

---

## How Your Cycle Changes

The first signs are often changes in your period:
- **Shorter cycles** — The follicular phase shortens first; you may bleed every 21–23 days instead of 28
- **Heavier or lighter flow**
- **Longer gaps between periods** — Eventually, cycles stretch to 60, 90 days, then stop
- **Spotting between periods**
- **Skipped periods** that return unpredictably

You can still get pregnant during perimenopause as long as you are still ovulating. Contraception remains necessary until 12 months after your last period (menopause).

---

## Common Symptoms

Estrogen receptors exist throughout the body — in the brain, bones, heart, vagina, skin, and bladder. When estrogen becomes unstable, the effects are wide-reaching.

**Vasomotor symptoms:**
- **Hot flushes** — sudden waves of heat, usually lasting 1–5 minutes; most common symptom, affecting up to 75% of people
- **Night sweats** — hot flushes during sleep, often disrupting rest significantly
- **Cold chills** following hot flushes

**Neurological and mood:**
- Brain fog, difficulty concentrating
- Low mood, anxiety, irritability
- Sleep disturbance (independent of night sweats)
- Memory lapses

**Genitourinary:**
- Vaginal dryness and discomfort
- Increased urinary urgency or UTIs
- Reduced libido

**Musculoskeletal:**
- Joint aches and stiffness
- Reduced muscle mass

---

## Hormonal Changes Explained

In perimenopause, the ovaries produce less **inhibin B**, which normally suppresses FSH. As inhibin falls, FSH rises — attempting to stimulate the ovaries. Estrogen production becomes erratic as follicle numbers deplete.

Blood tests measuring FSH and estradiol are unreliable for diagnosing perimenopause because levels fluctuate so much day to day. Perimenopause is primarily a **clinical diagnosis** based on symptoms and age.

---

## Bone Health: A Critical Window

Estrogen is essential for bone density. In the 5–10 years around menopause, bone loss accelerates significantly — particularly in the first 2–3 years post-menopause.

**Steps to protect bone health during perimenopause:**
- Adequate calcium: 1,000–1,200 mg/day (from food first)
- Vitamin D: 800–1,000 IU/day (many people are deficient)
- Weight-bearing and resistance exercise — essential for bone stimulation
- Avoiding smoking and excessive alcohol

---

## When to See Your Doctor

Speak to a doctor if:
- Symptoms are affecting your sleep, mood, or daily life
- Periods are extremely heavy (soaking through products frequently)
- You have long gaps between periods and are unsure about pregnancy risk
- You want to discuss HRT (hormone replacement therapy) as a treatment option

---

*Source: [The Menopause Society — Understanding the Menopausal Transition](https://menopause.org/patient-education/menopause-faqs-understanding-the-menopausal-transition) · Updated April 2024*
`,
  },

  // ─────────────────────────────────────────────────────────────────────
  {
    id: '14',
    slug: 'managing-menopause-symptoms',
    title: 'Managing Menopause Symptoms: An Evidence-Based Guide',
    category: 'menopause',
    content_type: 'article',
    thumbnail_url: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=800&q=80',
    reading_time_minutes: 7,
    source_name: 'Cleveland Clinic',
    source_url: 'https://my.clevelandclinic.org/health/diseases/21841-menopause',
    published_date: 'March 2024',
    summary: 'Menopause symptoms range from mildly inconvenient to life-disrupting. Evidence-based treatments — from HRT to lifestyle strategies — can dramatically improve quality of life.',
    tags: ['menopause', 'HRT', 'hot flushes', 'treatment', 'lifestyle'],
    is_published: true,
    view_count: 0,
    created_at: '2024-03-20T00:00:00Z',
    updated_at: '2024-03-20T00:00:00Z',
    body_markdown: `# Managing Menopause Symptoms: An Evidence-Based Guide

Menopause is not a disease — but its symptoms can significantly affect quality of life, work, relationships, and mental health. The good news: there are highly effective treatments. You do not have to simply endure it.

---

## Hormone Replacement Therapy (HRT)

HRT — also called Menopausal Hormone Therapy (MHT) — is the most effective treatment for menopausal symptoms. Modern HRT has been substantially rehabilitated following the initial negative interpretation of the 2002 WHI study, which was found to be poorly applied to the general menopause population.

**Current evidence shows that for most healthy women under 60, or within 10 years of menopause, HRT:**
- Reduces hot flushes and night sweats by 75–90%
- Improves sleep quality
- Reduces mood disturbance and brain fog
- Prevents bone loss (and fractures)
- May reduce risk of type 2 diabetes and cardiovascular disease when started early

### Types of HRT

**Combined HRT** (estrogen + progesterone): Required if you have a uterus, to protect the endometrium from estrogen-driven overgrowth.

**Estrogen-only HRT**: Used only after hysterectomy.

**Forms available:**
- Patches (most common; bypasses the liver, lower clot risk)
- Gels applied to skin
- Tablets (slightly higher clot and stroke risk vs transdermal)
- Vaginal estrogen (local only; for genitourinary symptoms; very low systemic absorption)

**Body-identical progesterone** (micronised progesterone / Utrogestan) has a better safety profile than older synthetic progestogens.

### Who Should Avoid HRT?

HRT is not suitable for everyone. Discuss with your doctor if you have a history of:
- Hormone-sensitive cancers (breast, endometrial)
- Unexplained vaginal bleeding
- Active liver disease
- Recent stroke or blood clot (venous thromboembolism)

---

## Non-Hormonal Treatments

For those who cannot or choose not to use HRT:

**SSRIs and SNRIs** (e.g., venlafaxine, escitalopram): Reduce hot flush frequency by ~50–60%. Also effective for mood symptoms.

**Fezolinetant** (Veoza): A newer non-hormonal medication that blocks neurokinin B — the brain signal responsible for triggering hot flushes. Approved in the UK and US in 2023–2024.

**Gabapentin**: Reduces hot flushes, particularly useful if sleep disruption is prominent.

**Clonidine**: Modest benefit for hot flushes.

---

## Genitourinary Syndrome of Menopause (GSM)

Vaginal dryness, discomfort during sex, and urinary symptoms affect up to 50% of post-menopausal people and — unlike hot flushes — often do not improve without treatment.

**Vaginal estrogen** (creams, pessaries, rings) is safe, effective, and very low-risk even for people who cannot use systemic HRT. It is dramatically underused. There is no increased cancer risk with vaginal estrogen.

**Ospemifene**: An oral SERM (selective estrogen receptor modulator) for genitourinary symptoms; good option for those who cannot use vaginal products.

**Lubricants and moisturisers**: Water-based or silicone-based lubricants for sex; vaginal moisturisers (e.g., Replens) used regularly improve long-term comfort.

---

## Lifestyle Strategies With Good Evidence

**Exercise:** Both aerobic exercise and strength training reduce hot flush frequency, improve mood, protect bones and cardiovascular health, and improve sleep.

**Cognitive Behavioural Therapy (CBT):** Highly effective for menopausal mood symptoms and hot flush distress — comparable to medication in some studies.

**Diet:** Mediterranean-style eating is associated with reduced vasomotor symptoms. Maintaining healthy weight reduces hot flush frequency and cardiovascular risk.

**Reducing triggers:** Hot flushes can be triggered by caffeine, alcohol, spicy foods, heat, and stress. Identifying your personal triggers helps.

**Sleep hygiene:** Cooling the bedroom (16–18°C), moisture-wicking bedding, and limiting alcohol all help with night-sweat-disrupted sleep.

---

## The Bottom Line

Menopause is a normal life stage — but suffering through it unnecessarily is not. Speak to a doctor who takes your symptoms seriously. HRT is safe for most people and dramatically effective. If one treatment does not work, others are available.

---

*Source: [Cleveland Clinic — Menopause](https://my.clevelandclinic.org/health/diseases/21841-menopause) · Reviewed March 2024*
`,
  },
];

export function getArticleBySlug(slug: string): Article | undefined {
  return ARTICLES.find((a) => a.slug === slug);
}

export function getArticlesByCategory(category: ContentCategory | 'all'): Article[] {
  if (category === 'all') return ARTICLES;
  return ARTICLES.filter((a) => a.category === category);
}
