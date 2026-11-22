export type Role = 'USER' | 'ADMIN';

export type OrderStatus = 'PENDING' | 'PROCESSING' | 'DELIVERED' | 'CANCELLED';

export type PaymentMethod = 'COD' | 'BKASH' | 'NAGAD';

export type PaymentStatus = 'UNPAID' | 'VERIFYING' | 'PAID' | 'FAILED';

export type DeliveryArea = 'INSIDE_DHAKA' | 'OUTSIDE_DHAKA';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: Role;
  createdAt?: string;
}

export interface AuthResult {
  accessToken: string;
  user: User;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  createdAt?: string;
  updatedAt?: string;
  _count?: { products: number };
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  careInstructions: string | null;
  price: number;
  /** The price after the store-wide discount. */
  discountedPrice: number;
  /** The store-wide discount percentage in force. */
  discountPercentage: number;
  stock: number;
  imageUrl: string | null;
  images: string[];
  isFeatured: boolean;
  isArchived: boolean;
  categoryId: string;
  createdAt: string;
  updatedAt: string;
  category: {
    id: string;
    name: string;
    slug: string;
  };
}

export interface ProductListResponse {
  items: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  discountPercentage: number;
}

export interface StoreSettings {
  discountPercentage: number;
}

export interface CartItem {
  id: string;
  productId: string;
  quantity: number;
  /** The price before the store-wide discount. */
  unitPrice: number;
  /** The price actually charged, after the store-wide discount. */
  discountedUnitPrice: number;
  lineTotal: number;
  /** When the line stops holding its stock and is auto-released. */
  expiresAt: string;
  product: Product;
}

export interface Cart {
  id: string | null;
  items: CartItem[];
  totalItems: number;
  /** The total before the store-wide discount. */
  subtotal: number;
  /** The discount applied to the subtotal. */
  discountAmount: number;
  /** The store-wide discount percentage in force. */
  discountPercentage: number;
  /** The total the customer actually pays for the items. */
  total: number;
  /** How long a cart line holds its stock, in minutes. */
  holdMinutes: number;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  quantity: number;
  price: number;
}

export interface OrderUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
}

export interface Order {
  id: string;
  userId: string;
  totalAmount: number;
  deliveryArea: DeliveryArea;
  deliveryFee: number;
  /** The item total before the store-wide discount. */
  subtotalAmount: number;
  /** The store-wide discount percentage that applied when the order was placed. */
  discountPercentage: number;
  /** The discount that was applied. */
  discountAmount: number;
  shippingAddr: string;
  note: string | null;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  senderNumber: string | null;
  trxId: string | null;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  user?: OrderUser;
}

/** Orders returned by the admin endpoints always include the customer. */
export interface AdminOrder extends Order {
  user: OrderUser;
}

export interface OrderListResponse {
  items: AdminOrder[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface TrackStep {
  label: string;
  status: OrderStatus;
  completed: boolean;
  current: boolean;
}

export interface TrackResponse {
  orderId: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  createdAt: string;
  updatedAt: string;
  cancelled: boolean;
  steps: TrackStep[];
}

export interface MerchantDetails {
  bkashNumber: string;
  nagadNumber: string;
  accountType: string;
  instructions: string;
}

export interface AdminStats {
  totalOrders: number;
  pendingOrders: number;
  processingOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  pendingVerification: number;
  productCount: number;
  lowStockCount: number;
  categoryCount: number;
  revenue: number;
  recentOrders: AdminOrder[];
}
