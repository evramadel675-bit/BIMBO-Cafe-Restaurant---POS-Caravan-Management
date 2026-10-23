import { MenuItem, TableOrder, ClosedOrder, MonthArchive, POSSettings, CostBreakdown } from '../types/pos';

export const STORAGE_KEYS = {
  MENU: 'bimbo_menu',
  TABLES: 'bimbo_tables',
  ORDERS: 'bimbo_orders',
  ARCHIVES: 'bimbo_archives',
  SETTINGS: 'bimbo_settings',
  THEME: 'bimbo_theme',
  LANG: 'bimbo_lang'
} as const;

const IDB_NAME = 'BIMBO_CARAVAN_POS_OFFLINE_DB';
const IDB_VERSION = 1;

export const DEFAULT_SETTINGS: POSSettings = {
  caravanName: 'BIMBO Cafe & Restaurant',
  currency: 'EGP',
  address: 'Caravan Hub, North Coast & City Walkways',
  phone: '+20 100 246 8901',
  soundEffects: true,
  enableTax: false,
  taxRatePercent: 14,
};

function calculateDerivedCosts(price: number, costs: CostBreakdown) {
  const totalCost = Number(
    (
      costs.cupAndLid +
      costs.coffeeOrBase +
      costs.milk +
      costs.sugar +
      costs.syrupAndSauce +
      costs.coverPackaging +
      costs.other
    ).toFixed(2)
  );
  const netProfit = Number((price - totalCost).toFixed(2));
  const marginPercent = price > 0 ? Number(((netProfit / price) * 100).toFixed(1)) : 0;
  return { totalCost, netProfit, marginPercent };
}

