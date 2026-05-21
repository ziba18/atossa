import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';
import { supabase } from './supabase';
import { Config } from '../constants/config';

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

async function generateNonce(): Promise<{ raw: string; hashed: string }> {
  const bytes = await Crypto.getRandomBytesAsync(32);
  const raw = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  const hashed = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    raw,
    { encoding: Crypto.CryptoEncoding.HEX },
  );
  return { raw, hashed };
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
    const { raw: rawNonce, hashed: hashedNonce } = await generateNonce();

    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
      nonce: hashedNonce,
    });

    if (!credential.identityToken) {
      return { user: null, error: new Error('No identity token received from Apple') };
    }

    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'apple',
      token: credential.identityToken,
      nonce: rawNonce,
    });

    // Apple only returns the user's full name on the FIRST sign-in. If we
    // got it, persist it to the profile right away so onboarding can show
    // the real name instead of Supabase's auto-generated identifier.
    const appleFullName = buildFullName(credential.fullName ?? null);
    if (data?.user && appleFullName) {
      await supabase.from('profiles').upsert(
        { id: data.user.id, display_name: appleFullName },
        { onConflict: 'id' },
      );
    }

    return { user: data?.user ?? null, error };
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

    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: idToken,
    });

    // Google returns the display name on every sign-in, but we only want to
    // overwrite the profile name on the first one — otherwise we'd clobber a
    // user-edited display_name. Upsert only if there isn't a row yet.
    if (data?.user && googleName) {
      const { data: existing } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', data.user.id)
        .maybeSingle();
      if (!existing?.display_name) {
        await supabase.from('profiles').upsert(
          { id: data.user.id, display_name: googleName },
          { onConflict: 'id' },
        );
      }
    }

    return { user: data?.user ?? null, error };
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
