import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { Link, useRouter } from "expo-router";
import Screen from "../components/Screen";
import Input from "../components/Input";
import Button from "../components/Button";
import { useAuthStore } from "../store/authStore";
import { colors, radius, spacing, typography } from "../constants/theme";

export default function Register() {
  const router = useRouter();
  const signUp = useAuthStore((s) => s.signUp);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"user" | "seller">("user");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit() {
    setLoading(true);
    setError(null);
    try {
      await signUp(name.trim(), email.trim(), password, role);
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
          <Text style={styles.title}>Create account</Text>
          <Text style={styles.subtitle}>Join PulseMarket in seconds.</Text>
        </View>

        <Input label="Full name" value={name} onChangeText={setName} placeholder="Jane Doe" />
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
          placeholder="At least 8 characters"
        />

        <Text style={styles.roleLabel}>I want to</Text>
        <View style={styles.roles}>
          {(["user", "seller"] as const).map((r) => (
            <Pressable
              key={r}
              onPress={() => setRole(r)}
              style={[styles.role, role === r && styles.roleActive]}
            >
              <Text style={[styles.roleText, role === r && styles.roleTextActive]}>
                {r === "user" ? "Buy products" : "Sell products"}
              </Text>
            </Pressable>
          ))}
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Button title="Create account" onPress={onSubmit} loading={loading} />

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already registered? </Text>
          <Link href="/login" style={styles.link}>
            Sign in
          </Link>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: spacing.lg, paddingTop: spacing.xxl, paddingBottom: spacing.lg },
  header: { marginBottom: spacing.xl },
  title: { ...typography.h1, color: colors.text },
  subtitle: { ...typography.body, color: colors.textMuted, marginTop: spacing.sm },
  roleLabel: { ...typography.bodyStrong, color: colors.text, marginBottom: spacing.sm },
  roles: { flexDirection: "row", marginBottom: spacing.lg },
  role: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: "center",
    marginRight: spacing.sm,
  },
  roleActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  roleText: { color: colors.textMuted, fontWeight: "600" },
  roleTextActive: { color: colors.primary },
  error: { color: colors.danger, marginBottom: spacing.md, fontWeight: "600" },
  footer: { flexDirection: "row", justifyContent: "center", marginTop: spacing.lg },
  footerText: { color: colors.textMuted },
  link: { color: colors.primary, fontWeight: "700" },
});
