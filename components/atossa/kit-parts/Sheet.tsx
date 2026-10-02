import React, { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo, Animated, Easing, Keyboard, KeyboardAvoidingView, Modal, PanResponder, Platform, Pressable,
  ScrollView, StyleSheet, View, useWindowDimensions,
  type NativeScrollEvent, type NativeSyntheticEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, layout, motion, radii, shadows, space } from '../../../constants/atossaUI';
import { Icon, type IconName } from '../../ui/Icon';
import { dismissToast } from './toast';
import { Txt } from './Txt';

/** True when the user asked the OS to reduce motion (then sheets fade instead of sliding). */
export function useReduceMotion(): boolean {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled?.().then((v) => { if (alive) setReduce(v); }).catch(() => {});
    const sub = AccessibilityInfo.addEventListener?.('reduceMotionChanged', setReduce);
    return () => { alive = false; sub?.remove?.(); };
  }, []);
  return reduce;
}

export interface SheetProps {
  visible: boolean;
  /** Called on X, Android back, scrim tap and swipe-down on the grabber/header. Set visible=false in it. */
  onClose: () => void;
  /** Sheet title (title 24/30). */
  title?: string;
  /** Sticky content under the title row (e.g. a DatePill or progress label). Doesn't scroll. */
  header?: React.ReactNode;
  /** Sticky footer (e.g. the primary Save button). Doesn't scroll; sits above the keyboard. */
  footer?: React.ReactNode;
  children: React.ReactNode;
  /** Fill the screen height (capture sheet). Default: hug content up to 92% of the screen. */
  full?: boolean;
  /** Set false when children manage their own scrolling. */
  scroll?: boolean;
  /** Close-button label for screen readers. */
  closeLabel?: string;
  /** The body ScrollView, e.g. to `scrollTo({ y: 0 })` when the content changes step. */
  scrollRef?: React.RefObject<ScrollView | null>;
  /** 20 pt glyph before the title (e.g. clay droplet on Log bleeding). */
  titleIcon?: { name: IconName; color?: string };
}

/** Web: drop focus from inside the closing sheet so nothing keeps a lock on the page. */
function releaseFocus() {
  Keyboard.dismiss();
  if (Platform.OS === 'web' && typeof document !== 'undefined') {
    const el = document.activeElement as HTMLElement | null;
    el?.blur?.();
  }
}

/**
 * Bottom sheet on RN Modal: 28 top radius, grabber, X (20) top-right, scrim, sticky header and
 * footer slots, keyboard avoiding. Opens with a 260 ms slide (fade only under Reduce Motion)
 * and dismisses any toast so it never covers the sheet.
 */
