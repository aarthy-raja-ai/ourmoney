// OurMoney — Root Layout
// Guards navigation based on auth state and household membership.
// Auth not loaded → loading screen
// Not authenticated → redirect to auth
// Authenticated + no household → redirect to setup
// Authenticated + household → show main tabs

import React, { useEffect, useRef } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { HouseholdProvider } from '../src/context/HouseholdContext';
import { ThemeProvider, useTheme } from '../src/context/ThemeContext';
import { LoadingSpinner } from '../src/components/LoadingSpinner';
import { ErrorBoundary } from '../src/components/ErrorBoundary';
import { OfflineBanner } from '../src/components/OfflineBanner';
import { View } from 'react-native';

function NavigationGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, userProfile } = useAuth();
  const { theme } = useTheme();
  const router = useRouter();
  const segments = useSegments();
  // Prevent multiple rapid redirects during the initial auth+profile load
  const redirectingRef = useRef(false);

  useEffect(() => {
    if (isLoading) {
      redirectingRef.current = false;
      return;
    }
    if (redirectingRef.current) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inSetupGroup = segments[0] === '(setup)';
    const inTabsGroup = segments[0] === '(tabs)';

    if (!isAuthenticated && !inAuthGroup) {
      // Not logged in → welcome screen
      redirectingRef.current = true;
      router.replace('/(auth)/welcome');
    } else if (
      isAuthenticated &&
      userProfile !== null &&           // profile fully loaded
      !userProfile.householdId &&       // no household yet
      !inSetupGroup &&
      !inAuthGroup
    ) {
      // Logged in but no household → setup
      redirectingRef.current = true;
      router.replace('/(setup)/household-setup');
    } else if (
      isAuthenticated &&
      userProfile?.householdId &&       // has a household
      (inAuthGroup || inSetupGroup)     // stuck on auth/setup screen
    ) {
      // Logged in with household → home
      redirectingRef.current = true;
      router.replace('/(tabs)/');
    }
  }, [isAuthenticated, isLoading, userProfile, userProfile?.householdId, segments]);

  // Show loading spinner while auth + profile are being resolved
  if (isLoading || (isAuthenticated && userProfile === null)) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <LoadingSpinner fullScreen message="Loading..." />
      </View>
    );
  }

  return <>{children}</>;
}

function AppShell() {
  const { isDark } = useTheme();
  return (
    <SafeAreaProvider>
      <OfflineBanner />
      <NavigationGuard>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(setup)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="(modals)" options={{ presentation: 'modal' }} />
          <Stack.Screen name="(settings)" options={{ presentation: 'card' }} />
        </Stack>
      </NavigationGuard>
      <StatusBar style={isDark ? 'light' : 'dark'} />
    </SafeAreaProvider>
  );
}

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <HouseholdProvider>
            <AppShell />
          </HouseholdProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
