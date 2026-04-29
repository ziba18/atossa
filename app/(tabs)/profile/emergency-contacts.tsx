import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../../stores/authStore';
import { supabase } from '../../../lib/supabase';
import { EmergencyButton } from '../../../components/alerts/EmergencyButton';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Header } from '../../../components/layout/Header';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Icon } from '../../../components/ui/Icon';
import type { EmergencyContact } from '../../../types/database';
import { useColors, type AppColors } from '../../../contexts/ThemeContext';
import { FontSize, Spacing } from '../../../constants/theme';

export default function EmergencyContactsScreen() {
  const theme = useColors();
  const styles = createStyles(theme);
  const user = useAuthStore((s) => s.user);
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [relationship, setRelationship] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from('emergency_contacts').select('*').eq('user_id', user.id).order('is_primary', { ascending: false })
      .then(({ data }) => setContacts((data ?? []) as EmergencyContact[]));
  }, [user]);

  const handleAdd = async () => {
    if (!user || !name || !phone) { Alert.alert('Name and phone are required.'); return; }
    setLoading(true);
    const { data } = await supabase.from('emergency_contacts').insert({
      user_id: user.id,
      name,
      phone_number: phone,
      relationship: relationship || null,
      is_primary: contacts.length === 0,
      notify_on_heavy_bleeding: true,
      notify_on_fainting: true,
    }).select().single();
    if (data) setContacts((prev) => [data as EmergencyContact, ...prev]);
    setName(''); setPhone(''); setRelationship('');
    setShowForm(false);
    setLoading(false);
  };

  const handleDelete = (id: string) => {
    Alert.alert('Remove Contact', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: async () => {
        await supabase.from('emergency_contacts').delete().eq('id', id);
        setContacts((prev) => prev.filter((c) => c.id !== id));
      }},
    ]);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <Header title="Emergency Contacts" showBack />
      <View style={styles.emergencySection}>
        <EmergencyButton emergencyContacts={contacts} />
      </View>

      <FlatList
        data={contacts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<EmptyState iconName="shield" title="No emergency contacts" subtitle="Add someone who should be alerted if you're in danger." />}
        ListHeaderComponent={
          showForm ? (
            <Card style={styles.form}>
              <Text style={styles.formTitle}>Add Emergency Contact</Text>
              <Input label="Name" value={name} onChangeText={setName} placeholder="Jane Doe" />
              <Input label="Phone Number" value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="+1 555 000 0000" />
              <Input label="Relationship (optional)" value={relationship} onChangeText={setRelationship} placeholder="Partner, Parent, Friend..." />
              <Button label="Save Contact" onPress={handleAdd} loading={loading} fullWidth />
            </Card>
          ) : (
            <Button label="+ Add Contact" onPress={() => setShowForm(true)} variant="outline" fullWidth style={styles.addBtn} />
          )
        }
        renderItem={({ item }) => (
          <Card style={styles.contactCard}>
            <View style={styles.contactRow}>
              <View style={styles.contactInfo}>
                <View style={styles.contactNameRow}>
                  <Text style={styles.contactName}>{item.name}</Text>
                  {item.is_primary && <Text style={styles.primaryBadge}>Primary</Text>}
                </View>
                <Text style={styles.contactPhone}>{item.phone_number}</Text>
                {item.relationship && <Text style={styles.contactRel}>{item.relationship}</Text>}
              </View>
              <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteBtn}>
                <Icon name="x" size={18} color={theme.textMuted} />
              </TouchableOpacity>
            </View>
          </Card>
        )}
      />
    </SafeAreaView>
  );
}

function createStyles(c: AppColors) {
  return StyleSheet.create({
    emergencySection: { padding: Spacing.md, alignItems: 'center' },
    list: { padding: Spacing.md },
    addBtn: { marginBottom: Spacing.md },
    form: { marginBottom: Spacing.md, gap: Spacing.xs },
    formTitle: { fontSize: FontSize.md, color: c.textPrimary, marginBottom: Spacing.sm },
    contactCard: { marginBottom: Spacing.sm },
    contactRow: { flexDirection: 'row', alignItems: 'center' },
    contactInfo: { flex: 1 },
    contactNameRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
    contactName: { fontSize: FontSize.md, color: c.textPrimary },
    primaryBadge: { fontSize: FontSize.xs, color: c.cherry },
    contactPhone: { fontSize: FontSize.sm, color: c.textSecondary, marginTop: 2 },
    contactRel: { fontSize: FontSize.xs, color: c.textMuted, marginTop: 2 },
    deleteBtn: { padding: Spacing.sm },
  });
}
