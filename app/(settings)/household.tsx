// OurMoney — Household Settings Screen
// View household invite code, partner status, and option to unlink/leave household.

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/context/ThemeContext';
import { useAuth } from '../../src/context/AuthContext';
import { useHousehold } from '../../src/context/HouseholdContext';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { Card } from '../../src/components/Card';
import { Badge } from '../../src/components/Badge';
import { Button } from '../../src/components/Button';
import { ConfirmDialog } from '../../src/components/ConfirmDialog';

export default function HouseholdSettingsScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const { household, leaveHousehold } = useHousehold();

  const [showConfirmLeave, setShowConfirmLeave] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  const handleLeaveHousehold = async () => {
    if (!user) return;
    try {
      setIsLeaving(true);
      await leaveHousehold();
      setShowConfirmLeave(false);
      router.replace('/(setup)/household-setup');
    } catch (err: any) {
      Alert.alert('Error Leaving Household', err.message);
    } finally {
      setIsLeaving(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScreenHeader title="Household Workspace" />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Card style={styles.card}>
          <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
            {household?.name ?? 'Household'}
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
            Invite Code: <Text style={{ fontWeight: '800', letterSpacing: 2 }}>{household?.inviteCode}</Text>
          </Text>
        </Card>

        {/* Partner Section */}
        <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>Partner Link</Text>
        <Card style={styles.card}>
          {household?.partnerProfile ? (
            <View style={styles.partnerRow}>
              <View style={[styles.avatar, { backgroundColor: theme.colors.accent }]}>
                <Text style={styles.avatarText}>
                  {household.partnerProfile.displayName.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text style={[styles.partnerName, { color: theme.colors.textPrimary }]}>
                  {household.partnerProfile.displayName}
                </Text>
                <Text style={[styles.partnerEmail, { color: theme.colors.textSecondary }]}>
                  {household.partnerProfile.email}
                </Text>
              </View>
              <Badge label="Active Partner" variant="success" size="sm" />
            </View>
          ) : (
            <View>
              <Text style={[styles.soloTitle, { color: theme.colors.textPrimary }]}>
                No partner linked yet
              </Text>
              <Text style={[styles.soloSub, { color: theme.colors.textSecondary }]}>
                Share invite code <Text style={{ fontWeight: '700' }}>{household?.inviteCode}</Text> with your partner to share financial management.
              </Text>
            </View>
          )}
        </Card>

        {/* Danger Zone */}
        <View style={{ marginTop: 24 }}>
          <Button
            title="Leave Household Workspace"
            variant="danger"
            onPress={() => setShowConfirmLeave(true)}
          />
        </View>
      </ScrollView>

      <ConfirmDialog
        visible={showConfirmLeave}
        title="Leave Household"
        message="Are you sure you want to leave this household? You can rejoin or create a new household at any time."
        confirmLabel="Leave Workspace"
        variant="danger"
        onConfirm={handleLeaveHousehold}
        onCancel={() => setShowConfirmLeave(false)}
        loading={isLeaving}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  content: { padding: 16 },
  card: { padding: 16, marginBottom: 16 },
  title: { fontSize: 20, fontWeight: '800', marginBottom: 4 },
  subtitle: { fontSize: 14 },
  sectionTitle: { fontSize: 13, fontWeight: '700', textTransform: 'uppercase', marginBottom: 8 },
  partnerRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#FFF', fontSize: 18, fontWeight: '700' },
  partnerName: { fontSize: 16, fontWeight: '700' },
  partnerEmail: { fontSize: 12 },
  soloTitle: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  soloSub: { fontSize: 13, lineHeight: 18 },
});
