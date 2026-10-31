// Pilot builds (a clinic pilot) hide the Friends feature. Set EXPO_PUBLIC_PILOT=1 only in the pilot environment.
export const IS_PILOT = process.env.EXPO_PUBLIC_PILOT === '1';
