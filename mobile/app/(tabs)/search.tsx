import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Screen from "../../components/Screen";
import ProductCard from "../../components/ProductCard";
import Loading from "../../components/Loading";
import EmptyState from "../../components/EmptyState";
import { colors, radius, spacing, typography } from "../../constants/theme";
import { useProducts } from "../../hooks/useProducts";
import { fetchCategories, suggestProducts } from "../../services/product.service";
import type { ProductQuery } from "../../services/product.service";
import { useFavoritesStore } from "../../store/favoritesStore";
import { useCartStore } from "../../store/cartStore";
import type { Category } from "../../types";

const SORTS = [
  { key: "newest", label: "Newest" },
  { key: "price_asc", label: "Price: low to high" },
  { key: "price_desc", label: "Price: high to low" },
  { key: "popularity", label: "Most popular" },
  { key: "rating", label: "Top rated" },
] as const;
const RECENT_SEARCHES_KEY = "@pulsemarket_recent_searches";

export default function Search() {
  const router = useRouter();
  const [term, setTerm] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sort, setSort] = useState<(typeof SORTS)[number]["key"]>("newest");
  const [inStock, setInStock] = useState(false);
  const [category, setCategory] = useState("");
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [search, setSearch] = useState<ProductQuery | null>(null);
  const [suggestions, setSuggestions] = useState<
    { id: number; title: string; imageUrl?: string; price: number }[]
  >([]);

  const favoriteIds = useFavoritesStore((s) => s.ids);
  const toggleFavorite = useFavoritesStore((s) => s.toggle);
  const addToCart = useCartStore((s) => s.add);

  useEffect(() => {
    let active = true;
    fetchCategories()
      .then((items) => {
        if (active) setCategories(items);
      })
      .catch((error: Error) => {
        if (active) setCategoryError(error.message);
      });
    AsyncStorage.getItem(RECENT_SEARCHES_KEY)
      .then((value) => {
        if (active && value) setRecentSearches(JSON.parse(value) as string[]);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const query = term.trim();
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }
    let active = true;
    const timeout = setTimeout(() => {
      suggestProducts(query)
        .then((items) => {
          if (active) setSuggestions(items);
        })
        .catch(() => {
          if (active) setSuggestions([]);
        });
    }, 250);
    return () => {
      active = false;
      clearTimeout(timeout);
    };
  }, [term]);

  const activeSearch = useMemo(() => search !== null, [search]);
  const { data, loading, loadingMore, error, refetch, loadMore } = useProducts(search ?? {}, activeSearch);

  async function submitSearch(nextTerm = term) {
    const min = minPrice.trim() ? Number(minPrice) : undefined;
    const max = maxPrice.trim() ? Number(maxPrice) : undefined;
    if ((min !== undefined && (!Number.isFinite(min) || min < 0)) ||
        (max !== undefined && (!Number.isFinite(max) || max < 0))) {
      Alert.alert("Invalid price", "Enter a valid non-negative minimum and maximum price.");
      return;
    }
    if (min !== undefined && max !== undefined && min > max) {
      Alert.alert("Invalid price range", "Minimum price must not exceed maximum price.");
      return;
    }

    const normalizedTerm = nextTerm.trim();
    const query: ProductQuery = {
      q: normalizedTerm || undefined,
      category: category || undefined,
      minPrice: min,
      maxPrice: max,
      inStock: inStock || undefined,
      sort,
      limit: 30,
    };
    if (!normalizedTerm && !category && min === undefined && max === undefined && !inStock && sort === "newest") {
      setSearch(null);
      return;
    }

    setSearch(query);
    if (normalizedTerm) {
      const next = [normalizedTerm, ...recentSearches.filter((item) => item !== normalizedTerm)].slice(0, 6);
      setRecentSearches(next);
      await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next)).catch(() => undefined);
    }
  }

  function clearSearch() {
    setTerm("");
    setMinPrice("");
    setMaxPrice("");
    setInStock(false);
    setCategory("");
    setSort("newest");
    setSearch(null);
  }

  async function clearRecentSearches() {
    setRecentSearches([]);
    await AsyncStorage.removeItem(RECENT_SEARCHES_KEY).catch(() => undefined);
  }

  const activeFilterCount =
    Number(Boolean(search?.category)) +
    Number(search?.minPrice !== undefined) +
    Number(search?.maxPrice !== undefined) +
    Number(Boolean(search?.inStock)) +
    Number(search?.sort !== undefined && search.sort !== "newest");

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
        onEndReached={() => void loadMore()}
        onEndReachedThreshold={0.45}
        ListFooterComponent={loadingMore ? <Loading fullscreen={false} /> : null}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.title}>Find your next favorite</Text>
            <Text style={styles.subtitle}>Search across products, categories, and price ranges.</Text>
            <View style={styles.searchBar}>
              <Ionicons name="search" size={18} color={colors.textMuted} />
              <TextInput
                style={styles.input}
                value={term}
                onChangeText={setTerm}
                placeholder="Product name or description"
                placeholderTextColor={colors.textMuted}
                returnKeyType="search"
                onSubmitEditing={() => submitSearch()}
                accessibilityLabel="Search products"
              />
              {term.length > 0 ? (
                <Pressable onPress={() => setTerm("")} accessibilityLabel="Clear search text">
                  <Ionicons name="close-circle" size={18} color={colors.textMuted} />
                </Pressable>
              ) : null}
            </View>
            {suggestions.length > 0 && !activeSearch ? (
              <View style={styles.suggestions}>
                {suggestions.map((item) => (
                  <Pressable
                    key={item.id}
                    style={styles.suggestionRow}
                    onPress={() => {
                      setTerm(item.title);
                      setSuggestions([]);
                      void submitSearch(item.title);
                    }}
                  >
                    <Ionicons name="search-outline" size={16} color={colors.textMuted} />
                    <Text style={styles.suggestionText} numberOfLines={1}>{item.title}</Text>
                    <Text style={styles.suggestionPrice}>{item.price.toFixed(2)}</Text>
                  </Pressable>
                ))}
              </View>
            ) : null}

            <View style={styles.actionRow}>
              <Pressable style={styles.filterButton} onPress={() => setFiltersVisible(!filtersVisible)}>
                <Ionicons name="options-outline" size={18} color={colors.primary} />
                <Text style={styles.filterButtonText}>Filters{activeFilterCount ? ` (${activeFilterCount})` : ""}</Text>
                <Ionicons name={filtersVisible ? "chevron-up" : "chevron-down"} size={16} color={colors.primary} />
              </Pressable>
              <Pressable style={styles.searchButton} onPress={() => submitSearch()}>
                <Text style={styles.searchButtonText}>Search</Text>
              </Pressable>
            </View>
            <Pressable
              onPress={() => setInStock(!inStock)}
              style={styles.stockToggle}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: inStock }}
            >
              <Ionicons
                name={inStock ? "checkbox" : "square-outline"}
                size={19}
                color={inStock ? colors.primary : colors.textMuted}
              />
              <Text style={styles.chipText}>Show in-stock products only</Text>
            </Pressable>

            {filtersVisible ? (
              <View style={styles.filters}>
                <Text style={styles.filterLabel}>Category</Text>
                <View style={styles.chips}>
                  <Pressable
                    onPress={() => setCategory("")}
                    style={[styles.chip, !category && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, !category && styles.chipTextActive]}>All</Text>
                  </Pressable>
                  {categories.map((item) => (
                    <Pressable
                      key={item.id}
                      onPress={() => setCategory(item.slug)}
                      style={[styles.chip, category === item.slug && styles.chipActive]}
                    >
                      <Text style={[styles.chipText, category === item.slug && styles.chipTextActive]}>
                        {item.name}
                      </Text>
                    </Pressable>
                  ))}
                </View>
                {categoryError ? <Text style={styles.errorText}>{categoryError}</Text> : null}

                <Text style={styles.filterLabel}>Price range</Text>
                <View style={styles.priceRow}>
                  <TextInput
                    style={styles.priceInput}
                    value={minPrice}
                    onChangeText={setMinPrice}
                    placeholder="Min"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="decimal-pad"
                    accessibilityLabel="Minimum price"
                  />
                  <Text style={styles.toText}>to</Text>
                  <TextInput
                    style={styles.priceInput}
                    value={maxPrice}
                    onChangeText={setMaxPrice}
                    placeholder="Max"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="decimal-pad"
                    accessibilityLabel="Maximum price"
                  />
                </View>

                <Text style={styles.filterLabel}>Sort by</Text>
                <View style={styles.chips}>
                  {SORTS.map((item) => (
                    <Pressable
                      key={item.key}
                      onPress={() => setSort(item.key)}
                      style={[styles.chip, sort === item.key && styles.chipActive]}
                    >
                      <Text style={[styles.chipText, sort === item.key && styles.chipTextActive]}>
                        {item.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
                <Pressable onPress={clearSearch} style={styles.resetFilters}>
                  <Text style={styles.resetText}>Reset search and filters</Text>
                </Pressable>
              </View>
            ) : null}

            {!activeSearch ? (
              <View style={styles.recentSection}>
                <View style={styles.recentHeader}>
                  <Text style={styles.sectionTitle}>Recent searches</Text>
                  {recentSearches.length > 0 ? (
                    <Pressable onPress={clearRecentSearches}>
                      <Text style={styles.clearRecent}>Clear</Text>
                    </Pressable>
                  ) : null}
                </View>
                {recentSearches.length > 0 ? (
                  <View style={styles.chips}>
                    {recentSearches.map((item) => (
                      <Pressable
                        key={item}
                        onPress={() => {
                          setTerm(item);
                          void submitSearch(item);
                        }}
                        style={styles.recentChip}
                      >
                        <Ionicons name="time-outline" size={14} color={colors.textMuted} />
                        <Text style={styles.recentChipText}>{item}</Text>
                      </Pressable>
                    ))}
                  </View>
                ) : (
                  <Text style={styles.emptyRecent}>Your recent searches will appear here.</Text>
                )}
              </View>
            ) : (
              <View style={styles.resultHeader}>
                <Text style={styles.sectionTitle}>
                  {data ? `${data.pagination.total} results` : "Results"}
                </Text>
                <Pressable onPress={clearSearch}>
                  <Text style={styles.clearRecent}>Clear search</Text>
                </Pressable>
              </View>
            )}
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
          ) : error ? (
            <EmptyState
              icon="cloud-offline-outline"
              title="Search is unavailable"
              subtitle={error}
              action={
                <Pressable onPress={refetch} style={styles.retryButton}>
                  <Text style={styles.searchButtonText}>Try again</Text>
                </Pressable>
              }
            />
          ) : activeSearch ? (
            <EmptyState
              icon="search-outline"
              title="No matching products"
              subtitle="Try another search term or widen your filters."
              action={
                <Pressable onPress={clearSearch} style={styles.retryButton}>
                  <Text style={styles.searchButtonText}>Clear filters</Text>
                </Pressable>
              }
            />
          ) : null
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.md },
  title: { ...typography.h2, color: colors.text },
  subtitle: { ...typography.small, color: colors.textMuted, marginTop: spacing.xs, marginBottom: spacing.md },
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
  suggestions: { backgroundColor: colors.surface, borderRadius: radius.md, marginTop: spacing.xs, paddingHorizontal: spacing.md, borderWidth: 1, borderColor: colors.border },
  suggestionRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  suggestionText: { flex: 1, ...typography.small, color: colors.text },
  suggestionPrice: { ...typography.tiny, color: colors.textMuted },
  actionRow: { flexDirection: "row", marginTop: spacing.sm, gap: spacing.sm },
  filterButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.sm,
  },
  filterButtonText: { ...typography.small, color: colors.primary, fontWeight: "700" },
  searchButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingHorizontal: spacing.xl,
    alignItems: "center",
    justifyContent: "center",
  },
  searchButtonText: { ...typography.bodyStrong, color: colors.white },
  filters: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterLabel: { ...typography.small, color: colors.textMuted, marginTop: spacing.xs, marginBottom: spacing.xs },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
  },
  chipActive: { backgroundColor: colors.primary },
  chipText: { ...typography.tiny, color: colors.text },
  chipTextActive: { color: colors.white, fontWeight: "700" },
  priceRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  priceInput: {
    flex: 1,
    height: 42,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    backgroundColor: colors.background,
  },
  toText: { ...typography.small, color: colors.textMuted },
  resetFilters: { alignSelf: "flex-start", marginTop: spacing.md },
  resetText: { ...typography.small, color: colors.danger, fontWeight: "700" },
  stockToggle: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginTop: spacing.md },
  recentSection: { marginTop: spacing.xl },
  recentHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.sm },
  sectionTitle: { ...typography.h3, color: colors.text },
  clearRecent: { ...typography.small, color: colors.primary, fontWeight: "700" },
  recentChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  recentChipText: { ...typography.tiny, color: colors.text },
  emptyRecent: { ...typography.small, color: colors.textMuted },
  resultHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  errorText: { ...typography.tiny, color: colors.danger, marginTop: spacing.xs },
  retryButton: {
    alignSelf: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
  },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl, flexGrow: 1 },
  row: { justifyContent: "space-between", marginBottom: spacing.lg },
});
