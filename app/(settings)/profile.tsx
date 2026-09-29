// OurMoney — Profile Settings Screen
// Edit display name and manage account details.

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../src/context/ThemeContext';
import { useAuth } from '../../src/context/AuthContext';
import { updateProfileName } from '../../src/services/authService';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { Input } from '../../src/components/Input';
import { Button } from '../../src/components/Button';
import { Card } from '../../src/components/Card';

export default function ProfileSettingsScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { user, userProfile, refreshUserProfile } = useAuth();

  const [displayName, setDisplayName] = useState(userProfile?.displayName ?? '');
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (!displayName.trim()) {
      Alert.alert('Invalid Name', 'Display name cannot be empty.');
      return;
    }
    if (!user) return;

    try {
      setIsLoading(true);
      await updateProfileName(user.uid, displayName.trim());
      await refreshUserProfile();
      Alert.alert('Success', 'Profile updated successfully.');
      router.back();
    } catch (err: any) {
      Alert.alert('Update Failed', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScreenHeader title="Edit Profile" />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Card style={styles.card}>
          <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Email Address</Text>
          <Text style={[styles.value, { color: theme.colors.textPrimary }]}>{user?.email}</Text>
        </Card>

        <Input
          label="Display Name"
          placeholder="Enter your name"
          value={displayName}
          onChangeText={setDisplayName}
        />

        <View style={{ marginTop: 24 }}>
          <Button
            title="Save Changes"
            variant="primary"
            loading={isLoading}
            onPress={handleSave}
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
  label: { fontSize: 12, marginBottom: 4 },
  value: { fontSize: 16, fontWeight: '700' },
});
