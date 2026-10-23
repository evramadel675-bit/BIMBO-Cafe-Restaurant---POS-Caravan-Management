export type Language = 'en' | 'ar';
export type Theme = 'dark' | 'light';

export interface Translations {
  // Navigation
  tabTables: string;
  tabTakeaway: string;
  tabDashboard: string;
  tabMenu: string;
  tabExcel: string;
  tabArchive: string;

  // Header
  todayRevenue: string;
  todayProfit: string;
  caravanOnline: string;
  soundEffects: string;
  caravanPOS: string;
  currency: string;
  themeToggle: string;
  languageToggle: string;
  installApp: string;
  installAppIOS: string;

  // Tables View
  dineInTables: string;
  activeTablesCount: string;
  openNewTable: string;
  fifoQueueNote: string;
  noActiveTables: string;
  table: string;
  guests: string;
  statusOccupied: string;
  statusCleaning: string;
  statusReserved: string;
  markCleaning: string;
  markReserved: string;
  markOccupied: string;
  addItems: string;
  payAndClose: string;
  voidTable: string;
  tableEmptyNotice: string;
  subtotal: string;
  estProfit: string;
  total: string;

  // Takeaway View
  fastLaneTakeaway: string;
  takeawaySubtitle: string;
  currentTakeaway: string;
  driveThruTicket: string;
  clearAll: string;
  emptyCartNotice: string;
  emptyCartSub: string;
  orderNotePlaceholder: string;
  discount: string;
  tenderedCash: string;
  changeDue: string;
  completeOrder: string;
  paymentCash: string;
  paymentVisa: string;
  paymentInstaPay: string;

  // Menu View
  menuTitle: string;
  menuSubtitle: string;
  addNewRecipe: string;
  searchPlaceholder: string;
  categoryAll: string;
  totalCost: string;
  netProfit: string;
  margin: string;
  inStock: string;
  outOfStock: string;
  editRecipe: string;
  deleteRecipe: string;
  rawIngredients: string;
  sellingPrice: string;
  cupLid: string;
  coffeeBeans: string;
  milkCost: string;
  sugarSyrup: string;
  packagingCost: string;

  // Excel & Archive
  excelTitle: string;
  excelSubtitle: string;
  exportCurrentMonth: string;
  exportArchiveSpreadsheet: string;
  downloadTemplate: string;
  importRecipes: string;
  monthlyArchiveTitle: string;
  closeMonthButton: string;

  // Modals & Common
  cancel: string;
  save: string;
  delete: string;
  confirm: string;
  close: string;
  printReceipt: string;
  copyReceipt: string;
  thankYouMessage: string;
}

