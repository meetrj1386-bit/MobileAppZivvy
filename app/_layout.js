import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import { useRouter, useSegments, useRootNavigationState } from 'expo-router';
import { View, ActivityIndicator, AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const navigationState = useRootNavigationState();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [initialRoute, setInitialRoute] = useState(null);

  useEffect(() => {
    // Only check session when navigation is ready
    if (!navigationState?.key) return;

    const checkSession = async () => {
      try {
        let { data: { session }, error } = await supabase.auth.getSession();
        
        if (!session && !error) {
          const { data: refreshData } = await supabase.auth.refreshSession();
          session = refreshData.session;
        }
        
        setIsAuthenticated(!!session);
        
        // Determine initial route but don't navigate yet
        if (session) {
          const scheduleData = await AsyncStorage.getItem('therapyFormData');
          if (scheduleData) {
            setInitialRoute('/(tabs)/schedule');
          } else {
            setInitialRoute('/calendar-form');
          }
        } else {
          setInitialRoute('/welcome');
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Session check error:', error);
        setInitialRoute('/welcome');
        setIsLoading(false);
      }
    };

    checkSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, [navigationState?.key]);

  // Navigate only after loading is complete and route is determined
  useEffect(() => {
    if (!isLoading && initialRoute && navigationState?.key) {
      router.replace(initialRoute);
    }
  }, [isLoading, initialRoute, navigationState?.key]);

  if (isLoading || !navigationState?.key) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#faf8f5' }}>
        <ActivityIndicator size="large" color="#6b5b95" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="welcome" />
      <Stack.Screen name="calendar-form" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}