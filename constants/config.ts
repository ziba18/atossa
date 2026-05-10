export const Config = {
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL!,
  supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  admobAppIdIos: process.env.EXPO_PUBLIC_ADMOB_APP_ID_IOS ?? '',
  admobAppIdAndroid: process.env.EXPO_PUBLIC_ADMOB_APP_ID_ANDROID ?? '',
  // Google Sign-In OAuth client IDs from Google Cloud Console.
  // - webClientId is the Web OAuth client; Supabase verifies ID tokens
  //   against this audience, so GoogleSignin must request it as the
  //   audience even on iOS/Android.
  // - iosClientId / androidClientId are the native client IDs; required
  //   on each platform so Google issues the device a token.
  googleWebClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '',
  googleIosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? '',
  googleAndroidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ?? '',
};
