import React, { useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ContentCard } from '../../../components/education/ContentCard';
import { CategoryFilter } from '../../../components/education/CategoryFilter';
import type { ContentCategory } from '../../../types/database';
import { ARTICLES, getArticlesByCategory } from '../../../constants/articles';
import { Colors } from '../../../constants/colors';
import { FontSize, Spacing } from '../../../constants/theme';
import { AuroraBackground } from '../../../components/layout/AuroraBackground';
import { Icon } from '../../../components/ui/Icon';
import { useRouter } from 'expo-router';

const QUIZ_CARDS = [
  {
    key: 'pcos',
    label: 'PCOS self-assessment',
    body: '12 questions. Get a clarity score and guidance.',
    accent: Colors.apricot,
    textAccent: Colors.gold,
    route: '/(tabs)/insights/pcos-assessment',
  },
  {
    key: 'health-trends',
    label: 'Health trends',
    body: 'Visualise your symptom patterns over time.',
    accent: Colors.rose,
    textAccent: Colors.roseDeep,
    route: '/(tabs)/insights/health-trends',
  },
] as const;

export default function EducationScreen() {
  const [category, setCategory] = useState<ContentCategory | 'all'>('all');
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const articles = getArticlesByCategory(category);
  const bottomPad = 68 + 12 + insets.bottom + 16;

  const ListHeader = (
    <View>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.smallcaps}>LEARN</Text>
        <Text style={styles.title}>Knowledge that fits your body</Text>
        <Text style={styles.subtitle}>Evidence-based articles and self-assessments</Text>
      </View>

      {/* Quiz / assessment cards */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.quizRow}
        style={{ marginBottom: Spacing.md }}
      >
        {QUIZ_CARDS.map((q) => (
          <TouchableOpacity
            key={q.key}
            onPress={() => router.push(q.route as any)}
            activeOpacity={0.82}
            style={[styles.quizCard, { backgroundColor: q.accent + '55' }]}
          >
            <Text style={styles.quizLabel}>SELF-ASSESSMENT</Text>
            <Text style={[styles.quizTitle, { color: Colors.textPrimary }]}>{q.label}</Text>
            <Text style={styles.quizBody}>{q.body}</Text>
            <View style={styles.quizCta}>
              <Text style={[styles.quizCtaText, { color: q.textAccent }]}>Begin</Text>
              <Icon name="arrow-right" size={12} color={q.textAccent} />
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Category filter */}
      <CategoryFilter selected={category} onChange={setCategory} />

      <Text style={styles.countText}>
        {articles.length} {articles.length === 1 ? 'article' : 'articles'}
        {category !== 'all' ? ` in ${category.replace(/_/g, ' ')}` : ''}
      </Text>
    </View>
  );

  return (
    <View style={styles.screen}>
      <AuroraBackground />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <FlatList
          data={articles}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.list, { paddingBottom: bottomPad }]}
          ListHeaderComponent={ListHeader}
          renderItem={({ item }) => <ContentCard content={item as any} />}
          showsVerticalScrollIndicator={false}
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  list: { paddingHorizontal: Spacing.md },
  header: {
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  smallcaps: {
    fontSize: 10, fontFamily: 'Jost_600SemiBold',
    color: Colors.textMuted, letterSpacing: 1.5, marginBottom: 6,
  },
  title: {
    fontSize: 28,
    fontFamily: 'CormorantGaramond_600SemiBold',
    color: Colors.textPrimary,
    lineHeight: 34,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: FontSize.sm,
    fontFamily: 'Jost_400Regular',
    color: Colors.textMuted,
    marginBottom: Spacing.md,
    lineHeight: 20,
  },

  // Quiz cards
  quizRow: { gap: 12, paddingBottom: 4 },
  quizCard: {
    width: 220,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(51,50,68,0.07)',
  },
  quizLabel: {
    fontSize: 9, fontFamily: 'Jost_600SemiBold',
    color: Colors.textMuted, letterSpacing: 1.2, marginBottom: 6,
  },
  quizTitle: {
    fontSize: FontSize.lg,
    fontFamily: 'CormorantGaramond_600SemiBold',
    lineHeight: 22,
    marginBottom: 6,
  },
  quizBody: {
    fontSize: FontSize.xs,
    fontFamily: 'Jost_400Regular',
    color: Colors.textSecondary,
    lineHeight: 17,
    marginBottom: 14,
  },
  quizCta: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  quizCtaText: { fontSize: FontSize.sm, fontFamily: 'Jost_600SemiBold' },

  countText: {
    fontSize: FontSize.xs,
    fontFamily: 'Jost_400Regular',
    color: Colors.textMuted,
    textTransform: 'capitalize',
    paddingVertical: Spacing.sm,
  },
});