export const INITIAL_MENU_ITEMS: MenuItem[] = [
  // Hot Coffee
  {
    id: 'item-1',
    name: 'Espresso Single',
    category: 'Hot Coffee',
    price: 45,
    costs: { cupAndLid: 2.0, coffeeOrBase: 9.5, milk: 0, sugar: 0.5, syrupAndSauce: 0, coverPackaging: 0.8, other: 0 },
    ...calculateDerivedCosts(45, { cupAndLid: 2.0, coffeeOrBase: 9.5, milk: 0, sugar: 0.5, syrupAndSauce: 0, coverPackaging: 0.8, other: 0 }),
    isAvailable: true,
    description: 'Freshly extracted single origin Arabica shot',
    badge: 'Classic'
  },
  {
    id: 'item-2',
    name: 'Espresso Double (Doppio)',
    category: 'Hot Coffee',
    price: 60,
    costs: { cupAndLid: 2.0, coffeeOrBase: 17.5, milk: 0, sugar: 0.5, syrupAndSauce: 0, coverPackaging: 0.8, other: 0 },
    ...calculateDerivedCosts(60, { cupAndLid: 2.0, coffeeOrBase: 17.5, milk: 0, sugar: 0.5, syrupAndSauce: 0, coverPackaging: 0.8, other: 0 }),
    isAvailable: true,
    description: 'Double shot rich crema espresso'
  },
  {
    id: 'item-3',
    name: 'Spanish Latte (Hot)',
    category: 'Hot Coffee',
    price: 85,
    costs: { cupAndLid: 3.5, coffeeOrBase: 11.0, milk: 17.5, sugar: 0.5, syrupAndSauce: 9.5, coverPackaging: 1.5, other: 0.5 },
    ...calculateDerivedCosts(85, { cupAndLid: 3.5, coffeeOrBase: 11.0, milk: 17.5, sugar: 0.5, syrupAndSauce: 9.5, coverPackaging: 1.5, other: 0.5 }),
    isAvailable: true,
    description: 'Espresso with steamed fresh milk and condensed sweetness',
    badge: 'Best Seller'
  },
  {
    id: 'item-4',
    name: 'Flat White Barista Special',
    category: 'Hot Coffee',
    price: 75,
    costs: { cupAndLid: 3.5, coffeeOrBase: 14.0, milk: 18.0, sugar: 0.5, syrupAndSauce: 0, coverPackaging: 1.5, other: 0 },
    ...calculateDerivedCosts(75, { cupAndLid: 3.5, coffeeOrBase: 14.0, milk: 18.0, sugar: 0.5, syrupAndSauce: 0, coverPackaging: 1.5, other: 0 }),
    isAvailable: true,
    description: 'Velvety microfoam over a double ristretto'
  },
  {
    id: 'item-5',
    name: 'Cappuccino Italiano',
    category: 'Hot Coffee',
    price: 70,
    costs: { cupAndLid: 3.5, coffeeOrBase: 11.0, milk: 16.5, sugar: 0.5, syrupAndSauce: 0, coverPackaging: 1.5, other: 0 },
    ...calculateDerivedCosts(70, { cupAndLid: 3.5, coffeeOrBase: 11.0, milk: 16.5, sugar: 0.5, syrupAndSauce: 0, coverPackaging: 1.5, other: 0 }),
    isAvailable: true,
    description: 'Equal thirds espresso, steamed milk, and airy froth'
  },
  {
    id: 'item-6',
    name: 'Turkish Coffee Double',
    category: 'Hot Coffee',
    price: 50,
    costs: { cupAndLid: 1.8, coffeeOrBase: 14.0, milk: 0, sugar: 1.5, syrupAndSauce: 0, coverPackaging: 0.8, other: 0.5 },
    ...calculateDerivedCosts(50, { cupAndLid: 1.8, coffeeOrBase: 14.0, milk: 0, sugar: 1.5, syrupAndSauce: 0, coverPackaging: 0.8, other: 0.5 }),
    isAvailable: true,
    description: 'Traditional slow-brewed Turkish coffee with cardamom'
  },

  // Cold Brew & Iced Coffee
  {
    id: 'item-7',
    name: 'Iced Spanish Latte',
    category: 'Cold Brew & Iced',
    price: 95,
    costs: { cupAndLid: 4.5, coffeeOrBase: 12.0, milk: 19.0, sugar: 0.5, syrupAndSauce: 11.0, coverPackaging: 1.8, other: 1.2 },
    ...calculateDerivedCosts(95, { cupAndLid: 4.5, coffeeOrBase: 12.0, milk: 19.0, sugar: 0.5, syrupAndSauce: 11.0, coverPackaging: 1.8, other: 1.2 }),
    isAvailable: true,
    description: 'Signature iced espresso, sweet milk layer, crushed ice',
    badge: 'Popular'
  },
  {
    id: 'item-8',
    name: 'Salted Caramel Iced Latte',
    category: 'Cold Brew & Iced',
    price: 95,
    costs: { cupAndLid: 4.5, coffeeOrBase: 12.0, milk: 19.0, sugar: 0.5, syrupAndSauce: 12.0, coverPackaging: 1.8, other: 1.5 },
    ...calculateDerivedCosts(95, { cupAndLid: 4.5, coffeeOrBase: 12.0, milk: 19.0, sugar: 0.5, syrupAndSauce: 12.0, coverPackaging: 1.8, other: 1.5 }),
    isAvailable: true,
    description: 'Artisanal salted caramel drizzle with cold frothy milk'
  },
  {
    id: 'item-9',
    name: 'BIMBO Nitro Cold Brew',
    category: 'Cold Brew & Iced',
    price: 85,
    costs: { cupAndLid: 4.5, coffeeOrBase: 22.0, milk: 0, sugar: 0, syrupAndSauce: 0, coverPackaging: 1.8, other: 2.0 },
    ...calculateDerivedCosts(85, { cupAndLid: 4.5, coffeeOrBase: 22.0, milk: 0, sugar: 0, syrupAndSauce: 0, coverPackaging: 1.8, other: 2.0 }),
    isAvailable: true,
    description: '18-hour slow steep cold brew with chocolate notes',
    badge: 'Specialty'
  },
  {
    id: 'item-10',
    name: 'Iced Americano Fresh',
    category: 'Cold Brew & Iced',
    price: 60,
    costs: { cupAndLid: 4.0, coffeeOrBase: 12.5, milk: 0, sugar: 0.5, syrupAndSauce: 0, coverPackaging: 1.5, other: 1.0 },
    ...calculateDerivedCosts(60, { cupAndLid: 4.0, coffeeOrBase: 12.5, milk: 0, sugar: 0.5, syrupAndSauce: 0, coverPackaging: 1.5, other: 1.0 }),
    isAvailable: true,
    description: 'Double espresso pulled fresh over chilled ice water'
  },

  // Caravan Shakes & Refreshers
  {
    id: 'item-11',
    name: 'Lotus Biscoff Shake',
    category: 'Caravan Shakes',
    price: 110,
    costs: { cupAndLid: 5.0, coffeeOrBase: 0, milk: 28.0, sugar: 1.0, syrupAndSauce: 24.0, coverPackaging: 2.0, other: 3.5 },
    ...calculateDerivedCosts(110, { cupAndLid: 5.0, coffeeOrBase: 0, milk: 28.0, sugar: 1.0, syrupAndSauce: 24.0, coverPackaging: 2.0, other: 3.5 }),
    isAvailable: true,
    description: 'Crushed Biscoff cookies, rich cream, Belgian Lotus spread',
    badge: 'Signature'
  },
  {
    id: 'item-12',
    name: 'Passion Fruit Mint Mojito',
    category: 'Caravan Shakes',
    price: 75,
    costs: { cupAndLid: 4.5, coffeeOrBase: 0, milk: 0, sugar: 2.0, syrupAndSauce: 14.0, coverPackaging: 2.0, other: 9.5 },
    ...calculateDerivedCosts(75, { cupAndLid: 4.5, coffeeOrBase: 0, milk: 0, sugar: 2.0, syrupAndSauce: 14.0, coverPackaging: 2.0, other: 9.5 }),
    isAvailable: true,
    description: 'Fresh crushed mint, lime wedges, passion fruit puree & sparkling soda'
  },
  {
    id: 'item-13',
    name: 'Oreo Blast Milkshake',
    category: 'Caravan Shakes',
    price: 100,
    costs: { cupAndLid: 5.0, coffeeOrBase: 0, milk: 26.0, sugar: 1.0, syrupAndSauce: 18.0, coverPackaging: 2.0, other: 2.5 },
    ...calculateDerivedCosts(100, { cupAndLid: 5.0, coffeeOrBase: 0, milk: 26.0, sugar: 1.0, syrupAndSauce: 18.0, coverPackaging: 2.0, other: 2.5 }),
    isAvailable: true,
    description: 'Vanilla cream milkshake blended with Oreo cookies & fudge'
  },

  // Caravan Savory & Sandwiches
  {
    id: 'item-14',
    name: 'Smoked Turkey & Cheddar Croissant',
    category: 'Food & Sandwiches',
    price: 95,
    costs: { cupAndLid: 0, coffeeOrBase: 0, milk: 0, sugar: 0, syrupAndSauce: 4.0, coverPackaging: 3.5, other: 48.0 },
    ...calculateDerivedCosts(95, { cupAndLid: 0, coffeeOrBase: 0, milk: 0, sugar: 0, syrupAndSauce: 4.0, coverPackaging: 3.5, other: 48.0 }),
    isAvailable: true,
    description: 'Flaky butter croissant stuffed with smoked turkey, cheddar & dijon'
  },
  {
    id: 'item-15',
    name: 'Grilled Halloumi & Pesto Panini',
    category: 'Food & Sandwiches',
    price: 90,
    costs: { cupAndLid: 0, coffeeOrBase: 0, milk: 0, sugar: 0, syrupAndSauce: 5.0, coverPackaging: 3.5, other: 42.0 },
    ...calculateDerivedCosts(90, { cupAndLid: 0, coffeeOrBase: 0, milk: 0, sugar: 0, syrupAndSauce: 5.0, coverPackaging: 3.5, other: 42.0 }),
    isAvailable: true,
    description: 'Cypriot halloumi, wild rocket, sun-dried tomatoes & basil pesto'
  },
  {
    id: 'item-16',
    name: 'BIMBO Club Caravan Sandwich',
    category: 'Food & Sandwiches',
    price: 115,
    costs: { cupAndLid: 0, coffeeOrBase: 0, milk: 0, sugar: 0, syrupAndSauce: 6.0, coverPackaging: 4.5, other: 58.0 },
    ...calculateDerivedCosts(115, { cupAndLid: 0, coffeeOrBase: 0, milk: 0, sugar: 0, syrupAndSauce: 6.0, coverPackaging: 4.5, other: 58.0 }),
    isAvailable: true,
    description: 'Triple decker toast with grilled chicken breast, beef bacon & cheddar',
    badge: 'Chef Special'
  },

  // Bakery & Desserts
  {
    id: 'item-17',
    name: 'Fresh French Butter Croissant',
    category: 'Bakery & Sweets',
    price: 55,
    costs: { cupAndLid: 0, coffeeOrBase: 0, milk: 0, sugar: 0, syrupAndSauce: 0, coverPackaging: 2.0, other: 24.0 },
    ...calculateDerivedCosts(55, { cupAndLid: 0, coffeeOrBase: 0, milk: 0, sugar: 0, syrupAndSauce: 0, coverPackaging: 2.0, other: 24.0 }),
    isAvailable: true,
    description: 'Authentic pure butter flaky golden croissant'
  },
  {
    id: 'item-18',
    name: 'Nutella & Banana Bubble Waffle',
    category: 'Bakery & Sweets',
    price: 95,
    costs: { cupAndLid: 0, coffeeOrBase: 0, milk: 0, sugar: 0, syrupAndSauce: 22.0, coverPackaging: 4.0, other: 22.0 },
    ...calculateDerivedCosts(95, { cupAndLid: 0, coffeeOrBase: 0, milk: 0, sugar: 0, syrupAndSauce: 22.0, coverPackaging: 4.0, other: 22.0 }),
    isAvailable: true,
    description: 'Freshly baked bubble waffle smothered with Nutella & fresh bananas'
  },
  {
    id: 'item-19',
    name: 'San Sebastian Basque Cheesecake',
    category: 'Bakery & Sweets',
    price: 110,
    costs: { cupAndLid: 0, coffeeOrBase: 0, milk: 0, sugar: 0, syrupAndSauce: 16.0, coverPackaging: 3.5, other: 45.0 },
    ...calculateDerivedCosts(110, { cupAndLid: 0, coffeeOrBase: 0, milk: 0, sugar: 0, syrupAndSauce: 16.0, coverPackaging: 3.5, other: 45.0 }),
    isAvailable: true,
    description: 'Creamy caramel-crusted Basque slice served with warm Belgian chocolate',
    badge: 'Indulgent'
  }
];

