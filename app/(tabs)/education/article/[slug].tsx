import React from 'react';
import { ScrollView, StyleSheet, View, Text, Image, TouchableOpacity, Linking } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Markdown from 'react-native-markdown-display';
import { Header } from '../../../../components/layout/Header';
import { Icon } from '../../../../components/ui/Icon';
import { getArticleBySlug } from '../../../../constants/articles';
import { Colors } from '../../../../constants/colors';
import { useColors, type AppColors } from '../../../../contexts/ThemeContext';
import { FontSize, Spacing, Shadow } from '../../../../constants/theme';

export default function ArticleScreen() {
  const theme = useColors();
  const styles = createStyles(theme);
  const mdStyles = createMarkdownStyles(theme);
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const article = getArticleBySlug(slug ?? '');

  if (!article) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
        <Header title="Article" showBack />
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>Article not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
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
              <Icon name="clock" size={13} color={theme.textMuted} />
              <Text style={styles.metaText}>{article.reading_time_minutes} min read</Text>
            </View>
            <Text style={styles.metaDot}>·</Text>
            <Text style={styles.metaText}>{article.published_date}</Text>
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Body */}
          <Markdown style={mdStyles}>{article.body_markdown}</Markdown>

          {/* Source card */}
          <TouchableOpacity
            style={styles.sourceCard}
            onPress={() => Linking.openURL(article.source_url)}
            activeOpacity={0.8}
          >
            <View style={styles.sourceLeft}>
              <Icon name="external-link" size={16} color={theme.cherry} />
              <View>
                <Text style={styles.sourceLabel}>Original source</Text>
                <Text style={styles.sourceName}>{article.source_name}</Text>
              </View>
            </View>
            <Icon name="chevron-right" size={16} color={theme.textMuted} />
          </TouchableOpacity>

          <View style={{ height: Spacing.xxl }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(c: AppColors) {
  return StyleSheet.create({
    notFound: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    notFoundText: { fontFamily: 'Fraunces_400Regular', color: c.textMuted },
    hero: { width: '100%', height: 220, backgroundColor: c.cherryLighter },
    container: { padding: Spacing.lg },
    categoryBadge: { alignSelf: 'flex-start', backgroundColor: c.cherryLighter, borderRadius: 99, paddingHorizontal: 10, paddingVertical: 4, marginBottom: Spacing.sm },
    categoryText: { fontSize: 10, fontFamily: 'Fraunces_600SemiBold', color: c.cherry, letterSpacing: 1.2 },
    title: { fontSize: 26, fontFamily: 'Fraunces_500Medium_Italic', color: c.textPrimary, lineHeight: 32, marginBottom: Spacing.sm },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: Spacing.md },
    metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    metaText: { fontSize: FontSize.xs, fontFamily: 'Fraunces_400Regular', color: c.textMuted },
    metaDot: { color: c.textMuted, fontSize: FontSize.xs },
    divider: { height: 1, backgroundColor: 'rgba(42,31,38,0.10)', marginBottom: Spacing.lg },
    sourceCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: c.surface, borderRadius: 14, borderWidth: 1, borderColor: c.border, padding: Spacing.md, marginTop: Spacing.xl, ...Shadow.sm },
    sourceLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    sourceLabel: { fontSize: FontSize.xs, fontFamily: 'Fraunces_400Regular', color: c.textMuted },
    sourceName: { fontSize: FontSize.sm, fontFamily: 'Fraunces_600SemiBold', color: c.textPrimary, marginTop: 1 },
  });
}

function createMarkdownStyles(c: AppColors) {
  return {
    body: { fontSize: FontSize.md, fontFamily: 'Fraunces_400Regular', color: c.textPrimary, lineHeight: 26 },
    heading1: { fontSize: 26, fontFamily: 'Fraunces_500Medium_Italic', color: c.textPrimary, marginBottom: Spacing.md, marginTop: Spacing.sm },
    heading2: { fontSize: 20, fontFamily: 'Fraunces_600SemiBold', color: c.textPrimary, marginBottom: Spacing.sm, marginTop: Spacing.lg },
    heading3: { fontSize: 16, fontFamily: 'Fraunces_600SemiBold', color: c.textPrimary, marginBottom: Spacing.xs, marginTop: Spacing.md },
    link: { color: c.cherry, fontFamily: 'Fraunces_500Medium' },
    strong: { fontFamily: 'Fraunces_600SemiBold' },
    paragraph: { fontFamily: 'Fraunces_400Regular', lineHeight: 26, marginBottom: Spacing.sm },
    hr: { backgroundColor: 'rgba(42,31,38,0.12)', height: 1, marginVertical: Spacing.md },
    blockquote: { backgroundColor: c.cherryLighter, borderLeftColor: c.cherry, borderLeftWidth: 3, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: 4 },
    table: { borderWidth: 1, borderColor: c.border, borderRadius: 8, marginVertical: Spacing.md },
    tr: { borderBottomWidth: 1, borderColor: c.border },
    th: { padding: Spacing.sm, backgroundColor: c.cherryLighter },
    td: { padding: Spacing.sm },
    thead: {},
    tbody: {},
    code_inline: { backgroundColor: c.surfaceElevated, borderRadius: 4, paddingHorizontal: 4, fontFamily: 'Fraunces_400Regular', fontSize: FontSize.sm },
    fence: { backgroundColor: c.surfaceElevated, borderRadius: 8, padding: Spacing.md },
    bullet_list: { marginBottom: Spacing.sm },
    ordered_list: { marginBottom: Spacing.sm },
    list_item: { marginBottom: 4 },
    em: { fontFamily: 'Fraunces_400Regular', fontStyle: 'italic' },
  };
}
