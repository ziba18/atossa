import type { ExpoConfig } from 'expo/config';

// Migrated from app.json so the native Google Sign-In plugin can read
// EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME from .env at build time. Everything
// else mirrors the previous static config.

// The Google Sign-In plugin throws if `iosUrlScheme` is missing/empty,
// which breaks `eas credentials` and other config-reading commands when
// the env var hasn't been populated yet. Mount the plugin only after
// the env var is set, so initial credential setup still works.
const googleIosUrlScheme = process.env.EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME;
const googlePlugin: any[] = googleIosUrlScheme
  ? [['@react-native-google-signin/google-signin', { iosUrlScheme: googleIosUrlScheme }]]
  : [];

const config: ExpoConfig = {
  name: 'Atossa',
  slug: 'attosa',
  version: '1.1.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',
  scheme: 'attosa',
  splash: {
    image: './assets/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#FFF8F9',
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.attosa.app',
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/android-icon-foreground.png',
      monochromeImage: './assets/android-icon-monochrome.png',
      backgroundColor: '#FFFFFF',
    },
    package: 'com.attosa.app',
    edgeToEdgeEnabled: true,
    permissions: [
      'android.permission.VIBRATE',
      'android.permission.RECEIVE_BOOT_COMPLETED',
    ],
  },
  web: {
    favicon: './assets/favicon.png',
    bundler: 'metro',
  },
  plugins: [
    'expo-router',
    'expo-secure-store',
    [
      'expo-build-properties',
      {
        ios: {
          useFrameworks: 'static',
        },
      },
    ],
    [
      'expo-notifications',
      {
        icon: './assets/icon.png',
        color: '#DC143C',
      },
    ],
    [
      'expo-speech-recognition',
      {
        microphonePermission: 'Atossa needs access to your microphone to let you describe symptoms by voice.',
        // We only ever call requestMicrophonePermissionsAsync() with
        // requiresOnDeviceRecognition: true, so this permission should
        // never actually be requested — kept accurate in case that changes.
        speechRecognitionPermission: 'Speech recognition is processed on your device — Atossa does not send your voice to a server.',
      },
    ],
    'expo-apple-authentication',
    ...googlePlugin,
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    router: {
      origin: false,
    },
    eas: {
      projectId: '8d09758f-8216-49a8-933f-d8e23b1fb914',
    },
  },
  owner: 'zamaniziba18',
};

export default config;
