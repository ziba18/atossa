import * as WebBrowser from 'expo-web-browser';
import { makeRedirectUri } from 'expo-auth-session';
import * as AppleAuthentication from 'expo-apple-authentication';
import { Platform } from 'react-native';
import { supabase } from './supabase';

WebBrowser.maybeCompleteAuthSession();

export async function signInWithGoogle(): Promise<{ user: any | null; error: Error | null }> {
  const redirectUrl = makeRedirectUri({ scheme: 'attosa', path: 'auth/callback' });

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectUrl,
      skipBrowserRedirect: true,
    },
  });

  if (error || !data.url) {
    return { user: null, error: error ?? new Error('No OAuth URL returned') };
  }

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);

  if (result.type === 'cancel' || result.type === 'dismiss') {
    return { user: null, error: null };
  }

  if (result.type !== 'success' || !result.url) {
    return { user: null, error: new Error('Google sign in failed') };
  }

  // Supabase returns tokens in the URL hash fragment
  const hashIndex = result.url.indexOf('#');
  if (hashIndex === -1) {
    return { user: null, error: new Error('No tokens in redirect URL') };
  }
  const params = new URLSearchParams(result.url.substring(hashIndex + 1));
  const access_token = params.get('access_token');
  const refresh_token = params.get('refresh_token');

  if (!access_token || !refresh_token) {
    return { user: null, error: new Error('No tokens received from Google') };
  }

  const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
    access_token,
    refresh_token,
  });

  return { user: sessionData?.user ?? null, error: sessionError };
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

    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'apple',
      token: credential.identityToken,
    });

    return { user: data?.user ?? null, error };
  } catch (err: any) {
    if (err.code === 'ERR_REQUEST_CANCELED') {
      return { user: null, error: null }; // user cancelled — not an error
    }
    return { user: null, error: err instanceof Error ? err : new Error(String(err)) };
  }
}
