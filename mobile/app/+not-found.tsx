import { StyleSheet, Text, View } from "react-native";
import { Link } from "expo-router";
import Screen from "../components/Screen";
import { colors, spacing, typography } from "../constants/theme";

export default function NotFound() {
  return (
    <Screen>
      <View style={styles.container}>
        <Text style={styles.title}>404</Text>
        <Text style={styles.text}>This screen doesn't exist.</Text>
        <Link href="/(tabs)" style={styles.link}>
          Go to home
        </Link>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center" },
  title: { ...typography.h1, color: colors.primary },
  text: { ...typography.body, color: colors.textMuted, marginTop: spacing.sm },
  link: { color: colors.primary, fontWeight: "700", marginTop: spacing.lg },
});
