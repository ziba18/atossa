import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '../../../components/ui/Icon';

const BG    = '#f7f3eb';
const CARD  = '#fdf8f1';
const MOSS  = '#3a4d39';
const BARK  = '#4a3728';
const INK   = '#1c1e1c';
const MUTED = '#7a6e60';

// ── Mock post data ─────────────────────────────────────────────────────────────
const PHASE_COLORS: Record<string, { bg: string; fg: string }> = {
  Follicular: { bg: '#e6ede4', fg: MOSS },
  Luteal:     { bg: '#E5DEEC', fg: '#5B4B73' },
  Menstrual:  { bg: '#F4E3E0', fg: '#6E1F1F' },
  Ovulatory:  { bg: '#fef3c7', fg: '#b45309' },
};

const POSTS = [
  {
    id: '1',
    avatar: '🌿',
    phase: 'Follicular',
    time: '2h ago',
    text: "Day 12 and I feel unstoppable. Sage flagged this as my peak energy window — she was absolutely right. Finally started the project I've been avoiding for months. Track your phases, they're real.",
    tags: ['lifestyle'],
    likes: 24,
    comments: 6,
  },
  {
    id: '2',
    avatar: '🌙',
    phase: 'Luteal',
    time: '5h ago',
    text: "Pain score hit 7 again at day 21. Third cycle in a row. I finally have the data to prove it's not in my head. GP appointment booked — I'm bringing my Atossa report.",
    tags: ['endometriosis', 'gp-visit'],
    likes: 41,
    comments: 12,
  },
  {
    id: '3',
    avatar: '🌸',
    phase: 'Menstrual',
    time: '1d ago',
    text: "Just used my GP report in an appointment. My doctor said it was the most thorough symptom history she'd received from a patient. She referred me for an ultrasound on the spot. This app changed everything.",
    tags: ['pcos', 'gp-visit'],
    likes: 89,
    comments: 31,
  },
  {
    id: '4',
    avatar: '🍀',
    phase: 'Ovulatory',
    time: '2d ago',
    text: "Does anyone else with PCOS notice their skin breaking out exactly 2 days post-ovulation? My analysis flagged it as a pattern across 4 cycles. Would love to compare data.",
    tags: ['pcos'],
    likes: 17,
    comments: 22,
  },
  {
    id: '5',
    avatar: '🌱',
    phase: 'Follicular',
    time: '3d ago',
    text: "Started tracking my fatigue score alongside my cycle. The correlation is undeniable — every luteal phase I hit 8–9/10 fatigue by day 4. My GP called it 'the most useful data I've had in years'.",
    tags: ['pmdd', 'lifestyle'],
    likes: 33,
    comments: 9,
  },
];

const TOPICS = ['All', 'PCOS', 'Endo', 'PMDD', 'Lifestyle', 'GP Visit'];

