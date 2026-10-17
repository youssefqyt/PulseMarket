import { useState } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from "react-native";
import { Link, useRouter } from "expo-router";
import Screen from "../components/Screen";
import Input from "../components/Input";
import Button from "../components/Button";
import { useAuthStore } from "../store/authStore";
import { colors, spacing, typography } from "../constants/theme";

export default function Login() {
  const router = useRouter();
  const signIn = useAuthStore((s) => s.signIn);

  const [email, setEmail] = useState("buyer@pulsemarket.dev");
  const [password, setPassword] = useState("Password123!");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit() {
    setLoading(true);
    setError(null);
    try {
      await signIn(email.trim(), password);
      router.replace("/(tabs)");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen scroll padded={false}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.container}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Welcome back 👋</Text>
          <Text style={styles.subtitle}>Sign in to continue shopping.</Text>
        </View>

        <Input
          label="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="you@example.com"
        />
        <Input
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="••••••••"
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Button title="Sign in" onPress={onSubmit} loading={loading} />

        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <Link href="/register" style={styles.link}>
            Create one
          </Link>
        </View>

        <View style={styles.demo}>
          <Text style={styles.demoTitle}>Demo accounts (password: Password123!)</Text>
          <Text style={styles.demoItem}>buyer@pulsemarket.dev</Text>
          <Text style={styles.demoItem}>seller@pulsemarket.dev</Text>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", paddingHorizontal: spacing.lg },
  header: { marginBottom: spacing.xxl },
  title: { ...typography.h1, color: colors.text },
  subtitle: { ...typography.body, color: colors.textMuted, marginTop: spacing.sm },
  error: { color: colors.danger, marginBottom: spacing.md, fontWeight: "600" },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: spacing.lg,
  },
  footerText: { color: colors.textMuted },
  link: { color: colors.primary, fontWeight: "700" },
  demo: {
    marginTop: spacing.xxl,
    padding: spacing.lg,
    backgroundColor: colors.primarySoft,
    borderRadius: 12,
  },
  demoTitle: { ...typography.tiny, color: colors.primary, marginBottom: spacing.sm },
  demoItem: { ...typography.small, color: colors.text },
});
