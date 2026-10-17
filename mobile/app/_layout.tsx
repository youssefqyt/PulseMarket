import { useEffect } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useAuthStore } from "../store/authStore";
import { colors } from "../constants/theme";
import Loading from "../components/Loading";

export default function RootLayout() {
  const status = useAuthStore((s) => s.status);
  const initialize = useAuthStore((s) => s.initialize);
  const refreshProfile = useAuthStore((s) => s.refreshProfile);
  const router = useRouter();
  const segments = useSegments();

  // 1. Restore the session once at startup.
  useEffect(() => {
    initialize();
  }, [initialize]);

  // 2. Refresh the profile whenever the user becomes authenticated.
  useEffect(() => {
    if (status === "authenticated") refreshProfile();
  }, [status, refreshProfile]);

  // 3. Route guard.
  useEffect(() => {
    if (status === "loading") return;
    const inAuthGroup = segments[0] === "(tabs)";
    if (status === "guest" && inAuthGroup) {
      router.replace("/login");
    } else if (status === "authenticated" && !inAuthGroup) {
      router.replace("/(tabs)");
    }
  }, [status, segments, router]);

  if (status === "loading") {
    return (
      <SafeAreaProvider>
        <Loading />
        <StatusBar style="dark" />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="product/[id]" />
        <Stack.Screen name="checkout" options={{ presentation: "modal" }} />
        <Stack.Screen name="orders" />
      </Stack>
    </SafeAreaProvider>
  );
}
