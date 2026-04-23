import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Modal,
  ScrollView, TextInput, Dimensions, Platform,
} from 'react-native';
import Svg, { G, Ellipse, Rect, Path, Circle, Text as SvgText } from 'react-native-svg';
import { Colors } from '../../constants/colors';
import { FontSize, Spacing, Radius, Shadow } from '../../constants/theme';

// ── Types ──────────────────────────────────────────────────────────────────────
export interface PainEntry {
  regionId: string;
  regionLabel: string;
  intensity: number;    // 1–10
  painType: string;
  notes: string;
}

interface Region {
  id: string;
  label: string;
  markerX: number;   // where the pain dot appears (in SVG coords)
  markerY: number;
}

// ── Constants ─────────────────────────────────────────────────────────────────
const PAIN_TYPES = ['Aching', 'Sharp', 'Burning', 'Throbbing', 'Pressure', 'Cramping', 'Stabbing'];

const VB_W = 200;   // SVG viewBox width
const VB_H = 440;   // SVG viewBox height

// Front regions — each region has an id, display label, and marker position
const FRONT_REGIONS: Region[] = [
  { id: 'head',           label: 'Head',            markerX: 100, markerY: 36 },
  { id: 'neck',           label: 'Neck',            markerX: 100, markerY: 69 },
  { id: 'left_shoulder',  label: 'Left Shoulder',   markerX: 55,  markerY: 86 },
  { id: 'right_shoulder', label: 'Right Shoulder',  markerX: 145, markerY: 86 },
  { id: 'chest',          label: 'Chest',           markerX: 100, markerY: 108 },
  { id: 'upper_abdomen',  label: 'Upper Abdomen',   markerX: 100, markerY: 158 },
  { id: 'lower_abdomen',  label: 'Lower Abdomen',   markerX: 100, markerY: 196 },
  { id: 'pelvis',         label: 'Pelvis / Uterus', markerX: 100, markerY: 228 },
  { id: 'left_upper_arm', label: 'Left Upper Arm',  markerX: 44,  markerY: 128 },
  { id: 'right_upper_arm',label: 'Right Upper Arm', markerX: 156, markerY: 128 },
  { id: 'left_forearm',   label: 'Left Forearm',    markerX: 36,  markerY: 204 },
  { id: 'right_forearm',  label: 'Right Forearm',   markerX: 164, markerY: 204 },
  { id: 'left_thigh',     label: 'Left Thigh',      markerX: 76,  markerY: 295 },
  { id: 'right_thigh',    label: 'Right Thigh',     markerX: 124, markerY: 295 },
  { id: 'left_knee',      label: 'Left Knee',       markerX: 76,  markerY: 344 },
  { id: 'right_knee',     label: 'Right Knee',      markerX: 124, markerY: 344 },
  { id: 'left_shin',      label: 'Left Shin',       markerX: 76,  markerY: 396 },
  { id: 'right_shin',     label: 'Right Shin',      markerX: 124, markerY: 396 },
];

