import { useCallback, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import Screen from "../components/Screen";
import Button from "../components/Button";
import Input from "../components/Input";
import EmptyState from "../components/EmptyState";
import Loading from "../components/Loading";
import { colors, radius, shadow, spacing, typography } from "../constants/theme";
import {
  createProduct,
  deleteProductImage,
  deleteProduct,
  fetchCategories,
  fetchMyProducts,
  fetchProduct,
  uploadProductImages,
  updateProduct,
} from "../services/product.service";
import { useAuthStore } from "../store/authStore";
import { useSettingsStore } from "../store/settingsStore";
import type { Category, Product } from "../types";

export default function MyProducts() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const formatCurrency = useSettingsStore((s) => s.formatCurrency);

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("10");
  const [lowStockThreshold, setLowStockThreshold] = useState("5");
  const [description, setDescription] = useState("");
  const [selectedImages, setSelectedImages] = useState<
    { uri: string; fileName: string; mimeType: string }[]
  >([]);
  const [selectedCatId, setSelectedCatId] = useState<number | undefined>(undefined);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const [cats, prods] = await Promise.all([fetchCategories(), fetchMyProducts()]);
      setCategories(cats);
      setProducts(prods);
      if (cats.length > 0 && !selectedCatId) {
        setSelectedCatId(cats[0].id);
      }
    } catch (error) {
      setLoadError((error as Error).message);
    } finally {
      setLoading(false);
    }
  }, [selectedCatId]);

  useFocusEffect(
    useCallback(() => {
      if (user?.role === "admin" || (user?.role === "seller" && user.sellerStatus === "approved")) {
        load();
      }
    }, [load, user?.role, user?.sellerStatus])
  );

  if (user?.role === "seller" && user.sellerStatus !== "approved") {
    return (
      <Screen>
        <EmptyState
          icon="time-outline"
          title={user.sellerStatus === "rejected" ? "Seller application not approved" : "Seller approval pending"}
          subtitle="An administrator must approve your seller account before you can manage product listings."
          action={<Button title="Go back" onPress={() => router.back()} />}
        />
      </Screen>
    );
  }

  async function handleCreateProduct() {
    if (title.trim().length < 3) {
      Alert.alert("Title required", "Please enter a product title (min 3 chars).");
      return;
    }
    const numPrice = parseFloat(price);
    if (isNaN(numPrice) || numPrice <= 0) {
      Alert.alert("Price required", "Please enter a valid positive price.");
      return;
    }
    const numStock = parseInt(stock, 10);
    if (isNaN(numStock) || numStock < 0) {
      Alert.alert("Stock required", "Please enter a valid stock quantity.");
      return;
    }
    const threshold = Number.parseInt(lowStockThreshold, 10);
    if (!Number.isInteger(threshold) || threshold < 0) {
      Alert.alert("Invalid threshold", "Enter a whole number greater than or equal to zero.");
      return;
    }

    setSubmitting(true);
    try {
      const productInput = {
        title: title.trim(),
        categoryId: selectedCatId,
        price: numPrice,
        stock: numStock,
        lowStockThreshold: threshold,
        description: description.trim() || undefined,
      };
      const saved = editingProduct
        ? await updateProduct(editingProduct.id, productInput)
        : await createProduct(productInput);
      setEditingProduct(saved);
      if (selectedImages.length > 0) {
        try {
          await uploadProductImages(saved.id, selectedImages);
        } catch (uploadError) {
          await load();
          Alert.alert(
            "Listing saved; image upload failed",
            (uploadError as Error).message
          );
          return;
        }
      }

      Alert.alert(
        editingProduct ? "Listing updated" : "Product listed",
        editingProduct ? `"${saved.title}" has been updated.` : `"${saved.title}" is now live in the marketplace.`
      );
      setModalVisible(false);
      setEditingProduct(null);
      setTitle("");
      setPrice("");
      setStock("10");
      setLowStockThreshold("5");
      setDescription("");
      setSelectedImages([]);
      await load();
    } catch (err) {
      Alert.alert("Could not create product", (err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  function openCreateModal() {
    setEditingProduct(null);
    setTitle("");
    setPrice("");
    setStock("10");
    setLowStockThreshold("5");
    setDescription("");
    setSelectedImages([]);
    setModalVisible(true);
  }

  function openEditModal(product: Product) {
    setEditingProduct(product);
    setTitle(product.title);
    setPrice(String(product.price));
    setStock(String(product.stock));
    setLowStockThreshold(String(product.lowStockThreshold ?? 5));
    setDescription(product.description ?? "");
    setSelectedImages([]);
    setSelectedCatId(product.categoryId ?? undefined);
    setModalVisible(true);
  }

  async function pickProductImages() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Photo access required", "Allow photo library access to attach product images.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      selectionLimit: 6,
      quality: 0.85,
    });
    if (result.canceled) return;
    const supportedTypes = ["image/jpeg", "image/png", "image/webp", "image/avif"];
    const validAssets = result.assets.filter((asset) =>
      (!asset.fileSize || asset.fileSize <= 5 * 1024 * 1024) &&
      supportedTypes.includes(asset.mimeType || "image/jpeg")
    );
    if (validAssets.length !== result.assets.length) {
      Alert.alert("Some images were skipped", "Use JPEG, PNG, WebP or AVIF images no larger than 5 MB.");
    }
    const existingCount = editingProduct?.images?.length ?? 0;
    if (validAssets.length + existingCount > 6) {
      Alert.alert("Image limit reached", `A listing can have up to 6 images. This listing already has ${existingCount}.`);
      return;
    }
    setSelectedImages(validAssets.map((asset, index) => ({
      uri: asset.uri,
      fileName: asset.fileName || `product-image-${Date.now()}-${index}.jpg`,
      mimeType: asset.mimeType || "image/jpeg",
    })));
  }

  async function removeExistingImage(imageId: number) {
    if (!editingProduct) return;
    try {
      await deleteProductImage(editingProduct.id, imageId);
      const refreshed = await fetchProduct(editingProduct.id);
      setEditingProduct(refreshed);
      setProducts((current) => current.map((product) => product.id === refreshed.id ? refreshed : product));
    } catch (error) {
      Alert.alert("Could not remove image", (error as Error).message);
    }
  }

  async function toggleVisibility(product: Product) {
    try {
      const updated = await updateProduct(product.id, { isActive: !product.isActive });
      setProducts((current) => current.map((item) => item.id === updated.id ? updated : item));
    } catch (error) {
      Alert.alert("Could not update listing", (error as Error).message);
    }
  }

  async function handleDelete(prodId: number) {
    Alert.alert("Delete Product", "Are you sure you want to remove this product?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteProduct(prodId);
            setProducts((prev) => prev.filter((p) => p.id !== prodId));
            Alert.alert("Product Deleted", "The item has been removed from your listings.");
          } catch (err) {
            Alert.alert("Failed to delete", (err as Error).message);
          }
        },
      },
    ]);
  }

  return (
    <Screen padded={false}>
      {user?.role !== "seller" && user?.role !== "admin" ? (
        <EmptyState
          icon="lock-closed-outline"
          title="Seller access required"
          subtitle="Switch to a seller account to create and manage marketplace listings."
          action={<Button title="Go back" onPress={() => router.back()} />}
        />
      ) : (
      <>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Pressable style={styles.iconBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </Pressable>
          <Text style={styles.title}>My Products</Text>
          <Pressable style={styles.addTopBtn} onPress={openCreateModal}>
            <Ionicons name="add" size={22} color={colors.white} />
          </Pressable>
        </View>
      </View>

      {loading && products.length === 0 ? (
        <Loading />
      ) : loadError && products.length === 0 ? (
        <EmptyState
          icon="cloud-offline-outline"
          title="Listings unavailable"
          subtitle={loadError}
          action={<Button title="Try again" onPress={load} />}
        />
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          refreshing={loading}
          onRefresh={load}
          renderItem={({ item }) => (
            <View style={styles.productCard}>
              {item.imageUrl ? (
                <Image source={{ uri: item.imageUrl }} style={styles.prodImg} />
              ) : (
                <View style={[styles.prodImg, styles.prodPlaceholder]}>
                  <Ionicons name="image-outline" size={24} color={colors.textMuted} />
                </View>
              )}

              <View style={styles.prodInfo}>
                <Text style={styles.prodTitle} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={styles.prodPrice}>{formatCurrency(item.price)}</Text>
                <Text style={styles.prodStock}>{item.stock} in stock</Text>
                <Text style={styles.prodStock}>Low-stock alert at {item.lowStockThreshold ?? 5}</Text>
                <Text style={[styles.prodStatus, item.isActive ? styles.prodLive : styles.prodHidden]}>
                  {item.isActive ? "Live on marketplace" : "Hidden from marketplace"}
                </Text>

                <View style={styles.actionRow}>
                  <Pressable
                    style={styles.viewBtn}
                    onPress={() => router.push(`/product/${item.id}`)}
                  >
                    <Ionicons name="eye-outline" size={16} color={colors.primary} />
                    <Text style={styles.viewBtnText}>View</Text>
                  </Pressable>

                  <Pressable
                    style={styles.viewBtn}
                    onPress={() => openEditModal(item)}
                  >
                    <Ionicons name="create-outline" size={16} color={colors.primary} />
                    <Text style={styles.viewBtnText}>Edit</Text>
                  </Pressable>

                  <Pressable
                    style={styles.viewBtn}
                    onPress={() => void toggleVisibility(item)}
                  >
                    <Ionicons name={item.isActive ? "eye-off-outline" : "eye-outline"} size={16} color={colors.primary} />
                    <Text style={styles.viewBtnText}>{item.isActive ? "Pause" : "Publish"}</Text>
                  </Pressable>

                  <Pressable
                    style={styles.deleteBtn}
                    onPress={() => handleDelete(item.id)}
                    hitSlop={8}
                  >
                    <Ionicons name="trash-outline" size={16} color={colors.danger} />
                    <Text style={styles.deleteBtnText}>Remove</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <EmptyState
              icon="storefront-outline"
              title="No products listed yet"
              subtitle="Start selling on PulseMarket by creating your first product listing."
              action={<Button title="+ Add New Product" onPress={openCreateModal} />}
            />
          }
        />
      )}

      {/* Add Product Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingProduct ? "Edit Listing" : "Add New Product"}</Text>
              <Pressable onPress={() => { setModalVisible(false); setEditingProduct(null); }} hitSlop={8}>
                <Ionicons name="close-circle" size={24} color={colors.textMuted} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Input
                label="Product Title"
                value={title}
                onChangeText={setTitle}
                placeholder="e.g. Wireless Noise-Cancelling Headphones"
              />

              <View style={styles.inputRow}>
                <View style={{ flex: 1, marginRight: spacing.sm }}>
                  <Input
                    label="Price"
                    value={price}
                    onChangeText={setPrice}
                    placeholder="29.99"
                    keyboardType="numeric"
                  />
                </View>
                <Input
                  label="Low-stock alert threshold"
                  value={lowStockThreshold}
                  onChangeText={setLowStockThreshold}
                  placeholder="5"
                  keyboardType="numeric"
                />
                <View style={{ flex: 1 }}>
                  <Input
                    label="Stock Quantity"
                    value={stock}
                    onChangeText={setStock}
                    placeholder="10"
                    keyboardType="numeric"
                  />
                </View>
              </View>

              {/* Category picker chips */}
              <Text style={styles.catLabel}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.md }}>
                {categories.map((cat) => {
                  const active = selectedCatId === cat.id;
                  return (
                    <Pressable
                      key={cat.id}
                      onPress={() => setSelectedCatId(cat.id)}
                      style={[styles.catChip, active && styles.catChipActive]}
                    >
                      <Text style={[styles.catChipText, active && styles.catChipTextActive]}>
                        {cat.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>

              <View style={styles.imagePickerHeader}>
                <View>
                  <Text style={styles.catLabel}>Product images</Text>
                  <Text style={styles.imageHint}>Select up to 6 JPEG, PNG, WebP or AVIF images (5 MB each).</Text>
                </View>
                <Pressable onPress={pickProductImages} style={styles.chooseImages}>
                  <Ionicons name="images-outline" size={17} color={colors.white} />
                  <Text style={styles.chooseImagesText}>Choose</Text>
                </Pressable>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.previewRow}>
                {editingProduct?.images?.map((image) => (
                  <View key={`existing-${image.id}`} style={styles.previewItem}>
                    <Image source={{ uri: image.url }} style={styles.previewImage} />
                    <Pressable
                      onPress={() => void removeExistingImage(image.id)}
                      style={styles.removeImageButton}
                      accessibilityLabel="Delete product image"
                    >
                      <Ionicons name="close-circle" size={22} color={colors.danger} />
                    </Pressable>
                  </View>
                ))}
                {!editingProduct?.images?.length ? (editingProduct?.imageUrls || []).map((uri, index) => (
                  <View key={`legacy-${uri}-${index}`} style={styles.previewItem}>
                    <Image source={{ uri }} style={styles.previewImage} />
                  </View>
                )) : null}
                {selectedImages.map((item, index) => (
                  <View key={`new-${item.uri}-${index}`} style={styles.previewItem}>
                    <Image source={{ uri: item.uri }} style={styles.previewImage} />
                    <Pressable
                      onPress={() => setSelectedImages((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                      style={styles.removeImageButton}
                      accessibilityLabel="Remove selected image"
                    >
                      <Ionicons name="close-circle" size={22} color={colors.danger} />
                    </Pressable>
                  </View>
                ))}
              </ScrollView>

              <Input
                label="Description"
                value={description}
                onChangeText={setDescription}
                placeholder="Product details, condition, features..."
                multiline
                style={{ height: 80, textAlignVertical: "top", paddingTop: spacing.sm }}
              />

              <Button
                title={editingProduct ? "Save Listing" : "Publish Product"}
                onPress={handleCreateProduct}
                loading={submitting}
                style={{ marginTop: spacing.md, marginBottom: spacing.lg }}
              />
            </ScrollView>
          </View>
        </View>
      </Modal>
      </>
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
  addTopBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    ...shadow.soft,
  },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl, flexGrow: 1 },
  productCard: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadow.soft,
  },
  prodImg: {
    width: 80,
    height: 80,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
  },
  prodPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  prodInfo: { flex: 1, marginLeft: spacing.md },
  prodTitle: { ...typography.bodyStrong, color: colors.text },
  prodPrice: { ...typography.h3, color: colors.primary, marginTop: 2 },
  prodStock: { ...typography.tiny, color: colors.textMuted, marginTop: 2 },
  prodStatus: { ...typography.tiny, marginTop: 2, fontWeight: "700" },
  prodLive: { color: colors.success },
  prodHidden: { color: colors.warning },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.sm,
    gap: spacing.md,
  },
  viewBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primarySoft,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  viewBtnText: { ...typography.tiny, color: colors.primary, marginLeft: 4 },
  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  deleteBtnText: { ...typography.tiny, color: colors.danger, marginLeft: 4 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
    maxHeight: "85%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  modalTitle: { ...typography.h2, color: colors.text },
  inputRow: { flexDirection: "row" },
  catLabel: { ...typography.small, color: colors.textMuted, marginBottom: spacing.xs },
  catChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
    marginRight: spacing.sm,
  },
  catChipActive: { backgroundColor: colors.primary },
  catChipText: { ...typography.small, color: colors.text },
  catChipTextActive: { color: colors.white, fontWeight: "700" },
  samplesRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  samplesLabel: { ...typography.tiny, color: colors.textMuted },
  imagePickerHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: spacing.sm },
  imageHint: { ...typography.tiny, color: colors.textMuted, maxWidth: 210 },
  chooseImages: { flexDirection: "row", alignItems: "center", gap: spacing.xs, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, backgroundColor: colors.primary, borderRadius: radius.md },
  chooseImagesText: { ...typography.tiny, color: colors.white, fontWeight: "700" },
  previewRow: { marginTop: spacing.sm, marginBottom: spacing.md },
  previewImage: { width: 76, height: 76, borderRadius: radius.md, marginRight: spacing.sm, backgroundColor: colors.surfaceAlt },
  previewItem: { position: "relative" },
  removeImageButton: { position: "absolute", right: 4, top: -4, backgroundColor: colors.white, borderRadius: radius.pill },
  sampleThumbWrapper: {
    borderRadius: radius.sm,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
  },
  sampleThumb: { width: 36, height: 36 },
});
