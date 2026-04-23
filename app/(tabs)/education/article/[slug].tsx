import React from 'react';
import { ScrollView, StyleSheet, View, Text, Image, TouchableOpacity, Linking } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Markdown from 'react-native-markdown-display';
import { Header } from '../../../../components/layout/Header';
import { Icon } from '../../../../components/ui/Icon';
import { getArticleBySlug } from '../../../../constants/articles';
import { Colors } from '../../../../constants/colors';
import { FontSize, Spacing, Shadow } from '../../../../constants/theme';

export default function ArticleScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const article = getArticleBySlug(slug ?? '');

  if (!article) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
        <Header title="Article" showBack />
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>Article not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      <Header title="" showBack />
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Hero image */}
        <Image source={{ uri: article.thumbnail_url }} style={styles.hero} />

        <View style={styles.container}>
          {/* Category tag */}
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>
              {article.category.replace(/_/g, ' ').toUpperCase()}
            </Text>
          </View>

          {/* Title */}
          <Text style={styles.title}>{article.title}</Text>

          {/* Meta row */}
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Icon name="clock" size={13} color={Colors.textMuted} />
              <Text style={styles.metaText}>{article.reading_time_minutes} min read</Text>
            </View>
            <Text style={styles.metaDot}>·</Text>
            <Text style={styles.metaText}>{article.published_date}</Text>
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Body */}
          <Markdown style={markdownStyles}>{article.body_markdown}</Markdown>

          {/* Source card */}
          <TouchableOpacity
            style={styles.sourceCard}
            onPress={() => Linking.openURL(article.source_url)}
            activeOpacity={0.8}
          >
            <View style={styles.sourceLeft}>
              <Icon name="external-link" size={16} color={Colors.cherry} />
              <View>
                <Text style={styles.sourceLabel}>Original source</Text>
                <Text style={styles.sourceName}>{article.source_name}</Text>
              </View>
            </View>
            <Icon name="chevron-right" size={16} color={Colors.textMuted} />
          </TouchableOpacity>

          <View style={{ height: Spacing.xxl }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  notFoundText: { fontFamily: 'Jost_400Regular', color: Colors.textMuted },

  hero: {
    width: '100%',
    height: 220,
    backgroundColor: Colors.cherryLighter,
  },

  container: {
    padding: Spacing.lg,
  },

  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.cherryLighter,
    borderRadius: 99,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: Spacing.sm,
  },
  categoryText: {
    fontSize: 10,
    fontFamily: 'Jost_600SemiBold',
    color: Colors.cherry,
    letterSpacing: 1.2,
  },

  title: {
    fontSize: 26,
    fontFamily: 'CormorantGaramond_600SemiBold',
    color: Colors.textPrimary,
    lineHeight: 32,
    marginBottom: Spacing.sm,
  },

  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: Spacing.md,
  },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: FontSize.xs, fontFamily: 'Jost_400Regular', color: Colors.textMuted },
  metaDot: { color: Colors.textMuted, fontSize: FontSize.xs },

  divider: {
    height: 1,
    backgroundColor: 'rgba(180,150,140,0.2)',
    marginBottom: Spacing.lg,
  },

  sourceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginTop: Spacing.xl,
    ...Shadow.sm,
  },
  sourceLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  sourceLabel: { fontSize: FontSize.xs, fontFamily: 'Jost_400Regular', color: Colors.textMuted },
  sourceName: { fontSize: FontSize.sm, fontFamily: 'Jost_600SemiBold', color: Colors.textPrimary, marginTop: 1 },
});

const markdownStyles = {
  body: {
    fontSize: FontSize.md,
    fontFamily: 'Jost_400Regular',
    color: Colors.textPrimary,
    lineHeight: 26,
  },
  heading1: {
    fontSize: 26,
    fontFamily: 'CormorantGaramond_600SemiBold',
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
    marginTop: Spacing.sm,
  },
  heading2: {
    fontSize: 20,
    fontFamily: 'CormorantGaramond_600SemiBold',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
    marginTop: Spacing.lg,
  },
  heading3: {
    fontSize: 16,
    fontFamily: 'Jost_600SemiBold',
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
    marginTop: Spacing.md,
  },
  link: { color: Colors.cherry, fontFamily: 'Jost_500Medium' },
  strong: { fontFamily: 'Jost_600SemiBold' },
  paragraph: { fontFamily: 'Jost_400Regular', lineHeight: 26, marginBottom: Spacing.sm },
  hr: { backgroundColor: 'rgba(180,150,140,0.25)', height: 1, marginVertical: Spacing.md },
  blockquote: {
    backgroundColor: Colors.cherryLighter,
    borderLeftColor: Colors.cherry,
    borderLeftWidth: 3,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 4,
  },
  table: { borderWidth: 1, borderColor: Colors.border, borderRadius: 8, marginVertical: Spacing.md },
  tr: { borderBottomWidth: 1, borderColor: Colors.border },
  th: { padding: Spacing.sm, backgroundColor: Colors.cherryLighter },
  td: { padding: Spacing.sm },
  thead: {},
  tbody: {},
  code_inline: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 4,
    paddingHorizontal: 4,
    fontFamily: 'Jost_400Regular',
    fontSize: FontSize.sm,
  },
  fence: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 8,
    padding: Spacing.md,
  },
  bullet_list: { marginBottom: Spacing.sm },
  ordered_list: { marginBottom: Spacing.sm },
  list_item: { marginBottom: 4 },
  em: { fontFamily: 'Jost_400Regular', fontStyle: 'italic' },
};