export const INITIAL_TABLES: TableOrder[] = [
  {
    id: 'tbl-1',
    tableNumber: 1,
    openedAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    customerName: 'Youssef & Friends',
    guestCount: 3,
    notes: 'Near outdoor awning umbrella',
    status: 'occupied',
    discount: 0,
    items: [
      {
        menuItemId: 'item-3',
        name: 'Spanish Latte (Hot)',
        category: 'Hot Coffee',
        price: 85,
        unitCost: 44.5,
        quantity: 2,
        notes: 'Extra hot'
      },
      {
        menuItemId: 'item-14',
        name: 'Smoked Turkey & Cheddar Croissant',
        category: 'Food & Sandwiches',
        price: 95,
        unitCost: 55.5,
        quantity: 1,
        notes: 'Warmed well'
      }
    ]
  },
  {
    id: 'tbl-2',
    tableNumber: 2,
    openedAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    customerName: 'Mariam',
    guestCount: 1,
    notes: 'Laptop worker',
    status: 'occupied',
    discount: 0,
    items: [
      {
        menuItemId: 'item-8',
        name: 'Salted Caramel Iced Latte',
        category: 'Cold Brew & Iced',
        price: 95,
        unitCost: 51.3,
        quantity: 1,
        notes: 'Oat milk preference if possible'
      },
      {
        menuItemId: 'item-17',
        name: 'Fresh French Butter Croissant',
        category: 'Bakery & Sweets',
        price: 55,
        unitCost: 26.0,
        quantity: 1
      }
    ]
  }
];

