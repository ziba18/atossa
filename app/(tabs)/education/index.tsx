import React, { useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ContentCard } from '../../../components/education/ContentCard';
import { CategoryFilter } from '../../../components/education/CategoryFilter';
import type { ContentCategory } from '../../../types/database';
import { ARTICLES, getArticlesByCategory } from '../../../constants/articles';
import { Colors } from '../../../constants/colors';
import { FontSize, Spacing } from '../../../constants/theme';

export default function EducationScreen() {
  const [category, setCategory] = useState<ContentCategory | 'all'>('all');

  const articles = getArticlesByCategory(category);

  const ListHeader = (
    <View>
      <View style={styles.header}>
        <Text style={styles.title}>Learn</Text>
        <Text style={styles.subtitle}>Evidence-based articles about your body</Text>
      </View>
      <CategoryFilter selected={category} onChange={setCategory} />
      <Text style={styles.countText}>
        {articles.length} {articles.length === 1 ? 'article' : 'articles'}
        {category !== 'all' ? ` in ${category.replace(/_/g, ' ')}` : ''}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <FlatList
        data={articles}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={ListHeader}
        renderItem={({ item }) => <ContentCard content={item as any} />}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={<View style={{ height: Spacing.xxl }} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  title: {
    fontSize: FontSize.xxxl,
    fontFamily: 'CormorantGaramond_600SemiBold',
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: FontSize.sm,
    fontFamily: 'Jost_400Regular',
    color: Colors.textMuted,
    marginTop: 2,
  },
  countText: {
    fontSize: FontSize.xs,
    fontFamily: 'Jost_400Regular',
    color: Colors.textMuted,
    textTransform: 'capitalize',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  list: {
    paddingHorizontal: Spacing.md,
  },
});
