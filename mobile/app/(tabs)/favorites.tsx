import { useCallback, useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import Screen from "../../components/Screen";
import ProductCard from "../../components/ProductCard";
import Loading from "../../components/Loading";
import EmptyState from "../../components/EmptyState";
import { colors, spacing, typography } from "../../constants/theme";
import { useFavoritesStore } from "../../store/favoritesStore";
import { fetchFavorites } from "../../services/favorite.service";
import type { Product } from "../../types";

export default function Favorites() {
  const router = useRouter();
  const favoriteIds = useFavoritesStore((s) => s.ids);
  const toggleFavorite = useFavoritesStore((s) => s.toggle);

  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchFavorites();
      setItems(result.items);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Refresh every time the tab gains focus so removed items disappear.
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function onToggle(id: number) {
    setItems((prev) => prev.filter((p) => p.id !== id));
    await toggleFavorite(id);
  }

  return (
    <Screen padded={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Favorites</Text>
        <Text style={styles.subtitle}>{items.length} saved item(s)</Text>
      </View>

      {loading ? (
        <Loading />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => String(item.id)}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <ProductCard
              product={item}
              width="48%"
              isFavorite={favoriteIds.has(item.id)}
              onToggleFavorite={() => onToggle(item.id)}
              onPress={() => router.push(`/product/${item.id}`)}
            />
          )}
          ListEmptyComponent={
            <EmptyState
              icon="heart-outline"
              title="No favorites yet"
              subtitle="Tap the heart on any product to save it here."
            />
          }
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.md },
  title: { ...typography.h2, color: colors.text },
  subtitle: { ...typography.small, color: colors.textMuted, marginTop: 2 },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  row: { justifyContent: "space-between", marginBottom: spacing.lg },
});
