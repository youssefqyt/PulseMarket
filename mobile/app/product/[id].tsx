import { useEffect, useState } from "react";
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import Button from "../../components/Button";
import QuantityStepper from "../../components/QuantityStepper";
import Loading from "../../components/Loading";
import EmptyState from "../../components/EmptyState";
import ProductCard from "../../components/ProductCard";
import { colors, formatPrice, radius, shadow, spacing, typography } from "../../constants/theme";
import {
  createProductReview,
  fetchEligibleReviewOrderItems,
  fetchProduct,
  fetchProductReviews,
  fetchProducts,
  respondToProductReview,
} from "../../services/product.service";
import { useCartStore } from "../../store/cartStore";
import { useFavoritesStore } from "../../store/favoritesStore";
import { useSettingsStore } from "../../store/settingsStore";
import { useAuthStore } from "../../store/authStore";
import type { Product, ProductReview } from "../../types";

export default function ProductDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const addToCart = useCartStore((s) => s.add);
  const favoriteIds = useFavoritesStore((s) => s.ids);
  const toggleFavorite = useFavoritesStore((s) => s.toggle);
  const formatCurrency = useSettingsStore((s) => s.formatCurrency);
  const user = useAuthStore((s) => s.user);

  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [eligibleOrderItemId, setEligibleOrderItemId] = useState<number | null>(null);
  const [reviewText, setReviewText] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [sellerResponse, setSellerResponse] = useState("");
  const [activeImage, setActiveImage] = useState(0);
  const [reviewSaving, setReviewSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [buying, setBuying] = useState(false);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      setLoading(true);
      try {
        const item = await fetchProduct(Number(id));
        if (!isMounted) return;
        setProduct(item);

        if (item?.categorySlug) {
          const relatedRes = await fetchProducts({
            category: item.categorySlug,
            limit: 4,
          }).catch(() => null);
          if (isMounted && relatedRes) {
            setRelated(relatedRes.items.filter((p) => p.id !== item.id));
          }
        }
      } catch {
        if (isMounted) setProduct(null);
      } finally {
        if (isMounted) setLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [id]);

  useEffect(() => {
    let active = true;
    fetchProductReviews(Number(id))
      .then((result) => {
        if (active) setReviews(result.items);
      })
      .catch((error: Error) => {
        if (active) Alert.alert("Reviews unavailable", error.message);
      });
    fetchEligibleReviewOrderItems(Number(id))
      .then((items) => {
        if (!active) return;
        setEligibleOrderItemId(items[0]?.orderItemId ?? null);
      })
      .catch((error: Error) => {
        if (active && user) Alert.alert("Purchase history unavailable", error.message);
      });
    return () => {
      active = false;
    };
  }, [id, user]);

  if (loading) return <Loading />;

  if (!product) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.notFoundHeader}>
          <Pressable style={styles.backBtnInline} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Product Details</Text>
          <View style={{ width: 40 }} />
        </View>
        <EmptyState
          icon="alert-circle-outline"
          title="Product not found"
          subtitle="This item might have been removed or is currently unavailable."
          action={<Button title="Go back to Home" onPress={() => router.replace("/(tabs)")} />}
        />
      </SafeAreaView>
    );
  }

  const isFav = favoriteIds.has(product.id);
  const imageUrls = product.imageUrls?.length ? product.imageUrls : product.imageUrl ? [product.imageUrl] : [];
  const productDetails = product;

  async function submitReview() {
    if (!eligibleOrderItemId) return;
    setReviewSaving(true);
    try {
      const created = await createProductReview(productDetails.id, {
        orderItemId: eligibleOrderItemId,
        rating: reviewRating,
        body: reviewText.trim(),
      });
      setReviews((current) => [created, ...current]);
      setProduct((current) => current ? {
        ...current,
        reviewCount: (current.reviewCount || 0) + 1,
        averageRating: (
          ((current.averageRating || 0) * (current.reviewCount || 0) + reviewRating) /
          ((current.reviewCount || 0) + 1)
        ),
      } : current);
      setEligibleOrderItemId(null);
      setReviewText("");
      Alert.alert("Review submitted", "Thanks for sharing your verified purchase experience.");
    } catch (error) {
      Alert.alert("Could not submit review", (error as Error).message);
    } finally {
      setReviewSaving(false);
    }
  }

  async function submitSellerResponse(reviewId: number) {
    try {
      const updated = await respondToProductReview(reviewId, sellerResponse.trim());
      setReviews((current) => current.map((item) => item.id === reviewId ? updated : item));
      setSellerResponse("");
    } catch (error) {
      Alert.alert("Could not send response", (error as Error).message);
    }
  }

  async function onAdd() {
    setAdding(true);
    try {
      await addToCart(product!.id, quantity);
      Alert.alert("Added to Cart 🎉", `"${product!.title}" (${quantity}x) has been added to your shopping cart.`, [
        { text: "Keep shopping", style: "cancel" },
        { text: "View cart", onPress: () => router.push("/(tabs)/cart") },
      ]);
    } catch (err) {
      Alert.alert("Could not add", (err as Error).message);
    } finally {
      setAdding(false);
    }
  }

  async function onBuyNow() {
    setBuying(true);
    try {
      await addToCart(product!.id, quantity);
      router.push("/checkout");
    } catch (err) {
      Alert.alert("Error", (err as Error).message);
    } finally {
      setBuying(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.imageWrapper}>
          {imageUrls.length > 0 ? (
            <Image source={{ uri: imageUrls[activeImage] }} style={styles.image} resizeMode="cover" />
          ) : (
            <View style={[styles.image, styles.placeholder]}>
              <Ionicons name="image-outline" size={48} color={colors.textMuted} />
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
          {imageUrls.length > 1 ? (
            <View style={styles.imageDots}>
              {imageUrls.map((_, index) => (
                <Pressable
                  key={index}
                  onPress={() => setActiveImage(index)}
                  style={[styles.imageDot, activeImage === index && styles.imageDotActive]}
                  accessibilityLabel={`View product image ${index + 1}`}
                />
              ))}
            </View>
          ) : null}
        </View>

        <View style={styles.body}>
          <View style={styles.metaRow}>
            {product.categoryName ? (
              <View style={styles.categoryBadge}>
                <Text style={styles.category}>{product.categoryName}</Text>
              </View>
            ) : null}
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={14} color="#F59E0B" />
              <Text style={styles.ratingText}>
                {product.reviewCount ? `${Number(product.averageRating || 0).toFixed(1)} (${product.reviewCount} reviews)` : "No reviews"}
              </Text>
            </View>
          </View>

          <Text style={styles.title}>{product.title}</Text>

          <View style={styles.priceRow}>
            <Text style={styles.price}>
              {formatCurrency ? formatCurrency(product.price) : formatPrice(product.price)}
            </Text>
            <View style={[styles.stock, product.stock === 0 && styles.stockOut]}>
              <Text style={[styles.stockText, product.stock === 0 && styles.stockTextOut]}>
                {product.stock > 0 ? `${product.stock} in stock` : "Sold out"}
              </Text>
            </View>
          </View>

          {product.sellerName ? (
            <View style={styles.seller}>
              <View style={styles.sellerAvatar}>
                <Ionicons name="storefront-outline" size={16} color={colors.primary} />
              </View>
              <View>
                <Text style={styles.sellerLabel}>Sold by</Text>
                <Text style={styles.sellerText}>{product.sellerName}</Text>
              </View>
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={14} color={colors.success} />
                <Text style={styles.verifiedText}>Verified</Text>
              </View>
            </View>
          ) : null}

          {/* Value Props & Guarantees */}
          <View style={styles.guarantees}>
            <View style={styles.guaranteeItem}>
              <Ionicons name="shield-checkmark-outline" size={20} color={colors.primary} />
              <Text style={styles.guaranteeText}>Buyer Protection</Text>
            </View>
            <View style={styles.guaranteeItem}>
              <Ionicons name="rocket-outline" size={20} color={colors.primary} />
              <Text style={styles.guaranteeText}>Fast Delivery</Text>
            </View>
            <View style={styles.guaranteeItem}>
              <Ionicons name="refresh-outline" size={20} color={colors.primary} />
              <Text style={styles.guaranteeText}>Easy Returns</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Product Description</Text>
          <Text style={styles.description}>
            {product.description ?? "No description provided for this item."}
          </Text>

          <Text style={styles.sectionTitle}>Verified buyer reviews</Text>
          {eligibleOrderItemId ? (
            <View style={styles.reviewForm}>
              <Text style={styles.reviewFormTitle}>Rate your completed purchase</Text>
              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((rating) => (
                  <Pressable key={rating} onPress={() => setReviewRating(rating)} accessibilityLabel={`${rating} stars`}>
                    <Ionicons name={rating <= reviewRating ? "star" : "star-outline"} size={24} color="#F59E0B" />
                  </Pressable>
                ))}
              </View>
              <TextInput
                value={reviewText}
                onChangeText={setReviewText}
                placeholder="Share what you thought about this product"
                placeholderTextColor={colors.textMuted}
                multiline
                maxLength={3000}
                style={styles.reviewInput}
              />
              <Button title="Submit verified review" onPress={submitReview} loading={reviewSaving} disabled={!reviewText.trim()} />
            </View>
          ) : null}
          {reviews.length ? reviews.map((review) => (
            <View key={review.id} style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <Text style={styles.reviewName}>{review.buyerName}</Text>
                <View style={styles.reviewStars}>
                  {Array.from({ length: review.rating }, (_, index) => (
                    <Ionicons key={index} name="star" size={13} color="#F59E0B" />
                  ))}
                </View>
              </View>
              <Text style={styles.reviewDate}>{new Date(review.createdAt).toLocaleDateString()}</Text>
              <Text style={styles.reviewBody}>{review.body}</Text>
              {review.sellerResponse ? (
                <View style={styles.sellerResponse}>
                  <Text style={styles.sellerResponseLabel}>Seller response</Text>
                  <Text style={styles.reviewBody}>{review.sellerResponse}</Text>
                </View>
              ) : user?.id === product.sellerId ? (
                <View style={styles.responseForm}>
                  <TextInput
                    value={sellerResponse}
                    onChangeText={setSellerResponse}
                    placeholder="Write a public reply"
                    placeholderTextColor={colors.textMuted}
                    style={styles.responseInput}
                  />
                  <Pressable disabled={!sellerResponse.trim()} onPress={() => void submitSellerResponse(review.id)}>
                    <Ionicons name="send" size={18} color={colors.primary} />
                  </Pressable>
                </View>
              ) : null}
            </View>
          )) : (
            <Text style={styles.noReviews}>No reviews yet. Verified buyers can review completed purchases.</Text>
          )}

          {/* Related items */}
          {related.length > 0 ? (
            <View style={styles.relatedSection}>
              <Text style={styles.sectionTitle}>You might also like</Text>
              <View style={styles.relatedGrid}>
                {related.map((item) => (
                  <ProductCard
                    key={item.id}
                    product={item}
                    width="48%"
                    isFavorite={favoriteIds.has(item.id)}
                    onToggleFavorite={() => toggleFavorite(item.id)}
                    onAddToCart={() => addToCart(item.id, 1)}
                    onPress={() => router.push(`/product/${item.id}`)}
                  />
                ))}
              </View>
            </View>
          ) : null}
        </View>
      </ScrollView>

      {/* Action Footer */}
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
          variant="outline"
          onPress={onAdd}
          loading={adding}
          disabled={product.stock === 0}
          style={{ flex: 1, marginRight: spacing.sm }}
        />
        <Button
          title="Buy now"
          onPress={onBuyNow}
          loading={buying}
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
  notFoundHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  backBtnInline: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    ...shadow.soft,
  },
  headerTitle: { ...typography.h3, color: colors.text },
  imageWrapper: { width: "100%", aspectRatio: 1, backgroundColor: colors.surfaceAlt },
  image: { width: "100%", height: "100%" },
  imageDots: { position: "absolute", bottom: spacing.md, alignSelf: "center", flexDirection: "row", gap: spacing.xs },
  imageDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.65)" },
  imageDotActive: { width: 20, backgroundColor: colors.primary },
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
    zIndex: 10,
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
    zIndex: 10,
  },
  body: { padding: spacing.lg },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.xs,
  },
  categoryBadge: {
    backgroundColor: colors.primarySoft,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  category: { ...typography.tiny, color: colors.primary, textTransform: "uppercase" },
  ratingBadge: { flexDirection: "row", alignItems: "center" },
  ratingText: { ...typography.small, color: colors.textMuted, marginLeft: 4, fontWeight: "600" },
  title: { ...typography.h2, color: colors.text, marginTop: spacing.xs },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.md,
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
  seller: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.lg,
    marginTop: spacing.lg,
    ...shadow.soft,
  },
  sellerAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  sellerLabel: { ...typography.tiny, color: colors.textMuted },
  sellerText: { ...typography.bodyStrong, color: colors.text },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: "auto",
    backgroundColor: "#E6F9F0",
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  verifiedText: { fontSize: 11, fontWeight: "600", color: colors.success, marginLeft: 3 },
  guarantees: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginTop: spacing.lg,
    ...shadow.soft,
  },
  guaranteeItem: { alignItems: "center", flex: 1 },
  guaranteeText: { ...typography.tiny, color: colors.textMuted, marginTop: 4, textAlign: "center" },
  sectionTitle: { ...typography.h3, color: colors.text, marginTop: spacing.xl, marginBottom: spacing.sm },
  description: { ...typography.body, color: colors.textMuted, lineHeight: 22 },
  reviewForm: { padding: spacing.md, backgroundColor: colors.surface, borderRadius: radius.md, marginBottom: spacing.md },
  reviewFormTitle: { ...typography.bodyStrong, color: colors.text },
  starsRow: { flexDirection: "row", gap: spacing.sm, marginVertical: spacing.sm },
  reviewInput: { minHeight: 88, textAlignVertical: "top", padding: spacing.md, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, color: colors.text, marginBottom: spacing.sm },
  reviewCard: { padding: spacing.md, backgroundColor: colors.surface, borderRadius: radius.md, marginBottom: spacing.sm },
  reviewHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  reviewName: { ...typography.bodyStrong, color: colors.text },
  reviewStars: { flexDirection: "row" },
  reviewDate: { ...typography.tiny, color: colors.textMuted, marginTop: 2 },
  reviewBody: { ...typography.small, color: colors.text, lineHeight: 19, marginTop: spacing.sm },
  sellerResponse: { marginTop: spacing.sm, paddingLeft: spacing.md, borderLeftWidth: 3, borderLeftColor: colors.primary },
  sellerResponseLabel: { ...typography.tiny, color: colors.primary, fontWeight: "700" },
  responseForm: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginTop: spacing.md },
  responseInput: { flex: 1, height: 42, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, paddingHorizontal: spacing.sm, color: colors.text },
  noReviews: { ...typography.small, color: colors.textMuted },
  relatedSection: { marginTop: spacing.lg },
  relatedGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: spacing.sm,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
    ...shadow.soft,
  },
  qtyWrapper: { marginRight: spacing.md },
});
