/**
 * Type definitions for BIMBO Cafe & Restaurant POS & Management System
 */

export interface CostBreakdown {
  cupAndLid: number;       // EGP
  coffeeOrBase: number;    // EGP (espresso beans, matcha powder, tea, etc.)
  milk: number;            // EGP (fresh dairy, oat milk, cream)
  sugar: number;           // EGP
  syrupAndSauce: number;   // EGP (vanilla, caramel, chocolate, lotus)
  coverPackaging: number;  // EGP (straw, bag, napkin, box, cup sleeve)
  other: number;           // EGP (extras, garnish, ice)
}

export interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;           // Selling Price in EGP
  costs: CostBreakdown;
  totalCost: number;       // Total Raw Material Cost in EGP
  netProfit: number;       // Price - TotalCost
  marginPercent: number;   // (NetProfit / Price) * 100
  isAvailable: boolean;
  description?: string;
  badge?: string;
}

export interface OrderItem {
  menuItemId: string;
  name: string;
  category: string;
  price: number;           // Unit selling price (EGP)
  unitCost: number;        // Unit raw cost (EGP)
  quantity: number;
  notes?: string;
}

export type TableStatus = 'occupied' | 'cleaning' | 'reserved';

export interface TableOrder {
  id: string;
  tableNumber: number;     // Sequential 1..N
  openedAt: string;        // ISO string
  customerName?: string;
  guestCount?: number;
  notes?: string;
  items: OrderItem[];
  status: TableStatus;
  discount: number;        // in EGP
}

export type PaymentMethod = 'cash' | 'card' | 'wallet';

export interface ClosedOrder {
  id: string;
  orderNumber: string;     // e.g. "BIMBO-202610-0023"
  type: 'table' | 'takeaway';
  tableNumber?: number;
  timestamp: string;       // ISO string
  items: OrderItem[];
  subtotal: number;        // EGP
  discount: number;        // EGP
  total: number;           // EGP (final charged)
  totalCost: number;       // EGP (cost of goods sold)
  netProfit: number;       // EGP (total - totalCost)
  paymentMethod: PaymentMethod;
  tendered?: number;
  change?: number;
  customerNotes?: string;
}

export interface MonthArchive {
  id: string;
  monthKey: string;        // e.g. "2026-10"
  monthName: string;       // e.g. "October 2026"
  archivedAt: string;      // ISO string
  totalOrders: number;
  totalRevenue: number;    // EGP
  totalCost: number;       // EGP
  netProfit: number;       // EGP
  marginPercent: number;
  orders: ClosedOrder[];
  topItems: {
    name: string;
    quantity: number;
    revenue: number;
    profit: number;
  }[];
}

export type ActiveTab = 
  | 'tables' 
  | 'takeaway' 
  | 'dashboard' 
  | 'menu' 
  | 'excel' 
  | 'archive';

export interface POSSettings {
  caravanName: string;
  currency: string;
  address: string;
  phone: string;
  soundEffects: boolean;
  enableTax: boolean;
  taxRatePercent: number;
}
