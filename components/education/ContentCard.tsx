import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import type { EducationContent } from '../../types/database';
import { Colors } from '../../constants/colors';
import { FontSize, FontWeight, Radius, Spacing } from '../../constants/theme';
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
          <Text style={styles.typeIcon}>
            {content.content_type === 'video' ? '▶️' : '📄'}
          </Text>
        </View>
      )}
      <View style={styles.info}>
        <View style={styles.badgeRow}>
          <Badge
            label={content.category.replace('_', ' ')}
            variant={CATEGORY_COLORS[content.category] ?? 'cherry'}
          />
          {content.is_premium && <Badge label="Premium" variant="whiskey" />}
        </View>
        <Text style={styles.title} numberOfLines={2}>{content.title}</Text>
        {content.reading_time_minutes && (
          <Text style={styles.meta}>📖 {content.reading_time_minutes} min read</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  thumbnail: { width: '100%', height: 160 },
  thumbnailPlaceholder: {
    width: '100%',
    height: 120,
    backgroundColor: Colors.cherryLighter,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeIcon: { fontSize: 36 },
  info: { padding: Spacing.md },
  badgeRow: { flexDirection: 'row', gap: Spacing.xs, marginBottom: Spacing.xs },
  title: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.textPrimary,
    lineHeight: 22,
  },
  meta: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: Spacing.xs },
});