const BACK_REGIONS: Region[] = [
  { id: 'head',           label: 'Head',            markerX: 100, markerY: 36 },
  { id: 'neck_back',      label: 'Neck',            markerX: 100, markerY: 69 },
  { id: 'left_shoulder_b',label: 'Left Shoulder',   markerX: 55,  markerY: 86 },
  { id: 'right_shoulder_b',label:'Right Shoulder',  markerX: 145, markerY: 86 },
  { id: 'upper_back',     label: 'Upper Back',      markerX: 100, markerY: 108 },
  { id: 'mid_back',       label: 'Mid Back',        markerX: 100, markerY: 155 },
  { id: 'lower_back',     label: 'Lower Back',      markerX: 100, markerY: 195 },
  { id: 'buttocks',       label: 'Buttocks',        markerX: 100, markerY: 232 },
  { id: 'left_upper_arm_b',label:'Left Upper Arm',  markerX: 44,  markerY: 128 },
  { id: 'right_upper_arm_b',label:'Right Upper Arm',markerX: 156, markerY: 128 },
  { id: 'left_forearm_b', label: 'Left Forearm',    markerX: 36,  markerY: 204 },
  { id: 'right_forearm_b',label: 'Right Forearm',   markerX: 164, markerY: 204 },
  { id: 'left_thigh_b',   label: 'Left Thigh',      markerX: 76,  markerY: 295 },
  { id: 'right_thigh_b',  label: 'Right Thigh',     markerX: 124, markerY: 295 },
  { id: 'left_knee_b',    label: 'Left Knee',       markerX: 76,  markerY: 344 },
  { id: 'right_knee_b',   label: 'Right Knee',      markerX: 124, markerY: 344 },
  { id: 'left_calf',      label: 'Left Calf',       markerX: 76,  markerY: 396 },
  { id: 'right_calf',     label: 'Right Calf',      markerX: 124, markerY: 396 },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function intensityColor(level: number): string {
  if (level <= 0) return 'transparent';
  if (level <= 3) return '#8DBF8A';
  if (level <= 6) return '#D4C870';
  return '#D4878A';
}

function intensityLabel(level: number): string {
  if (level <= 3) return 'Mild';
  if (level <= 6) return 'Moderate';
  return 'Severe';
}

// ── SVG Body — front view ─────────────────────────────────────────────────────
function FrontBody({ entries, onRegionPress, regionIds }: {
  entries: PainEntry[];
  onRegionPress: (r: Region) => void;
  regionIds: string[];
}) {
  const fill = (id: string) => {
    const e = entries.find((e) => e.regionId === id);
    if (!e) return '#EDE4DC';
    return intensityColor(e.intensity) + '60';
  };
  const stroke = (id: string) => {
    const e = entries.find((e) => e.regionId === id);
    return e ? intensityColor(e.intensity) : '#C4B0A8';
  };
  const sw = (id: string) => entries.find((e) => e.regionId === id) ? 2.5 : 1.2;

  const press = (r: Region) => () => onRegionPress(r);

  return (
    <Svg width="100%" height="100%" viewBox={`0 0 ${VB_W} ${VB_H}`}>
      {/* ── Background body fill (outline shape) ── */}
      {/* Torso outline fill for visual continuity */}
      <Path
        d="M62,78 L138,78 L148,88 L158,88 L168,162 L154,168 L148,242 L134,258 L66,258 L52,242 L46,168 L32,162 L42,88 L52,88 Z"
        fill="#F5EDE5" stroke="none"
      />
      {/* Left leg fill */}
      <Path
        d="M66,258 L52,265 L54,430 L100,430 L100,258 Z"
        fill="#F5EDE5" stroke="none"
      />
      {/* Right leg fill */}
      <Path
        d="M134,258 L148,265 L146,430 L100,430 L100,258 Z"
        fill="#F5EDE5" stroke="none"
      />

      {/* ── HEAD ── */}
      <G onPress={press(FRONT_REGIONS[0])}>
        <Ellipse cx={100} cy={36} rx={24} ry={28}
          fill={fill('head')} stroke={stroke('head')} strokeWidth={sw('head')} />
      </G>

      {/* ── NECK ── */}
      <G onPress={press(FRONT_REGIONS[1])}>
        <Rect x={89} y={62} width={22} height={14} rx={5}
          fill={fill('neck')} stroke={stroke('neck')} strokeWidth={sw('neck')} />
      </G>

      {/* ── LEFT SHOULDER ── */}
      <G onPress={press(FRONT_REGIONS[2])}>
        <Ellipse cx={55} cy={86} rx={16} ry={10}
          fill={fill('left_shoulder')} stroke={stroke('left_shoulder')} strokeWidth={sw('left_shoulder')} />
      </G>

      {/* ── RIGHT SHOULDER ── */}
      <G onPress={press(FRONT_REGIONS[3])}>
        <Ellipse cx={145} cy={86} rx={16} ry={10}
          fill={fill('right_shoulder')} stroke={stroke('right_shoulder')} strokeWidth={sw('right_shoulder')} />
      </G>

      {/* ── CHEST ── */}
      <G onPress={press(FRONT_REGIONS[4])}>
        <Rect x={60} y={78} width={80} height={60} rx={8}
          fill={fill('chest')} stroke={stroke('chest')} strokeWidth={sw('chest')} />
      </G>

      {/* ── UPPER ABDOMEN ── */}
      <G onPress={press(FRONT_REGIONS[5])}>
        <Rect x={62} y={137} width={76} height={42} rx={6}
          fill={fill('upper_abdomen')} stroke={stroke('upper_abdomen')} strokeWidth={sw('upper_abdomen')} />
      </G>

      {/* ── LOWER ABDOMEN ── */}
      <G onPress={press(FRONT_REGIONS[6])}>
        <Rect x={64} y={178} width={72} height={34} rx={6}
          fill={fill('lower_abdomen')} stroke={stroke('lower_abdomen')} strokeWidth={sw('lower_abdomen')} />
      </G>

      {/* ── PELVIS ── */}
      <G onPress={press(FRONT_REGIONS[7])}>
        <Path
          d="M58,212 Q56,252 76,260 L124,260 Q144,252 142,212 Z"
          fill={fill('pelvis')} stroke={stroke('pelvis')} strokeWidth={sw('pelvis')} />
      </G>

      {/* ── LEFT UPPER ARM ── */}
      <G onPress={press(FRONT_REGIONS[8])}>
        <Rect x={33} y={88} width={22} height={76} rx={10}
          fill={fill('left_upper_arm')} stroke={stroke('left_upper_arm')} strokeWidth={sw('left_upper_arm')} />
      </G>

      {/* ── RIGHT UPPER ARM ── */}
      <G onPress={press(FRONT_REGIONS[9])}>
        <Rect x={145} y={88} width={22} height={76} rx={10}
          fill={fill('right_upper_arm')} stroke={stroke('right_upper_arm')} strokeWidth={sw('right_upper_arm')} />
      </G>

      {/* ── LEFT FOREARM ── */}
      <G onPress={press(FRONT_REGIONS[10])}>
        <Rect x={26} y={162} width={20} height={72} rx={9}
          fill={fill('left_forearm')} stroke={stroke('left_forearm')} strokeWidth={sw('left_forearm')} />
      </G>

      {/* ── RIGHT FOREARM ── */}
      <G onPress={press(FRONT_REGIONS[11])}>
        <Rect x={154} y={162} width={20} height={72} rx={9}
          fill={fill('right_forearm')} stroke={stroke('right_forearm')} strokeWidth={sw('right_forearm')} />
      </G>

      {/* ── LEFT THIGH ── */}
      <G onPress={press(FRONT_REGIONS[12])}>
        <Rect x={60} y={260} width={34} height={74} rx={12}
          fill={fill('left_thigh')} stroke={stroke('left_thigh')} strokeWidth={sw('left_thigh')} />
      </G>

      {/* ── RIGHT THIGH ── */}
      <G onPress={press(FRONT_REGIONS[13])}>
        <Rect x={106} y={260} width={34} height={74} rx={12}
          fill={fill('right_thigh')} stroke={stroke('right_thigh')} strokeWidth={sw('right_thigh')} />
      </G>

      {/* ── LEFT KNEE ── */}
      <G onPress={press(FRONT_REGIONS[14])}>
        <Ellipse cx={77} cy={344} rx={17} ry={11}
          fill={fill('left_knee')} stroke={stroke('left_knee')} strokeWidth={sw('left_knee')} />
      </G>

      {/* ── RIGHT KNEE ── */}
      <G onPress={press(FRONT_REGIONS[15])}>
        <Ellipse cx={123} cy={344} rx={17} ry={11}
          fill={fill('right_knee')} stroke={stroke('right_knee')} strokeWidth={sw('right_knee')} />
      </G>

      {/* ── LEFT SHIN ── */}
      <G onPress={press(FRONT_REGIONS[16])}>
        <Rect x={61} y={353} width={32} height={66} rx={10}
          fill={fill('left_shin')} stroke={stroke('left_shin')} strokeWidth={sw('left_shin')} />
      </G>

      {/* ── RIGHT SHIN ── */}
      <G onPress={press(FRONT_REGIONS[17])}>
        <Rect x={107} y={353} width={32} height={66} rx={10}
          fill={fill('right_shin')} stroke={stroke('right_shin')} strokeWidth={sw('right_shin')} />
      </G>

      {/* ── Pain intensity markers ── */}
      {FRONT_REGIONS.map((r) => {
        const e = entries.find((e) => e.regionId === r.id);
        if (!e) return null;
        const c = intensityColor(e.intensity);
        return (
          <G key={r.id}>
            <Circle cx={r.markerX} cy={r.markerY} r={10} fill={c} opacity={0.9} />
            <SvgText
              x={r.markerX} y={r.markerY + 4}
              textAnchor="middle" fontSize={9} fill="#FFFFFF"
              fontWeight="bold"
            >
              {e.intensity}
            </SvgText>
          </G>
        );
      })}
    </Svg>
  );
}

// ── SVG Body — back view ──────────────────────────────────────────────────────
function BackBody({ entries, onRegionPress }: {
  entries: PainEntry[];
  onRegionPress: (r: Region) => void;
}) {
  const fill = (id: string) => {
    const e = entries.find((e) => e.regionId === id);
    if (!e) return '#EDE4DC';
    return intensityColor(e.intensity) + '60';
  };
  const stroke = (id: string) => {
    const e = entries.find((e) => e.regionId === id);
    return e ? intensityColor(e.intensity) : '#C4B0A8';
  };
  const sw = (id: string) => entries.find((e) => e.regionId === id) ? 2.5 : 1.2;
  const press = (r: Region) => () => onRegionPress(r);

  return (
    <Svg width="100%" height="100%" viewBox={`0 0 ${VB_W} ${VB_H}`}>
      {/* Background fills */}
      <Path
        d="M62,78 L138,78 L148,88 L158,88 L168,162 L154,168 L148,242 L134,258 L66,258 L52,242 L46,168 L32,162 L42,88 L52,88 Z"
        fill="#F5EDE5" stroke="none"
      />
      <Path d="M66,258 L52,265 L54,430 L100,430 L100,258 Z" fill="#F5EDE5" stroke="none" />
      <Path d="M134,258 L148,265 L146,430 L100,430 L100,258 Z" fill="#F5EDE5" stroke="none" />

      {/* HEAD */}
      <G onPress={press(BACK_REGIONS[0])}>
        <Ellipse cx={100} cy={36} rx={24} ry={28}
          fill={fill('head')} stroke={stroke('head')} strokeWidth={sw('head')} />
      </G>

      {/* NECK */}
      <G onPress={press(BACK_REGIONS[1])}>
        <Rect x={89} y={62} width={22} height={14} rx={5}
          fill={fill('neck_back')} stroke={stroke('neck_back')} strokeWidth={sw('neck_back')} />
      </G>

      {/* LEFT SHOULDER */}
      <G onPress={press(BACK_REGIONS[2])}>
        <Ellipse cx={55} cy={86} rx={16} ry={10}
          fill={fill('left_shoulder_b')} stroke={stroke('left_shoulder_b')} strokeWidth={sw('left_shoulder_b')} />
      </G>

      {/* RIGHT SHOULDER */}
      <G onPress={press(BACK_REGIONS[3])}>
        <Ellipse cx={145} cy={86} rx={16} ry={10}
          fill={fill('right_shoulder_b')} stroke={stroke('right_shoulder_b')} strokeWidth={sw('right_shoulder_b')} />
      </G>

      {/* UPPER BACK */}
      <G onPress={press(BACK_REGIONS[4])}>
        <Rect x={60} y={78} width={80} height={54} rx={8}
          fill={fill('upper_back')} stroke={stroke('upper_back')} strokeWidth={sw('upper_back')} />
      </G>

      {/* MID BACK */}
      <G onPress={press(BACK_REGIONS[5])}>
        <Rect x={62} y={131} width={76} height={40} rx={6}
          fill={fill('mid_back')} stroke={stroke('mid_back')} strokeWidth={sw('mid_back')} />
      </G>

      {/* LOWER BACK */}
      <G onPress={press(BACK_REGIONS[6])}>
        <Rect x={64} y={170} width={72} height={40} rx={6}
          fill={fill('lower_back')} stroke={stroke('lower_back')} strokeWidth={sw('lower_back')} />
      </G>

      {/* BUTTOCKS */}
      <G onPress={press(BACK_REGIONS[7])}>
        <Path
          d="M58,210 Q56,252 76,260 L124,260 Q144,252 142,210 Z"
          fill={fill('buttocks')} stroke={stroke('buttocks')} strokeWidth={sw('buttocks')} />
      </G>

      {/* LEFT UPPER ARM */}
      <G onPress={press(BACK_REGIONS[8])}>
        <Rect x={33} y={88} width={22} height={76} rx={10}
          fill={fill('left_upper_arm_b')} stroke={stroke('left_upper_arm_b')} strokeWidth={sw('left_upper_arm_b')} />
      </G>

      {/* RIGHT UPPER ARM */}
      <G onPress={press(BACK_REGIONS[9])}>
        <Rect x={145} y={88} width={22} height={76} rx={10}
          fill={fill('right_upper_arm_b')} stroke={stroke('right_upper_arm_b')} strokeWidth={sw('right_upper_arm_b')} />
      </G>

      {/* LEFT FOREARM */}
      <G onPress={press(BACK_REGIONS[10])}>
        <Rect x={26} y={162} width={20} height={72} rx={9}
          fill={fill('left_forearm_b')} stroke={stroke('left_forearm_b')} strokeWidth={sw('left_forearm_b')} />
      </G>

      {/* RIGHT FOREARM */}
      <G onPress={press(BACK_REGIONS[11])}>
        <Rect x={154} y={162} width={20} height={72} rx={9}
          fill={fill('right_forearm_b')} stroke={stroke('right_forearm_b')} strokeWidth={sw('right_forearm_b')} />
      </G>

      {/* LEFT THIGH */}
      <G onPress={press(BACK_REGIONS[12])}>
        <Rect x={60} y={260} width={34} height={74} rx={12}
          fill={fill('left_thigh_b')} stroke={stroke('left_thigh_b')} strokeWidth={sw('left_thigh_b')} />
      </G>

      {/* RIGHT THIGH */}
      <G onPress={press(BACK_REGIONS[13])}>
        <Rect x={106} y={260} width={34} height={74} rx={12}
          fill={fill('right_thigh_b')} stroke={stroke('right_thigh_b')} strokeWidth={sw('right_thigh_b')} />
      </G>

      {/* LEFT KNEE */}
      <G onPress={press(BACK_REGIONS[14])}>
        <Ellipse cx={77} cy={344} rx={17} ry={11}
          fill={fill('left_knee_b')} stroke={stroke('left_knee_b')} strokeWidth={sw('left_knee_b')} />
      </G>

      {/* RIGHT KNEE */}
      <G onPress={press(BACK_REGIONS[15])}>
        <Ellipse cx={123} cy={344} rx={17} ry={11}
          fill={fill('right_knee_b')} stroke={stroke('right_knee_b')} strokeWidth={sw('right_knee_b')} />
      </G>

      {/* LEFT CALF */}
      <G onPress={press(BACK_REGIONS[16])}>
        <Rect x={61} y={353} width={32} height={66} rx={10}
          fill={fill('left_calf')} stroke={stroke('left_calf')} strokeWidth={sw('left_calf')} />
      </G>

      {/* RIGHT CALF */}
      <G onPress={press(BACK_REGIONS[17])}>
        <Rect x={107} y={353} width={32} height={66} rx={10}
          fill={fill('right_calf')} stroke={stroke('right_calf')} strokeWidth={sw('right_calf')} />
      </G>

      {/* Pain intensity markers */}
      {BACK_REGIONS.map((r) => {
        const e = entries.find((e) => e.regionId === r.id);
        if (!e) return null;
        const c = intensityColor(e.intensity);
        return (
          <G key={r.id}>
            <Circle cx={r.markerX} cy={r.markerY} r={10} fill={c} opacity={0.9} />
            <SvgText
              x={r.markerX} y={r.markerY + 4}
              textAnchor="middle" fontSize={9} fill="#FFFFFF"
              fontWeight="bold"
            >
              {e.intensity}
            </SvgText>
          </G>
        );
      })}
    </Svg>
  );
}

// ── Pain Entry Modal ──────────────────────────────────────────────────────────
function PainModal({
  region, existing, onSave, onRemove, onClose,
}: {
  region: Region | null;
  existing: PainEntry | undefined;
  onSave: (entry: PainEntry) => void;
  onRemove: (regionId: string) => void;
  onClose: () => void;
}) {
  const [intensity, setIntensity] = useState(existing?.intensity ?? 5);
  const [painType, setPainType] = useState(existing?.painType ?? '');
  const [notes, setNotes] = useState(existing?.notes ?? '');

  if (!region) return null;

  const handleSave = () => {
    onSave({
      regionId: region.id,
      regionLabel: region.label,
      intensity,
      painType,
      notes,
    });
    onClose();
  };

  const handleRemove = () => {
    onRemove(region.id);
    onClose();
  };

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
      <View style={styles.sheet}>
        {/* Handle */}
        <View style={styles.handle} />

        {/* Header */}
        <View style={styles.sheetHeader}>
          <View>
            <Text style={styles.sheetRegion}>{region.label}</Text>
            <Text style={styles.sheetSub}>Log pain for this area</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {/* Intensity */}
          <Text style={styles.sectionLabel}>PAIN LEVEL</Text>
          <View style={styles.intensityRow}>
            {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => {
              const active = n === intensity;
              const col = intensityColor(n);
              return (
                <TouchableOpacity
                  key={n}
                  onPress={() => setIntensity(n)}
                  style={[
                    styles.intensityDot,
                    { backgroundColor: active ? col : col + '30', borderColor: col },
                    active && styles.intensityDotActive,
                  ]}
                >
                  <Text style={[styles.intensityNum, { color: active ? '#fff' : col }]}>{n}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <Text style={[styles.intensityDesc, { color: intensityColor(intensity) }]}>
            {intensityLabel(intensity)} · Level {intensity}/10
          </Text>

          {/* Pain type */}
          <Text style={styles.sectionLabel}>PAIN TYPE</Text>
          <View style={styles.typeRow}>
            {PAIN_TYPES.map((t) => {
              const active = painType === t;
              return (
                <TouchableOpacity
                  key={t}
                  onPress={() => setPainType(active ? '' : t)}
                  style={[styles.typeChip, active && styles.typeChipActive]}
                >
                  <Text style={[styles.typeChipText, active && styles.typeChipTextActive]}>{t}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Notes */}
          <Text style={styles.sectionLabel}>NOTES</Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Describe the pain, triggers, when it started..."
            placeholderTextColor={Colors.textMuted}
            multiline
            numberOfLines={3}
            style={styles.notesInput}
          />

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Text style={styles.saveBtnText}>Save Pain Entry</Text>
            </TouchableOpacity>
            {existing && (
              <TouchableOpacity style={styles.removeBtn} onPress={handleRemove}>
                <Text style={styles.removeBtnText}>Remove</Text>
              </TouchableOpacity>
            )}
          </View>
          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </Modal>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
interface Props {
  value: PainEntry[];
  onChange: (entries: PainEntry[]) => void;
}

const DISPLAY_W = Math.min(Dimensions.get('window').width - 80, 240);
const DISPLAY_H = DISPLAY_W * (VB_H / VB_W);

export function BodyPainMap({ value, onChange }: Props) {
  const [view, setView] = useState<'front' | 'back'>('front');
  const [activeRegion, setActiveRegion] = useState<Region | null>(null);

  const handleRegionPress = (region: Region) => {
    setActiveRegion(region);
  };

  const handleSave = (entry: PainEntry) => {
    const next = value.filter((e) => e.regionId !== entry.regionId);
    onChange([...next, entry]);
  };

  const handleRemove = (regionId: string) => {
    onChange(value.filter((e) => e.regionId !== regionId));
  };

  const existing = activeRegion ? value.find((e) => e.regionId === activeRegion.id) : undefined;

  return (
    <View>
      {/* Front / Back toggle */}
      <View style={styles.toggle}>
        <TouchableOpacity
          style={[styles.toggleBtn, view === 'front' && styles.toggleBtnActive]}
          onPress={() => setView('front')}
        >
          <Text style={[styles.toggleText, view === 'front' && styles.toggleTextActive]}>Front</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleBtn, view === 'back' && styles.toggleBtnActive]}
          onPress={() => setView('back')}
        >
          <Text style={[styles.toggleText, view === 'back' && styles.toggleTextActive]}>Back</Text>
        </TouchableOpacity>
      </View>

      {/* Instruction */}
      <Text style={styles.instruction}>Tap any body region to log pain</Text>

      {/* Body SVG */}
      <View style={styles.bodyContainer}>
        <View style={{ width: DISPLAY_W, height: DISPLAY_H }}>
          {view === 'front' ? (
            <FrontBody entries={value} onRegionPress={handleRegionPress} regionIds={FRONT_REGIONS.map(r => r.id)} />
          ) : (
            <BackBody entries={value} onRegionPress={handleRegionPress} />
          )}
        </View>
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        {[
          { label: 'Mild (1–3)', color: '#8DBF8A' },
          { label: 'Moderate (4–6)', color: '#D4C870' },
          { label: 'Severe (7–10)', color: '#D4878A' },
        ].map(({ label, color }) => (
          <View key={label} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: color }]} />
            <Text style={styles.legendText}>{label}</Text>
          </View>
        ))}
      </View>

      {/* Logged pain list */}
      {value.length > 0 && (
        <View style={styles.loggedList}>
          <Text style={styles.loggedTitle}>Pain logged ({value.length} area{value.length !== 1 ? 's' : ''})</Text>
          {value.map((entry) => (
            <TouchableOpacity
              key={entry.regionId}
              style={styles.loggedItem}
              onPress={() => {
                const allRegions = [...FRONT_REGIONS, ...BACK_REGIONS];
                const region = allRegions.find(r => r.id === entry.regionId);
                if (region) setActiveRegion(region);
              }}
            >
              <View style={[styles.loggedDot, { backgroundColor: intensityColor(entry.intensity) }]}>
                <Text style={styles.loggedDotText}>{entry.intensity}</Text>
              </View>
              <View style={styles.loggedInfo}>
                <Text style={styles.loggedRegion}>{entry.regionLabel}</Text>
                <Text style={styles.loggedMeta}>
                  {intensityLabel(entry.intensity)}{entry.painType ? ` · ${entry.painType}` : ''}
                </Text>
              </View>
              <Text style={styles.editHint}>Edit</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Pain entry modal */}
      <PainModal
        region={activeRegion}
        existing={existing}
        onSave={handleSave}
        onRemove={handleRemove}
        onClose={() => setActiveRegion(null)}
      />
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  toggle: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.full,
    padding: 3,
    alignSelf: 'center',
    marginBottom: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  toggleBtn: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xs + 2,
    borderRadius: Radius.full,
  },
  toggleBtnActive: { backgroundColor: Colors.cherry },
  toggleText: { fontSize: FontSize.sm, fontFamily: 'Jost_500Medium', color: Colors.textSecondary },
  toggleTextActive: { color: Colors.white, fontFamily: 'Jost_600SemiBold' },

  instruction: {
    textAlign: 'center',
    fontSize: FontSize.xs,
    fontFamily: 'Jost_400Regular',
    color: Colors.textMuted,
    marginBottom: Spacing.md,
  },

  bodyContainer: {
    alignItems: 'center',
    marginBottom: Spacing.md,
  },

  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.md,
    flexWrap: 'wrap',
    marginBottom: Spacing.md,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 10, fontFamily: 'Jost_400Regular', color: Colors.textMuted },

  loggedList: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  loggedTitle: {
    fontSize: FontSize.xs,
    fontFamily: 'Jost_600SemiBold',
    color: Colors.textMuted,
    letterSpacing: 0.8,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xs,
  },
  loggedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  loggedDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loggedDotText: { fontSize: FontSize.sm, fontFamily: 'Jost_600SemiBold', color: Colors.white },
  loggedInfo: { flex: 1 },
  loggedRegion: { fontSize: FontSize.sm, fontFamily: 'Jost_600SemiBold', color: Colors.textPrimary },
  loggedMeta: { fontSize: FontSize.xs, fontFamily: 'Jost_400Regular', color: Colors.textMuted, marginTop: 1 },
  editHint: { fontSize: FontSize.xs, fontFamily: 'Jost_500Medium', color: Colors.cherry },

  // Modal / bottom sheet
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(42,28,24,0.4)',
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    maxHeight: '80%',
    ...Shadow.lg,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: 'center',
    marginBottom: Spacing.md,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.lg,
  },
  sheetRegion: {
    fontSize: FontSize.xl,
    fontFamily: 'CormorantGaramond_600SemiBold',
    color: Colors.textPrimary,
  },
  sheetSub: {
    fontSize: FontSize.xs,
    fontFamily: 'Jost_400Regular',
    color: Colors.textMuted,
    marginTop: 2,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: { fontSize: FontSize.sm, color: Colors.textMuted },

  sectionLabel: {
    fontSize: 10,
    fontFamily: 'Jost_600SemiBold',
    color: Colors.textMuted,
    letterSpacing: 1.2,
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },

  intensityRow: {
    flexDirection: 'row',
    gap: 5,
    flexWrap: 'wrap',
  },
  intensityDot: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  intensityDotActive: { transform: [{ scale: 1.15 }] },
  intensityNum: { fontSize: FontSize.sm, fontFamily: 'Jost_600SemiBold' },
  intensityDesc: {
    fontSize: FontSize.sm,
    fontFamily: 'Jost_500Medium',
    marginTop: Spacing.sm,
  },

  typeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  typeChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
  },
  typeChipActive: { backgroundColor: Colors.cherry, borderColor: Colors.cherry },
  typeChipText: { fontSize: FontSize.sm, fontFamily: 'Jost_400Regular', color: Colors.textSecondary },
  typeChipTextActive: { color: Colors.white, fontFamily: 'Jost_600SemiBold' },

  notesInput: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    fontSize: FontSize.sm,
    fontFamily: 'Jost_400Regular',
    color: Colors.textPrimary,
    minHeight: 90,
    textAlignVertical: 'top',
  },

  actions: { gap: Spacing.sm, marginTop: Spacing.lg },
  saveBtn: {
    backgroundColor: Colors.cherry,
    borderRadius: Radius.full,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  saveBtnText: { fontSize: FontSize.md, fontFamily: 'Jost_600SemiBold', color: Colors.white },
  removeBtn: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: Radius.full,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  removeBtnText: { fontSize: FontSize.sm, fontFamily: 'Jost_500Medium', color: Colors.textMuted },
});
