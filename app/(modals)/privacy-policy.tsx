// OurMoney — Privacy Policy & Data Disclosure Screen
// Full Play Store compliant Privacy Policy detailing data collection, processing, storage, and rights.

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/context/ThemeContext';
import { Card } from '../../src/components/Card';

export default function PrivacyPolicyModal() {
  const { theme, isDark } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const topInset = Math.max(
    insets.top,
    Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) : 0,
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topInset + 6, borderBottomColor: theme.colors.borderLight }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
          <Ionicons name="close" size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>
          Privacy Policy
        </Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Banner */}
        <View style={[styles.banner, { backgroundColor: isDark ? '#162820' : theme.colors.successLight }]}>
          <Ionicons name="shield-checkmark" size={28} color={theme.colors.success} />
          <View style={{ marginLeft: 12, flex: 1 }}>
            <Text style={[styles.bannerTitle, { color: theme.colors.success }]}>
              OurMoney Privacy Policy
            </Text>
            <Text style={[styles.bannerText, { color: theme.colors.textSecondary }]}>
              Effective Date: October 3, 2026 • Version 1.0.0
            </Text>
          </View>
        </View>

        {/* Section 1: Overview */}
        <Card style={styles.card}>
          <Text style={[styles.sectionHeading, { color: theme.colors.primary }]}>
            1. Overview of OurMoney
          </Text>
          <Text style={[styles.paragraph, { color: theme.colors.textSecondary }]}>
            OurMoney is a collaborative household financial management application designed for partners and families to track shared expenses, set monthly budgets, plan loan payoffs, and track pending purchases in a joint workspace.
          </Text>
          <Text style={[styles.paragraph, { color: theme.colors.textSecondary }]}>
            OurMoney operates strictly on user-entered data and does NOT connect to bank accounts, read SMS financial messages, or access financial APIs.
          </Text>
        </Card>

        {/* Section 2: Data Collected */}
        <Card style={styles.card}>
          <Text style={[styles.sectionHeading, { color: theme.colors.primary }]}>
            2. Information We Collect
          </Text>

          <Text style={[styles.bulletTitle, { color: theme.colors.textPrimary }]}>
            a. Account & Authentication Information
          </Text>
          <Text style={[styles.paragraph, { color: theme.colors.textSecondary }]}>
            We use Firebase Authentication (a Google Cloud service) to create and secure your account. We collect your email address, display name, and unique user identifier (UID). Passwords are handled securely by Firebase Auth and are never stored on OurMoney servers.
          </Text>

          <Text style={[styles.bulletTitle, { color: theme.colors.textPrimary }]}>
            b. Household Information
          </Text>
          <Text style={[styles.paragraph, { color: theme.colors.textSecondary }]}>
            When you create or join a household, we store household identifiers, member user IDs, and temporary 6-character invite codes to link you with your partner.
          </Text>

          <Text style={[styles.bulletTitle, { color: theme.colors.textPrimary }]}>
            c. Financial & Expense Data (User-Entered)
          </Text>
          <Text style={[styles.paragraph, { color: theme.colors.textSecondary }]}>
            To provide budgeting and financial tracking, we store:
          </Text>
          <Text style={[styles.bulletItem, { color: theme.colors.textSecondary }]}>
            • <Text style={{ fontWeight: '600', color: theme.colors.textPrimary }}>Expenses:</Text> Amount, category, description, payment method, transaction date, payment status (paid or credit), and creating user ID.
          </Text>
          <Text style={[styles.bulletItem, { color: theme.colors.textSecondary }]}>
            • <Text style={{ fontWeight: '600', color: theme.colors.textPrimary }}>Budgets:</Text> Monthly spending target amounts for each spending category.
          </Text>
          <Text style={[styles.bulletItem, { color: theme.colors.textSecondary }]}>
            • <Text style={{ fontWeight: '600', color: theme.colors.textPrimary }}>Loans & Liabilities:</Text> Lender name, loan type, original principal, outstanding balance, interest rate, repayment method, and payment history records.
          </Text>
          <Text style={[styles.bulletItem, { color: theme.colors.textSecondary }]}>
            • <Text style={{ fontWeight: '600', color: theme.colors.textPrimary }}>Pending Purchases:</Text> Short-term credit purchase title, category, merchant name, amount, due date, and settlement status.
          </Text>
        </Card>

        {/* Section 3: Data Storage & Infrastructure */}
        <Card style={styles.card}>
          <Text style={[styles.sectionHeading, { color: theme.colors.primary }]}>
            3. How Data is Stored & Processed
          </Text>
          <Text style={[styles.paragraph, { color: theme.colors.textSecondary }]}>
            All application data is securely stored in Google Cloud Firestore infrastructure located in enterprise data centers. Real-time synchronization allows shared household members to view updated finances instantly.
          </Text>
        </Card>

        {/* Section 4: Data Usage */}
        <Card style={styles.card}>
          <Text style={[styles.sectionHeading, { color: theme.colors.primary }]}>
            4. How We Use Your Information
          </Text>
          <Text style={[styles.paragraph, { color: theme.colors.textSecondary }]}>
            Your information is used solely to provide core application features:
          </Text>
          <Text style={[styles.bulletItem, { color: theme.colors.textSecondary }]}>
            • Authenticating your identity and preventing unauthorized access.
          </Text>
          <Text style={[styles.bulletItem, { color: theme.colors.textSecondary }]}>
            • Linking your account with your household partner.
          </Text>
          <Text style={[styles.bulletItem, { color: theme.colors.textSecondary }]}>
            • Displaying joint expense analytics, category breakdown graphs, and budget progress.
          </Text>
          <Text style={[styles.bulletItem, { color: theme.colors.textSecondary }]}>
            • Calculating deterministic debt-payoff timelines and debt-free target schedules.
          </Text>
        </Card>

        {/* Section 5: Third-Party Service Providers */}
        <Card style={styles.card}>
          <Text style={[styles.sectionHeading, { color: theme.colors.primary }]}>
            5. Third-Party Service Providers & Sharing
          </Text>
          <Text style={[styles.paragraph, { color: theme.colors.textSecondary }]}>
            We do NOT sell, rent, or monetize your personal or financial data. We do NOT share data with third-party ad networks, data brokers, or marketing partners.
          </Text>
          <Text style={[styles.paragraph, { color: theme.colors.textSecondary }]}>
            We utilize <Text style={{ fontWeight: '700', color: theme.colors.textPrimary }}>Google Firebase</Text> (Authentication & Cloud Firestore) as our backend infrastructure service provider. Data is processed in compliance with Google Cloud security and privacy standards.
          </Text>
        </Card>

        {/* Section 6: Security Practices */}
        <Card style={styles.card}>
          <Text style={[styles.sectionHeading, { color: theme.colors.primary }]}>
            6. Data Security Practices
          </Text>
          <Text style={[styles.paragraph, { color: theme.colors.textSecondary }]}>
            We implement industry-standard technical measures to safeguard your information:
          </Text>
          <Text style={[styles.bulletItem, { color: theme.colors.textSecondary }]}>
            • <Text style={{ fontWeight: '600', color: theme.colors.textPrimary }}>Encryption in Transit:</Text> All communication between your device and Google Cloud servers uses HTTPS/TLS encryption.
          </Text>
          <Text style={[styles.bulletItem, { color: theme.colors.textSecondary }]}>
            • <Text style={{ fontWeight: '600', color: theme.colors.textPrimary }}>Server-Enforced Access Control:</Text> Cloud Firestore Security Rules ensure users can only access data belonging to their verified household.
          </Text>
          <Text style={[styles.bulletItem, { color: theme.colors.textSecondary }]}>
            • <Text style={{ fontWeight: '600', color: theme.colors.textPrimary }}>Zero Sensitive Credentials:</Text> We enforce database policies blocking bank account numbers, UPI PINs, credit card numbers, or passwords from ever being stored.
          </Text>
        </Card>

        {/* Section 7: Data Retention & Deletion */}
        <Card style={styles.card}>
          <Text style={[styles.sectionHeading, { color: theme.colors.primary }]}>
            7. Data Retention & Account Deletion Rights
          </Text>
          <Text style={[styles.paragraph, { color: theme.colors.textSecondary }]}>
            Your data is retained for as long as your account remains active. You have full rights to permanently delete your account and data at any time.
          </Text>
          <Text style={[styles.paragraph, { color: theme.colors.textSecondary }]}>
            • <Text style={{ fontWeight: '700', color: theme.colors.textPrimary }}>In-App Deletion:</Text> Go to Settings → Privacy & Data → Delete Account to trigger permanent account deletion.
          </Text>
          <Text style={[styles.paragraph, { color: theme.colors.textSecondary }]}>
            • <Text style={{ fontWeight: '700', color: theme.colors.textPrimary }}>External Request:</Text> You can submit a deletion request online via our public webpage or email support.
          </Text>
        </Card>

        {/* Section 8: Contact Information */}
        <Card style={styles.card}>
          <Text style={[styles.sectionHeading, { color: theme.colors.primary }]}>
            8. Developer & Privacy Contact
          </Text>
          <Text style={[styles.paragraph, { color: theme.colors.textSecondary }]}>
            If you have any questions or concerns regarding this Privacy Policy or your data, please contact us:
          </Text>
          <Text style={[styles.bulletItem, { color: theme.colors.textPrimary, fontWeight: '600' }]}>
            OurMoney Developer Support
          </Text>
          <Text style={[styles.bulletItem, { color: theme.colors.textSecondary }]}>
            Email: support@ourmoney.app
          </Text>
          <Text style={[styles.bulletItem, { color: theme.colors.textSecondary }]}>
            Web: https://ourmoney.app/privacy-policy
          </Text>
        </Card>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  closeButton: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700' },
  scroll: { flex: 1 },
  content: { padding: 16 },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
  },
  bannerTitle: { fontSize: 16, fontWeight: '700', marginBottom: 2 },
  bannerText: { fontSize: 12, lineHeight: 16 },
  card: { padding: 16, marginBottom: 12 },
  sectionHeading: { fontSize: 15, fontWeight: '700', marginBottom: 8 },
  paragraph: { fontSize: 13, lineHeight: 19, marginBottom: 8 },
  bulletTitle: { fontSize: 14, fontWeight: '700', marginTop: 6, marginBottom: 4 },
  bulletItem: { fontSize: 13, lineHeight: 19, marginLeft: 6, marginBottom: 4 },
});
