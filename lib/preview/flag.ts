// Design-preview mode (reviewers, no login, no network). Leaf module: no imports, so
// anything — including lib/records/dates.ts — can read it without import cycles.
//
// Turned on with EXPO_PUBLIC_DESIGN_PREVIEW=1 at bundle time, e.g.
//   EXPO_PUBLIC_DESIGN_PREVIEW=1 npx expo start --web --port 8081   (npm run preview:web)
// Never set it in EAS / production envs. As a second guard it only takes effect in a development
// bundle (__DEV__): an `eas update` or store build is a production bundle, so the flag is ignored there
// even if the variable leaks into that environment.

export const IS_PREVIEW = __DEV__ && process.env.EXPO_PUBLIC_DESIGN_PREVIEW === '1';

/** "Today" for the seeded Sam persona, so seed dates read naturally ("This week", "Today"). */
export const PREVIEW_TODAY = '2026-09-24';

export const PREVIEW_USER_ID = 'preview-sam';
