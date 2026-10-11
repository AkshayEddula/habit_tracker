import { Nunito_600SemiBold } from '@expo-google-fonts/nunito/600SemiBold';
import { Nunito_700Bold } from '@expo-google-fonts/nunito/700Bold';
import { Nunito_800ExtraBold } from '@expo-google-fonts/nunito/800ExtraBold';
import { Nunito_900Black } from '@expo-google-fonts/nunito/900Black';
import { useFonts } from 'expo-font';
import { DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { AppState, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { CelebrationOverlay } from '@/components/celebration';
import { useTheme } from '@/hooks/use-theme';
import { hydrateStore, refreshToday, useGameState, useHydrated } from '@/store/store';

SplashScreen.preventAutoHideAsync();
hydrateStore();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
    Nunito_900Black,
  });
  const hydrated = useHydrated();
  const { onboarded } = useGameState();
  const theme = useTheme();
  const ready = (fontsLoaded || fontError !== null) && hydrated;

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  // Roll over to a new day while the app stays open, or when it returns to the foreground.
  useEffect(() => {
    const id = setInterval(refreshToday, 30_000);
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') refreshToday();
    });
    return () => {
      clearInterval(id);
      sub.remove();
    };
  }, []);

  if (!ready) return null;

  const navTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: theme.bg,
      card: theme.surface,
      text: theme.text,
      border: theme.border,
      primary: theme.primary,
    },
  };

  return (
    <GestureHandlerRootView style={[styles.root, { backgroundColor: theme.bg }]}>
      <ThemeProvider value={navTheme}>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: theme.bg } }}>
          <Stack.Protected guard={onboarded}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen
              name="pack"
              options={{
                presentation: 'fullScreenModal',
                animation: 'fade',
                contentStyle: { backgroundColor: '#FFF8E6' },
              }}
            />
            <Stack.Screen
              name="streak"
              options={{ presentation: 'fullScreenModal', animation: 'fade', contentStyle: { backgroundColor: '#FFFFFF' } }}
            />
            <Stack.Screen
              name="reward"
              options={{ presentation: 'fullScreenModal', animation: 'fade', contentStyle: { backgroundColor: '#FFFFFF' } }}
            />
            <Stack.Screen name="streak-info" options={{ presentation: 'modal' }} />
            <Stack.Screen name="gallery" options={{ presentation: 'modal' }} />
            <Stack.Screen name="badges" options={{ presentation: 'modal' }} />
            <Stack.Screen name="card/[id]" options={{ presentation: 'modal' }} />
            <Stack.Screen name="habit" options={{ presentation: 'modal' }} />
          </Stack.Protected>
          <Stack.Protected guard={!onboarded}>
            <Stack.Screen name="onboarding" options={{ animation: 'fade' }} />
          </Stack.Protected>
        </Stack>
        <CelebrationOverlay />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
