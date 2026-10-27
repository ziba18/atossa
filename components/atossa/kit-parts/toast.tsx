import React, { useEffect, useRef } from 'react';
import { AccessibilityInfo, Animated, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { create } from 'zustand';
import { colors, fonts, heights, layout, motion, radii, shadows, space } from '../../../constants/atossaUI';
import { Icon } from '../../ui/Icon';
import { Txt } from './Txt';

interface ToastState {
  message: string | null;
  /** Bumps on every show so the same text shown twice still restarts the timer/animation. */
  seq: number;
}

const useToastStore = create<ToastState>(() => ({ message: null, seq: 0 }));
let timer: ReturnType<typeof setTimeout> | null = null;

/**
 * Show the one app toast ("Saved. 13 notes ready for your GP."). A new toast replaces the
 * previous one. Auto-dismisses after 3 s (longer for long messages). System status only — never health content.
 */
export function showToast(message: string): void {
  if (timer) clearTimeout(timer);
  useToastStore.setState((s) => ({ message, seq: s.seq + 1 }));
  AccessibilityInfo.announceForAccessibility?.(message);
  // 3 s for the short "Saved." lines; longer messages stay ~70 ms per character so they can be read.
  timer = setTimeout(dismissToast, Math.max(motion.toastMs, message.length * 70));
}

/** Hide the toast now. Sheets call this when they open so it never sits over them. */
export function dismissToast(): void {
  if (timer) { clearTimeout(timer); timer = null; }
  if (useToastStore.getState().message !== null) useToastStore.setState({ message: null });
}

/** Mounted once in app/_layout.tsx, after the navigator. */
export function ToastHost() {
  const { message, seq } = useToastStore();
  const insets = useSafeAreaInsets();
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!message) return;
    opacity.setValue(0);
    Animated.timing(opacity, { toValue: 1, duration: motion.fast, useNativeDriver: Platform.OS !== 'web' }).start();
  }, [seq]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!message) return null;
  return (
    <View style={[StyleSheet.absoluteFill, styles.layer]}>
      {/* Full-width row that centres the toast under the content column on wide windows / iPad
          (review 3, #3: absolute left/right ignored alignSelf and pinned it to the far left). */}
      <View style={[styles.row, { bottom: insets.bottom + heights.tabBar + space.sm }]}>
        <Animated.View
          style={[styles.toast, { opacity }]}
          accessibilityLiveRegion="polite"
          accessibilityRole="alert"
        >
          <Pressable onPress={dismissToast} accessibilityLabel={`${message} Dismiss`} style={styles.inner}>
            <Icon name="check-circle" size={20} color={colors.saved} />
            <Txt style={styles.text}>{message}</Txt>
          </Pressable>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // box-none MUST live in StyleSheet.create: RN-web only compiles it (self none, children auto)
  // for static styles; as an inline style it becomes invalid CSS and the full-screen layer ate
  // every tap for the toast's 3 s (review 2, N1 — the "dead tap after Log bleeding Save").
  layer: { zIndex: 1000, elevation: 1000, pointerEvents: 'box-none' },
  // Same box-none rule: the row spans the screen but only the toast takes touches.
  row: { position: 'absolute', left: 0, right: 0, alignItems: 'center', paddingHorizontal: layout.gutter, pointerEvents: 'box-none' },
  toast: {
    width: '100%',
    maxWidth: layout.maxContentWidth - layout.gutter * 2,
    // Floats clear of the canvas (V28): its own shadow + a faint saved-green edge.
    backgroundColor: colors.savedTint, borderRadius: radii.input, borderWidth: 1, borderColor: `${colors.saved}33`,
    ...shadows.toast,
  },
  inner: { flexDirection: 'row', alignItems: 'center', gap: space.xs, paddingHorizontal: space.md, paddingVertical: space.sm, minHeight: heights.toast },
  text: { flex: 1, fontFamily: fonts.medium, fontSize: 15, lineHeight: 20, color: colors.saved },
});
