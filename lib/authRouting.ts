import type { Profile } from '../types/database';
import { isHumanName } from './humanName';

/**
 * Where a signed-in user should land: the app if onboarding is finished, otherwise the
 * first onboarding step they still need (the name step only when we don't have a real name,
 * e.g. Apple sign-in that hid it).
 */
export function routeAfterSignIn(profile: Profile | null | undefined): string {
  if (profile?.onboarding_complete) return '/(tabs)/chat';
  if (!isHumanName(profile?.display_name)) return '/(auth)/onboarding/name';
  return '/(auth)/onboarding/basics';
}
