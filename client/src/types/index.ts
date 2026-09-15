export interface ProductColor {
  name: string;
  hex: string;
}

export interface ProductImage {
  url: string;
  publicId: string;
  isPrimary: boolean;
}

export interface ProductCategory {
  _id: string;
  name: string;
  slug: string;
}

export interface Product {
  _id: string;

  name: string;

  slug: string;

  sku: string;

  description?: string;

  category: string;

  subcategory?: string;

  brand: string;

  price: number;

  discountPrice?: number;

  stock: number;

  sizes: string[];

  colors: string[];

  images: {
    url: string;
    publicId: string;
    isPrimary: boolean;
  }[];

  tags: string[];

  ratingsAverage: number;

  ratingsQuantity: number;

  isNewArrival: boolean;

  isFeatured: boolean;

  isActive: boolean;

  createdAt?: string;

  updatedAt?: string;
}

export interface CartItem {
  product: Product;

  size: string;

  color?: string;

  quantity: number;
}

export interface User {
  _id: string;

  name: string;

  email: string;

  role: 'customer' | 'admin' | 'superadmin';

  phone?: string;

  addresses: Address[];
}

export interface Address {
  _id?: string;

  fullName: string;

  phone: string;

  street: string;

  landmark?: string;

  city: string;

  state: string;

  postalCode: string;

  isDefault: boolean;
}

export interface OrderItem {
  product: string;

  name: string;

  sku: string;

  image: string;

  size: string;

  color?: string;

  quantity: number;

  price: number;

  subtotal: number;
}

export type PaymentMethod =
  | 'CreditCard'
  | 'UPI'
  | 'NetBanking'
  | 'COD';

export type PaymentStatus =
  | 'Pending'
  | 'Paid'
  | 'Failed'
  | 'Refunded';

export type OrderStatus =
  | 'Pending'
  | 'Confirmed'
  | 'Processing'
  | 'Shipped'
  | 'Out for Delivery'
  | 'Delivered'
  | 'Cancelled'
  | 'Returned';

export interface AppliedCoupon {
  code: string;

  discountValue: number;
}

export interface Order {
  _id: string;

  orderNumber: string;

  items: OrderItem[];

  shippingAddress: Address;

  couponApplied?: AppliedCoupon;

  subtotal: number;

  discountAmount: number;

  shippingCharge: number;

  totalAmount: number;

  paymentMethod: PaymentMethod;

  paymentStatus: PaymentStatus;

  orderStatus: OrderStatus;

  createdAt: string;

  updatedAt?: string;
}

export interface Category {
  _id: string;

  name: string;

  slug: string;

  image: string;

  isActive: boolean;
}