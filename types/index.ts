import { LucideIcon } from "lucide-react";

export interface HomeFeature {
  icon: LucideIcon;
  title: string;
  description: string;
}

export interface BakeryReason {
  icon: LucideIcon;
  key: string;
}

export interface BakeryStandard {
  image: string;
  key: string;
}

export interface BakeryProduct {
  id: string;
  image: string;
  name: string;
  description: string;
  price: number;
  slug: string;

  daily: {
    planned_quantity: number;
    remaining_quantity: number;
    status: StoreInventoryItemStatusEnum;
    available: boolean;
  };

  preorder: {
    available: boolean;
    schedules: {
      schedule_id: string;
      date: string;
      planned_quantity: number;
      remaining_quantity: number;
    }[];
  };
}

export type MenuCategoryId = "bread" | "cake" | "pastry";

export interface MenuProduct extends BakeryProduct {
  category: MenuCategoryId;
  ingredients: string[];
}

export interface MenuCategory {
  id: MenuCategoryId | "all";
  label: string;
}

export interface CategoryItem {
  id: string;
  name: {
    en: string;
    vi: string;
  };
  description: {
    en: string;
    vi: string;
  };
  is_active: boolean;
  slug: {
    en: string;
    vi: string;
  };
  created_at: string;
  updated_at: string | null;
}

export interface RawProduct {
  id: string;
  price: number;
  image_url: string[];
  is_active: boolean;
  created_at: string;
  is_bestseller: boolean;
  updated_at: string | null;
  categories: { id: string; name: string } | null;
  product_translations: ProductTranslation[];
  product_ingredients: ProductIngredientRow[];
}

export interface ProductIngredientRow {
  ingredients: IngredientItem;
}

export interface IngredientItem {
  id: string;
  name: {
    en: string;
    vi: string;
  };
  is_active: boolean;
  slug: {
    en: string;
    vi: string;
  };
  created_at: string;
  updated_at: string | null;
}

export interface ProductTranslation {
  name: string;
  slug: string;
  description: string;
  locale: string;
}

export interface ProductStoreInventory {
  remaining_quantity: number;
  planned_quantity: number;
  status: string;

  stores: {
    id: string;
    name: string;
    city: string;
    district: string;

    address: {
      en: string;
      vi: string;
    };

    phone: string;
  };
}

export interface ProductItem {
  id: string;
  name: string;
  description: string;
  price: number;
  slug: string;
  image_url: string[];
  category_id: string;
  category_name: string;
  category: CategoryItem;
  categories: CategoryItem;
  product_translations: ProductTranslation[];
  product_ingredients: ProductIngredientRow[];
  ingredients: IngredientItem[];
  is_active: boolean;
  is_bestseller: boolean;
  created_at: string;
  updated_at: string | null;
  status?: StoreInventoryItemStatusEnum;
}

export interface FetchedProductMenu {
  id: string;
  name: string;
  description: string;
  price: number;
  slug: string;
  image_url: string[];
  is_active: boolean;

  category: {
    id: string;
    name: {
      en: string;
      vi: string;
    };
  } | null;

  daily: {
    planned_quantity: number;
    remaining_quantity: number;
    status: StoreInventoryItemStatusEnum;
    available: boolean;
  };

  preorder: {
    available: boolean;
    schedules: {
      schedule_id: string;
      date: string;
      planned_quantity: number;
      remaining_quantity: number;
    }[];
  };
}

export interface ProductDetailPage {
  id: string;
  price: number;
  image_url: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
  category: {
    id: string;
    name: {
      vi: string;
      en: string;
    };
  } | null;
  name: string | null;
  description: string | null;
  slug: string | null;
  ingredients: {
    id: string;
    name: {
      vi: string;
      en: string;
    };
  }[];

  daily: {
    planned_quantity: number;
    remaining_quantity: number;
    available: boolean;
  };
  preorder: {
    available: boolean;
    schedules: {
      schedule_id: string;
      date: string;
      planned_quantity: number;
      remaining_quantity: number;
    }[];
  };
}

export interface ProductSearchVectorItem {
  product_id: string;
  content: string;
  similarity: number;
}

