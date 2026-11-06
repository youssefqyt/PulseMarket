import { useEffect, useState } from "react";
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Screen from "../components/Screen";
import EmptyState from "../components/EmptyState";
import { colors, radius, spacing, typography } from "../constants/theme";
import { fetchSharedWishlist, type SharedWishlist } from "../services/wishlist.service";
import { useSettingsStore } from "../store/settingsStore";

export default function SharedWishlistScreen() {
  const router = useRouter();
  const formatCurrency = useSettingsStore((state) => state.formatCurrency);
  const params = useLocalSearchParams<{ token?: string | string[] }>();
  const token = Array.isArray(params.token) ? params.token[0] : params.token;
  const [wishlist, setWishlist] = useState<SharedWishlist | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) {
      setError("This wishlist link is missing its share token.");
      setLoading(false);
      return;
    }
    let active = true;
    fetchSharedWishlist(token)
      .then((result) => {
        if (active) setWishlist(result);
      })
      .catch((requestError: Error) => {
        if (active) setError(requestError.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [token]);

  return (
    <Screen>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={21} color={colors.text} />
        </Pressable>
        <View>
          <Text style={styles.title}>Shared wishlist</Text>
          {wishlist ? <Text style={styles.subtitle}>Shared by {wishlist.ownerName}</Text> : null}
        </View>
      </View>
      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={styles.loading} />
      ) : error ? (
        <EmptyState icon="alert-circle-outline" title="Wishlist unavailable" subtitle={error} />
      ) : wishlist?.items.length ? (
        <ScrollView contentContainerStyle={styles.list}>
          {wishlist.items.map((item) => (
            <Pressable
              key={item.id}
              style={styles.item}
              onPress={() => router.push(`/product/${item.id}`)}
            >
              {item.imageUrl ? (
                <Image source={{ uri: item.imageUrl }} style={styles.image} />
              ) : (
                <View style={[styles.image, styles.placeholder]}>
                  <Ionicons name="image-outline" size={23} color={colors.textMuted} />
                </View>
              )}
              <View style={styles.itemDetails}>
                <Text style={styles.itemTitle} numberOfLines={2}>{item.title}</Text>
                <Text style={styles.price}>{formatCurrency(item.price)}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </Pressable>
          ))}
        </ScrollView>
      ) : (
        <EmptyState icon="heart-outline" title="This wishlist is empty" subtitle="The owner has not saved any products yet." />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", gap: spacing.md, marginBottom: spacing.lg },
  backButton: { width: 42, height: 42, borderRadius: radius.pill, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center" },
  title: { ...typography.h2, color: colors.text },
  subtitle: { ...typography.small, color: colors.textMuted, marginTop: 2 },
  loading: { marginTop: spacing.xxl },
  list: { paddingBottom: spacing.xxl },
  item: { flexDirection: "row", alignItems: "center", padding: spacing.md, marginBottom: spacing.sm, backgroundColor: colors.surface, borderRadius: radius.md, gap: spacing.md },
  image: { width: 66, height: 66, borderRadius: radius.sm, backgroundColor: colors.surfaceAlt },
  placeholder: { alignItems: "center", justifyContent: "center" },
  itemDetails: { flex: 1 },
  itemTitle: { ...typography.bodyStrong, color: colors.text },
  price: { ...typography.bodyStrong, color: colors.primary, marginTop: spacing.xs },
});
