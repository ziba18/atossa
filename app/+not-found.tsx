import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../constants/colors';
import { useColors } from '../contexts/ThemeContext';
import { FontSize, FontWeight, Spacing } from '../constants/theme';

export default function NotFoundScreen() {
  const router = useRouter();
  const theme = useColors();

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.background }]}>
      <LinearGradient
        colors={['#390517', '#03110D']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <Text style={styles.code}>404</Text>
        <Text style={styles.title}>Page Not Found</Text>
        <Text style={styles.subtitle}>
          This page doesn't exist. Let's get you back on track.
        </Text>
      </LinearGradient>

      <View style={styles.body}>
        <TouchableOpacity
          style={styles.btn}
          onPress={() => router.replace('/(tabs)/home')}
          activeOpacity={0.85}
        >
          <Text style={styles.btnText}>Go to Home</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.backLink}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Text style={styles.backLinkText}>← Go back</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  code: {
    fontSize: 96,
    fontFamily: 'CormorantGaramond_600SemiBold',
    color: 'rgba(255,255,255,0.15)',
    lineHeight: 100,
  },
  title: {
    fontSize: FontSize.xxl,
    fontFamily: 'CormorantGaramond_600SemiBold',
    color: Colors.white,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: FontSize.md,
    fontFamily: 'Jost_400Regular',
    color: 'rgba(255,255,255,0.65)',
    textAlign: 'center',
    lineHeight: 22,
  },
  body: {
    padding: Spacing.xl,
    gap: Spacing.md,
    alignItems: 'center',
  },
  btn: {
    backgroundColor: Colors.cherry,
    borderRadius: 99,
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.md,
    width: '100%',
    alignItems: 'center',
  },
  btnText: {
    fontSize: FontSize.md,
    fontFamily: 'Jost_600SemiBold',
    fontWeight: FontWeight.semibold,
    color: Colors.white,
  },
  backLink: {
    paddingVertical: Spacing.sm,
  },
  backLinkText: {
    fontSize: FontSize.md,
    fontFamily: 'Jost_400Regular',
    color: Colors.cherry,
  },
});
