import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { supabase } from '../../../../lib/supabase';
import { Header } from '../../../../components/layout/Header';
import { LoadingSpinner } from '../../../../components/ui/LoadingSpinner';
import { Badge } from '../../../../components/ui/Badge';
import type { EducationContent } from '../../../../types/database';
import { Colors } from '../../../../constants/colors';
import { FontSize, FontWeight, Spacing } from '../../../../constants/theme';

const { width } = Dimensions.get('window');

export default function VideoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [video, setVideo] = useState<EducationContent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    supabase.from('education_content').select('*').eq('id', id).maybeSingle()
      .then(({ data }) => { setVideo(data as EducationContent | null); setLoading(false); });
  }, [id]);

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      <Header title={video?.title ?? 'Video'} showBack />
      <ScrollView>
        {video?.video_url && (
          <WebView
            source={{ uri: video.video_url }}
            style={{ width, height: width * 0.5625 }} // 16:9
            allowsFullscreenVideo
          />
        )}
        <View style={styles.info}>
          <Text style={styles.title}>{video?.title}</Text>
          <View style={styles.badges}>
            <Badge label={video?.category?.replace('_', ' ') ?? ''} variant="cherry" />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  info: { padding: Spacing.lg },
  title: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginBottom: Spacing.sm },
  badges: { flexDirection: 'row', gap: Spacing.xs },
});