export function generateSeedClosedOrders(): ClosedOrder[] {
  const orders: ClosedOrder[] = [];
  const now = new Date();
  
  const pastDaysOffsets = [0, 0, 0, 1, 1, 2, 3, 4, 5];
  const itemsPool = INITIAL_MENU_ITEMS;

  pastDaysOffsets.forEach((daysAgo, idx) => {
    const orderDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000 - (idx * 45 + 20) * 60 * 1000);
    const isTakeaway = idx % 2 === 0;
    
    const item1 = itemsPool[idx % itemsPool.length];
    const item2 = itemsPool[(idx + 3) % itemsPool.length];
    
    const orderItems = [
      {
        menuItemId: item1.id,
        name: item1.name,
        category: item1.category,
        price: item1.price,
        unitCost: item1.totalCost,
        quantity: (idx % 2) + 1,
        notes: ''
      },
      {
        menuItemId: item2.id,
        name: item2.name,
        category: item2.category,
        price: item2.price,
        unitCost: item2.totalCost,
        quantity: 1,
        notes: ''
      }
    ];

    const subtotal = orderItems.reduce((acc, i) => acc + i.price * i.quantity, 0);
    const totalCost = orderItems.reduce((acc, i) => acc + i.unitCost * i.quantity, 0);
    const discount = idx === 3 ? 15 : 0;
    const total = subtotal - discount;
    const netProfit = total - totalCost;
    const paymentMethods: ('cash' | 'card' | 'wallet')[] = ['cash', 'card', 'wallet'];
    const pMethod = paymentMethods[idx % 3];

    orders.push({
      id: `ord-seed-${idx + 1}`,
      orderNumber: `BIMBO-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}-${String(idx + 1).padStart(4, '0')}`,
      type: isTakeaway ? 'takeaway' : 'table',
      tableNumber: isTakeaway ? undefined : (idx % 4) + 1,
      timestamp: orderDate.toISOString(),
      items: orderItems,
      subtotal,
      discount,
      total,
      totalCost,
      netProfit,
      paymentMethod: pMethod,
      tendered: pMethod === 'cash' ? Math.ceil(total / 50) * 50 : total,
      change: pMethod === 'cash' ? (Math.ceil(total / 50) * 50) - total : 0,
      customerNotes: isTakeaway ? 'Caravan Window customer' : undefined
    });
  });

  return orders;
}

