import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Screen from "../../components/Screen";
import { colors, radius, shadow, spacing, typography } from "../../constants/theme";
import { useAuthStore } from "../../store/authStore";
import { useCartStore } from "../../store/cartStore";
import { useFavoritesStore } from "../../store/favoritesStore";

const MENU = [
  { icon: "receipt-outline", label: "My orders", route: "/orders" },
  { icon: "storefront-outline", label: "My products", route: "/(tabs)" },
  { icon: "heart-outline", label: "Favorites", route: "/(tabs)/favorites" },
  { icon: "settings-outline", label: "Settings", route: "/(tabs)/profile" },
] as const;

export default function Profile() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const resetCart = useCartStore((s) => s.reset);
  const resetFavorites = useFavoritesStore((s) => s.reset);

  function onLogout() {
    Alert.alert("Log out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log out",
        style: "destructive",
        onPress: async () => {
          await signOut();
          resetCart();
          resetFavorites();
          router.replace("/login");
        },
      },
    ]);
  }

  const initials = (user?.name ?? "?")
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <Screen scroll>
      <Text style={styles.title}>Profile</Text>

      <View style={styles.card}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <View style={{ flex: 1, marginLeft: spacing.lg }}>
          <Text style={styles.name}>{user?.name ?? "Guest"}</Text>
          <Text style={styles.email}>{user?.email ?? "-"}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{user?.role?.toUpperCase() ?? "USER"}</Text>
          </View>
        </View>
      </View>

      <View style={styles.menu}>
        {MENU.map((item, idx) => (
          <Pressable
            key={item.label}
            style={[styles.menuItem, idx < MENU.length - 1 && styles.menuDivider]}
            onPress={() => router.push(item.route as never)}
          >
            <View style={styles.menuIcon}>
              <Ionicons name={item.icon} size={20} color={colors.primary} />
            </View>
            <Text style={styles.menuLabel}>{item.label}</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </Pressable>
        ))}
      </View>

      <Pressable style={styles.logout} onPress={onLogout}>
        <Ionicons name="log-out-outline" size={20} color={colors.danger} />
        <Text style={styles.logoutText}>Log out</Text>
      </Pressable>

      <Text style={styles.version}>PulseMarket v1.0.0</Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { ...typography.h2, color: colors.text, marginTop: spacing.sm, marginBottom: spacing.lg },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...shadow.soft,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: colors.white, fontSize: 22, fontWeight: "800" },
  name: { ...typography.h3, color: colors.text },
  email: { ...typography.small, color: colors.textMuted, marginTop: 2 },
  roleBadge: {
    alignSelf: "flex-start",
    marginTop: spacing.sm,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  roleText: { ...typography.tiny, color: colors.primary },
  menu: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    marginTop: spacing.xl,
    overflow: "hidden",
    ...shadow.soft,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.lg,
  },
  menuDivider: { borderBottomWidth: 1, borderBottomColor: colors.border },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  menuLabel: { flex: 1, ...typography.bodyStrong, color: colors.text },
  logout: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.xl,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: "#FFE9E9",
  },
  logoutText: { color: colors.danger, fontWeight: "700", marginLeft: spacing.sm },
  version: { textAlign: "center", color: colors.textMuted, fontSize: 12, marginTop: spacing.xl },
});
