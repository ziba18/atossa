<div align="center">
  <img src="assets/Atossa-logo.png" alt="Atossa logo" width="140" />

  # Atossa

  **A symptom-capture companion for people with PCOS or endometriosis, built with Expo, React Native, and a Python backend.**

  Put symptoms into your own words, keep track of appointments and medicines, and bring a clear, GP-ready summary to your doctor.
</div>

---

## Features

- **Today** — one prompt: speak or type how you're feeling in your own words. Atossa asks only the follow-ups that are missing (where, how bad 0–10, how long, did it stop you doing things), shows a "Here's what I noted" card, and saves it. Also a quick "Rough day" log, a Log bleeding sheet, your next appointment and your latest note. No AI writes anything here, so nothing diagnostic can appear.
- **Timeline** — every note in your own words, as a filterable list grouped by week or as a month calendar (bleeding days marked), with a detail view for each entry.
- **For my doctor** — pick a date range and what to include, see an A4 document preview, then share it as a PDF, print it, or show it on screen in the appointment.
- **Profile & Records** — opened from the header avatar: medicines, appointments and health history (add / edit / delete), settings, and edit profile.
- **Friends** — invite-only, mutual connections who can see each other's current cycle phase (never raw flow/symptom/notes data).
- **Onboarding** — name, usual cycle and period length, last period date, an optional daily reminder.
- **Apple, Google, and email sign-in** — verified server-side by the FastAPI backend; sessions stored with Expo SecureStore.

No diagnostic language anywhere in the product: the app never names a condition, gives a probability, suggests a cause, or recommends treatment. Clinician statements the user types are always labelled "I was told:". The app also makes no predictions, streaks or threshold labels ("heavy", "irregular"). See [`MVP.md`](MVP.md) and [`WORKLOG.md`](WORKLOG.md).

## Tech stack