export function Sheet({
  visible, onClose, title, header, footer, children, full, scroll = true, closeLabel = 'Close',
  scrollRef, titleIcon,
}: SheetProps) {
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const reduceMotion = useReduceMotion();
  const [mounted, setMounted] = useState(visible);
  const progress = useRef(new Animated.Value(0)).current; // 0 hidden → 1 shown
  const drag = useRef(new Animated.Value(0)).current;
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  // Sticky-edge hairline under the title/header once the body scrolls (V14).
  const edge = useRef(new Animated.Value(0)).current;
  const scrolled = useRef(false);
  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const s = e.nativeEvent.contentOffset.y > 2;
    if (s === scrolled.current) return;
    scrolled.current = s;
    Animated.timing(edge, { toValue: s ? 1 : 0, duration: 160, useNativeDriver: Platform.OS !== 'web' }).start();
  };

  useEffect(() => {
    if (visible) {
      dismissToast();
      setMounted(true);
      drag.setValue(0);
      scrolled.current = false;
      edge.setValue(0);
      Animated.timing(progress, {
        toValue: 1, duration: motion.sheet, easing: Easing.bezier(0.2, 0, 0, 1), useNativeDriver: Platform.OS !== 'web',
      }).start();
      return undefined;
    }
    if (!mounted) return undefined;
    // Closing. The dead-first-tap bug (review 1, UX #5): the Modal's full-screen layer stayed
    // mounted, invisible, until the exit animation's callback — which on web runs on rAF and can
    // stall — so the next tap landed on the invisible scrim. Now: release focus/keyboard at once;
    // on web unmount immediately (no exit slide); on native unmount after the 200 ms fade, with a
    // timer fallback in case the animation callback never fires.
    releaseFocus();
    if (Platform.OS === 'web') {
      progress.setValue(0);
      setMounted(false);
      return undefined;
    }
    let done = false;
    const finish = () => { if (!done) { done = true; setMounted(false); } };
    Animated.timing(progress, {
      toValue: 0, duration: motion.fast, easing: Easing.out(Easing.quad), useNativeDriver: true,
    }).start(({ finished }) => { if (finished) finish(); });
    const fallback = setTimeout(finish, motion.fast + 120);
    // Re-opened before the fade ended: keep it mounted.
    return () => { done = true; clearTimeout(fallback); };
  }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps

  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => g.dy > 6 && Math.abs(g.dy) > Math.abs(g.dx),
      onPanResponderMove: (_, g) => drag.setValue(Math.max(0, g.dy)),
      onPanResponderRelease: (_, g) => {
        if (g.dy > 80 || g.vy > 0.8) onCloseRef.current();
        else Animated.spring(drag, { toValue: 0, useNativeDriver: Platform.OS !== 'web', bounciness: 0 }).start();
      },
      onPanResponderTerminate: () => {
        Animated.spring(drag, { toValue: 0, useNativeDriver: Platform.OS !== 'web', bounciness: 0 }).start();
      },
    }),
  ).current;

  if (!mounted) return null;

  const maxHeight = height - insets.top - space.xs;
  const translateY = reduceMotion
    ? drag
    : Animated.add(progress.interpolate({ inputRange: [0, 1], outputRange: [height, 0] }), drag);
  const sheetOpacity = reduceMotion ? progress : 1;

  const body = scroll ? (
    <ScrollView
      ref={scrollRef as React.RefObject<ScrollView>}
      onScroll={onScroll}
      scrollEventThrottle={32}
      style={full ? { flex: 1 } : { flexGrow: 0, flexShrink: 1 }}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="interactive"
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.content, { flexShrink: 1 }, full && { flex: 1 }]}>{children}</View>
  );

  return (
    <Modal visible transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      {/* While closing (native fade), nothing inside takes touches. */}
      <View style={[StyleSheet.absoluteFill, { pointerEvents: visible ? 'auto' : 'none' }]}>
      <Animated.View style={[StyleSheet.absoluteFill, styles.scrim, { opacity: progress }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel={closeLabel} accessibilityRole="button" />
      </Animated.View>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.anchor}
      >
        <Animated.View
          accessibilityViewIsModal
          style={[
            styles.sheet,
            { maxHeight, paddingBottom: footer ? 0 : Math.max(insets.bottom, space.lg), opacity: sheetOpacity, transform: [{ translateY }] },
            full && { height: maxHeight },
          ]}
        >
          {/* Grabber + title row: the swipe-down handle. */}
          <View {...pan.panHandlers}>
            <View style={styles.grabberHit}>
              <View style={styles.grabber} />
            </View>
            <View style={styles.titleRow}>
              <View style={styles.titleWrap}>
                {titleIcon ? <Icon name={titleIcon.name} size={20} color={titleIcon.color ?? colors.ink} /> : null}
                {title ? <Txt variant="title" accessibilityRole="header" style={{ flexShrink: 1 }}>{title}</Txt> : null}
              </View>
              <Pressable
                onPress={onClose}
                accessibilityRole="button"
                accessibilityLabel={closeLabel}
                hitSlop={4}
                style={({ pressed }) => [styles.close, pressed && { backgroundColor: colors.sunken }]}
              >
                <Icon name="x" size={20} color={colors.ink} />
              </Pressable>
            </View>
          </View>
          {header ? <View style={styles.header}>{header}</View> : null}
          <Animated.View style={[styles.edge, { opacity: edge }]} />
          {body}
          {footer ? (
            <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, space.lg) }]}>{footer}</View>
          ) : null}
        </Animated.View>
      </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: { backgroundColor: colors.scrim },
  // box-none in StyleSheet.create, never inline: RN-web drops an inline 'box-none' (invalid CSS),
  // which made this full-screen anchor swallow scrim taps on web.
  anchor: { flex: 1, justifyContent: 'flex-end', alignItems: 'center', pointerEvents: 'box-none' },
  sheet: {
    width: '100%', maxWidth: layout.maxContentWidth,
    backgroundColor: colors.canvas, borderTopLeftRadius: radii.sheet, borderTopRightRadius: radii.sheet,
    overflow: 'hidden', ...shadows.sheet,
  },
  grabberHit: { height: 20, alignItems: 'center', justifyContent: 'center' },
  grabber: { width: 48, height: 6, borderRadius: radii.pill, backgroundColor: colors.borderStrong },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingLeft: layout.gutter, paddingRight: space.sm, minHeight: 44 },
  titleWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: space.xs },
  edge: { height: StyleSheet.hairlineWidth * 2, backgroundColor: colors.hairline, marginBottom: -StyleSheet.hairlineWidth * 2, zIndex: 1 },
  close: { width: 44, height: 44, borderRadius: radii.pill, alignItems: 'center', justifyContent: 'center' },
  header: { paddingHorizontal: layout.gutter, paddingBottom: space.sm },
  content: { paddingHorizontal: layout.gutter, paddingTop: space.xs, paddingBottom: space.xl },
  footer: {
    paddingHorizontal: layout.gutter, paddingTop: space.sm, borderTopWidth: 1, borderTopColor: colors.hairline,
    backgroundColor: colors.canvas, gap: space.xs,
  },
});
