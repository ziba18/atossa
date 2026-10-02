// Routes into Timeline's detail screens and the shared "back" behaviour for them.
// `from` = the visible title of the screen the detail was opened from (BackChevron label).
import { useRef, type RefObject } from 'react';
import { Dimensions, Platform, type LayoutChangeEvent, type ScrollView } from 'react-native';
import type { useRouter } from 'expo-router';

type Router = ReturnType<typeof useRouter>;

export type RecordRouteKind = 'appointments' | 'medicines';

const q = (from: string) => `from=${encodeURIComponent(from)}`;

export const entryHref = (id: string, from = 'Timeline') =>
  `/(tabs)/timeline/entry/${encodeURIComponent(id)}?${q(from)}`;

export const bleedingHref = (date: string, from = 'Timeline') =>
  `/(tabs)/timeline/bleeding/${date}?${q(from)}`;

/** A run of consecutive bleeding days (List card) → the list of those days. */
export const periodHref = (start: string, from = 'Timeline') =>
  `/(tabs)/timeline/period/${start}?${q(from)}`;

export const recordHref = (kind: RecordRouteKind, id: string, from = 'Timeline') =>
  `/(tabs)/timeline/record/${kind}/${encodeURIComponent(id)}?${q(from)}`;

/** Tab root for a `from` label, used when there is no history to go back to. */
const ROOTS: Record<string, string> = {
  Today: '/(tabs)/today',
  Timeline: '/(tabs)/timeline',
  'For my doctor': '/(tabs)/doctor',
  Profile: '/(tabs)/profile',
};

/** Normalise the `from` search param (string | string[] | undefined) to a label. */
export function fromLabel(from: string | string[] | undefined): string {
  const v = Array.isArray(from) ? from[0] : from;
  return v && v.trim() ? v : 'Timeline';
}

/**
 * Back to the screen named by `from`.
 * - Opened from another tab's root (e.g. Today's latest note): go to that tab. A plain
 *   router.back() could land on the Timeline list instead when the Timeline stack already had
 *   the list under this detail — the BackChevron promised "Today". (The Timeline stack drops the
 *   detail once the tab loses focus — see app/(tabs)/timeline/_layout.tsx.)
 * - Otherwise router.back() when there is history, else the Timeline list.
 */
export function goBack(router: Router, from: string) {
  const root = ROOTS[from];
  if (root && from !== 'Timeline') router.navigate(root as any);
  else if (router.canGoBack()) router.back();
  else router.navigate(ROOTS.Timeline as any);
}

/** Pause before navigating / opening another modal after closing a Sheet (its Modal must finish dismissing). */
export const AFTER_SHEET_MS = 320;

/**
 * Scroll a just-opened ConfirmCard (at the foot of a detail screen) fully into view, buttons
 * included, above the tab bar (UX #13). Call it from the button that opens the card AND from the
 * card's onLayout (pass the event): on web the ScrollView ref can be null (react-native-web /
 * React 19), so the layout event's DOM node is used to find the scroll container instead.
 */
export function revealConfirm(scrollRef: RefObject<ScrollView | null>, e?: LayoutChangeEvent) {
  type ScrollNode = { scrollToEnd?: (o: { animated: boolean }) => void; parentElement?: ScrollNode | null };
  let webNode: ScrollNode | null = null;
  if (Platform.OS === 'web' && e) {
    let n = (e.nativeEvent as unknown as { target?: ScrollNode }).target ?? null;
    while (n && typeof n.scrollToEnd !== 'function') n = n.parentElement ?? null;
    webNode = n;
  }
  const go = (animated: boolean) => () => {
    const sv = scrollRef.current ?? (webNode as unknown as ScrollView | null);
    sv?.scrollToEnd({ animated });
  };
  setTimeout(go(true), 60);
  setTimeout(go(true), 160);
  // Final settle without animation: guarantees the end even if a smooth scroll was interrupted
  // (no visible jump when the animated scroll already got there).
  setTimeout(go(false), 450);
}

