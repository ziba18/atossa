<div align="center">
  <img src="assets/Atossa-logo.png" alt="Atossa logo" width="140" />

  # Atossa

  **A women's health companion built with Expo, React Native, and a Python/ML backend.**

  Track your cycle, capture symptoms by voice or text, and get data-driven phase predictions — all in one calm, beautifully designed app.
</div>

---

## Features

- **Symptom capture** — describe symptoms by voice (on-device transcription, nothing sent to a server) or text; entries are timestamped and kept for review. This is the active build focus — see [`MVP.md`](MVP.md) and [`WORKLOG.md`](WORKLOG.md) for the in-progress pivot toward turning captures into a structured, GP-ready summary. No diagnostic language anywhere in the product: the app never names a condition, gives a probability, suggests a cause, or recommends treatment.
- **Cycle tracking** — log periods on a continuous linear calendar (any day, past or present), get phase predictions (menstrual, follicular, ovulatory, luteal), and see your full cycle on an animated ring.
- **Friends** — invite-only, mutual connections who can see each other's current cycle phase (never raw flow/symptom/notes data) and get a nudge when you're in the same phase.
- **Insights & metrics** — visualize trends across cycles with charts.
- **Onboarding flow** — multi-step setup: basics, last period date, tracked symptoms, notification preferences.
- **Profile & social** — edit profile, manage emergency contacts, connected accounts, friends.
- **Secure by default** — sessions stored in the device secure enclave (Expo SecureStore); no analytics SDKs.
- **Apple, Google, and email sign-in** — verified server-side by the FastAPI backend.

## Tech stack

