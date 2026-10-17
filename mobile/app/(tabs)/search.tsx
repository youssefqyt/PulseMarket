import { useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Screen from "../../components/Screen";
import ProductCard from "../../components/ProductCard";
import Loading from "../../components/Loading";
import EmptyState from "../../components/EmptyState";
import { colors, radius, spacing, typography } from "../../constants/theme";
import { useProducts } from "../../hooks/useProducts";
import { useFavoritesStore } from "../../store/favoritesStore";

const SORTS = [
  { key: "newest", label: "Newest" },
  { key: "price_asc", label: "Price ↑" },
  { key: "price_desc", label: "Price ↓" },
] as const;

export default function Search() {
  const router = useRouter();
  const [term, setTerm] = useState("");
  const [submitted, setSubmitted] = useState("");
  const [sort, setSort] = useState<(typeof SORTS)[number]["key"]>("newest");

  const favoriteIds = useFavoritesStore((s) => s.ids);
  const toggleFavorite = useFavoritesStore((s) => s.toggle);

  const { data, loading } = useProducts({
    q: submitted || undefined,
    sort,
    limit: 30,
  });

  return (
    <Screen padded={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Search</Text>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={colors.textMuted} />
          <TextInput
            style={styles.input}
            value={term}
            onChangeText={setTerm}
            placeholder="Search products..."
            placeholderTextColor={colors.textMuted}
            returnKeyType="search"
            onSubmitEditing={() => setSubmitted(term.trim())}
          />
          {term.length > 0 ? (
            <Pressable onPress={() => { setTerm(""); setSubmitted(""); }}>
              <Ionicons name="close-circle" size={18} color={colors.textMuted} />
            </Pressable>
          ) : null}
        </View>

        <View style={styles.sorts}>
          {SORTS.map((s) => (
            <Pressable
              key={s.key}
              onPress={() => setSort(s.key)}
              style={[styles.sort, sort === s.key && styles.sortActive]}
            >
              <Text style={[styles.sortText, sort === s.key && styles.sortTextActive]}>
                {s.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <FlatList
        data={data?.items ?? []}
        keyExtractor={(item) => String(item.id)}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.list}
        refreshing={loading}
        onRefresh={() => {}}
        renderItem={({ item }) => (
          <ProductCard
            product={item}
            width="48%"
            isFavorite={favoriteIds.has(item.id)}
            onToggleFavorite={() => toggleFavorite(item.id)}
            onPress={() => router.push(`/product/${item.id}`)}
          />
        )}
        ListEmptyComponent={
          loading ? (
            <Loading fullscreen={false} />
          ) : (
            <EmptyState
              icon="search-outline"
              title={submitted ? "No results" : "Start searching"}
              subtitle={submitted ? `Nothing matched "${submitted}".` : "Type a product name above."}
            />
          )
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.md },
  title: { ...typography.h2, color: colors.text, marginBottom: spacing.md },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    height: 50,
    borderWidth: 1,
    borderColor: colors.border,
  },
  input: { flex: 1, marginLeft: spacing.sm, fontSize: 15, color: colors.text },
  sorts: { flexDirection: "row", marginTop: spacing.md },
  sort: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.sm,
  },
  sortActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  sortText: { fontSize: 13, fontWeight: "600", color: colors.text },
  sortTextActive: { color: colors.white },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  row: { justifyContent: "space-between", marginBottom: spacing.lg },
});
