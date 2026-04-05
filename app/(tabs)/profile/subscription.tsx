import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import type { PurchasesPackage } from 'react-native-purchases';
import { useAuthStore } from '../../../stores/authStore';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { Header } from '../../../components/layout/Header';
import { Colors } from '../../../constants/colors';
import { FontSize, FontWeight, Spacing } from '../../../constants/theme';
import { getOfferings, purchasePackage, restorePurchases, isPremium, getCustomerInfo } from '../../../lib/revenuecat';

const FEATURES = [
  { free: '3 months history',       premium: 'Unlimited history' },
  { free: '5 symptom types',        premium: 'All symptoms + custom' },
  { free: 'Basic PCOS assessment',  premium: 'Full PCOS trend analysis' },
  { free: '3 articles/week',        premium: 'All content unlocked' },
  { free: 'No connected accounts',  premium: 'Up to 3 connections' },
  { free: 'Manual metrics only',    premium: 'Apple Health / Google Fit' },
  { free: 'Ads shown',              premium: 'Ad-free experience' },
  { free: '1 cycle ahead',          premium: '6 cycles prediction' },
];

export default function SubscriptionScreen() {
  const profile = useAuthStore((s) => s.profile);
  const fetchProfile = useAuthStore((s) => s.fetchProfile);
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [loadingPackages, setLoadingPackages] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [isActivePremium, setIsActivePremium] = useState(profile?.subscription_tier === 'premium');

  useEffect(() => {
    (async () => {
      const info = await getCustomerInfo();
      if (isPremium(info)) setIsActivePremium(true);
      const pkgs = await getOfferings();
      setPackages(pkgs);
      setLoadingPackages(false);
    })();
  }, []);

  const handleSubscribe = async (pkg: PurchasesPackage) => {
    setPurchasing(true);
    try {
      const info = await purchasePackage(pkg);
      if (info && isPremium(info)) {
        setIsActivePremium(true);
        await fetchProfile();
        Alert.alert('Welcome to Premium!', 'You now have access to all Atossa features.');
      }
    } catch (e: any) {
      Alert.alert('Purchase Failed', e?.message ?? 'Something went wrong. Please try again.');
    } finally {
      setPurchasing(false);
    }
  };

  const handleRestore = async () => {
    setPurchasing(true);
    const info = await restorePurchases();
    setPurchasing(false);
    if (info && isPremium(info)) {
      setIsActivePremium(true);
      await fetchProfile();
      Alert.alert('Restored!', 'Your Premium subscription has been restored.');
    } else {
      Alert.alert('No Active Subscription', 'No previous Premium purchase found.');
    }
  };

  // Helper: pick monthly and annual packages from RevenueCat offerings
  const monthlyPkg = packages.find((p) => p.packageType === 'MONTHLY' || p.identifier.toLowerCase().includes('monthly'));
  const annualPkg = packages.find((p) => p.packageType === 'ANNUAL' || p.identifier.toLowerCase().includes('annual') || p.identifier.toLowerCase().includes('yearly'));

  if (isActivePremium) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
        <Header title="Subscription" showBack />
        <View style={styles.premiumContainer}>
          <Text style={styles.premiumEmoji}>✨</Text>
          <Text style={styles.premiumTitle}>You're on Premium!</Text>
          <Text style={styles.premiumSubtitle}>Thank you for supporting Atossa. You have access to all features.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
      <Header title="Go Premium" showBack />
      <ScrollView contentContainerStyle={styles.container}>
        <LinearGradient colors={[Colors.whiskey, Colors.whiskeyDark]} style={styles.hero}>
          <Text style={styles.heroEmoji}>✨</Text>
          <Text style={styles.heroTitle}>Atossa Premium</Text>
          <Text style={styles.heroSubtitle}>Unlock your full health potential</Text>
        </LinearGradient>

        <View style={styles.comparison}>
          {FEATURES.map((f, i) => (
            <View key={i} style={[styles.featureRow, i % 2 === 0 && styles.featureRowAlt]}>
              <View style={styles.freeCol}>
                <Text style={styles.freeText}>✗ {f.free}</Text>
              </View>
              <View style={styles.premiumCol}>
                <Text style={styles.premiumText}>✓ {f.premium}</Text>
              </View>
            </View>
          ))}
        </View>

        {loadingPackages ? (
          <ActivityIndicator color={Colors.cherry} style={{ marginVertical: Spacing.xl }} />
        ) : (
          <>
            <Card style={styles.planCard} elevated>
              <Text style={styles.planTitle}>Monthly</Text>
              <Text style={styles.planPrice}>
                {monthlyPkg?.product.priceString ?? '$4.99'}
                <Text style={styles.planPer}>/month</Text>
              </Text>
              <Button
                label={purchasing ? 'Processing...' : 'Start Monthly Plan'}
                onPress={() => monthlyPkg ? handleSubscribe(monthlyPkg) : Alert.alert('Not Available', 'Monthly plan not found in store.')}
                fullWidth
                disabled={purchasing}
              />
            </Card>

            <Card style={[styles.planCard, styles.planCardBest] as any} elevated>
              <View style={styles.bestBadge}><Text style={styles.bestBadgeText}>BEST VALUE</Text></View>
              <Text style={styles.planTitle}>Annual</Text>
              <Text style={styles.planPrice}>
                {annualPkg?.product.priceString ?? '$39.99'}
                <Text style={styles.planPer}>/year</Text>
              </Text>
              <Text style={styles.planSaving}>Save 33% vs monthly</Text>
              <Button
                label={purchasing ? 'Processing...' : 'Start Annual Plan'}
                onPress={() => annualPkg ? handleSubscribe(annualPkg) : Alert.alert('Not Available', 'Annual plan not found in store.')}
                fullWidth
                style={styles.annualBtn}
                disabled={purchasing}
              />
            </Card>

            <Button label="Restore Purchases" onPress={handleRestore} variant="ghost" fullWidth />
          </>
        )}

        <Text style={styles.footer}>Cancel anytime. Billed through the App Store or Google Play.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { padding: Spacing.md },
  premiumContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  premiumEmoji: { fontSize: 64, marginBottom: Spacing.lg },
  premiumTitle: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, color: Colors.whiskey },
  premiumSubtitle: { fontSize: FontSize.md, color: Colors.textMuted, textAlign: 'center', marginTop: Spacing.sm, lineHeight: 22 },
  hero: { borderRadius: 20, padding: Spacing.xl, alignItems: 'center', marginBottom: Spacing.xl },
  heroEmoji: { fontSize: 48 },
  heroTitle: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, color: Colors.white, marginTop: Spacing.sm },
  heroSubtitle: { fontSize: FontSize.md, color: 'rgba(255,255,255,0.85)', marginTop: Spacing.xs },
  comparison: { marginBottom: Spacing.xl, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: Colors.border },
  featureRow: { flexDirection: 'row', paddingVertical: Spacing.sm },
  featureRowAlt: { backgroundColor: Colors.background },
  freeCol: { flex: 1, paddingHorizontal: Spacing.sm },
  premiumCol: { flex: 1, paddingHorizontal: Spacing.sm },
  freeText: { fontSize: FontSize.xs, color: Colors.textMuted },
  premiumText: { fontSize: FontSize.xs, color: Colors.emeraldDark, fontWeight: FontWeight.medium },
  planCard: { marginBottom: Spacing.md },
  planCardBest: { borderColor: Colors.whiskey, borderWidth: 2 },
  bestBadge: { backgroundColor: Colors.whiskey, borderRadius: 99, paddingHorizontal: Spacing.sm, paddingVertical: 2, alignSelf: 'flex-start', marginBottom: Spacing.xs },
  bestBadgeText: { fontSize: 10, fontWeight: FontWeight.bold, color: Colors.white },
  planTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  planPrice: { fontSize: FontSize.xxxl, fontWeight: FontWeight.bold, color: Colors.cherry, marginVertical: Spacing.xs },
  planPer: { fontSize: FontSize.md, color: Colors.textMuted },
  planSaving: { fontSize: FontSize.sm, color: Colors.emeraldDark, marginBottom: Spacing.sm },
  annualBtn: { backgroundColor: Colors.whiskey },
  footer: { fontSize: FontSize.xs, color: Colors.textMuted, textAlign: 'center', marginTop: Spacing.md },
});