### Mobile app
- **Framework** — [Expo SDK 54](https://expo.dev) · React Native 0.81 · React 19 · TypeScript
- **Routing** — [expo-router](https://docs.expo.dev/router/introduction/) (typed file-based routes)
- **State** — Zustand stores (`stores/`)
- **UI** — Custom design tokens (`constants/theme.ts`), Cormorant Garamond + Jost fonts, gradient + SVG accents
- **Charts** — `react-native-chart-kit`, `react-native-calendars`, `react-native-svg`
- **Auth** — Apple Sign-In (`expo-apple-authentication`) and Google Sign-In, verified server-side; sessions issued by the FastAPI backend
- **Voice capture** — `expo-speech-recognition`, on-device only (no audio ever leaves the device)
- **Native modules** — Expo Notifications, SecureStore, Contacts, AV
- **Build** — [EAS Build](https://docs.expo.dev/build/introduction/)

### Python backend
- **API** — [FastAPI](https://fastapi.tiangolo.com) with routers for auth, profiles, cycles, symptom captures, and friend connections
- **Database** — PostgreSQL via SQLAlchemy 2 ORM; [Alembic](https://alembic.sqlalchemy.org) migrations. Hosted on [Supabase](https://supabase.com) (used purely for Postgres — the app never talks to Supabase directly)
- **Auth** — Its own email/password JWTs (`passlib`/`python-jose`), plus server-side verification of Apple/Google identity tokens for social sign-in
- **ML prediction layer** (`backend/app/ml/predict.py`) — hybrid EWMA + Bayesian forecaster (see below)
- **Hosting** — [Render](https://render.com) (free tier), deployed via the `render.yaml` blueprint at the repo root

### Machine learning
- **Client-side algorithms** (`algorithms/`) — TypeScript port of the cycle predictor, runs on-device
- **Server-side predictor** (`backend/app/ml/predict.py`) — Python mirror of the same hybrid algorithm using NumPy
- **Deep learning forecaster** (`training/`) — LSTM model trained with Gaussian NLL loss, exported to TFLite (~120 KB)

## Project structure

```
atossa/
├── app/
│   ├── (auth)/                   # auth & onboarding screens
│   │   └── onboarding/           # 5-step onboarding flow
│   └── (tabs)/                   # tab navigator
│       ├── dashboard/            # home dashboard + notifications
│       ├── chat/                 # symptom capture (voice/text), period log, cycle data
│       ├── analysis/             # insights & metrics
│       ├── community/            # social feed
│       ├── report/               # findings/report view
│       └── profile/              # edit profile, contacts, connections, friends
├── algorithms/                   # TypeScript cycle prediction + date helpers
│   ├── cyclePrediction.ts        # EWMA / Bayesian / median predictor
│   ├── aiCyclePrediction.ts      # AI-enhanced prediction helpers
│   ├── healthRiskDetection.ts    # anomaly / risk flags
│   └── predict.ts                # prediction entry point
├── backend/
│   ├── app/
│   │   ├── main.py               # FastAPI app, CORS, router wiring
│   │   ├── ml/predict.py         # hybrid EWMA + Bayesian forecaster (Python)
│   │   ├── models/               # SQLAlchemy ORM models (user, cycle, health, capture, social)
│   │   ├── routers/              # auth, profiles, cycles, captures, connections
│   │   ├── schemas/              # Pydantic request/response schemas
│   │   └── services/             # auth (JWT) + social_auth (Apple/Google verification)
│   └── alembic/                  # database migration versions
├── training/                     # LSTM forecaster training pipeline (see training/README.md)
│   ├── forecaster.py             # LSTM(64) → Dense(2) [mean, log_var], Gaussian NLL loss
│   ├── features.py               # feature engineering (12-step windows, 6 features each)
│   └── data/                     # fetch.py, prepare.py, synthetic.py
├── components/                   # reusable UI: calendar, layout, primitives
├── constants/theme.ts            # design tokens (color, spacing, radius, typography)
├── contexts/                     # ThemeContext (light/dark)
├── hooks/                        # useAuth, useColorScheme, etc.
├── lib/                          # API client, Supabase client (social sign-in only), transcription
├── stores/                       # Zustand stores (auth, cycle, health, profile)
├── supabase/functions/           # Supabase edge functions
├── render.yaml                   # Render blueprint for the backend deploy
└── assets/                       # icons, splash, logo
```

## Cycle prediction

Atossa uses a three-layer prediction stack:

1. **TypeScript (on-device)** — `algorithms/cyclePrediction.ts` runs locally in the app. It classifies cycle regularity (regular / variable / irregular) and picks the right estimator: EWMA for regular cycles, median for irregular (PCOS-friendly), or Bayesian shrinkage toward the user's profile prior when data is sparse.

2. **Python (server-side)** — `backend/app/ml/predict.py` is a NumPy port of the same algorithm, called by the `/cycles/predict` endpoint. Predictions are persisted to the `cycle_predictions` table with a confidence score and method label.

3. **LSTM forecaster (training artifact)** — `training/forecaster.py` trains a `LSTM(64) → Dropout → Dense(32) → Dense(2)` model with a Gaussian negative log-likelihood loss. The two outputs are `[mean, log_var]`; the variance head lets the model express its own uncertainty, which is used to widen the fertile window for high-variance forecasts. The model exports to TFLite (~120 KB) for potential on-device inference.

## Getting started

### Prerequisites

- Node 20+ and npm
- Python 3.11
- iOS Simulator (Xcode) or Android Emulator, or the [Expo Go](https://expo.dev/client) app
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
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
EXPO_PUBLIC_API_URL=http://localhost:8000   # points at the backend above; defaults to this if unset
```

```bash
npm run ios       # iOS simulator
npm run android   # Android emulator
npm start         # Expo CLI — pick your target
```

Voice capture (`expo-speech-recognition`) is a native module — it needs a dev-client build (`eas build --profile development` or a local `xcodebuild`/`./gradlew` build), not Expo Go.

### 3. Train the LSTM forecaster (optional)

```bash
cd training
pip install -r requirements.txt
python data/synthetic.py   # generate synthetic training data
python data/prepare.py     # build windowed feature arrays
python forecaster.py       # train + export forecaster.tflite
```

### 4. Deploy the backend

The backend deploys to [Render](https://render.com) (free tier) from the `render.yaml` blueprint at the repo root — in the Render dashboard, "New Blueprint Instance" against this repo, set `DATABASE_URL` and `SECRET_KEY` when prompted. Note the deployed URL for the next step.

Render's free tier spins the service down after inactivity — the first request after a lull can take up to ~50 seconds while it wakes back up.

### 5. Build and submit to the App Store / Play Store

Set `EXPO_PUBLIC_API_URL` to the deployed backend URL from step 4 as an [EAS environment variable](https://docs.expo.dev/eas/environment-variables/) for the `production` profile (`eas env:create production --name EXPO_PUBLIC_API_URL --value https://your-backend.onrender.com`), alongside the other `EXPO_PUBLIC_*` values from your `.env`. Then:

```bash
eas build --platform ios --profile production
eas submit --platform ios --profile production
```

EAS/submit configuration lives in `eas.json`.

## Privacy

- All session tokens are stored in the device's secure enclave via `expo-secure-store`.
- Voice capture is transcribed on-device; no audio is ever uploaded.
- Health data is stored in Postgres (hosted on your own Supabase project) behind the FastAPI backend — the app never talks to Supabase directly for this data.
- Apple Sign-In is supported and recommended on iOS.
- No third-party analytics SDKs are bundled.

## License

All rights reserved © 2026 Atossa. Published for transparency and portfolio purposes — please do not redistribute without permission.

---

<div align="center">
  Made with care for women's health.
</div>