// ── Post card ─────────────────────────────────────────────────────────────────
function PostCard({ post }: { post: typeof POSTS[number] }) {
  const [liked, setLiked] = useState(false);
  const phase = PHASE_COLORS[post.phase] ?? { bg: '#e6ede4', fg: MOSS };

  return (
    <View style={styles.postCard}>
      <View style={styles.postHeader}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarEmoji}>{post.avatar}</Text>
        </View>
        <View style={styles.postMeta}>
          <View style={[styles.phaseBadge, { backgroundColor: phase.bg }]}>
            <Text style={[styles.phaseText, { color: phase.fg }]}>{post.phase}</Text>
          </View>
          <Text style={styles.postTime}>{post.time}</Text>
        </View>
      </View>

      <Text style={styles.postText}>{post.text}</Text>

      <View style={styles.tagRow}>
        {post.tags.map(tag => (
          <View key={tag} style={styles.tag}>
            <Text style={styles.tagText}>{tag}</Text>
          </View>
        ))}
      </View>

      <View style={styles.postActions}>
        <Pressable
          style={styles.actionBtn}
          onPress={() => setLiked(l => !l)}
        >
          <Icon name="heart" size={15} color={liked ? '#6E1F1F' : MUTED} />
          <Text style={[styles.actionText, liked && { color: '#6E1F1F' }]}>
            {post.likes + (liked ? 1 : 0)}
          </Text>
        </Pressable>
        <Pressable
          style={styles.actionBtn}
          onPress={() => Alert.alert('Comments', 'Live comments arrive with the community launch.')}
        >
          <Icon name="message-circle" size={15} color={MUTED} />
          <Text style={styles.actionText}>{post.comments}</Text>
        </Pressable>
      </View>
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────
export default function CommunityScreen() {
  const insets = useSafeAreaInsets();
  const [activeTopic, setActiveTopic] = useState('All');

  const filteredPosts = POSTS.filter(p => {
    if (activeTopic === 'All') return true;
    const topicKey = activeTopic.toLowerCase().replace(' ', '-');
    return p.tags.some(t => t.toLowerCase().includes(topicKey) || topicKey.includes(t.toLowerCase()));
  });

  return (
    <ScrollView
      style={[styles.screen, { paddingTop: insets.top }]}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 96 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Community</Text>
          <Text style={styles.subtitle}>Real experiences. Real cycles.</Text>
        </View>
        <Pressable
          style={styles.shareBtn}
          onPress={() => Alert.alert('Coming soon', 'Post sharing will be available when the live community launches.')}
        >
          <Icon name="plus" size={18} color="#fff" />
        </Pressable>
      </View>

      {/* Preview banner */}
      <View style={styles.previewBanner}>
        <Icon name="sparkles" size={14} color={BARK} />
        <Text style={styles.previewText}>
          Preview · Live community launching in the next update
        </Text>
      </View>

      {/* Topic filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.topicScroll}
        contentContainerStyle={styles.topicContent}
      >
        {TOPICS.map(topic => (
          <Pressable
            key={topic}
            style={[styles.topicPill, activeTopic === topic && styles.topicPillActive]}
            onPress={() => setActiveTopic(topic)}
          >
            <Text style={[styles.topicText, activeTopic === topic && styles.topicTextActive]}>
              {topic}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Post feed */}
      {filteredPosts.length > 0 ? (
        filteredPosts.map(post => <PostCard key={post.id} post={post} />)
      ) : (
        <View style={styles.emptyState}>
          <Icon name="leaf" size={32} color={MUTED} />
          <Text style={styles.emptyText}>No posts in this topic yet.</Text>
        </View>
      )}

      {/* Community values footer */}
      <View style={styles.valuesCard}>
        <Text style={styles.valuesTitle}>Community principles</Text>
        {[
          '🌿  Anonymous by default — no names, no profiles',
          '🩺  Evidence-grounded — link symptoms to data',
          '🤝  Supportive — not diagnostic advice',
          '🔒  Private — your posts never train AI models',
        ].map((v, i) => (
          <Text key={i} style={styles.valuesItem}>{v}</Text>
        ))}
      </View>
    </ScrollView>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen:  { flex: 1, backgroundColor: BG },
  content: { paddingHorizontal: 16, paddingTop: 4 },

  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 12, paddingTop: 8,
  },
  title:    { fontSize: 22, fontFamily: 'Fraunces_400Regular_Italic', color: INK, letterSpacing: -0.3 },
  subtitle: { fontSize: 12, fontFamily: 'Fraunces_400Regular', color: MUTED, marginTop: 2 },
  shareBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: MOSS, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: INK,
    shadowColor: INK, shadowOffset: { width: 3, height: 3 }, shadowOpacity: 0.12, shadowRadius: 0, elevation: 2,
  },

  previewBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#f0e8dc', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 8, marginBottom: 14,
    borderWidth: 1, borderColor: 'rgba(74,55,40,0.20)',
  },
  previewText: { fontSize: 12, fontFamily: 'Fraunces_400Regular_Italic', color: BARK, flex: 1 },

  topicScroll:   { marginBottom: 16 },
  topicContent:  { gap: 8, paddingRight: 8 },
  topicPill: {
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7,
    borderWidth: 1.5, borderColor: 'rgba(28,30,28,0.20)',
    backgroundColor: CARD,
  },
  topicPillActive: { backgroundColor: MOSS, borderColor: INK },
  topicText:       { fontSize: 12, fontFamily: 'Fraunces_500Medium', color: MUTED },
  topicTextActive: { color: '#fff' },

  postCard: {
    backgroundColor: CARD, borderRadius: 16, padding: 16, marginBottom: 12,
    borderWidth: 2, borderColor: INK,
    shadowColor: INK, shadowOffset: { width: 4, height: 4 }, shadowOpacity: 0.10, shadowRadius: 0, elevation: 2,
  },
  postHeader:  { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  avatarCircle: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#e6ede4', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: 'rgba(58,77,57,0.30)',
  },
  avatarEmoji: { fontSize: 18 },
  postMeta:    { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  phaseBadge:  { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  phaseText:   { fontSize: 10, fontFamily: 'Fraunces_500Medium' },
  postTime:    { fontSize: 11, fontFamily: 'Fraunces_400Regular', color: MUTED },
  postText: {
    fontSize: 14, fontFamily: 'Fraunces_400Regular', color: INK,
    lineHeight: 22, marginBottom: 10,
  },
  tagRow:   { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  tag: {
    backgroundColor: 'rgba(58,77,57,0.08)', borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 3,
    borderWidth: 1, borderColor: 'rgba(58,77,57,0.18)',
  },
  tagText: { fontSize: 10, fontFamily: 'Fraunces_400Regular', color: MOSS },
  postActions:  { flexDirection: 'row', gap: 16 },
  actionBtn:    { flexDirection: 'row', alignItems: 'center', gap: 5 },
  actionText:   { fontSize: 12, fontFamily: 'Fraunces_400Regular', color: MUTED },

  emptyState: { alignItems: 'center', paddingVertical: 40, gap: 12 },
  emptyText:  { fontSize: 14, fontFamily: 'Fraunces_400Regular_Italic', color: MUTED },

  valuesCard: {
    backgroundColor: CARD, borderRadius: 16, padding: 16, marginTop: 8,
    borderWidth: 2, borderColor: MOSS,
    shadowColor: MOSS, shadowOffset: { width: 4, height: 4 }, shadowOpacity: 0.10, shadowRadius: 0, elevation: 2,
    gap: 8,
  },
  valuesTitle: { fontSize: 13, fontFamily: 'Fraunces_500Medium', color: MOSS, marginBottom: 4 },
  valuesItem:  { fontSize: 12, fontFamily: 'Fraunces_400Regular', color: MUTED, lineHeight: 20 },
});
