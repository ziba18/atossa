<div align="center">
  <img src="assets/Atossa-logo.png" alt="Atossa logo" width="140" />

  # Atossa

  **A modern cycle & women's health companion, built with Expo and React Native.**

  Track your cycle, log how you feel, surface trends, and learn — all in one calm, beautifully designed app.
</div>

---

## ✨ Features

- **Cycle tracking** — log periods, get phase predictions (menstrual, follicular, ovulatory, luteal), and see your full cycle on an animated ring.
- **Health log** — capture symptoms, mood, sleep, energy, flow, and notes in a fast multi-page flow.
- **Insights & metrics** — visualize trends across cycles with charts that surface what your body is telling you.
- **Education hub** — curated, evidence-based articles on hormones, fertility, and well-being.
- **Secure by default** — sessions are stored in the device secure enclave (Expo SecureStore); no analytics, no tracking.
- **Apple & email sign-in** — frictionless onboarding via Supabase Auth.

## 📱 Screens

| Cycle | Health Log | Insights |
|---|---|---|
| Animated cycle ring with phase legend and quick-log shortcuts. | Carousel-style logger for symptoms, mood, sleep & flow. | Charts and patterns across cycles. |

## 🛠 Tech stack

- **App** — [Expo SDK 54](https://expo.dev) · React Native 0.81 · React 19 · TypeScript
- **Routing** — [expo-router](https://docs.expo.dev/router/introduction/) (typed routes)
- **State** — Zustand stores (`stores/`)
- **UI** — Custom design tokens (`constants/theme.ts`), Cormorant Garamond + Jost fonts, gradient + SVG accents
- **Charts & calendars** — `react-native-chart-kit`, `react-native-calendars`, `react-native-svg`
- **Backend** — [Supabase](https://supabase.com) (Postgres + Auth + Row-level security)
- **Auth** — Supabase Auth, Apple Sign-In (`expo-apple-authentication`)
- **Native modules** — Notifications, Secure Store, Contacts
- **Build** — [EAS Build](https://docs.expo.dev/build/introduction/)

## 📂 Project structure

```
atossa/
├── app/                  # expo-router screens
│   ├── (tabs)/           # tab navigator: cycle, health, insights, education, profile
│   └── _layout.tsx       # root layout, fonts, splash, theme
├── algorithms/           # cycle prediction, date helpers
├── components/           # reusable UI: calendar, layout, ui primitives
├── constants/theme.ts    # design tokens (color, spacing, radius, shadow, typography)
├── contexts/             # ThemeContext (light/dark colors)
├── hooks/                # useAuth, useColorScheme, etc.
├── lib/                  # supabase client, storage adapter, integrations
├── stores/               # Zustand stores (auth, cycle, health, profile)
├── supabase/             # SQL migrations & schema
└── assets/               # icons, splash, logo
```

## 🚀 Getting started

### Prerequisites

- Node 20+
- Bun, pnpm, or npm
- An iOS Simulator (Xcode) or Android Emulator (Android Studio), or the [Expo Go](https://expo.dev/client) app on your device
- A [Supabase](https://supabase.com) project for the backend

### 1. Install

```bash
git clone https://github.com/ziba18/atossa.git
cd atossa
npm install
```

### 2. Configure environment

Create a `.env` file in the project root:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Run the SQL migrations in `supabase/` against your Supabase project to create the tables and RLS policies.

### 3. Run the app

```bash
npm run ios       # iOS simulator
npm run android   # Android emulator
npm start         # Pick your target via the Expo CLI
```

### 4. Build for the App Store / Play Store

```bash
npx eas build --platform ios
npx eas build --platform android
```

EAS configuration lives in `eas.json`. Bundle IDs and platform settings are wired up in `app.json`.

## 🧠 Cycle prediction

Predictions live in `algorithms/` and combine logged period start dates with rolling cycle-length averages to estimate the four phases. Predictions degrade gracefully when there is little data and improve with each logged cycle.

## 🔐 Privacy

- All session tokens are stored in the device's secure enclave via `expo-secure-store`.
- Health data stays in your Supabase project under your control.
- Apple Sign-In is supported and recommended on iOS.
- No third-party analytics SDKs are bundled.

## 🤝 Contributing

This is currently a solo project, but issues, ideas, and PRs are welcome. If you spot a bug or have a feature suggestion, please [open an issue](https://github.com/ziba18/atossa/issues).

## 📄 License

All rights reserved © 2026 Atossa. The code is published here for transparency and portfolio purposes; please do not redistribute without permission.

---

<div align="center">
  Made with care for women's health.
</div>
