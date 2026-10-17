// ------------------------------------------------------------------
//  Shared domain types (mirror the API JSON shapes)
// ------------------------------------------------------------------

export interface User {
  id: number;
  name: string;
  email: string;
  role: "user" | "seller" | "admin";
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
  stock: number;
  isActive?: boolean;
  createdAt?: string;
  categoryName?: string | null;
  categorySlug?: string | null;
  sellerName?: string | null;
  isFavorite?: boolean;
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
  status: OrderStatus;
  total: number;
  shippingAddress?: string | null;
  createdAt: string;
  updatedAt?: string;
  items: OrderItem[];
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
