<div align="center">
  <img src="assets/Atossa-logo.png" alt="Atossa logo" width="140" />

  # Atossa

  **A symptom-capture companion for people with PCOS or endometriosis, built with Expo, React Native, and a Python backend.**

  Put symptoms into your own words, keep track of appointments and medicines, and bring a clear, GP-ready summary to your doctor.

  **Status:** version 1.1.0 (build 23) is being prepared for App Store review. Development happens on the `mvp-symptom-capture` branch.
</div>

---

## Features

- **Today** — a calm chat: type or dictate how you're feeling in your own words and Atossa replies with a short follow-up question (via the `/chat` LLM, instructed never to diagnose). "Save as a note for my GP" opens the capture sheet pre-filled, which asks only the missing details (where, how bad 0–10, how long, did it stop you doing things) before saving. The **+** button attaches a photo or file (kept on the phone), logs bleeding, or starts a full note. Chat history lives on the device; a drawer lists past chats.
- **Timeline** — every note in your own words, as a filterable list grouped by week or as a month calendar (bleeding days marked), with a detail view for each entry.
- **For my doctor** — pick a date range and what to include, see an A4 document preview, then share it as a PDF, print it, or show it on screen in the appointment.
- **Profile & Records** — opened from the header avatar: medicines, appointments and health history (add / edit / delete), settings, and edit profile.
- **Friends** — invite-only, mutual connections who can see each other's current cycle phase (never raw flow/symptom/notes data).
- **Onboarding** — name, usual cycle and period length, last period date, an optional daily reminder.
- **Apple, Google, and email sign-in** — verified server-side by the FastAPI backend; sessions stored with Expo SecureStore.
- **Account deletion** — Profile → Delete account permanently removes the account and every record.
- **Onboarding analytics** — anonymous Mixpanel funnel events (welcome viewed, sign-up, each setup step, setup finished). No health data, names or emails; no IP-based location.

No diagnostic language anywhere in the product: the app never names a condition, gives a probability, suggests a cause, or recommends treatment. Clinician statements the user types are always labelled "I was told:". The app also makes no predictions, streaks or threshold labels ("heavy", "irregular"). See [`MVP.md`](MVP.md) and [`WORKLOG.md`](WORKLOG.md).

## Tech stack

### Mobile app
- **Framework** — [Expo SDK 57](https://expo.dev) · React Native 0.86 · React 19 · TypeScript
- **Routing** — [expo-router](https://docs.expo.dev/router/introduction/) (typed file-based routes)
- **State** — Zustand stores (`stores/`); health records in `stores/recordsStore.ts`
- **UI** — "Warm Paper, Deep Ink" design system: tokens in `constants/atossaUI.ts`, shared components in `components/atossa/kit.tsx` (rules in [`design/KIT.md`](design/KIT.md)); Inter for UI, Instrument Serif only for the user's own words; 44pt+ tap targets, Dynamic Type, haptics
- **Voice** — `expo-speech-recognition`, on-device only (no audio ever leaves the device); loaded lazily so the app still runs in Expo Go, where the mic explains that voice needs the App Store build
- **Sharing** — `expo-print` + `expo-sharing` for the doctor summary PDF
- **Attachments** — `expo-image-picker`, `expo-document-picker`, `expo-file-system` (files are copied into the app's own folder and never uploaded)
- **Analytics** — `mixpanel-react-native` in JS mode (works in Expo Go), only when `EXPO_PUBLIC_MIXPANEL_TOKEN` is set (`lib/analytics.ts`)
- **Build** — [EAS Build](https://docs.expo.dev/build/introduction/)

### Python backend
- **API** — [FastAPI](https://fastapi.tiangolo.com) with routers for auth, profiles, cycles (onboarding period date), records, friend connections, and chat
- **Records** — `/records` is a generic per-user store: one JSON document per row, `kind` ∈ symptom | appointment | medicine | history | period_day | doctor_note
- **Database** — PostgreSQL via SQLAlchemy 2 ORM; [Alembic](https://alembic.sqlalchemy.org) migrations. Hosted on [Supabase](https://supabase.com) (used purely for Postgres — the app never talks to Supabase directly)
- **Auth** — its own email/password JWTs (`passlib`/`python-jose`), plus server-side verification of Apple/Google identity tokens
- **Chat** — `POST /chat` proxies an OpenAI-compatible LLM (Groq `openai/gpt-oss-20b` by default) for the Today chat. The no-diagnosis rule is enforced in the system prompt (`backend/app/services/llm.py`).
- **Legal pages** — `GET /privacy` and `GET /terms` serve the privacy policy and terms linked from the app and App Store Connect
- **Hosting** — [Render](https://render.com) (free tier), deployed via the `render.yaml` blueprint; kept warm by a scheduled GitHub Action (see [Deploy](#3-deploy-the-backend))

## Project structure

```
atossa/
├── app/
│   ├── (auth)/                   # welcome, sign in, sign up, onboarding (name, basics, last period, reminders)
│   └── (tabs)/
│       ├── today/                # chat (composer, drawer, attachments) + save-as-note
│       ├── timeline/             # list + month views, entry / bleeding / period / record detail
│       ├── doctor/               # "For my doctor" builder + show-on-screen view
│       └── profile/              # profile, settings, friends, records (opened from the header avatar)
├── components/
│   ├── atossa/                   # kit + kit-parts, tab bar, chat/, capture/, timeline/, doctor/, records/
│   ├── auth/                     # Apple / Google sign-in buttons
│   └── ui/Icon.tsx               # icon set
├── lib/records/                  # pure logic: dates, formatting, fields, doctor summary
├── lib/preview/                  # design-preview mode (seeded sample data, no login)
├── design/                       # KIT.md (UI rules), PORT_PLAN.md, Lovable reference snapshot
├── algorithms/                   # cycle-phase math used by Friends
├── backend/app/                  # FastAPI: routers, models, schemas, services
├── backend/alembic/              # database migrations
├── .github/workflows/            # keep-backend-warm.yml (lives on main)
├── support-site/                 # static App Store support page (Vercel project "support-site")
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
EXPO_PUBLIC_MIXPANEL_TOKEN=                 # optional: Mixpanel project token; empty = analytics off
```

```bash
npm start              # then scan the QR code with Expo Go
npm run preview:web    # design preview in the browser: sample data, no login, no backend needed
```

Voice dictation (`expo-speech-recognition`) is a native module that Expo Go doesn't include — use a TestFlight/store or dev-client build to try it. `EXPO_PUBLIC_DESIGN_PREVIEW` (set by `preview:web`) is for local review only — never set it in an EAS environment.

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
- Messages typed in the Today chat are sent through the backend to the configured LLM provider (Groq by default) to write a reply. Attached photos and files stay on the phone; the model only sees "[Attached a photo: name]". Point `LLM_BASE_URL` at a self-hosted model to keep chat text in-house.
- Mixpanel receives anonymous onboarding events only (random app ID, device type, app version) — never names, emails, symptoms or notes, and IP geolocation is turned off.
- Apple Sign-In is supported and recommended on iOS.
- The full policy is served by the backend at `/privacy`; the App Store support page is in `support-site/`.

## License

All rights reserved © 2026 Atossa. Published for transparency and portfolio purposes — please do not redistribute without permission.

---

<div align="center">
  Made with care for women's health.
</div>
