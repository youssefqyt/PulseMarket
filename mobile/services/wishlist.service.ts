import { apiRequest } from "./api";

export interface PriceAlert {
  productId: number;
  title: string;
  currentPrice: number;
  targetPrice: number;
}

export interface SharedWishlist {
  ownerName: string;
  total: number;
  items: { id: number; title: string; price: number; imageUrl?: string | null }[];
}

type PriceAlertRow = {
  product_id: number;
  title: string;
  price: number | string;
  target_price: number | string;
};

function mapAlert(row: PriceAlertRow): PriceAlert {
  return {
    productId: row.product_id,
    title: row.title,
    currentPrice: Number(row.price),
    targetPrice: Number(row.target_price),
  };
}

export async function fetchPriceAlerts(): Promise<PriceAlert[]> {
  const rows = await apiRequest<PriceAlertRow[]>("/api/wishlist/price-alerts", { auth: true });
  return rows.map(mapAlert);
}

export async function setPriceAlert(
  productId: number,
  title: string,
  currentPrice: number,
  targetPrice: number
): Promise<PriceAlert> {
  await apiRequest<{
    id: number;
    user_id: number;
    product_id: number;
    target_price: number | string;
    is_active: boolean;
    created_at: string;
  }>(`/api/wishlist/price-alerts/${productId}`, {
    method: "POST",
    auth: true,
    body: JSON.stringify({ targetPrice }),
  });
  return { productId, title, currentPrice, targetPrice };
}

export async function removePriceAlert(productId: number): Promise<void> {
  await apiRequest(`/api/wishlist/price-alerts/${productId}`, { method: "DELETE", auth: true });
}

export async function createWishlistShare(): Promise<{ token: string; expiresAt: string }> {
  return apiRequest("/api/wishlist/share", { method: "POST", auth: true });
}

export async function fetchSharedWishlist(token: string): Promise<SharedWishlist> {
  return apiRequest(`/api/wishlist/shared/${encodeURIComponent(token)}`);
}