export const translations: Record<Language, Translations> = {
  en: {
    // Navigation
    tabTables: 'Table Orders',
    tabTakeaway: 'Takeaway Fast-Lane',
    tabDashboard: 'Sales & Costs Dashboard',
    tabMenu: 'Menu & Recipe Costs',
    tabExcel: 'Excel Import/Export',
    tabArchive: 'Monthly Archive',

    // Header
    todayRevenue: "Today's Revenue",
    todayProfit: "Today's Profit",
    caravanOnline: '100% Offline (Local)',
    soundEffects: 'Sound FX',
    caravanPOS: 'Caravan POS',
    currency: 'EGP',
    themeToggle: 'Switch Theme',
    languageToggle: 'العربية',
    installApp: 'Install App',
    installAppIOS: 'Install App (iOS)',

    // Tables View
    dineInTables: 'Dine-In Caravan Tables',
    activeTablesCount: 'Active',
    openNewTable: 'Open New Table',
    fifoQueueNote: 'Dynamic Queue: Settling a table shifts remaining tables sequentially.',
    noActiveTables: 'No Active Tables',
    table: 'Table',
    guests: 'guests',
    statusOccupied: 'Occupied',
    statusCleaning: 'Cleaning',
    statusReserved: 'Reserved',
    markCleaning: 'Clean',
    markReserved: 'Reserve',
    markOccupied: 'Seat',
    addItems: 'Add Items',
    payAndClose: 'Pay & Close',
    voidTable: 'Void Table',
    tableEmptyNotice: 'No items on table. Tap Add Items to take order.',
    subtotal: 'Subtotal',
    estProfit: 'Est. Profit',
    total: 'Total',

    // Takeaway View
    fastLaneTakeaway: 'Fast-Lane Takeaway Checkout',
    takeawaySubtitle: 'Touch items to add to ticket. One-tap instant settlement & printing.',
    currentTakeaway: 'Current Takeaway',
    driveThruTicket: 'Drive-Thru / Window Ticket',
    clearAll: 'Clear All',
    emptyCartNotice: 'Takeaway cart is empty',
    emptyCartSub: 'Tap menu items to add instantly',
    orderNotePlaceholder: 'Order Note (e.g. Car plate / White SUV / Extra ice)...',
    discount: 'Discount',
    tenderedCash: 'Cash Tendered',
    changeDue: 'Change Due',
    completeOrder: 'Complete & Print',
    paymentCash: 'Cash',
    paymentVisa: 'Card / POS',
    paymentInstaPay: 'InstaPay / Wallet',

    // Menu View
    menuTitle: 'Menu & Recipe Cost Breakdown',
    menuSubtitle: 'Raw ingredient cost tracking: Cup, Coffee, Milk, Sugar & Packaging with live profit margins.',
    addNewRecipe: 'Add New Menu Recipe',
    searchPlaceholder: 'Search recipes, coffee, bakery...',
    categoryAll: 'All',
    totalCost: 'Total Cost',
    netProfit: 'Net Profit',
    margin: 'Margin',
    inStock: 'In Stock',
    outOfStock: '86 Out',
    editRecipe: 'Edit Recipe',
    deleteRecipe: 'Delete Recipe',
    rawIngredients: 'Raw Ingredients',
    sellingPrice: 'Selling Price',
    cupLid: 'Cup & Lid',
    coffeeBeans: 'Coffee Beans',
    milkCost: 'Fresh Milk',
    sugarSyrup: 'Sugar & Syrups',
    packagingCost: 'Packaging / Cover',

    // Excel & Archive
    excelTitle: 'Excel Data Center',
    excelSubtitle: 'Export audit spreadsheets & import bulk recipes directly from .xlsx files.',
    exportCurrentMonth: 'Export Current Month',
    exportArchiveSpreadsheet: 'Download Backup',
    downloadTemplate: 'Download Excel Template',
    importRecipes: 'Import Recipes from Excel',
    monthlyArchiveTitle: 'Monthly Business Archives',
    closeMonthButton: 'End Month & Archive',

    // Modals & Common
    cancel: 'Cancel',
    save: 'Save Changes',
    delete: 'Delete',
    confirm: 'Confirm',
    close: 'Close',
    printReceipt: 'Print Thermal Receipt',
    copyReceipt: 'Copy Receipt Text',
    thankYouMessage: 'Thank you for visiting BIMBO Caravan!'
  },
  ar: {
    // Navigation
    tabTables: 'طلبات الطاولات',
    tabTakeaway: 'شباك التيك أواي السريع',
    tabDashboard: 'لوحة المبيعات والأرباح',
    tabMenu: 'المنيو وتكاليف الوصفات',
    tabExcel: 'استيراد وتصدير إكسيل',
    tabArchive: 'الأرشيف الشهري',

    // Header
    todayRevenue: 'إيراد اليوم',
    todayProfit: 'أرباح اليوم',
    caravanOnline: 'أوفلاين 100% (تخزين محلي)',
    soundEffects: 'الأصوات',
    caravanPOS: 'نظام كرفان POS',
    currency: 'ج.م',
    themeToggle: 'تغيير المظهر',
    languageToggle: 'English',
    installApp: 'تثبيت التطبيق',
    installAppIOS: 'تثبيت على آيفون',

    // Tables View
    dineInTables: 'طاولات الكرفان والصالة',
    activeTablesCount: 'طاولة نشطة',
    openNewTable: 'فتح طاولة جديدة',
    fifoQueueNote: 'إعادة ترتيب تلقائية: إغلاق أي طاولة يعيد ترتيب الطاولات التالية تباعاً.',
    noActiveTables: 'لا توجد طاولات نشطة حالياً',
    table: 'طاولة',
    guests: 'أفراد',
    statusOccupied: 'مشغولة',
    statusCleaning: 'تنظيف',
    statusReserved: 'محجوزة',
    markCleaning: 'تنظيف',
    markReserved: 'حجز',
    markOccupied: 'إشغال',
    addItems: 'إضافة أصناف',
    payAndClose: 'محاسبة وإغلاق',
    voidTable: 'إلغاء الطاولة',
    tableEmptyNotice: 'الطاولة فارغة. اضغط على إضافة أصناف لتسجيل الطلب.',
    subtotal: 'المجموع الجزئي',
    estProfit: 'الربح التقديري',
    total: 'الإجمالي',

    // Takeaway View
    fastLaneTakeaway: 'محاسبة التيك أواي والسيارات',
    takeawaySubtitle: 'المس الصنف للإضافة للتذكرة مباشرة مع محاسبة وطباعة فورية بنقرة واحدة.',
    currentTakeaway: 'تذكرة التيك أواي الحالية',
    driveThruTicket: 'تذكرة الشباك / السيارات',
    clearAll: 'مسح الكل',
    emptyCartNotice: 'سلة التيك أواي فارغة',
    emptyCartSub: 'المس أي صنف في القائمة لإضافته فوراً',
    orderNotePlaceholder: 'ملاحظة الطلب (مثال: رقم السيارة / جيب أبيض / ثلج زيادة)...',
    discount: 'الخصم',
    tenderedCash: 'المبلغ المدفوع',
    changeDue: 'المتبقي للعميل',
    completeOrder: 'إتمام الطلب وطباعة الفاتورة',
    paymentCash: 'نقدي (كاش)',
    paymentVisa: 'بطاقة / فيزا',
    paymentInstaPay: 'إنستاباي / محفظة',

    // Menu View
    menuTitle: 'تفاصيل تكاليف وصفات المنيو والربحية',
    menuSubtitle: 'تتبع تكاليف المواد الخام بدقة: الكوب، البن، الحليب، السكر، والنكهات مع هامش الربح الحي.',
    addNewRecipe: 'إضافة وصفة جديدة للمنيو',
    searchPlaceholder: 'بحث في الوصفات، القهوة، المخبوزات...',
    categoryAll: 'الكل',
    totalCost: 'إجمالي التكلفة',
    netProfit: 'صافي الربح',
    margin: 'نسبة الربح',
    inStock: 'متوفر',
    outOfStock: 'نفذ',
    editRecipe: 'تعديل الوصفة',
    deleteRecipe: 'حذف الوصفة',
    rawIngredients: 'المواد الخام',
    sellingPrice: 'سعر البيع',
    cupLid: 'الكوب والغطاء',
    coffeeBeans: 'حبوب البن',
    milkCost: 'حليب طازج',
    sugarSyrup: 'سكر وسيرب',
    packagingCost: 'التغليف والملحقات',

    // Excel & Archive
    excelTitle: 'مركز بيانات إكسيل',
    excelSubtitle: 'تصدير تقارير محاسبية واستيراد جماعي للمنيو من ملفات Excel (.xlsx) بكل سهولة.',
    exportCurrentMonth: 'تصدير مبيعات الشهر الحالي',
    exportArchiveSpreadsheet: 'تحميل نسخة احتياطية',
    downloadTemplate: 'تحميل نموذج إكسيل المفرغ',
    importRecipes: 'استيراد وصفات من إكسيل',
    monthlyArchiveTitle: 'سجلات وأرشيف الشهور السابقة',
    closeMonthButton: 'إغلاق الشهر وترحيل الأرشيف',

    // Modals & Common
    cancel: 'إلغاء',
    save: 'حفظ التغييرات',
    delete: 'حذف',
    confirm: 'تأكيد',
    close: 'إغلاق',
    printReceipt: 'طباعة الفاتورة الحرارية',
    copyReceipt: 'نسخ نص الفاتورة',
    thankYouMessage: 'شكراً لزيارتكم كرفان بيمبو!'
  }
};