/**
 * A ScrollView ref for ScreenLarge's `scrollRef` that survives a web quirk: on react-native-web
 * (React 19) the object ref is reset to null after mount although the scroll node is still on
 * screen, so scrollToEnd silently did nothing (UX #13). On web a null is ignored while the last
 * node is still in the document; on native it behaves like a plain useRef.
 */
export function useScrollRef(): RefObject<ScrollView | null> {
  const holder = useRef<RefObject<ScrollView | null> | null>(null);
  if (!holder.current) {
    let node: ScrollView | null = null;
    holder.current = {
      get current() { return node; },
      set current(v: ScrollView | null) {
        if (v != null || Platform.OS !== 'web') node = v;
        else if (!(node as unknown as { isConnected?: boolean } | null)?.isConnected) node = null;
      },
    };
  }
  return holder.current;
}

/** Room kept clear above a revealed block, and below it for the tab bar + home indicator. */
const REVEAL_TOP = 16;
const REVEAL_BOTTOM = 96;

type MeasurableHost = {
  measureInWindow?: (cb: (x: number, y: number, w: number, h: number) => void) => void;
  measureLayout?: (rel: unknown, ok: (x: number, y: number) => void, fail?: () => void) => void;
};
type DomNode = {
  getBoundingClientRect?: () => { top: number; bottom: number };
  parentElement?: DomNode | null;
  scrollHeight?: number;
  clientHeight?: number;
  scrollTop?: number;
  scrollTo?: (o: { top: number; behavior?: string }) => void;
};

/**
 * Scroll an inline editor that just opened (N9) so all of it is on screen: when it runs past the
 * bottom (or starts above the top), its top is brought to 16 pt below the top of the screen.
 * Nothing moves when it already fits. Call from the editor's first onLayout with its host ref.
 * Web: walks up the DOM to the scroll container (ScrollView refs can be null there — see
 * useScrollRef); native: measures in the window and against the ScrollView's content.
 */
export function revealBlock(scrollRef: RefObject<ScrollView | null>, node: unknown) {
  if (!node) return;
  if (Platform.OS === 'web') {
    setTimeout(() => {
      const el = node as DomNode;
      let sc = el.parentElement ?? null;
      while (sc && !((sc.scrollHeight ?? 0) > (sc.clientHeight ?? 0) + 1 && /(auto|scroll)/.test(
        (globalThis as unknown as { getComputedStyle: (n: unknown) => { overflowY: string } }).getComputedStyle(sc).overflowY,
      ))) sc = sc.parentElement ?? null;
      if (!sc || !el.getBoundingClientRect || !sc.getBoundingClientRect) return;
      const r = el.getBoundingClientRect();
      const c = sc.getBoundingClientRect();
      const viewBottom = c.bottom - REVEAL_BOTTOM;
      if (r.top >= c.top + REVEAL_TOP && r.bottom <= viewBottom) return;
      sc.scrollTo?.({ top: (sc.scrollTop ?? 0) + (r.top - c.top) - REVEAL_TOP, behavior: 'smooth' });
    }, 60);
    return;
  }
  setTimeout(() => {
    const host = node as MeasurableHost;
    const sv = scrollRef.current as unknown as {
      getInnerViewRef?: () => unknown;
      scrollTo: (o: { y: number; animated: boolean }) => void;
    } | null;
    if (!sv || !host.measureInWindow || !host.measureLayout) return;
    host.measureInWindow((_x, y, _w, h) => {
      const winH = Dimensions.get('window').height;
      // 60 ≈ status bar + a little air: the screen has no sticky header.
      if (y >= 60 && y + h <= winH - REVEAL_BOTTOM) return;
      const inner = sv.getInnerViewRef?.();
      if (!inner) return;
      host.measureLayout!(inner, (_cx, cy) => sv.scrollTo({ y: Math.max(0, cy - REVEAL_TOP), animated: true }), () => {});
    });
  }, 60);
}
