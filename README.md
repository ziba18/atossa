<div align="center">
  <img src="assets/Atossa-logo.png" alt="Atossa logo" width="140" />

  # Atossa

  **A symptom-capture companion for people with PCOS or endometriosis, built with Expo, React Native, and a Python backend.**

  Put symptoms into your own words, keep track of appointments and medicines, and bring a clear, GP-ready summary to your doctor.
</div>

---

## Features

- **Chat** — describe a symptom in your own words (typed, or dictated with on-device speech recognition), confirm the "I've noted this" card, then answer four fixed questions: where, how bad (0–10), how long, and whether it stopped you doing things. No AI writes anything here, so nothing diagnostic can appear.
- **Dashboard** — pain chart, weekly "stopped me doing things" bars, recent symptoms, a cycle calendar, appointments, medicines and health history, each with add / edit / delete.
- **For my doctor** — an at-a-glance summary with collapsible sections and editable notes, shareable as text or PDF.
- **Friends** — invite-only, mutual connections who can see each other's current cycle phase (never raw flow/symptom/notes data).
- **Onboarding** — name, basics, last period date, tracked symptoms, notification preferences.
- **Apple, Google, and email sign-in** — verified server-side by the FastAPI backend; sessions stored with Expo SecureStore.

No diagnostic language anywhere in the product: the app never names a condition, gives a probability, suggests a cause, or recommends treatment. Clinician statements the user types are always labelled "I was told:". See [`MVP.md`](MVP.md) and [`WORKLOG.md`](WORKLOG.md).

## Tech stack

### Mobile app
- **Framework** — [Expo SDK 54](https://expo.dev) · React Native 0.81 · React 19 · TypeScript
- **Routing** — [expo-router](https://docs.expo.dev/router/introduction/) (typed file-based routes)
- **State** — Zustand stores (`stores/`); health records in `stores/recordsStore.ts`
- **UI** — design tokens in `constants/atossaUI.ts` (main tabs) and `constants/theme.ts` (auth, onboarding, profile); Instrument Serif + Work Sans; `react-native-svg` charts
- **Voice** — `expo-speech-recognition`, on-device only (no audio ever leaves the device)
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
│   ├── (auth)/                   # welcome, login, register, 5-step onboarding
│   └── (tabs)/
│       ├── chat/                 # symptom flow (four fixed questions)
│       ├── dashboard/            # overview + calendar, symptoms, appointments, medicines, health
│       ├── report/               # "For my doctor" summary
│       └── profile/              # profile, settings, friends (opened from the header avatar)
├── components/
│   ├── atossa/                   # the redesign's shared UI (kit, charts, calendar, tab bar)
│   └── auth/, layout/, tracking/, ui/  # auth/onboarding/profile building blocks
├── lib/records/                  # pure logic: dates, cycles, doctor summary
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
- A dev-client build of the app (`eas build --profile development`) — voice dictation is a native module that Expo Go doesn't include
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
npm run ios       # iOS simulator
npm run android   # Android emulator
npm start         # Expo CLI — pick your target
```

Voice dictation (`expo-speech-recognition`) is a native module — it needs a dev-client build, not Expo Go.

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
