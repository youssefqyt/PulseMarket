import { useState } from "react";
import { Dimensions, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Screen from "../components/Screen";
import Button from "../components/Button";
import { colors, radius, spacing, typography } from "../constants/theme";

const { width } = Dimensions.get("window");

const SLIDES = [
  {
    icon: "storefront-outline" as const,
    title: "Discover a world of products",
    text: "Browse thousands of items across electronics, fashion, home and more.",
  },
  {
    icon: "search-outline" as const,
    title: "Search & save favorites",
    text: "Find exactly what you need and keep the best for later.",
  },
  {
    icon: "cart-outline" as const,
    title: "Buy in a few taps",
    text: "Add to cart and check out instantly - simple and secure.",
  },
];

export default function Onboarding() {
  const [index, setIndex] = useState(0);
  const router = useRouter();
  const slide = SLIDES[index];
  const isLast = index === SLIDES.length - 1;

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.brand}>PulseMarket</Text>
        <Text style={styles.skip} onPress={() => router.replace("/login")}>
          Skip
        </Text>
      </View>

      <View style={styles.hero}>
        <View style={styles.iconCircle}>
          <Ionicons name={slide.icon} size={64} color={colors.primary} />
        </View>
        <Text style={styles.title}>{slide.title}</Text>
        <Text style={styles.text}>{slide.text}</Text>
      </View>

      <View style={styles.dots}>
        {SLIDES.map((_, i) => (
          <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
        ))}
      </View>

      <View style={styles.actions}>
        <Button
          title={isLast ? "Get started" : "Next"}
          onPress={() => (isLast ? router.replace("/register") : setIndex(index + 1))}
        />
        <Button
          title="I already have an account"
          variant="outline"
          onPress={() => router.replace("/login")}
          style={{ marginTop: spacing.md }}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.md,
  },
  brand: { ...typography.h3, color: colors.primary },
  skip: { color: colors.textMuted, fontWeight: "600" },
  hero: { flex: 1, alignItems: "center", justifyContent: "center" },
  iconCircle: {
    width: width * 0.5,
    height: width * 0.5,
    borderRadius: radius.xl,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xxl,
  },
  title: { ...typography.h1, color: colors.text, textAlign: "center" },
  text: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
    lineHeight: 22,
  },
  dots: { flexDirection: "row", justifyContent: "center", marginBottom: spacing.xl },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
    marginHorizontal: 4,
  },
  dotActive: { backgroundColor: colors.primary, width: 22 },
  actions: { marginBottom: spacing.lg },
});
