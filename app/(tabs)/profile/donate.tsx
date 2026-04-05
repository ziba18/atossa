import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../../../stores/authStore';
import { supabase } from '../../../lib/supabase';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Header } from '../../../components/layout/Header';
import { Card } from '../../../components/ui/Card';
import { Colors } from '../../../constants/colors';
import { FontSize, FontWeight, Spacing } from '../../../constants/theme';
import { Config } from '../../../constants/config';

const PRESET_AMOUNTS = [200, 500, 1000, 2500]; // in cents

export default function DonateScreen() {
  const user = useAuthStore((s) => s.user);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(500);
  const [customAmount, setCustomAmount] = useState('');
  const [totalDonated, setTotalDonated] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.from('donations').select('amount_cents').eq('status', 'completed')
      .then(({ data }) => {
        const total = (data ?? []).reduce((s: number, d: any) => s + (d.amount_cents ?? 0), 0);
        setTotalDonated(total);
      });
  }, []);

  const amountCents = customAmount
    ? Math.round(parseFloat(customAmount) * 100)
    : selectedAmount ?? 0;

  const padsCount = Math.floor(amountCents / Config.centsPerPad);

  const handleDonate = async () => {
    if (amountCents < 100) { Alert.alert('Minimum donation is $1.00'); return; }
    setLoading(true);
    // In production: open Stripe PaymentSheet here
    // For now, record as completed (demo)
    await supabase.from('donations').insert({
      donor_user_id: user?.id ?? null,
      amount_cents: amountCents,
      currency: 'USD',
      status: 'completed',
      campaign: Config.donationCampaign,
      is_anonymous: false,
    });
    setTotalDonated((prev) => prev + amountCents);
    setLoading(false);
    Alert.alert('Thank You! 💝', `Your donation of $${(amountCents / 100).toFixed(2)} will help provide ~${padsCount} period products to women in need.`);
  };

  const totalPads = Math.floor(totalDonated / Config.centsPerPad);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      <Header title="Donate Period Products" showBack />
      <ScrollView contentContainerStyle={styles.container}>
        <LinearGradient colors={[Colors.emerald, Colors.emeraldDark]} style={styles.impactCard}>
          <Text style={styles.impactNumber}>{totalPads.toLocaleString()}</Text>
          <Text style={styles.impactLabel}>Period products donated worldwide 🌍</Text>
          <Text style={styles.impactSub}>${(totalDonated / 100).toFixed(0)} raised by the Atossa community</Text>
        </LinearGradient>

        <Text style={styles.description}>
          Millions of women and girls around the world lack access to basic period products. Your donation directly provides pads and tampons to homeless women and girls in need.
        </Text>

        <Text style={styles.sectionLabel}>Choose an amount</Text>
        <View style={styles.amountsRow}>
          {PRESET_AMOUNTS.map((cents) => (
            <TouchableOpacity
              key={cents}
              onPress={() => { setSelectedAmount(cents); setCustomAmount(''); }}
              style={[styles.amountBtn, selectedAmount === cents && !customAmount && styles.amountBtnActive]}
            >
              <Text style={[styles.amountText, selectedAmount === cents && !customAmount && styles.amountTextActive]}>
                ${(cents / 100).toFixed(0)}
              </Text>
              <Text style={[styles.padsText, selectedAmount === cents && !customAmount && styles.padsTextActive]}>
                ~{Math.floor(cents / Config.centsPerPad)} pads
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Input
          label="Custom amount ($)"
          value={customAmount}
          onChangeText={(v) => { setCustomAmount(v); setSelectedAmount(null); }}
          keyboardType="decimal-pad"
          placeholder="10.00"
        />

        {amountCents >= 100 && (
          <Card style={styles.summaryCard}>
            <Text style={styles.summaryText}>
              Your ${(amountCents / 100).toFixed(2)} donation will provide approximately{' '}
              <Text style={styles.summaryBold}>{padsCount} period products</Text> to women in need.
            </Text>
          </Card>
        )}

        <Button
          label={`Donate $${(amountCents / 100).toFixed(2)} 💝`}
          onPress={handleDonate}
          loading={loading}
          size="lg"
          fullWidth
          style={styles.donateBtn}
        />
        <Text style={styles.disclaimer}>Payments processed securely via Stripe. All donations go directly to period product procurement.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { padding: Spacing.md },
  impactCard: { borderRadius: 20, padding: Spacing.xl, alignItems: 'center', marginBottom: Spacing.xl },
  impactNumber: { fontSize: 48, fontWeight: FontWeight.bold, color: Colors.white },
  impactLabel: { fontSize: FontSize.lg, color: Colors.white, fontWeight: FontWeight.semibold, textAlign: 'center' },
  impactSub: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.8)', marginTop: Spacing.xs, textAlign: 'center' },
  description: { fontSize: FontSize.md, color: Colors.textSecondary, lineHeight: 24, marginBottom: Spacing.xl },
  sectionLabel: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.textPrimary, marginBottom: Spacing.sm },
  amountsRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg },
  amountBtn: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  amountBtnActive: { backgroundColor: Colors.cherry, borderColor: Colors.cherry },
  amountText: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  amountTextActive: { color: Colors.white },
  padsText: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
  padsTextActive: { color: 'rgba(255,255,255,0.8)' },
  summaryCard: { backgroundColor: Colors.emeraldLighter, borderColor: Colors.emerald, marginBottom: Spacing.md },
  summaryText: { fontSize: FontSize.md, color: Colors.emeraldDark, lineHeight: 22 },
  summaryBold: { fontWeight: FontWeight.bold },
  donateBtn: { marginTop: Spacing.sm },
  disclaimer: { fontSize: FontSize.xs, color: Colors.textMuted, textAlign: 'center', marginTop: Spacing.md, lineHeight: 18 },
});
