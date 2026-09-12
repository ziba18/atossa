import * as AppleAuthentication from 'expo-apple-authentication';
import { Platform } from 'react-native';
import { Config } from '../constants/config';
import { useAuthStore } from '../stores/authStore';

// Lazy-require Google Sign-In so the bundle still loads in Expo Go (and on
// dev clients that don't have the native module linked). We replace the
// real module with a stub whose .signIn() throws a friendly error — the UI
// can catch and tell the user "Google Sign-In requires a dev/release build".
let GoogleSignin: any;
let statusCodes: any = { SIGN_IN_CANCELLED: 'SIGN_IN_CANCELLED', IN_PROGRESS: 'IN_PROGRESS' };
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const mod = require('@react-native-google-signin/google-signin');
  GoogleSignin = mod.GoogleSignin;
  statusCodes = mod.statusCodes;
  // Configure once at module load. Safe to call before first sign-in;
  // subsequent calls are no-ops.
  GoogleSignin.configure({
    webClientId: Config.googleWebClientId,
    iosClientId: Config.googleIosClientId,
    ...(Platform.OS === 'android'
      ? { androidClientId: Config.googleAndroidClientId }
      : {}),
    scopes: ['profile', 'email'],
  });
} catch {
  GoogleSignin = {
    hasPlayServices: async () => true,
    signIn: async () => {
      throw new Error('Google Sign-In requires a dev or release build of Atossa.');
    },
  };
}

function buildFullName(fullName: AppleAuthentication.AppleAuthenticationFullName | null): string | null {
  if (!fullName) return null;
  const given = (fullName.givenName ?? '').trim();
  const family = (fullName.familyName ?? '').trim();
  const joined = [given, family].filter(Boolean).join(' ');
  return joined || null;
}

export async function signInWithApple(): Promise<{ user: any | null; error: Error | null }> {
  if (Platform.OS !== 'ios') {
    return { user: null, error: new Error('Apple Sign In is only available on iOS') };
  }

  try {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });

    if (!credential.identityToken) {
      return { user: null, error: new Error('No identity token received from Apple') };
    }

    // Apple only returns the user's full name on the FIRST sign-in — pass it
    // along so the backend can seed the profile on account creation.
    const appleFullName = buildFullName(credential.fullName ?? null);
    await useAuthStore.getState().loginWithApple(credential.identityToken, appleFullName);

    return { user: useAuthStore.getState().user, error: null };
  } catch (err: any) {
    if (err.code === 'ERR_REQUEST_CANCELED') {
      return { user: null, error: null }; // user cancelled — not an error
    }
    return { user: null, error: err instanceof Error ? err : new Error(String(err)) };
  }
}

export async function signInWithGoogle(): Promise<{ user: any | null; error: Error | null }> {
  try {
    // hasPlayServices is no-op on iOS but required on Android — it surfaces a
    // dialog if Google Play Services is missing/outdated.
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

    const result = await GoogleSignin.signIn();

    // The shape varies slightly by version — newer versions return
    // { type: 'success', data: { idToken, user } }, older ones return the
    // user object directly. Normalise.
    const userInfo: any = (result as any)?.data ?? result;
    const idToken: string | undefined = userInfo?.idToken;
    const googleName: string | null = userInfo?.user?.name ?? null;

    if (!idToken) {
      return { user: null, error: new Error('No identity token received from Google') };
    }

    // Google returns the display name on every sign-in; the backend only
    // uses it to seed a profile that doesn't have a name yet, so it's safe
    // to pass along on every call without risking clobbering an edited name.
    await useAuthStore.getState().loginWithGoogle(idToken, googleName);

    return { user: useAuthStore.getState().user, error: null };
  } catch (err: any) {
    // Cancellation isn't an error, just a no-op return.
    if (
      err?.code === statusCodes.SIGN_IN_CANCELLED ||
      err?.code === statusCodes.IN_PROGRESS
    ) {
      return { user: null, error: null };
    }
    return { user: null, error: err instanceof Error ? err : new Error(String(err)) };
  }
}
