import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import type { EducationContent } from '../../types/database';
import { Icon } from '../ui/Icon';
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
          <Icon
            name={content.content_type === 'video' ? 'play' : 'file-text'}
            size={36}
            color={Colors.cherry}
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
            <Icon name="clock" size={12} color={Colors.textMuted} />
            <Text style={styles.meta}>{content.reading_time_minutes} min read</Text>
          </View>
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
  info: { padding: Spacing.md },
  badgeRow: { flexDirection: 'row', gap: Spacing.xs, marginBottom: Spacing.xs },
  title: {
    fontSize: FontSize.md,
    fontFamily: 'Jost_600SemiBold',
    color: Colors.textPrimary,
    lineHeight: 22,
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: Spacing.xs },
  meta: { fontSize: FontSize.xs, fontFamily: 'Jost_400Regular', color: Colors.textMuted },
});
