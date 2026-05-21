import React, { useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ContentCard } from '../../../components/education/ContentCard';
import { CategoryFilter } from '../../../components/education/CategoryFilter';
import type { ContentCategory } from '../../../types/database';
import { ARTICLES, getArticlesByCategory } from '../../../constants/articles';
import { Spacing } from '../../../constants/theme';
import { Type } from '../../../constants/typography';
import { useColors, type AppColors } from '../../../contexts/ThemeContext';
import { AuroraBackground } from '../../../components/layout/AuroraBackground';

export default function EducationScreen() {
  const theme = useColors();
  const styles = createStyles(theme);
  const [category, setCategory] = useState<ContentCategory | 'all'>('all');
  const insets = useSafeAreaInsets();

  const articles = getArticlesByCategory(category);
  const bottomPad = 68 + 12 + insets.bottom + 16;

  const ListHeader = (
    <View>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.kicker}>THE LIBRARY</Text>
        <Text style={styles.title} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>
          Knowledge for you
        </Text>
      </View>

      {/* Category filter */}
      <CategoryFilter selected={category} onChange={setCategory} />

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

function createStyles(c: AppColors) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: c.background },
    list: { paddingHorizontal: Spacing.md },
    header: {
      paddingTop: Spacing.md,
      paddingBottom: Spacing.sm,
    },
    kicker: { ...Type.education.kicker },
    title:  { ...Type.education.title, marginBottom: 6, marginTop: 2 },
  });
}
