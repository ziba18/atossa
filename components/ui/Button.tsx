import React, { useEffect } from 'react';
import {
  Pressable, Text, ActivityIndicator, StyleSheet,
  ViewStyle, TextStyle, View,
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming, withRepeat,
  withDelay, Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useColors, type AppColors } from '../../contexts/ThemeContext';
import { Colors } from '../../constants/colors';
import { FontSize, FontWeight, Radius, Spacing } from '../../constants/theme';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

const AnimatedView = Animated.createAnimatedComponent(View);

/**
 * "Alive" button:
 *  - spring lift on hover-in, squeeze on press (reanimated)
 *  - gradient fill that subtly shifts on the gloss variants
 *  - animated specular sheen sweep on press
 *  - preserved public API — no caller has to change
 */
export function Button({
  label, onPress, variant = 'primary', size = 'md',
  loading = false, disabled = false,
  style, textStyle, fullWidth = false,
}: ButtonProps) {
  const theme = useColors();
  const styles = createStyles(theme);
  const isDisabled = disabled || loading;

  // Press scale + lift
  const scale = useSharedValue(1);
  const lift = useSharedValue(0);
  // Sheen sweep — runs continuously on filled variants, paused for ghost/outline.
  const sheen = useSharedValue(-1);

  const filledVariant = variant === 'primary' || variant === 'danger' || variant === 'success';

  useEffect(() => {
    if (!filledVariant) return;
    // Soft, slow sheen sweep — looks alive without being noisy.
    sheen.value = withRepeat(
      withDelay(2400, withTiming(1, { duration: 1100, easing: Easing.inOut(Easing.cubic) })),
      -1,
      false,
    );
    return () => {
      sheen.value = -1;
    };
  }, [filledVariant]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: lift.value },
      { scale: scale.value },
    ],
  }));

  const sheenStyle = useAnimatedStyle(() => ({
    opacity: filledVariant ? 1 : 0,
    transform: [{ translateX: 250 * sheen.value }, { rotate: '20deg' }],
  }));

  const onPressIn = () => {
    scale.value = withSpring(0.96, { stiffness: 400, damping: 18 });
    lift.value = withSpring(0, { stiffness: 400, damping: 18 });
  };
  const onPressOut = () => {
    scale.value = withSpring(1, { stiffness: 320, damping: 18 });
    lift.value = withSpring(-1.5, { stiffness: 320, damping: 18 });
    setTimeout(() => {
      lift.value = withSpring(0, { stiffness: 280, damping: 22 });
    }, 120);
  };

  // Gradient endpoints per variant (filled).
  const gradient =
    variant === 'primary' ? [Colors.cherry, Colors.cherryDark] :
    variant === 'danger'  ? [Colors.roseDeep, Colors.cherryDark] :
    variant === 'success' ? [Colors.emerald,  Colors.emeraldDark] :
    null;

  return (
    <AnimatedView style={[
      styles.shadow,
      fullWidth && styles.fullWidth,
      isDisabled && styles.disabled,
      animatedStyle,
      style,
    ]}>
      <Pressable
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        disabled={isDisabled}
        style={({ pressed }) => [
          styles.base,
          styles[`size_${size}`],
          !filledVariant && styles[variant],
          fullWidth && styles.fullWidth,
        ]}
      >
        {/* Gradient fill for filled variants */}
        {gradient && (
          <LinearGradient
            colors={gradient as [string, string]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />
        )}

        {/* Animated specular sheen — only on filled variants */}
        {filledVariant && (
          <Animated.View
            pointerEvents="none"
            style={[styles.sheen, sheenStyle]}
          >
            <LinearGradient
              colors={['transparent', 'rgba(255,255,255,0.55)', 'transparent']}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={StyleSheet.absoluteFillObject}
            />
          </Animated.View>
        )}

        {/* Inner top-edge highlight — gives the "glossy" raised feel */}
        {filledVariant && <View style={styles.innerHighlight} pointerEvents="none" />}

        {/* Label */}
        {loading ? (
          <ActivityIndicator
            color={variant === 'outline' || variant === 'ghost' ? theme.cherry : '#FFFFFF'}
            size="small"
          />
        ) : (
          <Text style={[
            styles.text,
            styles[`text_${variant}`],
            styles[`textSize_${size}`],
            textStyle,
          ]}>
            {label}
          </Text>
        )}
      </Pressable>
    </AnimatedView>
  );
}

function createStyles(c: AppColors) {
  return StyleSheet.create({
    shadow: {
      borderRadius: Radius.full,
      // Soft "lift off the page" shadow that complements the gloss.
      shadowColor: c.cherry,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.22,
      shadowRadius: 16,
      elevation: 4,
    },
    base: {
      borderRadius: Radius.full,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      overflow: 'hidden',
      position: 'relative',
    },
    fullWidth: { width: '100%' },
    disabled: { opacity: 0.45 },

    // Non-filled variants keep their flat backgrounds.
    secondary: { backgroundColor: c.cherryLighter },
    outline:   { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: c.cherry },
    ghost:     { backgroundColor: c.cherryLighter },

    sheen: {
      position: 'absolute',
      top: -10, bottom: -10,
      width: 70,
      left: -90,
    },
    innerHighlight: {
      position: 'absolute',
      top: 0, left: 0, right: 0,
      height: '50%',
      borderTopLeftRadius: Radius.full,
      borderTopRightRadius: Radius.full,
      backgroundColor: 'rgba(255,255,255,0.22)',
    },

    size_sm: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs + 2, minHeight: 36 },
    size_md: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm + 4, minHeight: 44 },
    size_lg: { paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md,     minHeight: 52 },

    text:           { fontWeight: FontWeight.semibold, letterSpacing: 0.3, fontFamily: 'Jost_600SemiBold' },
    text_primary:   { color: '#FFFFFF' },
    text_secondary: { color: c.cherry },
    text_outline:   { color: c.cherry },
    text_ghost:     { color: c.cherry },
    text_danger:    { color: '#FFFFFF' },
    text_success:   { color: '#FFFFFF' },

    textSize_sm: { fontSize: FontSize.sm },
    textSize_md: { fontSize: FontSize.sm },
    textSize_lg: { fontSize: FontSize.md },
  });
}
