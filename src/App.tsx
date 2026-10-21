import React, { useState, useEffect } from 'react';
import { 
  MenuItem, 
  TableOrder, 
  ClosedOrder, 
  MonthArchive, 
  POSSettings, 
  ActiveTab 
} from './types/pos';
import { 
  loadAppData, 
  persistData, 
  resetAllDataToDemo 
} from './utils/storage';
import { exportSingleArchiveToExcel } from './utils/excel';
import { Header } from './components/Header';
import { TableOrdersView } from './components/TableOrdersView';
import { TakeawayView } from './components/TakeawayView';
import { DashboardView } from './components/DashboardView';
import { MenuManagementView } from './components/MenuManagementView';
import { ExcelIOView } from './components/ExcelIOView';
import { MonthlyArchiveView } from './components/MonthlyArchiveView';
import { ReceiptModal } from './components/ReceiptModal';
import { Toast } from './components/Toast';
import { sound } from './utils/sound';
import { Theme, Language, translations } from './utils/i18n';

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ActiveTab>('tables');

  // Theme & Language State with LocalStorage persistence
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      const saved = localStorage.getItem('bimbo_theme');
      return saved === 'light' || saved === 'dark' ? saved : 'dark';
    } catch {
      return 'dark';
    }
  });

  const [language, setLanguage] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('bimbo_lang');
      return saved === 'ar' || saved === 'en' ? saved : 'en';
    } catch {
      return 'en';
    }
  });

  // Core Data State
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [activeTables, setActiveTables] = useState<TableOrder[]>([]);
  const [closedOrders, setClosedOrders] = useState<ClosedOrder[]>([]);
  const [archives, setArchives] = useState<MonthArchive[]>([]);
  const [settings, setSettings] = useState<POSSettings>({
    caravanName: 'BIMBO Cafe & Restaurant',
    currency: 'EGP',
    address: 'Caravan Hub, North Coast & City Walkways',
    phone: '+20 100 246 8901',
    soundEffects: true,
    enableTax: false,
    taxRatePercent: 14
  });

  // Modal & Toast State
  const [receiptOrder, setReceiptOrder] = useState<ClosedOrder | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(prev => (prev === msg ? null : prev));
    }, 4000);
  };

  // Sync Theme with DOM and LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem('bimbo_theme', theme);
      if (theme === 'light') {
        document.documentElement.classList.add('theme-light');
      } else {
        document.documentElement.classList.remove('theme-light');
      }
    } catch (e) {
      console.error(e);
    }
  }, [theme]);

  // Sync Language and RTL direction with DOM and LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem('bimbo_lang', language);
      document.documentElement.setAttribute('dir', language === 'ar' ? 'rtl' : 'ltr');
      document.documentElement.setAttribute('lang', language);
    } catch (e) {
      console.error(e);
    }
  }, [language]);

  const handleToggleTheme = () => {
    sound.playTap();
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const handleToggleLanguage = () => {
    sound.playTap();
    setLanguage(prev => (prev === 'en' ? 'ar' : 'en'));
  };

  const t = translations[language];

  // Initial Load from IndexedDB / LocalStorage
  useEffect(() => {
    const init = async () => {
      try {
        const data = await loadAppData();
        setMenuItems(data.menu);
        setActiveTables(data.activeTables);
        setClosedOrders(data.closedOrders);
        setArchives(data.archives);
        setSettings(data.settings);
        sound.enabled = data.settings.soundEffects;
      } catch (err) {
        console.error('Failed to load local app data:', err);
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, []);

  // Today's metrics for header
  const isToday = (iso: string) => {
    const d = new Date(iso);
    return d.toDateString() === new Date().toDateString();
  };
  const todayOrders = closedOrders.filter(o => isToday(o.timestamp));
  const todaySales = todayOrders.reduce((sum, o) => sum + o.total, 0);
  const todayCosts = todayOrders.reduce((sum, o) => sum + o.totalCost, 0);
  const todayProfit = todaySales - todayCosts;

  // Handler: Update Tables with dynamic persistence
  const handleUpdateTables = (newTables: TableOrder[], notification?: string) => {
    setActiveTables(newTables);
    persistData('bimbo_tables', newTables);
    if (notification) {
      showToast(notification);
    }
  };

  // Handler: Order Completed (From Table Checkout or Takeaway Fast-Lane)
  const handleOrderCompleted = (order: ClosedOrder) => {
    const updated = [order, ...closedOrders];
    setClosedOrders(updated);
    persistData('bimbo_orders', updated);
    showToast(`Order #${order.orderNumber.split('-').pop()} settled (${order.total} EGP)`);
  };

  // Handler: Update Menu Items
  const handleUpdateMenu = (newMenu: MenuItem[], message?: string) => {
    setMenuItems(newMenu);
    persistData('bimbo_menu', newMenu);
    if (message) {
      showToast(message);
    }
  };

  // Handler: Import Menu from Excel
  const handleImportMenu = (imported: MenuItem[], mode: 'replace' | 'append') => {
    const updated = mode === 'replace' ? imported : [...imported, ...menuItems];
    setMenuItems(updated);
    persistData('bimbo_menu', updated);
  };

  // Handler: End of Month Close & Archive Ceremony
  const handleCloseAndArchiveMonth = () => {
    const now = new Date();
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const monthName = now.toLocaleString('en-US', { month: 'long', year: 'numeric' });

    const totalOrders = closedOrders.length;
    const totalRevenue = closedOrders.reduce((s, o) => s + o.total, 0);
    const totalCost = closedOrders.reduce((s, o) => s + o.totalCost, 0);
    const netProfit = totalRevenue - totalCost;
    const marginPercent = totalRevenue > 0 ? Number(((netProfit / totalRevenue) * 100).toFixed(1)) : 0;

    // Top items aggregation
    const itemMap = new Map<string, { name: string; quantity: number; revenue: number; profit: number }>();
    closedOrders.forEach(order => {
      order.items.forEach(i => {
        const prev = itemMap.get(i.menuItemId) || { name: i.name, quantity: 0, revenue: 0, profit: 0 };
        const rev = i.price * i.quantity;
        const cst = i.unitCost * i.quantity;
        prev.quantity += i.quantity;
        prev.revenue += rev;
        prev.profit += (rev - cst);
        itemMap.set(i.menuItemId, prev);
      });
    });

    const topItems = Array.from(itemMap.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);

    const newArchive: MonthArchive = {
      id: `arch-${Date.now()}`,
      monthKey,
      monthName,
      archivedAt: new Date().toISOString(),
      totalOrders,
      totalRevenue,
      totalCost,
      netProfit,
      marginPercent,
      orders: [...closedOrders],
      topItems
    };

    // 1. Save and lock archive into local memory
    const updatedArchives = [newArchive, ...archives];
    setArchives(updatedArchives);
    persistData('bimbo_archives', updatedArchives);

    // 2. Automatically trigger downloadable backup Excel file
    try {
      exportSingleArchiveToExcel(newArchive);
    } catch {
      // export error handled inside
    }

    // 3. Start a fresh, clean month while maintaining historical records
    setClosedOrders([]);
    persistData('bimbo_orders', []);

    showToast(`Month "${monthName}" sealed and locked in archives! Fresh month started.`);
  };

  // Handler: Reset Demo Data
  const handleResetDemo = async () => {
    setIsLoading(true);
    try {
      const fresh = await resetAllDataToDemo();
      setMenuItems(fresh.menu);
      setActiveTables(fresh.activeTables);
      setClosedOrders(fresh.closedOrders);
      setArchives(fresh.archives);
      setSettings(fresh.settings);
      showToast('BIMBO Cafe & Restaurant demo data refreshed successfully!');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div 
        dir={language === 'ar' ? 'rtl' : 'ltr'}
        className={`min-h-screen flex flex-col items-center justify-center space-y-4 ${
          theme === 'light' ? 'bg-[#fbf8f3] text-stone-900' : 'bg-stone-950 text-white'
        }`}
      >
        <div className="w-12 h-12 rounded-2xl bg-amber-500 animate-pulse flex items-center justify-center text-stone-950 font-black text-xl shadow-lg shadow-amber-500/20">
          ☕
        </div>
        <p className="text-sm font-semibold tracking-wide">
          {language === 'ar' ? 'جاري تحميل نظام كرفان بيمبو...' : 'Loading BIMBO Caravan POS System...'}
        </p>
      </div>
    );
  }

  return (
    <div 
      dir={language === 'ar' ? 'rtl' : 'ltr'}
      className={`min-h-screen flex flex-col selection:bg-amber-500 selection:text-stone-950 transition-colors duration-200 ${
        theme === 'light' ? 'theme-light bg-[#fbf8f3] text-stone-900' : 'bg-stone-950 text-stone-100'
      }`}
    >
      
      {/* Caravan Header & Navigation */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activeTableCount={activeTables.length}
        todaySales={todaySales}
        todayProfit={todayProfit}
        settings={settings}
        setSettings={setSettings}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        language={language}
        onToggleLanguage={handleToggleLanguage}
        t={t}
      />

      {/* Main Tab Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        
        {/* Tab 1: Table Orders */}
        {activeTab === 'tables' && (
          <TableOrdersView
            tables={activeTables}
            menuItems={menuItems}
            settings={settings}
            onUpdateTables={handleUpdateTables}
            onOrderCompleted={handleOrderCompleted}
            onShowReceipt={(order) => setReceiptOrder(order)}
            language={language}
            t={t}
          />
        )}

        {/* Tab 2: Takeaway Fast-Lane */}
        {activeTab === 'takeaway' && (
          <TakeawayView
            menuItems={menuItems}
            settings={settings}
            onOrderCompleted={handleOrderCompleted}
            onShowReceipt={(order) => setReceiptOrder(order)}
            language={language}
            t={t}
          />
        )}

        {/* Tab 3: Sales & Costs Dashboard */}
        {activeTab === 'dashboard' && (
          <DashboardView
            orders={closedOrders}
            menuItems={menuItems}
            settings={settings}
            onShowReceipt={(order) => setReceiptOrder(order)}
          />
        )}

        {/* Tab 4: Menu & Recipe Costs */}
        {activeTab === 'menu' && (
          <MenuManagementView
            menuItems={menuItems}
            settings={settings}
            onUpdateMenu={handleUpdateMenu}
          />
        )}

        {/* Tab 5: Excel Import/Export */}
        {activeTab === 'excel' && (
          <ExcelIOView
            orders={closedOrders}
            menuItems={menuItems}
            archives={archives}
            settings={settings}
            onImportMenu={handleImportMenu}
            onShowToast={showToast}
          />
        )}

        {/* Tab 6: Monthly Archive */}
        {activeTab === 'archive' && (
          <MonthlyArchiveView
            orders={closedOrders}
            menuItems={menuItems}
            archives={archives}
            settings={settings}
            onCloseAndArchiveMonth={handleCloseAndArchiveMonth}
            onShowToast={showToast}
          />
        )}

      </main>

      {/* Printable Thermal Receipt Modal */}
      <ReceiptModal
        order={receiptOrder}
        onClose={() => setReceiptOrder(null)}
        settings={settings}
      />

      {/* Notification Toast */}
      <Toast
        message={toastMessage}
        onDismiss={() => setToastMessage(null)}
      />

      {/* Subtle Caravan Footer */}
      <footer className="border-t border-stone-800/80 bg-stone-950/60 py-4 text-center text-xs text-stone-500">
        <p>
          {language === 'ar' 
            ? 'بيمبو كافيه ومطعم • إدارة كرفان المأكولات ونقاط البيع • شاشة لمس عالية التباين'
            : 'BIMBO Cafe & Restaurant • Food Caravan Management & POS • High-Contrast Touch Screen'
          }
        </p>
      </footer>

    </div>
  );
}
