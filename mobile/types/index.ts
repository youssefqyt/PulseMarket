// ------------------------------------------------------------------
//  Shared domain types (mirror the API JSON shapes)
// ------------------------------------------------------------------

export interface User {
  id: number;
  name: string;
  email: string;
  role: "user" | "seller" | "admin";
  sellerStatus?: "pending" | "approved" | "rejected";
  avatarUrl?: string | null;
  createdAt?: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  icon?: string | null;
  productCount?: number;
}

export interface Product {
  id: number;
  sellerId: number;
  categoryId?: number | null;
  title: string;
  description?: string | null;
  price: number;
  imageUrl?: string | null;
  imageUrls?: string[];
  images?: { id: number; url: string; sortOrder: number }[];
  stock: number;
  lowStockThreshold?: number;
  isActive?: boolean;
  createdAt?: string;
  categoryName?: string | null;
  categorySlug?: string | null;
  sellerName?: string | null;
  isFavorite?: boolean;
  reviewCount?: number;
  averageRating?: number | null;
}

export interface CartItem {
  id: number;
  productId: number;
  quantity: number;
  title: string;
  price: number;
  imageUrl?: string | null;
  stock: number;
  subtotal: number;
}

export interface Cart {
  items: CartItem[];
  total: number;
  itemCount: number;
}

export type OrderStatus = "pending" | "paid" | "shipped" | "completed" | "cancelled";
export type PaymentMethod = "card" | "cash";

export interface OrderItem {
  id: number;
  productId: number | null;
  sellerId: number | null;
  title: string;
  price: number;
  quantity: number;
}

export interface Order {
  id: number;
  buyerId: number;
  buyerName?: string;
  buyerEmail?: string;
  status: OrderStatus;
  paymentMethod?: PaymentMethod;
  paymentStatus?: "unpaid" | "pending" | "paid" | "failed" | "refunded";
  total: number;
  shippingAddress?: string | null;
  phone?: string | null;
  deliveryNotes?: string | null;
  createdAt: string;
  updatedAt?: string;
  items: OrderItem[];
  statusHistory?: { status: OrderStatus; note?: string; createdAt: string }[];
  fulfillments?: {
    sellerId: number;
    sellerName: string;
    status: "pending" | "shipped" | "completed";
    trackingNumber?: string | null;
    carrier?: string | null;
    estimatedDeliveryAt?: string | null;
    updatedAt: string;
  }[];
  sellerFulfillment?: {
    status: "pending" | "shipped" | "completed";
    tracking_number?: string | null;
    carrier?: string | null;
    estimated_delivery_at?: string | null;
  };
}

export interface ProductReview {
  id: number;
  productId: number;
  buyerId: number;
  buyerName: string;
  orderItemId: number;
  rating: number;
  body: string;
  sellerResponse?: string | null;
  respondedAt?: string | null;
  createdAt: string;
}

export interface Notification {
  id: number;
  userId: number;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface Paginated<T> {
  items: T[];
  pagination: Pagination;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  error?: { message: string; details?: { field: string; message: string }[] };
}
