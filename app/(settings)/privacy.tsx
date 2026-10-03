// OurMoney — Privacy & Data Security Screen
// Detailed breakdown of data rights, security practices, and links to Privacy Policy & Account Deletion.

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Shield, FileText, Trash2, ChevronRight, Server, EyeOff } from 'lucide-react-native';
import { useTheme } from '../../src/context/ThemeContext';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { Card } from '../../src/components/Card';

export default function PrivacySettingsScreen() {
  const { theme } = useTheme();
  const router = useRouter();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScreenHeader title="Privacy & Data Security" />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Architecture Overview */}
        <Card style={styles.card}>
          <View style={styles.row}>
            <Shield size={24} color={theme.colors.primary} />
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text style={[styles.cardTitle, { color: theme.colors.textPrimary }]}>
                Data Architecture & Rights
              </Text>
              <Text style={[styles.cardSub, { color: theme.colors.textSecondary }]}>
                Your household financial data belongs exclusively to you and your linked partner. OurMoney never sells your data, shows third-party advertisements, or shares info with data brokers.
              </Text>
            </View>
          </View>
        </Card>

        {/* Security Principles */}
        <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
          Security Controls
        </Text>

        <Card style={styles.card}>
          <View style={styles.principleRow}>
            <EyeOff size={20} color={theme.colors.danger} />
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text style={[styles.itemTitle, { color: theme.colors.textPrimary }]}>
                Zero Bank Credentials
              </Text>
              <Text style={[styles.itemSub, { color: theme.colors.textSecondary }]}>
                We never ask for or store bank account numbers, UPI PINs, credit card numbers, or banking passwords.
              </Text>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: theme.colors.borderLight }]} />

          <View style={styles.principleRow}>
            <Server size={20} color={theme.colors.success} />
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text style={[styles.itemTitle, { color: theme.colors.textPrimary }]}>
                Cloud Isolation
              </Text>
              <Text style={[styles.itemSub, { color: theme.colors.textSecondary }]}>
                Google Cloud Firestore Security Rules ensure only authenticated members of your household can read or write your workspace data.
              </Text>
            </View>
          </View>
        </Card>

        {/* Quick Links */}
        <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>
          Privacy Options
        </Text>

        <Card style={styles.card}>
          <TouchableOpacity
            style={styles.linkRow}
            onPress={() => router.push('/(modals)/privacy-policy')}
          >
            <FileText size={20} color={theme.colors.primary} />
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text style={[styles.linkTitle, { color: theme.colors.textPrimary }]}>
                Read Full Privacy Policy
              </Text>
              <Text style={[styles.linkSub, { color: theme.colors.textSecondary }]}>
                Detailed breakdown of data collected, storage & rights
              </Text>
            </View>
            <ChevronRight size={18} color={theme.colors.textTertiary} />
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: theme.colors.borderLight }]} />

          <TouchableOpacity
            style={styles.linkRow}
            onPress={() => router.push('/(settings)/delete-account' as any)}
          >
            <Trash2 size={20} color={theme.colors.danger} />
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text style={[styles.linkTitle, { color: theme.colors.danger }]}>
                Delete Account & Data
              </Text>
              <Text style={[styles.linkSub, { color: theme.colors.textSecondary }]}>
                Permanently delete account credentials and profile
              </Text>
            </View>
            <ChevronRight size={18} color={theme.colors.textTertiary} />
          </TouchableOpacity>
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  content: { padding: 16 },
  card: { padding: 16, marginBottom: 16 },
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  cardTitle: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  cardSub: { fontSize: 13, lineHeight: 19 },
  sectionTitle: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8, marginLeft: 4 },
  principleRow: { flexDirection: 'row', alignItems: 'center' },
  itemTitle: { fontSize: 14, fontWeight: '700' },
  itemSub: { fontSize: 12, lineHeight: 17, marginTop: 2 },
  divider: { height: 1, marginVertical: 12 },
  linkRow: { flexDirection: 'row', alignItems: 'center' },
  linkTitle: { fontSize: 15, fontWeight: '600' },
  linkSub: { fontSize: 12, marginTop: 1 },
});
