import { Platform } from 'react-native';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000';
// A phone build must talk to the API over https: a missing or http:// address in a release build is a
// packaging mistake, and sending health notes in clear text is worse than a build that refuses to start.
if (!__DEV__ && Platform.OS !== 'web' && !API_URL.startsWith('https://')) {
  throw new Error('EXPO_PUBLIC_API_URL must be an https:// address in release builds');
}

export const Config = {
  apiUrl: API_URL,
  // Google Sign-In OAuth client IDs from Google Cloud Console.
  // - webClientId is the Web OAuth client; the backend verifies ID tokens
  //   against this audience, so GoogleSignin must request it as the
  //   audience even on iOS/Android.
  // - iosClientId / androidClientId are the native client IDs; required
  //   on each platform so Google issues the device a token.
  googleWebClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '',
  googleIosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? '',
  googleAndroidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ?? '',
};

// Public legal pages, served by the backend (backend/app/routers/legal.py). The privacy URL
// is also the one to give App Store Connect.
export const LegalUrls = {
  privacy: `${Config.apiUrl}/privacy`,
  terms: `${Config.apiUrl}/terms`,
};
