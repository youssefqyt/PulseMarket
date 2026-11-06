import { useEffect, useState } from "react";
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Screen from "../../components/Screen";
import ProductCard from "../../components/ProductCard";
import CategoryChip from "../../components/CategoryChip";
import Loading from "../../components/Loading";
import EmptyState from "../../components/EmptyState";
import { colors, radius, shadow, spacing, typography } from "../../constants/theme";
import { useProducts } from "../../hooks/useProducts";
import { useAuthStore } from "../../store/authStore";
import { useCartStore } from "../../store/cartStore";
import { useFavoritesStore } from "../../store/favoritesStore";
import { fetchCategories } from "../../services/product.service";
import type { Category } from "../../types";

export default function Home() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const loadCart = useCartStore((s) => s.load);
  const addToCart = useCartStore((s) => s.add);
  const loadFavorites = useFavoritesStore((s) => s.load);
  const favoriteIds = useFavoritesStore((s) => s.ids);
  const toggleFavorite = useFavoritesStore((s) => s.toggle);

  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const { data, loading, refetch } = useProducts({
    category: activeCategory ?? undefined,
    sort: "newest",
    limit: 20,
  });

  useEffect(() => {
    loadCart();
    loadFavorites();
    fetchCategories().then(setCategories).catch(() => {});
  }, [loadCart, loadFavorites]);

  return (
    <Screen padded={false}>
      <FlatList
        data={data?.items ?? []}
        keyExtractor={(item) => String(item.id)}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshing={loading}
        onRefresh={refetch}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.topBar}>
              <View>
                <Text style={styles.greeting}>Hello, {user?.name?.split(" ")[0] ?? "there"} 👋</Text>
                <Text style={styles.headline}>Find something great</Text>
              </View>
              <Pressable style={styles.iconBtn} onPress={() => router.push("/notifications")}>
                <Ionicons name="notifications-outline" size={22} color={colors.text} />
              </Pressable>
            </View>

            <Pressable style={styles.searchBar} onPress={() => router.push("/(tabs)/search")}>
              <Ionicons name="search" size={18} color={colors.textMuted} />
              <Text style={styles.searchPlaceholder}>Search products...</Text>
            </Pressable>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.categories}
              contentContainerStyle={{ paddingRight: spacing.lg }}
            >
              <CategoryChip
                label="All"
                active={activeCategory === null}
                onPress={() => setActiveCategory(null)}
              />
              {categories.map((c) => (
                <CategoryChip
                  key={c.id}
                  label={c.name}
                  active={activeCategory === c.slug}
                  onPress={() => setActiveCategory(c.slug)}
                />
              ))}
            </ScrollView>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Trending now</Text>
              <Text style={styles.sectionCount}>{data?.pagination.total ?? 0} items</Text>
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <ProductCard
            product={item}
            width="48%"
            isFavorite={favoriteIds.has(item.id)}
            onToggleFavorite={() => toggleFavorite(item.id)}
            onAddToCart={() => addToCart(item.id, 1)}
            onPress={() => router.push(`/product/${item.id}`)}
          />
        )}
        ListEmptyComponent={
          loading ? (
            <Loading fullscreen={false} />
          ) : (
            <EmptyState
              icon="cube-outline"
              title="No products yet"
              subtitle="Run the seed script to load demo products, or pull to refresh."
            />
          )
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  row: { justifyContent: "space-between", marginBottom: spacing.lg },
  header: { marginTop: spacing.sm, marginBottom: spacing.lg },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  greeting: { ...typography.small, color: colors.textMuted },
  headline: { ...typography.h2, color: colors.text, marginTop: 2 },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    ...shadow.soft,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    height: 50,
    ...shadow.soft,
  },
  searchPlaceholder: { marginLeft: spacing.sm, color: colors.textMuted, fontSize: 15 },
  categories: { marginTop: spacing.lg },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.xl,
  },
  sectionTitle: { ...typography.h3, color: colors.text },
  sectionCount: { ...typography.small, color: colors.textMuted },
});
