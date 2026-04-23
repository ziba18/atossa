import React from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ContentCard } from '../../../../components/education/ContentCard';
import { Header } from '../../../../components/layout/Header';
import { EmptyState } from '../../../../components/ui/EmptyState';
import { getArticlesByCategory } from '../../../../constants/articles';
import type { ContentCategory } from '../../../../types/database';
import { Colors } from '../../../../constants/colors';
import { Spacing } from '../../../../constants/theme';

export default function CategoryScreen() {
  const { name } = useLocalSearchParams<{ name: string }>();
  const articles = getArticlesByCategory((name as ContentCategory) ?? 'all');

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      <Header title={name?.replace(/_/g, ' ') ?? 'Category'} showBack />
      <FlatList
        data={articles}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <EmptyState iconName="book-open" title="No articles in this category" subtitle="Check other categories." />
        }
        renderItem={({ item }) => <ContentCard content={item as any} />}
        ListFooterComponent={<View style={{ height: Spacing.xxl }} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({ list: { padding: Spacing.md } });
