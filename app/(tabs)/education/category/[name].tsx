import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../../../lib/supabase';
import { ContentCard } from '../../../../components/education/ContentCard';
import { Header } from '../../../../components/layout/Header';
import { LoadingSpinner } from '../../../../components/ui/LoadingSpinner';
import { EmptyState } from '../../../../components/ui/EmptyState';
import type { EducationContent } from '../../../../types/database';
import { Colors } from '../../../../constants/colors';
import { Spacing } from '../../../../constants/theme';

export default function CategoryScreen() {
  const { name } = useLocalSearchParams<{ name: string }>();
  const [content, setContent] = useState<EducationContent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!name) return;
    supabase.from('education_content').select('*').eq('category', name).eq('is_published', true)
      .order('view_count', { ascending: false })
      .then(({ data }) => { setContent((data ?? []) as EducationContent[]); setLoading(false); });
  }, [name]);

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      <Header title={name?.replace('_', ' ') ?? 'Category'} showBack />
      <FlatList
        data={content}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<EmptyState emoji="📚" title="No content yet" subtitle="Check back soon!" />}
        renderItem={({ item }) => <ContentCard content={item} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({ list: { padding: Spacing.md } });
