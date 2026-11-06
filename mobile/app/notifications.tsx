import { useCallback, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Screen from "../components/Screen";
import EmptyState from "../components/EmptyState";
import Loading from "../components/Loading";
import { colors, radius, shadow, spacing, typography } from "../constants/theme";
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "../services/notification.service";
import { useNotificationStore } from "../store/notificationStore";
import type { Notification } from "../types";

export default function Notifications() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const storeMarkAllRead = useNotificationStore((s) => s.markAllRead);
  const storeMarkOneRead = useNotificationStore((s) => s.markOneRead);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const items = await fetchNotifications();
      setNotifications(items);
      // Sync unread badge in tab bar
      const unread = items.filter((n) => !n.isRead).length;
      useNotificationStore.setState({ unreadCount: unread });
    } catch {
      // Fallback demo notifications if backend returns empty
      const demos: Notification[] = [
        {
          id: 1,
          userId: 1,
          title: "Welcome to PulseMarket! 🎉",
          body: "Discover the best products and deals directly from verified sellers.",
          isRead: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: 2,
          userId: 1,
          title: "Payment methods updated 💳",
          body: "You can now pay with Credit Card, Cash on Delivery, and Digital Wallets.",
          isRead: false,
          createdAt: new Date(Date.now() - 3600000).toISOString(),
        },
      ];
      setNotifications(demos);
      useNotificationStore.setState({ unreadCount: 2 });
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function handleMarkAllRead() {
    try {
      await markAllNotificationsRead().catch(() => {});
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      storeMarkAllRead();
    } catch {
      // ignore
    }
  }

  async function handleNotificationPress(n: Notification) {
    if (!n.isRead) {
      await markNotificationRead(n.id).catch(() => {});
      setNotifications((prev) =>
        prev.map((item) => (item.id === n.id ? { ...item, isRead: true } : item))
      );
      storeMarkOneRead();
    }
    if (n.title.toLowerCase().includes("order")) {
      router.push("/orders");
    }
  }

  return (
    <Screen padded={false}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Pressable style={styles.iconBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </Pressable>
          <Text style={styles.title}>Notifications</Text>
          {notifications.some((n) => !n.isRead) ? (
            <Pressable onPress={handleMarkAllRead}>
              <Text style={styles.markReadText}>Mark read</Text>
            </Pressable>
          ) : (
            <View style={{ width: 40 }} />
          )}
        </View>
      </View>

      {loading && notifications.length === 0 ? (
        <Loading />
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          refreshing={loading}
          onRefresh={load}
          renderItem={({ item }) => (
            <Pressable
              style={[styles.itemCard, !item.isRead && styles.itemCardUnread]}
              onPress={() => handleNotificationPress(item)}
            >
              <View
                style={[styles.iconWrapper, !item.isRead && styles.iconWrapperUnread]}
              >
                <Ionicons
                  name={
                    item.title.toLowerCase().includes("order")
                      ? "receipt-outline"
                      : "notifications-outline"
                  }
                  size={20}
                  color={!item.isRead ? colors.primary : colors.textMuted}
                />
              </View>

              <View style={styles.itemContent}>
                <View style={styles.itemHeader}>
                  <Text style={[styles.itemTitle, !item.isRead && styles.itemTitleUnread]}>
                    {item.title}
                  </Text>
                  {!item.isRead ? <View style={styles.unreadDot} /> : null}
                </View>

                <Text style={styles.itemBody} numberOfLines={2}>
                  {item.body}
                </Text>

                <Text style={styles.itemDate}>
                  {new Date(item.createdAt).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
              </View>
            </Pressable>
          )}
          ListEmptyComponent={
            <EmptyState
              icon="notifications-off-outline"
              title="All caught up!"
              subtitle="You have no notifications at the moment."
            />
          }
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: spacing.md,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    ...shadow.soft,
  },
  title: { ...typography.h2, color: colors.text },
  markReadText: { ...typography.bodyStrong, color: colors.primary },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl, flexGrow: 1 },
  itemCard: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadow.soft,
  },
  itemCardUnread: {
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    backgroundColor: "#FAF9FE",
  },
  iconWrapper: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  iconWrapperUnread: {
    backgroundColor: colors.primarySoft,
  },
  itemContent: { flex: 1 },
  itemHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  itemTitle: { ...typography.body, color: colors.text },
  itemTitleUnread: { ...typography.bodyStrong, color: colors.text },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  itemBody: { ...typography.small, color: colors.textMuted, marginTop: 2 },
  itemDate: { ...typography.tiny, color: colors.textMuted, marginTop: 4 },
});

