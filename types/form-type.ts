export interface StoreInventoryFormState {
  product_id: string;
  quantity: number;
}

export interface CreatePreorderItem {
  schedule_id: string;
  items: {
    product_id: string;
    quantity: number;
  }[];
}

export type OrderConfirmationItemProps = {
  product_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  products: {
    image_url?: string[];
  };
};

export type OrderConfirmationEmailProps = {
  name: string;
  email: string;
  phone: string;
  orderCode: string;
  orderType: "available" | "preorder";

  preorderDate?: string;

  items: OrderConfirmationItemProps[];

  subtotal: number;
  shippingFee: number;
  total: number;

  fulfillmentMethod: "delivery" | "pickup";

  address?: string;
  city?: string;
  district?: string;
  ward?: string;
};
