export interface SaleItem {
  productId: string;
  description: string;
  quantity: number;
  price: number; // Unit price
  cost: number;  // Unit cost for profit calculation
}

export interface Sale {
  id?: string;
  date: any;
  items: SaleItem[];
  total: number;
  payment_method: 'Pix' | 'Dinheiro' | 'Cartão';
  customer_id?: string;
  customer_name?: string;
  created_at: any;
}
