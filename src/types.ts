export type Category = 'yemek' | 'içecek' | 'diğer';

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  note?: string;
  createdAt: string;
}

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: Category;
  active: boolean;
}

export interface OrderLine {
  id: string;
  orderId: string;
  menuItemId?: string;
  nameSnapshot: string;
  priceSnapshot: number;
  qty: number;
  createdAt: string;
}

export interface Order {
  id: string;
  customerId: string;
  status: 'open' | 'closed';
  createdAt: string;
  closedAt?: string;
}

export interface Payment {
  id: string;
  customerId: string;
  orderId?: string;
  amount: number;
  paidAt: string;
  note?: string;
}

export interface Purchase {
  id: string;
  name: string;
  qty: number;
  unitCost: number;
  date: string;
  supplierNote?: string;
}

export interface AppData {
  customers: Customer[];
  menuItems: MenuItem[];
  orders: Order[];
  orderLines: OrderLine[];
  payments: Payment[];
  purchases: Purchase[];
  version: number;
}