export type StoreTypeEnum = "online" | "offline";

export interface StoreItem {
  id: string;
  name: string;
  address: {
    en: string;
    vi: string;
  };
  city: string;
  district: string;
  slug: string;
  image_url: string;
  phone: string;
  is_active: boolean;
  type: StoreTypeEnum;
  created_at: string;
  updated_at: string | null;
  deleted_at: string | null;
}

export type UserStatusEnum = "active" | "inactive" | "banned";
export type UserRoleEnum = "admin" | "staff" | "customer";
export type UserGenderEnum = "male" | "female" | "other";

export interface UserItem {
  id: string;
  full_name: string;
  role: UserRoleEnum;
  status: UserStatusEnum;
}

export interface StaffItem {
  id: string;
  user_id: string;
  users: UserItem;
  store_id: string;
  stores: StoreItem | null;
  email: string;
  dob: string | null;
  gender: UserGenderEnum;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
  deleted_at: string | null;
}

export type StoreInventoryItemStatusEnum =
  | "available"
  | "out_of_stock"
  | "low_stock"
  | "draft"
  | "closed";

export interface CartItemProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  image_url: string;
  available: boolean;
  preorder: boolean;
}

export interface CartItem {
  id: string;
  quantity: number;
  product: CartItemProduct;
}

export interface CartData {
  id: string | null;
  items: CartItem[];
}

export interface StoreInventoryRaw {
  id: string;
  store_id: string;
  product_id: string;
  updated_by: string;
  quantity: number;
  planned_quantity: number;
  remaining_quantity: number;
  status: StoreInventoryItemStatusEnum;
  updated_at: string | null;
  created_at: string;
  products: ProductItem;
  staffs: StaffItem;
  business_date: string;
}

export interface OrderItem {
  id: string;
  user_id: string;
  store_id: string;
  order_code: string;
  status: OrderStatusEnum;
  payment_status: PaymentStatusEnum;
  order_type: OrderTypeEnum;
  fulfillment_method: FulfillmentMethodEnum;
  preorder_date_id: string | null;
  name: string;
  phone: string;
  email: string;
  address: string;
  note: string | null;
  subtotal: number;
  shipping_fee: number;
  total: number;
  confirmed_at: string | null;
  delivered_at: string | null;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string | null;
  district: string;
  ward: string;
  city: string;
  payment_method: PaymentMethodEnum;
  store: StoreItem;
}

export type OrderTypeEnum = "available" | "preorder";
export type FulfillmentMethodEnum = "delivery" | "pickup";

export type OrderStatusEnum =
  | "pending"
  | "confirmed"
  | "preparing"
  | "shipping"
  | "delivered"
  | "cancelled";

export type PaymentStatusEnum = "unpaid" | "paid" | "failed" | "refunded";
export type PaymentMethodEnum = "payos" | "visa";

export interface PayOSWebhookBody {
  code: string;
  desc: string;
  success: boolean;
  data: {
    orderCode: number;
    amount: number;
    description: string;
    accountNumber: string;
    reference: string;
    transactionDateTime: string;
    currency: string;
    paymentLinkId: string;

    code: string;
    desc: string;

    counterAccountBankId: string;
    counterAccountBankName: string;
    counterAccountName: string;
    counterAccountNumber: string;

    virtualAccountName: string;
    virtualAccountNumber: string;
  };
  signature: string;
}

export interface KnowledgeSearchResult {
  id: string;
  document_id: string;
  chunk_index: number;
  content: string;
  metadata: Record<string, unknown> | null;
  similarity: number;
}

export interface PreorderSchedule {
  id?: string;
  date: string;
  status: boolean;
  created_at: string;
  updated_at: string;
}

export interface PreorderItem {
  id: string;
  schedule_id: string;
  product_id: string;
  planned_quantity: number;
  remaining_quantity: number;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;

  products: {
    id: string;
    price: number;
    image_url: string[];
    is_active: boolean;
    product_translations: {
      locale: string;
      name: string;
      slug: string;
    }[];
    categories: {
      id: string;
      name: string;
    } | null;
  };
  preorder_schedules: {
    id: string;
    date: string;
    status: boolean;
  };
}
