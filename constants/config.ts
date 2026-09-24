export const Config = {
  apiUrl: process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000',
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
