import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Markdown from 'react-native-markdown-display';
import { supabase } from '../../../../lib/supabase';
import { Header } from '../../../../components/layout/Header';
import { LoadingSpinner } from '../../../../components/ui/LoadingSpinner';
import type { EducationContent } from '../../../../types/database';
import { Colors } from '../../../../constants/colors';
import { FontSize, Spacing } from '../../../../constants/theme';

export default function ArticleScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const [article, setArticle] = useState<EducationContent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    supabase.from('education_content').select('*').eq('slug', slug).maybeSingle()
      .then(({ data }) => {
        setArticle(data as EducationContent | null);
        setLoading(false);
        if (data) supabase.from('education_content').update({ view_count: (data.view_count ?? 0) + 1 }).eq('id', data.id);
      });
  }, [slug]);

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      <Header title={article?.title ?? 'Article'} showBack />
      <ScrollView contentContainerStyle={styles.container}>
        {article?.body_markdown && (
          <Markdown style={markdownStyles}>{article.body_markdown}</Markdown>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { padding: Spacing.lg },
});

const markdownStyles = {
  body: { fontSize: FontSize.md, color: Colors.textPrimary, lineHeight: 26 },
  heading1: { fontSize: 26, fontWeight: '700' as const, color: Colors.cherry, marginBottom: Spacing.md },
  heading2: { fontSize: 20, fontWeight: '600' as const, color: Colors.textPrimary, marginBottom: Spacing.sm },
  link: { color: Colors.cherry },
  strong: { fontWeight: '700' as const },
};