export function generateSeedArchives(): MonthArchive[] {
  const prevDate = new Date();
  prevDate.setMonth(prevDate.getMonth() - 1);
  const monthKey = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
  const monthName = prevDate.toLocaleString('en-US', { month: 'long', year: 'numeric' });

  return [
    {
      id: 'arch-seed-prev',
      monthKey,
      monthName,
      archivedAt: new Date(prevDate.getFullYear(), prevDate.getMonth() + 1, 1).toISOString(),
      totalOrders: 428,
      totalRevenue: 38450,
      totalCost: 17290,
      netProfit: 21160,
      marginPercent: 55.0,
      orders: [],
      topItems: [
        { name: 'Iced Spanish Latte', quantity: 184, revenue: 17480, profit: 8188 },
        { name: 'Spanish Latte (Hot)', quantity: 142, revenue: 12070, profit: 5751 },
        { name: 'Smoked Turkey & Cheddar Croissant', quantity: 98, revenue: 9310, profit: 3871 },
        { name: 'Lotus Biscoff Shake', quantity: 86, revenue: 9460, profit: 4128 }
      ]
    }
  ];
}

/* =====================================================================
   SYNCHRONOUS LOCALSTORAGE PERSISTENCE (100% Offline Primary Engine)
   ===================================================================== */

export function getLocalItem<T>(key: string): T | null {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch (err) {
    console.warn(`[Offline POS] Error reading ${key} from localStorage:`, err);
    return null;
  }
}

export function setLocalItem<T>(key: string, value: T): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn(`[Offline POS] Error writing ${key} to localStorage:`, err);
  }
}

/* =====================================================================
   INDEXEDDB SECONDARY MIRROR (Offline High-Capacity Storage)
   ===================================================================== */

function openIndexedDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB not supported'));
    }
    const request = indexedDB.open(IDB_NAME, IDB_VERSION);
    request.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('store')) {
        db.createObjectStore('store');
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function idbGet<T>(key: string): Promise<T | null> {
  try {
    const db = await openIndexedDB();
    return new Promise((resolve) => {
      const tx = db.transaction('store', 'readonly');
      const store = tx.objectStore('store');
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result !== undefined ? req.result : null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

async function idbSet<T>(key: string, value: T): Promise<void> {
  try {
    const db = await openIndexedDB();
    return new Promise((resolve) => {
      const tx = db.transaction('store', 'readwrite');
      const store = tx.objectStore('store');
      store.put(value, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch {
    // Fail silently in offline environment
  }
}

/* =====================================================================
   APP DATA LIFECYCLE (Load & Instant Local Persistence)
   ===================================================================== */

export interface CaravanAppData {
  menu: MenuItem[];
  activeTables: TableOrder[];
  closedOrders: ClosedOrder[];
  archives: MonthArchive[];
  settings: POSSettings;
}

/**
 * Loads all app state completely offline.
 * Checks localStorage first (synchronous instant read).
 * If empty on first launch, populates with BIMBO defaults and writes to disk.
 */
/**
 * 100% Synchronous initial app data loader for instant 0ms startup.
 * Reads directly from localStorage with zero delay and instant fallback to BIMBO defaults.
 * Guarantees the POS NEVER hangs on a loading spinner or wait state.
 */
export function getInitialAppData(): CaravanAppData {
  let menu = getLocalItem<MenuItem[]>(STORAGE_KEYS.MENU);
  let activeTables = getLocalItem<TableOrder[]>(STORAGE_KEYS.TABLES);
  let closedOrders = getLocalItem<ClosedOrder[]>(STORAGE_KEYS.ORDERS);
  let archives = getLocalItem<MonthArchive[]>(STORAGE_KEYS.ARCHIVES);
  let settings = getLocalItem<POSSettings>(STORAGE_KEYS.SETTINGS);

  if (!menu || menu.length === 0) {
    menu = INITIAL_MENU_ITEMS;
    setLocalItem(STORAGE_KEYS.MENU, menu);
  }

  if (!activeTables || activeTables.length === 0) {
    activeTables = INITIAL_TABLES;
    setLocalItem(STORAGE_KEYS.TABLES, activeTables);
  } else {
    activeTables = activeTables.map(t => ({
      ...t,
      status: (t.status === 'cleaning' || t.status === 'reserved' || t.status === 'occupied') ? t.status : 'occupied'
    }));
  }

  if (!closedOrders) {
    closedOrders = generateSeedClosedOrders();
    setLocalItem(STORAGE_KEYS.ORDERS, closedOrders);
  }

  if (!archives) {
    archives = generateSeedArchives();
    setLocalItem(STORAGE_KEYS.ARCHIVES, archives);
  }

  if (!settings) {
    settings = DEFAULT_SETTINGS;
    setLocalItem(STORAGE_KEYS.SETTINGS, settings);
  }

  return { menu, activeTables, closedOrders, archives, settings };
}

export async function loadAppData(): Promise<CaravanAppData> {
  // 1. Primary: Fast synchronous read from localStorage
  let menu = getLocalItem<MenuItem[]>(STORAGE_KEYS.MENU);
  let activeTables = getLocalItem<TableOrder[]>(STORAGE_KEYS.TABLES);
  let closedOrders = getLocalItem<ClosedOrder[]>(STORAGE_KEYS.ORDERS);
  let archives = getLocalItem<MonthArchive[]>(STORAGE_KEYS.ARCHIVES);
  let settings = getLocalItem<POSSettings>(STORAGE_KEYS.SETTINGS);

  // 2. Secondary fallback: Check IndexedDB if localStorage was empty for any key
  if (!menu) menu = await idbGet<MenuItem[]>(STORAGE_KEYS.MENU);
  if (!activeTables) activeTables = await idbGet<TableOrder[]>(STORAGE_KEYS.TABLES);
  if (!closedOrders) closedOrders = await idbGet<ClosedOrder[]>(STORAGE_KEYS.ORDERS);
  if (!archives) archives = await idbGet<MonthArchive[]>(STORAGE_KEYS.ARCHIVES);
  if (!settings) settings = await idbGet<POSSettings>(STORAGE_KEYS.SETTINGS);

  // 3. First run initialization: Auto-populate with defaults & commit to localStorage
  if (!menu || menu.length === 0) {
    menu = INITIAL_MENU_ITEMS;
    setLocalItem(STORAGE_KEYS.MENU, menu);
    idbSet(STORAGE_KEYS.MENU, menu).catch(() => {});
  }

  if (!activeTables) {
    activeTables = INITIAL_TABLES;
    setLocalItem(STORAGE_KEYS.TABLES, activeTables);
    idbSet(STORAGE_KEYS.TABLES, activeTables).catch(() => {});
  } else {
    // Ensure table statuses are normalized
    activeTables = activeTables.map(t => ({
      ...t,
      status: (t.status === 'cleaning' || t.status === 'reserved' || t.status === 'occupied') ? t.status : 'occupied'
    }));
  }

  if (!closedOrders) {
    closedOrders = generateSeedClosedOrders();
    setLocalItem(STORAGE_KEYS.ORDERS, closedOrders);
    idbSet(STORAGE_KEYS.ORDERS, closedOrders).catch(() => {});
  }

  if (!archives) {
    archives = generateSeedArchives();
    setLocalItem(STORAGE_KEYS.ARCHIVES, archives);
    idbSet(STORAGE_KEYS.ARCHIVES, archives).catch(() => {});
  }

  if (!settings) {
    settings = DEFAULT_SETTINGS;
    setLocalItem(STORAGE_KEYS.SETTINGS, settings);
    idbSet(STORAGE_KEYS.SETTINGS, settings).catch(() => {});
  }

  return { menu, activeTables, closedOrders, archives, settings };
}

/**
 * Instantly persists data locally.
 * - Writes synchronously to localStorage (guarantees persistence even if app closes immediately).
 * - Asynchronously mirrors to IndexedDB for high-capacity backup.
 */
export function persistData<T>(key: string, value: T): void {
  // 1. Instant synchronous write to localStorage
  setLocalItem(key, value);
  // 2. Asynchronous background mirror to IndexedDB
  idbSet(key, value).catch(() => {});
}

/**
 * Resets all local data to clean demo dataset and updates localStorage.
 */
export async function resetAllDataToDemo(): Promise<CaravanAppData> {
  const freshData: CaravanAppData = {
    menu: INITIAL_MENU_ITEMS,
    activeTables: INITIAL_TABLES,
    closedOrders: generateSeedClosedOrders(),
    archives: generateSeedArchives(),
    settings: DEFAULT_SETTINGS
  };

  persistData(STORAGE_KEYS.MENU, freshData.menu);
  persistData(STORAGE_KEYS.TABLES, freshData.activeTables);
  persistData(STORAGE_KEYS.ORDERS, freshData.closedOrders);
  persistData(STORAGE_KEYS.ARCHIVES, freshData.archives);
  persistData(STORAGE_KEYS.SETTINGS, freshData.settings);

  return freshData;
}

/**
 * Exports complete offline database as a portable JSON backup file.
 */
export function exportDatabaseBackupJSON(): void {
  const data = {
    app: 'BIMBO Cafe & Restaurant POS',
    exportedAt: new Date().toISOString(),
    menu: getLocalItem(STORAGE_KEYS.MENU) || INITIAL_MENU_ITEMS,
    tables: getLocalItem(STORAGE_KEYS.TABLES) || INITIAL_TABLES,
    orders: getLocalItem(STORAGE_KEYS.ORDERS) || [],
    archives: getLocalItem(STORAGE_KEYS.ARCHIVES) || [],
    settings: getLocalItem(STORAGE_KEYS.SETTINGS) || DEFAULT_SETTINGS
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `BIMBO_POS_Backup_${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
