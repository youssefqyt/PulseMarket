import { Alert, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useState } from "react";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Screen from "../../components/Screen";
import { colors, radius, shadow, spacing, typography } from "../../constants/theme";
import { useAuthStore } from "../../store/authStore";
import { useCartStore } from "../../store/cartStore";
import { useFavoritesStore } from "../../store/favoritesStore";
import { useNotificationStore } from "../../store/notificationStore";
import { useSettingsStore } from "../../store/settingsStore";

const CUSTOMER_MENU = [
  { icon: "receipt-outline", label: "My orders", route: "/orders" },
  { icon: "heart-outline", label: "Favorites", route: "/(tabs)/favorites" },
  { icon: "notifications-outline", label: "Notifications", route: "/notifications" },
  { icon: "settings-outline", label: "Settings & Preferences", route: "/settings" },
] as const;
const SELLER_MENU_ITEM = {
  icon: "storefront-outline",
  label: "Seller workspace",
  route: "/seller-dashboard",
} as const;
const ADMIN_MENU_ITEM = {
  icon: "shield-checkmark-outline",
  label: "Admin workspace",
  route: "/admin",
} as const;

export default function Profile() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const resetCart = useCartStore((s) => s.reset);
  const resetFavorites = useFavoritesStore((s) => s.reset);
  const resetNotifications = useNotificationStore((s) => s.reset);
  const resetSettings = useSettingsStore((s) => s.reset);
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const [loggingOut, setLoggingOut] = useState(false);
  const menu = [
    ...(user?.role === "seller" || user?.role === "admin" ? [SELLER_MENU_ITEM] : []),
    ...(user?.role === "admin" ? [ADMIN_MENU_ITEM] : []),
    ...CUSTOMER_MENU,
  ];

  function onLogout() {
    if (loggingOut) return;
    if (Platform.OS === "web") {
      if (typeof window !== "undefined" && !window.confirm("Are you sure you want to log out?")) return;
      void performLogout();
      return;
    }

    Alert.alert("Log out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log out",
        style: "destructive",
        onPress: () => void performLogout(),
      },
    ]);
  }

  async function performLogout() {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await signOut();
    } catch (error) {
      console.error("Local sign-out failed", error);
    } finally {
      resetCart();
      resetFavorites();
      resetNotifications();
      void resetSettings().catch((error: Error) => {
        console.error("Could not clear saved settings during sign-out", error);
      });
      router.replace("/login");
    }
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
        {menu.map((item, idx) => (
          <Pressable
            key={item.label}
            style={[styles.menuItem, idx < menu.length - 1 && styles.menuDivider]}
            onPress={() => router.push(item.route as never)}
          >
            <View style={styles.menuIcon}>
              <Ionicons name={item.icon} size={20} color={colors.primary} />
            </View>
            <Text style={styles.menuLabel}>{item.label}</Text>
            {item.route === "/notifications" && unreadCount > 0 ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount > 99 ? "99+" : unreadCount}</Text>
              </View>
            ) : null}
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </Pressable>
        ))}
      </View>

      <Pressable
        style={[styles.logout, loggingOut && styles.logoutDisabled]}
        onPress={onLogout}
        disabled={loggingOut}
      >
        <Ionicons name="log-out-outline" size={20} color={colors.danger} />
        <Text style={styles.logoutText}>{loggingOut ? "Logging out…" : "Log out"}</Text>
      </Pressable>

      <Text style={styles.version}>PulseMarket v1.2.0 • Online Marketplace</Text>
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
  badge: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
    marginRight: 6,
  },
  badgeText: { color: colors.white, fontSize: 11, fontWeight: "700" },
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
  logoutDisabled: { opacity: 0.6 },
  version: { textAlign: "center", color: colors.textMuted, fontSize: 12, marginTop: spacing.xl },
});
