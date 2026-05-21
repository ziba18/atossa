import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import type { EducationContent } from '../../types/database';
import { Icon } from '../ui/Icon';
import { Colors } from '../../constants/colors';
import { useColors, type AppColors } from '../../contexts/ThemeContext';
import { FontSize, Radius, Spacing } from '../../constants/theme';
import { Type } from '../../constants/typography';
import { Badge } from '../ui/Badge';

interface Props {
  content: EducationContent;
}

const CATEGORY_COLORS: Record<string, 'cherry' | 'emerald' | 'whiskey'> = {
  pcos: 'cherry',
  hormones: 'whiskey',
  cycle_basics: 'emerald',
  fertility: 'emerald',
  nutrition: 'emerald',
  mental_health: 'whiskey',
  emergency_care: 'cherry',
  teen_health: 'emerald',
  menopause: 'whiskey',
};

export function ContentCard({ content }: Props) {
  const router = useRouter();
  const theme = useColors();
  const styles = createStyles(theme);

  const handlePress = () => {
    if (content.content_type === 'article') {
      router.push(`/education/article/${content.slug}` as any);
    } else if (content.content_type === 'video') {
      router.push(`/education/video/${content.id}` as any);
    }
  };

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.85} style={styles.card}>
      {content.thumbnail_url ? (
        <Image source={{ uri: content.thumbnail_url }} style={styles.thumbnail} />
      ) : (
        <View style={styles.thumbnailPlaceholder}>
          <Icon
            name={content.content_type === 'video' ? 'play' : 'file-text'}
            size={36}
            color={theme.cherry}
          />
        </View>
      )}
      <View style={styles.info}>
        <View style={styles.badgeRow}>
          <Badge
            label={content.category.replace('_', ' ')}
            variant={CATEGORY_COLORS[content.category] ?? 'cherry'}
          />
        </View>
        <Text style={styles.title} numberOfLines={2}>{content.title}</Text>
        {content.reading_time_minutes && (
          <View style={styles.metaRow}>
            <Icon name="clock" size={12} color={theme.textMuted} />
            <Text style={styles.meta}>{content.reading_time_minutes} min read</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

function createStyles(c: AppColors) {
  return StyleSheet.create({
    card: { backgroundColor: c.surface, borderRadius: Radius.lg, borderWidth: 1, borderColor: c.border, overflow: 'hidden', marginBottom: Spacing.md },
    thumbnail: { width: '100%', height: 160 },
    thumbnailPlaceholder: { width: '100%', height: 120, backgroundColor: c.cherryLighter, alignItems: 'center', justifyContent: 'center' },
    info: { padding: Spacing.md },
    badgeRow: { flexDirection: 'row', gap: Spacing.xs, marginBottom: Spacing.xs },
    title: { ...Type.education.cardTitle },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: Spacing.xs },
    meta:  { ...Type.education.meta },
  });
}
