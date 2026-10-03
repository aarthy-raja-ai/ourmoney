// OurMoney — Settings Tab Screen
// Workspace management, app preferences, Privacy & Data controls, account deletion, and sign out.

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Home,
  Moon,
  Wallet,
  ShieldCheck,
  Trash2,
  ChevronRight,
  FileText,
} from 'lucide-react-native';
import { useTheme } from '../../src/context/ThemeContext';
import { useAuth } from '../../src/context/AuthContext';
import { useHousehold } from '../../src/context/HouseholdContext';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { Card } from '../../src/components/Card';
import { Button } from '../../src/components/Button';
import { Badge } from '../../src/components/Badge';

export default function SettingsScreen() {
  const { theme, colorScheme, setColorScheme } = useTheme();
  const { user, userProfile, signOut } = useAuth();
  const { household: _household, partner, isSolo } = useHousehold();
  const router = useRouter();

  const [isSignOutLoading, setIsSignOutLoading] = useState(false);

  const handleSignOut = async () => {
    try {
      setIsSignOutLoading(true);
      await signOut();
      router.replace('/(auth)/welcome');
    } catch (err: any) {
      Alert.alert('Sign Out Error', err.message);
    } finally {
      setIsSignOutLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScreenHeader title="Settings & Privacy" subtitle="Workspace, account & data preferences" />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Profile Card */}
        <Card style={styles.card} onPress={() => router.push('/(settings)/profile' as any)}>
          <View style={styles.profileRow}>
            <View style={[styles.avatar, { backgroundColor: theme.colors.primary }]}>
              <Text style={styles.avatarText}>
                {userProfile?.displayName ? userProfile.displayName.charAt(0).toUpperCase() : 'U'}
              </Text>
            </View>

            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[styles.profileName, { color: theme.colors.textPrimary }]}>
                {userProfile?.displayName ?? 'User'}
              </Text>
              <Text style={[styles.profileEmail, { color: theme.colors.textSecondary }]}>
                {user?.email}
              </Text>
            </View>

            <ChevronRight size={20} color={theme.colors.textTertiary} />
          </View>
        </Card>

        {/* Household Section */}
        <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
          Household Workspace
        </Text>
        <Card style={styles.card} onPress={() => router.push('/(settings)/household' as any)}>
          <View style={styles.settingItem}>
            <Home size={22} color={theme.colors.primary} />
            <View style={styles.settingTextContainer}>
              <Text style={[styles.settingTitle, { color: theme.colors.textPrimary }]}>
                {isSolo ? 'Personal Workspace' : 'Shared Household'}
              </Text>
              <Text style={[styles.settingSubtitle, { color: theme.colors.textSecondary }]}>
                {isSolo
                  ? 'Solo mode — tap to invite a partner'
                  : partner
                    ? `Linked with ${partner.displayName}`
                    : 'Waiting for partner to join'}
              </Text>
            </View>
            <Badge
              label={isSolo ? 'Solo' : partner ? 'Linked' : 'Pending'}
              variant={isSolo ? 'neutral' : partner ? 'success' : 'warning'}
              size="sm"
            />
          </View>
        </Card>

        {/* Preferences */}
        <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
          Preferences
        </Text>
        <Card style={styles.card}>
          {/* Dark Mode Toggle */}
          <View style={styles.settingItem}>
            <Moon size={22} color={theme.colors.primary} />
            <View style={styles.settingTextContainer}>
              <Text style={[styles.settingTitle, { color: theme.colors.textPrimary }]}>
                Dark Mode
              </Text>
              <Text style={[styles.settingSubtitle, { color: theme.colors.textSecondary }]}>
                {colorScheme === 'dark' ? 'Dark theme enabled' : 'Light theme enabled'}
              </Text>
            </View>
            <Switch
              value={colorScheme === 'dark'}
              onValueChange={(val) => setColorScheme(val ? 'dark' : 'light')}
              trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
            />
          </View>

          <View style={[styles.divider, { backgroundColor: theme.colors.borderLight }]} />

          {/* Manage Budgets */}
          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => router.push('/(modals)/manage-budgets')}
          >
            <Wallet size={22} color={theme.colors.primary} />
            <View style={styles.settingTextContainer}>
              <Text style={[styles.settingTitle, { color: theme.colors.textPrimary }]}>
                Monthly Budgets
              </Text>
              <Text style={[styles.settingSubtitle, { color: theme.colors.textSecondary }]}>
                Set category spending targets
              </Text>
            </View>
            <ChevronRight size={20} color={theme.colors.textTertiary} />
          </TouchableOpacity>
        </Card>

        {/* Privacy & Data Section */}
        <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
          Privacy & Data
        </Text>
        <Card style={styles.card}>
          {/* Privacy Policy */}
          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => router.push('/(modals)/privacy-policy')}
          >
            <FileText size={22} color={theme.colors.primary} />
            <View style={styles.settingTextContainer}>
              <Text style={[styles.settingTitle, { color: theme.colors.textPrimary }]}>
                Privacy Policy
              </Text>
              <Text style={[styles.settingSubtitle, { color: theme.colors.textSecondary }]}>
                Full data practices disclosure
              </Text>
            </View>
            <ChevronRight size={20} color={theme.colors.textTertiary} />
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: theme.colors.borderLight }]} />

          {/* Data & Security */}
          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => router.push('/(settings)/privacy')}
          >
            <ShieldCheck size={22} color={theme.colors.success} />
            <View style={styles.settingTextContainer}>
              <Text style={[styles.settingTitle, { color: theme.colors.textPrimary }]}>
                Data & Security
              </Text>
              <Text style={[styles.settingSubtitle, { color: theme.colors.textSecondary }]}>
                Zero bank credentials & server isolation
              </Text>
            </View>
            <ChevronRight size={20} color={theme.colors.textTertiary} />
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: theme.colors.borderLight }]} />

          {/* Delete Account */}
          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => router.push('/(settings)/delete-account' as any)}
          >
            <Trash2 size={22} color={theme.colors.danger} />
            <View style={styles.settingTextContainer}>
              <Text style={[styles.settingTitle, { color: theme.colors.danger }]}>
                Delete Account
              </Text>
              <Text style={[styles.settingSubtitle, { color: theme.colors.textSecondary }]}>
                Permanently erase account & profile
              </Text>
            </View>
            <ChevronRight size={20} color={theme.colors.textTertiary} />
          </TouchableOpacity>
        </Card>

        {/* Sign Out Button */}
        <View style={{ marginTop: 24, marginBottom: 40 }}>
          <Button
            title="Sign Out"
            variant="outline"
            loading={isSignOutLoading}
            onPress={handleSignOut}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  content: { padding: 16 },
  card: { padding: 16, marginBottom: 16 },
  profileRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { color: '#FFF', fontSize: 20, fontWeight: '700' },
  profileName: { fontSize: 16, fontWeight: '700' },
  profileEmail: { fontSize: 13 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 4,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  settingTextContainer: { flex: 1, marginLeft: 12 },
  settingTitle: { fontSize: 15, fontWeight: '600' },
  settingSubtitle: { fontSize: 12 },
  divider: { height: 1, marginVertical: 12 },
});
