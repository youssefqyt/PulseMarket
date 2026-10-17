import { useEffect, useState } from "react";
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import Button from "../../components/Button";
import QuantityStepper from "../../components/QuantityStepper";
import Loading from "../../components/Loading";
import EmptyState from "../../components/EmptyState";
import { colors, formatPrice, radius, shadow, spacing, typography } from "../../constants/theme";
import { fetchProduct } from "../../services/product.service";
import { useCartStore } from "../../store/cartStore";
import { useFavoritesStore } from "../../store/favoritesStore";
import type { Product } from "../../types";

export default function ProductDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const addToCart = useCartStore((s) => s.add);
  const favoriteIds = useFavoritesStore((s) => s.ids);
  const toggleFavorite = useFavoritesStore((s) => s.toggle);

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setProduct(await fetchProduct(Number(id)));
      } catch {
        setProduct(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) return <Loading />;
  if (!product) {
    return (
      <SafeAreaView style={styles.safe}>
        <EmptyState icon="alert-circle-outline" title="Product not found" />
      </SafeAreaView>
    );
  }

  const isFav = favoriteIds.has(product.id);

  async function onAdd() {
    setAdding(true);
    try {
      await addToCart(product!.id, quantity);
      Alert.alert("Added to cart", `"${product!.title}" is now in your cart.`, [
        { text: "Keep shopping", style: "cancel" },
        { text: "View cart", onPress: () => router.push("/(tabs)/cart") },
      ]);
    } catch (err) {
      Alert.alert("Could not add", (err as Error).message);
    } finally {
      setAdding(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.imageWrapper}>
          {product.imageUrl ? (
            <Image source={{ uri: product.imageUrl }} style={styles.image} />
          ) : (
            <View style={[styles.image, styles.placeholder]}>
              <Ionicons name="image-outline" size={40} color={colors.textMuted} />
            </View>
          )}

          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </Pressable>

          <Pressable style={styles.favBtn} onPress={() => toggleFavorite(product.id)}>
            <Ionicons
              name={isFav ? "heart" : "heart-outline"}
              size={22}
              color={isFav ? colors.danger : colors.text}
            />
          </Pressable>
        </View>

        <View style={styles.body}>
          {product.categoryName ? (
            <Text style={styles.category}>{product.categoryName}</Text>
          ) : null}
          <Text style={styles.title}>{product.title}</Text>

          <View style={styles.priceRow}>
            <Text style={styles.price}>{formatPrice(product.price)}</Text>
            <View style={[styles.stock, product.stock === 0 && styles.stockOut]}>
              <Text style={[styles.stockText, product.stock === 0 && styles.stockTextOut]}>
                {product.stock > 0 ? `${product.stock} in stock` : "Sold out"}
              </Text>
            </View>
          </View>

          {product.sellerName ? (
            <View style={styles.seller}>
              <View style={styles.sellerAvatar}>
                <Ionicons name="person" size={14} color={colors.primary} />
              </View>
              <Text style={styles.sellerText}>Sold by {product.sellerName}</Text>
            </View>
          ) : null}

          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{product.description ?? "No description provided."}</Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.qtyWrapper}>
          <QuantityStepper
            quantity={quantity}
            max={Math.max(product.stock, 1)}
            onChange={setQuantity}
          />
        </View>
        <Button
          title={product.stock === 0 ? "Sold out" : "Add to cart"}
          onPress={onAdd}
          loading={adding}
          disabled={product.stock === 0}
          style={{ flex: 1 }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingBottom: spacing.xxl },
  imageWrapper: { width: "100%", aspectRatio: 1, backgroundColor: colors.surfaceAlt },
  image: { width: "100%", height: "100%" },
  placeholder: { alignItems: "center", justifyContent: "center" },
  backBtn: {
    position: "absolute",
    top: spacing.lg,
    left: spacing.lg,
    width: 42,
    height: 42,
    borderRadius: radius.pill,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    ...shadow.soft,
  },
  favBtn: {
    position: "absolute",
    top: spacing.lg,
    right: spacing.lg,
    width: 42,
    height: 42,
    borderRadius: radius.pill,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    ...shadow.soft,
  },
  body: { padding: spacing.lg },
  category: { ...typography.tiny, color: colors.primary, textTransform: "uppercase" },
  title: { ...typography.h2, color: colors.text, marginTop: spacing.xs },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.lg,
  },
  price: { ...typography.h1, color: colors.primary },
  stock: {
    backgroundColor: "#E1F7F0",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
  },
  stockOut: { backgroundColor: "#FFE5E5" },
  stockText: { color: "#00815F", fontWeight: "700", fontSize: 12 },
  stockTextOut: { color: "#C0392B" },
  seller: { flexDirection: "row", alignItems: "center", marginTop: spacing.lg },
  sellerAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.sm,
  },
  sellerText: { ...typography.small, color: colors.textMuted },
  sectionTitle: { ...typography.h3, color: colors.text, marginTop: spacing.xl, marginBottom: spacing.sm },
  description: { ...typography.body, color: colors.textMuted, lineHeight: 22 },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  qtyWrapper: { marginRight: spacing.md },
});
