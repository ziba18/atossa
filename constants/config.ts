export const Config = {
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL!,
  supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  admobAppIdIos: process.env.EXPO_PUBLIC_ADMOB_APP_ID_IOS ?? '',
  admobAppIdAndroid: process.env.EXPO_PUBLIC_ADMOB_APP_ID_ANDROID ?? '',
};
