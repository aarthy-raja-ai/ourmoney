// OurMoney — Household Settings Screen
// View household invite code, partner status, copy/share/regenerate invite codes, and leave workspace.

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Share, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { Copy, Share2, RefreshCw, Check } from 'lucide-react-native';
import { useTheme } from '../../src/context/ThemeContext';
import { useAuth } from '../../src/context/AuthContext';
import { useHousehold } from '../../src/context/HouseholdContext';
import { refreshInviteCode } from '../../src/services/householdService';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { Card } from '../../src/components/Card';
import { Badge } from '../../src/components/Badge';
import { Button } from '../../src/components/Button';
import { ConfirmDialog } from '../../src/components/ConfirmDialog';
import { LoadingSpinner } from '../../src/components/LoadingSpinner';

export default function HouseholdSettingsScreen() {
  const { theme, isDark } = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const { household, partner, isPartnerLinked, isLoading, leaveHousehold } = useHousehold();

  const [showConfirmLeave, setShowConfirmLeave] = useState(false);
  const [showConfirmRegenerate, setShowConfirmRegenerate] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const isOwner = household?.createdByUserId === user?.uid;
  const rawCode = household?.inviteCode ?? '';
  const formattedCode = rawCode ? rawCode.split('').join('  ') : '';

  const getExpiryString = () => {
    if (!household?.inviteCodeExpiresAt) return null;
    const expiresAtMs = typeof household.inviteCodeExpiresAt.toMillis === 'function'
      ? household.inviteCodeExpiresAt.toMillis()
      : new Date(household.inviteCodeExpiresAt as any).getTime();
    const diffMs = expiresAtMs - Date.now();
    if (diffMs <= 0) return 'Expired';
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) return `${hours} hours`;
    return `${mins} mins`;
  };

  const expiryString = getExpiryString();

  const handleCopyCode = async () => {
    if (!rawCode) return;
    const cleanCode = rawCode.toUpperCase().trim();
    await Clipboard.setStringAsync(cleanCode);
    setToastMessage('Invite code copied');
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleShareInvite = async () => {
    if (!rawCode) return;
    const cleanCode = rawCode.toUpperCase().trim();
    const message = `Join my OurMoney household.\n\nInvite code: ${cleanCode}\n\nOpen OurMoney and choose "Join household" to enter the code.`;
    try {
      await Share.share({ message });
    } catch {
      // Share cancelled or unavailable
    }
  };

  const handleConfirmRegenerate = async () => {
    if (!household || !user) return;
    try {
      setIsRegenerating(true);
      await refreshInviteCode(household.id, user.uid);
      setShowConfirmRegenerate(false);
      setToastMessage('New invite code generated');
      setTimeout(() => setToastMessage(null), 2500);
    } catch (err: any) {
      Alert.alert('Regeneration Failed', err.message);
    } finally {
      setIsRegenerating(false);
    }
  };

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

      {toastMessage && (
        <View style={[styles.toastContainer, { backgroundColor: theme.colors.success }]}>
          <Check size={16} color="#FFFFFF" />
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      )}

      {isLoading ? (
        <LoadingSpinner message="Checking household..." />
      ) : (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
          {/* Workspace Card */}
          <Card style={styles.card}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={[styles.title, { color: theme.colors.textPrimary }]}>
                  HOUSEHOLD WORKSPACE
                </Text>
                <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
                  {isOwner ? 'Workspace Owner' : 'Household Member'}
                </Text>
              </View>
              <Badge
                label={isPartnerLinked ? 'Partner Linked' : 'Waiting for Partner'}
                variant={isPartnerLinked ? 'success' : 'warning'}
              />
            </View>

            {/* Invite Code Display section for Owner / Solo state when partner is not linked */}
            {(!isPartnerLinked && rawCode) ? (
            <View style={[styles.inviteBox, { backgroundColor: isDark ? '#162032' : theme.colors.borderLight }]}>
              <Text style={[styles.inviteLabel, { color: theme.colors.textSecondary }]}>
                Invite Code
              </Text>
              <Text style={[styles.codeText, { color: theme.colors.primary }]}>
                {formattedCode}
              </Text>

              {expiryString && (
                <Text style={[styles.expiryText, { color: expiryString === 'Expired' ? theme.colors.danger : theme.colors.textTertiary }]}>
                  {expiryString === 'Expired' ? 'Invite code expired' : `Expires in: ${expiryString}`}
                </Text>
              )}

              {/* Action Buttons */}
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
                  onPress={handleCopyCode}
                  activeOpacity={0.7}
                >
                  <Copy size={16} color={theme.colors.primary} />
                  <Text style={[styles.actionBtnText, { color: theme.colors.textPrimary }]}>
                    Copy Code
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: theme.colors.primary }]}
                  onPress={handleShareInvite}
                  activeOpacity={0.8}
                >
                  <Share2 size={16} color="#FFFFFF" />
                  <Text style={[styles.actionBtnText, { color: '#FFFFFF' }]}>
                    Share Invite
                  </Text>
                </TouchableOpacity>
              </View>

              {isOwner && (
                <TouchableOpacity
                  style={[styles.regenerateBtn, { borderTopColor: theme.colors.borderLight }]}
                  onPress={() => setShowConfirmRegenerate(true)}
                  activeOpacity={0.7}
                >
                  <RefreshCw size={14} color={theme.colors.textSecondary} />
                  <Text style={[styles.regenerateText, { color: theme.colors.textSecondary }]}>
                    Regenerate Code
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (!isPartnerLinked && isOwner) ? (
            <View style={[styles.inviteBox, { backgroundColor: isDark ? '#162032' : theme.colors.borderLight }]}>
              <Text style={[styles.inviteLabel, { color: theme.colors.textSecondary }]}>
                Invite Code
              </Text>
              <Text style={[styles.soloSub, { color: theme.colors.textSecondary, textAlign: 'center', marginBottom: 12 }]}>
                No active invite code. Generate a 6-character code to share with your partner.
              </Text>
              <Button
                title="Generate Invite Code"
                onPress={handleConfirmRegenerate}
                loading={isRegenerating}
                size="md"
              />
            </View>
          ) : null}
        </Card>

        {/* Partner Section */}
        <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>Partner Link</Text>
        <Card style={styles.card}>
          {isPartnerLinked && partner ? (
            <View style={styles.partnerRow}>
              <View style={[styles.avatar, { backgroundColor: theme.colors.primary }]}>
                <Text style={styles.avatarText}>
                  {partner.displayName ? partner.displayName.charAt(0).toUpperCase() : 'P'}
                </Text>
              </View>
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text style={[styles.partnerName, { color: theme.colors.textPrimary }]}>
                  {partner.displayName}
                </Text>
                <Text style={[styles.partnerSub, { color: theme.colors.textSecondary }]}>
                  Synced with household
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
                {rawCode
                  ? `Share invite code ${rawCode} with your partner to share financial management.`
                  : 'Generate or share an invite code to connect with your partner.'}
              </Text>
            </View>
          )}
        </Card>

        {/* Danger Zone */}
        <View style={{ marginTop: 24, marginBottom: 40 }}>
          <Button
            title="Leave Household Workspace"
            variant="danger"
            onPress={() => setShowConfirmLeave(true)}
          />
        </View>
      </ScrollView>
      )}

      {/* Confirm Regenerate Dialog */}
      <ConfirmDialog
        visible={showConfirmRegenerate}
        title="Generate a new invite code?"
        message="Your current invite code will stop working and a new code will be generated."
        confirmLabel="Generate New Code"
        onConfirm={handleConfirmRegenerate}
        onCancel={() => setShowConfirmRegenerate(false)}
        loading={isRegenerating}
      />

      {/* Confirm Leave Dialog */}
      <ConfirmDialog
        visible={showConfirmLeave}
        title="Leave Household"
        message="Are you sure you want to leave this household? You can rejoin or create a new household at any time."
        confirmLabel="Leave Workspace"
        isDestructive
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
  toastContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 12,
  },
  toastText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
  card: { padding: 16, marginBottom: 16 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  title: { fontSize: 16, fontWeight: '800', letterSpacing: 0.5 },
  subtitle: { fontSize: 13, marginTop: 2 },
  inviteBox: {
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  inviteLabel: { fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  codeText: { fontSize: 30, fontWeight: '800', letterSpacing: 4, marginVertical: 4 },
  expiryText: { fontSize: 12, fontWeight: '600', marginBottom: 16 },
  actionRow: { flexDirection: 'row', gap: 10, width: '100%' },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  actionBtnText: { fontSize: 14, fontWeight: '700' },
  regenerateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 14,
    paddingTop: 12,
    width: '100%',
    borderTopWidth: 1,
  },
  regenerateText: { fontSize: 13, fontWeight: '600' },
  sectionTitle: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', marginBottom: 8, letterSpacing: 0.5 },
  partnerRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#FFF', fontSize: 18, fontWeight: '700' },
  partnerName: { fontSize: 16, fontWeight: '700' },
  partnerSub: { fontSize: 12, marginTop: 1 },
  soloTitle: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  soloSub: { fontSize: 13, lineHeight: 18 },
});
