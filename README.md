<div align="center">
  <img src="assets/Atossa-logo.png" alt="Atossa logo" width="140" />

  # Atossa

  **A cycle & women's health companion built with Expo, React Native, and a Python/ML backend.**

  Track your cycle, log symptoms, surface trends, and get data-driven phase predictions — all in one calm, beautifully designed app.
</div>

---

## Features

- **Cycle tracking** — log periods, get phase predictions (menstrual, follicular, ovulatory, luteal), and see your full cycle on an animated ring.
- **Health log** — carousel-style logger for symptoms, mood, sleep, energy, flow, and notes.
- **Insights & metrics** — visualize trends across cycles with charts.
- **Education hub** — curated articles and videos on hormones, fertility, and well-being.
- **Onboarding flow** — multi-step setup: basics, last period date, tracked symptoms, notification preferences.
- **Profile & social** — edit profile, manage emergency contacts, connected accounts.
- **Secure by default** — sessions stored in the device secure enclave (Expo SecureStore); no analytics SDKs.
- **Apple & email sign-in** — Supabase Auth with Apple Sign-In on iOS.

## Tech stack

### Mobile app
- **Framework** — [Expo SDK 54](https://expo.dev) · React Native 0.81 · React 19 · TypeScript
- **Routing** — [expo-router](https://docs.expo.dev/router/introduction/) (typed file-based routes)
- **State** — Zustand stores (`stores/`)
- **UI** — Custom design tokens (`constants/theme.ts`), Cormorant Garamond + Jost fonts, gradient + SVG accents
- **Charts** — `react-native-chart-kit`, `react-native-calendars`, `react-native-svg`
- **Auth** — Supabase Auth, Apple Sign-In (`expo-apple-authentication`)
- **Native modules** — Expo Notifications, SecureStore, Contacts
- **Build** — [EAS Build](https://docs.expo.dev/build/introduction/)

### Python backend
- **API** — [FastAPI](https://fastapi.tiangolo.com) with routers for auth, profiles, and cycles
- **Database** — PostgreSQL via SQLAlchemy 2 ORM; [Alembic](https://alembic.sqlalchemy.org) migrations
- **Auth service** — Supabase JWT verification
- **ML prediction layer** (`backend/app/ml/predict.py`) — hybrid EWMA + Bayesian forecaster (see below)

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
│       ├── home/                 # dashboard + notifications
│       ├── cycle/                # ring view, calendar, log period
│       ├── health/               # symptom logger + history
│       ├── education/            # articles, videos, categories
│       └── profile/              # edit profile, contacts, connections
├── algorithms/                   # TypeScript cycle prediction + date helpers
│   ├── cyclePrediction.ts        # EWMA / Bayesian / median predictor
│   ├── aiCyclePrediction.ts      # AI-enhanced prediction helpers
│   ├── healthRiskDetection.ts    # anomaly / risk flags
│   └── predict.ts                # prediction entry point
├── backend/
│   ├── app/
│   │   ├── main.py               # FastAPI app, CORS, router wiring
│   │   ├── ml/predict.py         # hybrid EWMA + Bayesian forecaster (Python)
│   │   ├── models/               # SQLAlchemy ORM models (user, cycle, health, social)
│   │   ├── routers/              # auth, profiles, cycles
│   │   ├── schemas/              # Pydantic request/response schemas
│   │   └── services/             # auth service (Supabase JWT)
│   └── alembic/                  # database migration versions
├── training/
│   ├── forecaster.py             # LSTM(64) → Dense(2) [mean, log_var], Gaussian NLL loss
│   ├── features.py               # feature engineering (12-step windows, 6 features each)
│   └── data/                     # fetch.py, prepare.py, synthetic.py
├── components/                   # reusable UI: calendar, layout, primitives
├── constants/theme.ts            # design tokens (color, spacing, radius, typography)
├── contexts/                     # ThemeContext (light/dark)
├── hooks/                        # useAuth, useColorScheme, etc.
├── lib/                          # Supabase client, storage adapter
├── stores/                       # Zustand stores (auth, cycle, health, profile)
├── supabase/                     # SQL migrations & RLS policies
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
- Python 3.10+
- iOS Simulator (Xcode) or Android Emulator, or the [Expo Go](https://expo.dev/client) app
- A [Supabase](https://supabase.com) project

### 1. Install the mobile app

```bash
git clone https://github.com/ziba18/atossa.git
cd atossa
npm install
```

### 2. Configure mobile environment

Create `.env` in the project root:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Run the SQL migrations in `supabase/` against your Supabase project to create tables and RLS policies.

### 3. Run the mobile app

```bash
npm run ios       # iOS simulator
npm run android   # Android emulator
npm start         # Expo CLI — pick your target
```

### 4. Run the Python backend

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
```

Create `backend/.env`:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/atossa
SUPABASE_JWT_SECRET=your-supabase-jwt-secret
```

Run migrations and start the server:

```bash
alembic upgrade head
uvicorn app.main:app --reload
```

API docs available at `http://localhost:8000/docs`.

### 5. Train the LSTM forecaster (optional)

```bash
cd training
pip install -r requirements.txt
python data/synthetic.py   # generate synthetic training data
python data/prepare.py     # build windowed feature arrays
python forecaster.py       # train + export forecaster.tflite
```

### 6. Build for the App Store / Play Store

```bash
npx eas build --platform ios
npx eas build --platform android
```

EAS configuration lives in `eas.json`.

## Privacy

- All session tokens are stored in the device's secure enclave via `expo-secure-store`.
- Health data stays in your own Supabase project.
- Apple Sign-In is supported and recommended on iOS.
- No third-party analytics SDKs are bundled.

## License

All rights reserved © 2026 Atossa. Published for transparency and portfolio purposes — please do not redistribute without permission.

---

<div align="center">
  Made with care for women's health.
</div>
