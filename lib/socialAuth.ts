import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';
import { supabase } from './supabase';

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

    return { user: data?.user ?? null, error };
  } catch (err: any) {
    if (err.code === 'ERR_REQUEST_CANCELED') {
      return { user: null, error: null }; // user cancelled — not an error
    }
    return { user: null, error: err instanceof Error ? err : new Error(String(err)) };
  }
}
