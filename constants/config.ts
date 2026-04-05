export const Config = {
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL!,
  supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!,
  admobAppIdIos: process.env.EXPO_PUBLIC_ADMOB_APP_ID_IOS ?? '',
  admobAppIdAndroid: process.env.EXPO_PUBLIC_ADMOB_APP_ID_ANDROID ?? '',
  revenueCatApiKeyIos: process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_IOS ?? '',
  revenueCatApiKeyAndroid: process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID ?? '',
  stripePublishableKey: process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? '',

  // RevenueCat product IDs
  premiumMonthlyProductId: 'attosa_premium_monthly',
  premiumAnnualProductId: 'attosa_premium_annual',

  // Donation campaign
  donationCampaign: 'period_products',
  centsPerPad: 25, // ~$0.25 per pad/tampon
};

export const FREE_TIER_LIMITS = {
  cycleHistoryMonths: 3,
  symptomTypes: 5,
  connectedAccounts: 0,
  predictionsAhead: 1,
};
