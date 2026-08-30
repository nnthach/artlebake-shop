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
