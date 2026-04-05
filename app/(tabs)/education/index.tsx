import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../../lib/supabase';
import { ContentCard } from '../../../components/education/ContentCard';
import { CategoryFilter } from '../../../components/education/CategoryFilter';
import { EmptyState } from '../../../components/ui/EmptyState';
import type { EducationContent, ContentCategory } from '../../../types/database';
import { Colors } from '../../../constants/colors';
import { FontSize, FontWeight, Spacing } from '../../../constants/theme';

export default function EducationScreen() {
  const [content, setContent] = useState<EducationContent[]>([]);
  const [category, setCategory] = useState<ContentCategory | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchContent = useCallback(async (cat: ContentCategory | 'all', isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    let query = supabase
      .from('education_content')
      .select('*')
      .eq('is_published', true)
      .order('view_count', { ascending: false })
      .limit(30);

    if (cat !== 'all') query = query.eq('category', cat);

    const { data } = await query;
    setContent((data ?? []) as EducationContent[]);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    fetchContent(category);
  }, [category, fetchContent]);

  const handleCategoryChange = (cat: ContentCategory | 'all') => {
    setCategory(cat);
  };

  const ListHeader = (
    <View>
      <View style={styles.header}>
        <Text style={styles.title}>Learn</Text>
        <Text style={styles.subtitle}>Articles & videos about your body</Text>
      </View>
      <CategoryFilter selected={category} onChange={handleCategoryChange} />
      <View style={styles.countRow}>
        {loading ? (
          <ActivityIndicator size="small" color={Colors.cherry} />
        ) : (
          <Text style={styles.countText}>
            {content.length} {content.length === 1 ? 'item' : 'items'}
            {category !== 'all' ? ` in ${category.replace(/_/g, ' ')}` : ''}
          </Text>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      {!loading && content.length === 0 ? (
        <>
          {ListHeader}
          <EmptyState
            emoji="📚"
            title="No content yet"
            subtitle="Check back soon for articles and videos."
          />
        </>
      ) : (
        <FlatList
          data={loading ? [] : content}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListHeaderComponent={ListHeader}
          renderItem={({ item }) => <ContentCard content={item} />}
          showsVerticalScrollIndicator={false}
          onRefresh={() => fetchContent(category, true)}
          refreshing={refreshing}
          ListFooterComponent={<View style={{ height: Spacing.xxl }} />}
        />
      )}
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
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    marginTop: 2,
  },
  countRow: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    minHeight: 32,
    justifyContent: 'center',
  },
  countText: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    textTransform: 'capitalize',
  },
  list: {
    paddingHorizontal: Spacing.md,
  },
});
