// All TypeScript types for AuroraMart frontend
export type { Id } from '../../../convex/_generated/dataModel';

export type UserRole = 'customer' | 'vendor' | 'admin' | 'super_admin';
export type UserStatus = 'active' | 'inactive' | 'suspended' | 'pending_verification';

export interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
  role: UserRole;
  status: UserStatus;
  emailVerified: boolean;
  totalOrders: number;
  totalSpent: number;
  preferences?: { currency?: string; emailNotifs?: boolean };
  _creationTime: number;
}

export interface Category {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  isActive: boolean;
  sortOrder: number;
  level: number;
  productCount: number;
  parentId?: string;
  children?: Category[];
  _creationTime: number;
}

export type ProductStatus = 'draft' | 'active' | 'out_of_stock' | 'discontinued';
export type ProductType = 'physical' | 'digital' | 'service';

export interface ProductVariant {
  id: string;
  name: string;
  options: Record<string, string>;
  price: number;
  stock: number;
  sku?: string;
}

export interface Product {
  _id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;
  price: number;
  compareAtPrice?: number;
  status: ProductStatus;
  type: ProductType;
  stockQuantity: number;
  lowStockThreshold: number;
  trackInventory: boolean;
  sku?: string;
  images: string[];
  thumbnail?: string;
  hasVariants: boolean;
  variants?: ProductVariant[];
  attributes?: Record<string, string>;
  tags: string[];
  viewCount: number;
  salesCount: number;
  averageRating: number;
  reviewCount: number;
  isFeatured: boolean;
  isBestSeller: boolean;
  isNewArrival: boolean;
  freeShipping: boolean;
  brand: string;
  categoryId: string;
  category?: Category;
  _creationTime: number;
}

export interface CartItem {
  _id: string;
  cartId: string;
  productId: string;
  product?: Product;
  variantId?: string;
  quantity: number;
  priceAtAdd: number;
  _creationTime: number;
}

export interface Cart {
  _id: string;
  userId?: string;
  sessionId?: string;
  items: CartItem[];
  couponCode?: string;
  couponDiscount: number;
  _creationTime: number;
}

export type OrderStatus =
  | 'pending' | 'confirmed' | 'processing' | 'packed'
  | 'shipped' | 'out_for_delivery' | 'delivered'
  | 'cancelled' | 'refund_requested' | 'refunded';

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export interface OrderItem {
  _id: string;
  orderId: string;
  productId: string;
  productName: string;
  productImage?: string;
  variantId?: string;
  variantName?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  isReviewed: boolean;
}

export interface ShippingAddress {
  fullName: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  country: string;
  landmark?: string;
}

export interface Order {
  _id: string;
  orderNumber: string;
  userId: string;
  items?: OrderItem[];
  subtotal: number;
  shippingFee: number;
  discount: number;
  tax: number;
  total: number;
  currency: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod?: string;
  shippingAddress: ShippingAddress;
  trackingNumber?: string;
  deliveredAt?: number;
  statusHistory: Array<{ status: string; timestamp: number; note?: string }>;
  isBotGenerated: boolean;
  _creationTime: number;
}

export interface Review {
  _id: string;
  userId: string;
  user?: Pick<User, '_id' | 'firstName' | 'lastName' | 'avatar'>;
  productId: string;
  rating: number;
  title?: string;
  body?: string;
  images: string[];
  status: 'pending' | 'approved' | 'rejected';
  helpfulCount: number;
  isVerifiedPurchase: boolean;
  _creationTime: number;
}

export interface PaginatedResult<T> {
  items: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext?: boolean;
    hasPrev?: boolean;
  };
}
