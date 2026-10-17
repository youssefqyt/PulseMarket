import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, formatPrice, radius, shadow, spacing, typography } from "../constants/theme";
import type { Product } from "../types";

interface Props {
  product: Product;
  onPress: () => void;
  onToggleFavorite?: () => void;
  isFavorite?: boolean;
  width?: number | string;
}

export default function ProductCard({
  product,
  onPress,
  onToggleFavorite,
  isFavorite,
  width,
}: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, { width: width as number }, pressed && styles.pressed]}
    >
      <View style={styles.imageWrapper}>
        {product.imageUrl ? (
          <Image source={{ uri: product.imageUrl }} style={styles.image} />
        ) : (
          <View style={[styles.image, styles.placeholder]}>
            <Ionicons name="image-outline" size={28} color={colors.textMuted} />
          </View>
        )}

        {onToggleFavorite ? (
          <Pressable onPress={onToggleFavorite} style={styles.favBtn} hitSlop={8}>
            <Ionicons
              name={isFavorite ? "heart" : "heart-outline"}
              size={18}
              color={isFavorite ? colors.danger : colors.text}
            />
          </Pressable>
        ) : null}

        {product.stock === 0 ? (
          <View style={styles.soldOut}>
            <Text style={styles.soldOutText}>Sold out</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.body}>
        {product.categoryName ? (
          <Text style={styles.category} numberOfLines={1}>
            {product.categoryName}
          </Text>
        ) : null}
        <Text style={styles.title} numberOfLines={2}>
          {product.title}
        </Text>
        <Text style={styles.price}>{formatPrice(product.price)}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    overflow: "hidden",
    ...shadow.card,
  },
  pressed: { opacity: 0.9 },
  imageWrapper: { width: "100%", aspectRatio: 1 },
  image: { width: "100%", height: "100%", backgroundColor: colors.surfaceAlt },
  placeholder: { alignItems: "center", justifyContent: "center" },
  favBtn: {
    position: "absolute",
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: radius.pill,
    padding: spacing.xs + 2,
    ...shadow.soft,
  },
  soldOut: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(26,26,46,0.7)",
    paddingVertical: spacing.xs,
    alignItems: "center",
  },
  soldOutText: { color: colors.white, fontSize: 12, fontWeight: "700" },
  body: { padding: spacing.md },
  category: { ...typography.tiny, color: colors.primary, textTransform: "uppercase" },
  title: { ...typography.bodyStrong, color: colors.text, marginTop: 2, minHeight: 40 },
  price: { ...typography.h3, color: colors.text, marginTop: spacing.sm },
});
