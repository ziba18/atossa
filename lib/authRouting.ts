import type { Profile } from '../types/database';
import { isHumanName } from './humanName';

/** Version of the consent text on the consent screen. Raise it when the text changes. */
export const CONSENT_VERSION = 1;

/**
 * Where a signed-in user should land: the app if onboarding is finished, otherwise the
 * first onboarding step they still need (the name step only when we don't have a real name,
 * e.g. Apple sign-in that hid it).
 */
export function routeAfterSignIn(profile: Profile | null | undefined): string {
  // consent_version is null until agreed. An older backend omits it (undefined): then there is nothing to ask.
  if (profile && profile.consent_version === null) return '/(auth)/onboarding/consent';
  if (profile?.onboarding_complete) return '/(tabs)/today';
  if (!isHumanName(profile?.display_name)) return '/(auth)/onboarding/name';
  return '/(auth)/onboarding/basics';
}