### Mobile app
- **Framework** — [Expo SDK 57](https://expo.dev) · React Native 0.86 · React 19 · TypeScript
- **Routing** — [expo-router](https://docs.expo.dev/router/introduction/) (typed file-based routes)
- **State** — Zustand stores (`stores/`); health records in `stores/recordsStore.ts`
- **UI** — "Warm Paper, Deep Ink" design system: tokens in `constants/atossaUI.ts`, shared components in `components/atossa/kit.tsx` (rules in [`design/KIT.md`](design/KIT.md)); Inter for UI, Instrument Serif only for the user's own words; 44pt+ tap targets, Dynamic Type, haptics
- **Voice** — `expo-speech-recognition`, on-device only (no audio ever leaves the device); loaded lazily so the app still runs in Expo Go, where dictation reports "not available"
- **Sharing** — `expo-print` + `expo-sharing` for the doctor summary PDF
- **Build** — [EAS Build](https://docs.expo.dev/build/introduction/)

### Python backend
- **API** — [FastAPI](https://fastapi.tiangolo.com) with routers for auth, profiles, cycles (onboarding period date), records, friend connections, and chat
- **Records** — `/records` is a generic per-user store: one JSON document per row, `kind` ∈ symptom | appointment | medicine | history | period_day | doctor_note
- **Database** — PostgreSQL via SQLAlchemy 2 ORM; [Alembic](https://alembic.sqlalchemy.org) migrations. Hosted on [Supabase](https://supabase.com) (used purely for Postgres — the app never talks to Supabase directly)
- **Auth** — its own email/password JWTs (`passlib`/`python-jose`), plus server-side verification of Apple/Google identity tokens
- **Chat (unused)** — `POST /chat` proxies an OpenAI-compatible LLM (Groq by default). It stays deployed for a possible future feature, but the app does not call it.
- **Hosting** — [Render](https://render.com) (free tier), deployed via the `render.yaml` blueprint; kept warm by a scheduled GitHub Action (see [Deploy](#3-deploy-the-backend))

## Project structure

```
atossa/
├── app/
│   ├── (auth)/                   # welcome, sign in, sign up, onboarding (name, basics, last period, reminders)
│   └── (tabs)/
│       ├── today/                # capture prompt, rough day, latest note, next appointment
│       ├── timeline/             # list + month views, entry / bleeding / period / record detail
│       ├── doctor/               # "For my doctor" builder + show-on-screen view
│       └── profile/              # profile, settings, friends, records (opened from the header avatar)
├── components/
│   ├── atossa/                   # kit + kit-parts, tab bar, capture/, timeline/, doctor/, records/ screens' parts
│   ├── auth/                     # Apple / Google sign-in buttons
│   └── ui/Icon.tsx               # icon set
├── lib/records/                  # pure logic: dates, formatting, fields, doctor summary
├── lib/preview/                  # design-preview mode (seeded sample data, no login)
├── design/                       # KIT.md (UI rules), PORT_PLAN.md, Lovable reference snapshot
├── algorithms/                   # cycle-phase math used by Friends
├── backend/app/                  # FastAPI: routers, models, schemas, services
├── backend/alembic/              # database migrations
├── .github/workflows/            # keep-backend-warm.yml (lives on main)
├── render.yaml                   # Render blueprint for the backend
└── assets/                       # icons, splash, logo
```

## Getting started

### Prerequisites

- Node 20+ and npm
- Python 3.11
- [Expo Go](https://expo.dev/go) (SDK 57) on your phone — everything except voice dictation works there; dictation needs a dev-client or store build
- A [Supabase](https://supabase.com) project (used only as Postgres hosting — nothing else needs configuring there beyond creating the project)

### 1. Set up the Python backend

```bash
git clone https://github.com/ziba18/atossa.git
cd atossa/backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
```

Create `backend/.env`:

```env
DATABASE_URL=postgresql://postgres.your-project-ref:password@aws-1-region.pooler.supabase.com:5432/postgres
SECRET_KEY=a-long-random-string
LLM_API_KEY=your-groq-api-key   # optional: without it /chat returns 503. Free key at console.groq.com
# Optional overrides: LLM_BASE_URL, LLM_MODEL, LLM_REASONING_EFFORT (set to "" for providers that reject it)
```

Run migrations and start the server:

```bash
alembic upgrade head
uvicorn app.main:app --reload --port 8000
```

API docs available at `http://localhost:8000/docs`.

### 2. Configure and run the mobile app

```bash
cd ..   # back to repo root
npm install
```

Create `.env` in the project root:

```env
EXPO_PUBLIC_API_URL=http://localhost:8000   # points at the backend above; defaults to this if unset
```

```bash
npm start              # then scan the QR code with Expo Go
npm run preview:web    # design preview in the browser: sample data, no login, no backend needed
```

Voice dictation (`expo-speech-recognition`) is a native module — in Expo Go the mic reports "not available"; use a store or dev-client build to try it. `EXPO_PUBLIC_DESIGN_PREVIEW` (set by `preview:web`) is for local review only — never set it in an EAS environment.

### 3. Deploy the backend

The backend deploys to [Render](https://render.com) (free tier) from the `render.yaml` blueprint at the repo root — in the Render dashboard, "New Blueprint Instance" against this repo, set `DATABASE_URL` and `SECRET_KEY` when prompted. Note the deployed URL for the next step.

Also set `LLM_API_KEY` (from [Groq](https://console.groq.com)) as a variable **on the service** — a Render Environment Group only applies if it's linked to the service.

Render's free tier spins the service down after inactivity — the first request after a lull can take up to ~50 seconds while it wakes back up. Two mitigations are in place:

- The app calls `GET /warmup` (wakes the process and opens a database connection) when the auth screens open and whenever the app returns to the foreground, so the wake-up overlaps the user typing their credentials.
- `.github/workflows/keep-backend-warm.yml` pings `/warmup` every 10 minutes. GitHub only runs scheduled workflows from the default branch, so this file must be on `main`. GitHub pauses scheduled workflows after 60 days of repo inactivity — re-enable it in the Actions tab if that happens.

### 4. Build and submit to the App Store / Play Store

Set `EXPO_PUBLIC_API_URL` to the deployed backend URL from step 3 as an [EAS environment variable](https://docs.expo.dev/eas/environment-variables/) for the `production` profile (`eas env:create production --name EXPO_PUBLIC_API_URL --value https://your-backend.onrender.com`), alongside the other `EXPO_PUBLIC_*` values from your `.env`. Then:

```bash
eas build --platform ios --profile production --auto-submit   # build, then submit to TestFlight
# or separately: eas build ... && eas submit --platform ios --profile production
```

EAS/submit configuration lives in `eas.json`.

**Shipping JS-only changes without a new build (EAS Update):** screens, text, layout and logic changes can go straight to installed builds:

```bash
eas update --channel production --environment production --message "what changed"
```

The app downloads the update on launch and uses it from the next launch. `runtimeVersion` uses the `fingerprint` policy, so an update only reaches builds with matching native code — after adding/removing a native package, changing permissions or `app.config.ts` plugins, make a new build instead.

## Privacy

- All session tokens are stored in the device's secure enclave via `expo-secure-store`.
- Voice dictation is transcribed on-device; no audio is ever uploaded.
- Health data is stored in Postgres (hosted on your own Supabase project) behind the FastAPI backend — the app never talks to Supabase directly for this data.
- Nothing typed in the app is sent to an AI provider. (The backend still has an unused `/chat` LLM proxy; if it is ever used again, its text would go to the configured provider — point `LLM_BASE_URL` at a self-hosted model to keep it in-house.)
- Apple Sign-In is supported and recommended on iOS.
- No third-party analytics SDKs are bundled.

## License

All rights reserved © 2026 Atossa. Published for transparency and portfolio purposes — please do not redistribute without permission.

---

<div align="center">
  Made with care for women's health.
</div>
