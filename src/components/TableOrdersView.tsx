import React, { useState } from 'react';
import { TableOrder, TableStatus, MenuItem, OrderItem, ClosedOrder, PaymentMethod, POSSettings } from '../types/pos';
import { 
  Plus, 
  Users, 
  Clock, 
  CheckCircle, 
  Trash2, 
  CreditCard, 
  Banknote, 
  Smartphone, 
  Edit3, 
  Search, 
  X, 
  ArrowRightLeft,
  Coffee,
  AlertCircle,
  Bookmark,
  Sparkles
} from 'lucide-react';
import { sound } from '../utils/sound';
import { HorizontalScrollContainer } from './HorizontalScrollContainer';
import { ConfirmModal, ConfirmModalState } from './ConfirmModal';
import { Language, Translations, translations } from '../utils/i18n';
import { BimboLogo } from './BimboLogo';

interface TableOrdersViewProps {
  tables: TableOrder[];
  menuItems: MenuItem[];
  settings: POSSettings;
  onUpdateTables: (newTables: TableOrder[], notification?: string) => void;
  onOrderCompleted: (order: ClosedOrder) => void;
  onShowReceipt: (order: ClosedOrder) => void;
  language?: Language;
  t?: Translations;
}

export const TableOrdersView: React.FC<TableOrdersViewProps> = ({
  tables,
  menuItems,
  settings,
  onUpdateTables,
  onOrderCompleted,
  onShowReceipt,
  language = 'en',
  t,
}) => {
  const dict = t || translations[language];

  // In-app confirmation modal for deletions
  const [confirmModal, setConfirmModal] = useState<ConfirmModalState | null>(null);

  // State for Add/Edit items modal on a table
  const [activeEditingTableId, setActiveEditingTableId] = useState<string | null>(null);
  const [itemSearch, setItemSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // State for Settlement / Checkout modal
  const [checkoutTable, setCheckoutTable] = useState<TableOrder | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [tenderedAmount, setTenderedAmount] = useState<string>('');
  const [discountAmount, setDiscountAmount] = useState<number>(0);

  // State for Table Details / Note edit
  const [editingMetaTable, setEditingMetaTable] = useState<TableOrder | null>(null);
  const [editCustomerName, setEditCustomerName] = useState('');
  const [editGuestCount, setEditGuestCount] = useState(2);
  const [editNotes, setEditNotes] = useState('');

  // Categories for menu selection
  const categories = ['All', ...Array.from(new Set(menuItems.map(m => m.category)))];

  // Helper to get elapsed minutes
  const getElapsedMinutes = (isoString: string): number => {
    const diffMs = Date.now() - new Date(isoString).getTime();
    return Math.max(0, Math.floor(diffMs / 60000));
  };

  // 1. Create a new active table (dynamically Table N+1)
  // Status toggle handler ('occupied' | 'cleaning' | 'reserved')
  const handleUpdateTableStatus = (tableId: string, newStatus: TableStatus) => {
    sound.playTap();
    const updated = tables.map(t => t.id === tableId ? { ...t, status: newStatus } : t);
    const target = tables.find(t => t.id === tableId);
    const label = newStatus === 'occupied' ? 'Occupied' : newStatus === 'cleaning' ? 'Cleaning' : 'Reserved';
    onUpdateTables(updated, `Table ${target?.tableNumber || ''} status set to ${label}`);
  };

  // 1. Create a new active table (dynamically Table N+1)
  const handleAddNewTable = () => {
    sound.playTap();
    const newTableNumber = tables.length + 1;
    const newTable: TableOrder = {
      id: `tbl-${Date.now()}`,
      tableNumber: newTableNumber,
      openedAt: new Date().toISOString(),
      customerName: `Guest Group #${newTableNumber}`,
      guestCount: 2,
      notes: '',
      items: [],
      status: 'occupied',
      discount: 0
    };

    const updated = [...tables, newTable];
    onUpdateTables(updated, `Opened Table ${newTableNumber}`);
    setActiveEditingTableId(newTable.id);
  };

  // 2. Add or increment item in a table
  const handleAddItemToTable = (tableId: string, menuItem: MenuItem) => {
    sound.playTap();
    const updated = tables.map(t => {
      if (t.id !== tableId) return t;

      const existingIndex = t.items.findIndex(i => i.menuItemId === menuItem.id);
      let newItems: OrderItem[];

      if (existingIndex > -1) {
        newItems = t.items.map((item, idx) => 
          idx === existingIndex ? { ...item, quantity: item.quantity + 1 } : item
        );
      } else {
        newItems = [
          ...t.items,
          {
            menuItemId: menuItem.id,
            name: menuItem.name,
            category: menuItem.category,
            price: menuItem.price,
            unitCost: menuItem.totalCost,
            quantity: 1,
            notes: ''
          }
        ];
      }

      return { ...t, items: newItems };
    });

    onUpdateTables(updated);
  };

  // Delete item from table
  const handleRemoveItem = (tableId: string, menuItemId: string) => {
    sound.playTap();
    const updated = tables.map(t => {
      if (t.id !== tableId) return t;
      return {
        ...t,
        items: t.items.filter(i => i.menuItemId !== menuItemId)
      };
    });
    onUpdateTables(updated);
  };

  // Prompt confirmation before removing item from table
  const promptRemoveItem = (tableId: string, tableNumber: number, menuItemId: string, itemName?: string) => {
    sound.playTap();
    const table = tables.find(t => t.id === tableId);
    const item = table?.items.find(i => i.menuItemId === menuItemId);
    const name = itemName || item?.name || 'this item';

    setConfirmModal({
      isOpen: true,
      title: `Remove Item from Table ${tableNumber}`,
      message: `Are you sure you want to remove "${name}" from Table ${tableNumber}?`,
      confirmLabel: 'Remove Item',
      onConfirm: () => handleRemoveItem(tableId, menuItemId)
    });
  };

  // Modify quantity of item on a table
  const handleUpdateItemQuantity = (tableId: string, menuItemId: string, delta: number) => {
    sound.playTap();
    const table = tables.find(t => t.id === tableId);
    const item = table?.items.find(i => i.menuItemId === menuItemId);

    // If decreasing from 1 to 0, ask confirmation first
    if (delta < 0 && item && item.quantity <= 1) {
      promptRemoveItem(tableId, table?.tableNumber || 1, menuItemId, item.name);
      return;
    }

    const updated = tables.map(t => {
      if (t.id !== tableId) return t;
      const newItems = t.items
        .map(i => {
          if (i.menuItemId === menuItemId) {
            const newQty = i.quantity + delta;
            return newQty > 0 ? { ...i, quantity: newQty } : null;
          }
          return i;
        })
        .filter((i): i is OrderItem => i !== null);

      return { ...t, items: newItems };
    });

    onUpdateTables(updated);
  };

  // Save meta info (customer name, guests, notes)
  const handleSaveTableMeta = () => {
    if (!editingMetaTable) return;
    sound.playTap();
    const updated = tables.map(t => {
      if (t.id !== editingMetaTable.id) return t;
      return {
        ...t,
        customerName: editCustomerName.trim() || `Table ${t.tableNumber}`,
        guestCount: editGuestCount,
        notes: editNotes.trim()
      };
    });
    onUpdateTables(updated, `Updated details for Table ${editingMetaTable.tableNumber}`);
    setEditingMetaTable(null);
  };

  // Open Checkout modal
  const handleOpenCheckout = (table: TableOrder) => {
    sound.playTap();
    const subtotal = table.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    setCheckoutTable(table);
    setPaymentMethod('cash');
    setDiscountAmount(table.discount || 0);
    setTenderedAmount(String(subtotal - (table.discount || 0)));
  };

  // Close & Pay Table with AUTOMATIC QUEUE REORDERING!
  const handleSettleAndCloseTable = () => {
    if (!checkoutTable) return;

    const subtotal = checkoutTable.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const finalTotal = Math.max(0, subtotal - discountAmount);
    const totalCost = checkoutTable.items.reduce((sum, i) => sum + i.unitCost * i.quantity, 0);
    const netProfit = finalTotal - totalCost;
    const paidTender = paymentMethod === 'cash' ? (parseFloat(tenderedAmount) || finalTotal) : finalTotal;
    const change = Math.max(0, paidTender - finalTotal);

    const closedNumber = `BIMBO-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(Date.now()).slice(-4)}`;
    
    const closedOrder: ClosedOrder = {
      id: `ord-${Date.now()}`,
      orderNumber: closedNumber,
      type: 'table',
      tableNumber: checkoutTable.tableNumber,
      timestamp: new Date().toISOString(),
      items: [...checkoutTable.items],
      subtotal,
      discount: discountAmount,
      total: finalTotal,
      totalCost,
      netProfit,
      paymentMethod,
      tendered: paidTender,
      change,
      customerNotes: checkoutTable.notes || checkoutTable.customerName
    };

    // 1. Record completed order
    onOrderCompleted(closedOrder);
    sound.playCash();

    // 2. CRITICAL QUEUE REORDERING:
    // Remove closed table, then re-index remaining tables so Table 2 becomes Table 1, Table 3 becomes Table 2, maintaining 1..N sequence!
    const closedTableNumber = checkoutTable.tableNumber;
    const remainingTables = tables
      .filter(t => t.id !== checkoutTable.id)
      .map((t, idx) => ({
        ...t,
        tableNumber: idx + 1 // Pure 1..N dynamic re-sequencing
      }));

    sound.playTableShift();

    const reorderMessage = remainingTables.length > 0
      ? `Table ${closedTableNumber} settled! Queue reordered: remaining ${remainingTables.length} tables shifted into sequential order (1..${remainingTables.length}).`
      : `Table ${closedTableNumber} settled! All dine-in tables are now clear.`;

    onUpdateTables(remainingTables, reorderMessage);

    // Show thermal receipt modal
    onShowReceipt(closedOrder);
    setCheckoutTable(null);
  };

  // Void / Cancel an empty or occupied table with reordering
  const handleVoidTable = (tableId: string, tableNumber: number) => {
    sound.playTap();
    const targetTable = tables.find(t => t.id === tableId);
    const itemCount = targetTable?.items.reduce((s, i) => s + i.quantity, 0) || 0;

    setConfirmModal({
      isOpen: true,
      title: `Void Table ${tableNumber}`,
      message: itemCount > 0
        ? `Table ${tableNumber} currently has ${itemCount} item${itemCount > 1 ? 's' : ''} on its order. Are you sure you want to void and clear this table? Remaining tables will shift up into sequential order.`
        : `Are you sure you want to void Table ${tableNumber}? Remaining tables will shift up into sequential order.`,
      confirmLabel: 'Void Table',
      onConfirm: () => {
        const remaining = tables
          .filter(t => t.id !== tableId)
          .map((t, idx) => ({
            ...t,
            tableNumber: idx + 1
          }));

        sound.playTableShift();
        onUpdateTables(remaining, `Table ${tableNumber} voided. Remaining active tables shifted to 1..${remaining.length}`);
      }
    });
  };

  const currentEditingTable = tables.find(t => t.id === activeEditingTableId);

  // Filtered menu for adding items
  const filteredMenuItems = menuItems.filter(item => {
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(itemSearch.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Controls Bar */}
      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <span>{dict.dineInTables}</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-bold border border-amber-500/30">
                {tables.length} {dict.activeTablesCount}
              </span>
            </h2>
          </div>
          <p className="text-xs text-stone-400 mt-1">
            {dict.fifoQueueNote}
          </p>
        </div>

        <button
          onClick={handleAddNewTable}
          className="w-full sm:w-auto px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 transition transform active:scale-95 cursor-pointer"
        >
          <Plus className="w-5 h-5 stroke-[2.5]" />
          <span>{dict.openNewTable} {tables.length + 1}</span>
        </button>
      </div>

      {/* Tables Grid */}
      {tables.length === 0 ? (
        <div className="bg-stone-900/60 border border-dashed border-stone-800 rounded-3xl p-12 text-center space-y-4">
          <div className="w-20 h-20 rounded-full mx-auto p-1 bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shadow-lg shadow-amber-500/10">
            <BimboLogo 
              className="w-16 h-16 rounded-full" 
            />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">{dict.noActiveTables}</h3>
            <p className="text-xs text-stone-400 max-w-sm mx-auto mt-1">
              {dict.tableEmptyNotice}
            </p>
          </div>
          <button
            onClick={handleAddNewTable}
            className="px-6 py-2.5 rounded-xl bg-amber-500 text-stone-950 font-bold text-xs inline-flex items-center gap-2 hover:bg-amber-400 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" /> {dict.openNewTable} 1
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {tables.map((table) => {
            const subtotal = table.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
            const totalCost = table.items.reduce((sum, i) => sum + i.unitCost * i.quantity, 0);
            const estimatedProfit = subtotal - totalCost;
            const elapsed = getElapsedMinutes(table.openedAt);

            const isCleaning = table.status === 'cleaning';
            const isReserved = table.status === 'reserved';
            const isOccupied = table.status === 'occupied' || (!isCleaning && !isReserved);

            const cardClasses = isCleaning
              ? 'bg-gradient-to-b from-sky-950/40 via-stone-900 to-stone-900 border border-sky-500/60 shadow-xl shadow-sky-950/20 hover:border-sky-400'
              : isReserved
              ? 'bg-gradient-to-b from-purple-950/40 via-stone-900 to-stone-900 border border-purple-500/60 shadow-xl shadow-purple-950/20 hover:border-purple-400'
              : 'bg-stone-900 border border-stone-800 hover:border-amber-500/50 shadow-xl';

            const headerClasses = isCleaning
              ? 'p-4 bg-sky-950/70 border-b border-sky-800/60 flex items-center justify-between'
              : isReserved
              ? 'p-4 bg-purple-950/70 border-b border-purple-800/60 flex items-center justify-between'
              : 'p-4 bg-stone-950/70 border-b border-stone-800 flex items-center justify-between';

            const numberBoxClasses = isCleaning
              ? 'w-12 h-12 rounded-xl bg-sky-500/15 border border-sky-500/40 flex flex-col items-center justify-center text-sky-300'
              : isReserved
              ? 'w-12 h-12 rounded-xl bg-purple-500/15 border border-purple-500/40 flex flex-col items-center justify-center text-purple-300'
              : 'w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex flex-col items-center justify-center text-amber-400';

            return (
              <div
                key={table.id}
                className={`${cardClasses} rounded-2xl flex flex-col overflow-hidden transition duration-200`}
              >
                {/* Table Header Card */}
                <div className={headerClasses}>
                  <div className="flex items-center gap-3">
                    <div className={numberBoxClasses}>
                      <span className="text-[10px] uppercase font-bold tracking-wider leading-none">Table</span>
                      <span className="text-xl font-black leading-none mt-0.5">{table.tableNumber}</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-sm flex items-center gap-1.5">
                        <span>{table.customerName || `Table ${table.tableNumber}`}</span>
                        <button
                          onClick={() => {
                            sound.playTap();
                            setEditingMetaTable(table);
                            setEditCustomerName(table.customerName || '');
                            setEditGuestCount(table.guestCount || 2);
                            setEditNotes(table.notes || '');
                          }}
                          className="text-stone-400 hover:text-amber-400 p-0.5"
                          title="Edit table notes"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      </h4>
                      <div className="flex items-center gap-2 text-[11px] text-stone-400 mt-0.5">
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3 text-stone-500" /> {table.guestCount || 2} guests
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-stone-500" /> {elapsed}m ago
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Void button */}
                  <button
                    type="button"
                    onClick={() => handleVoidTable(table.id, table.tableNumber)}
                    className="p-1.5 rounded-lg text-stone-500 hover:text-red-400 hover:bg-red-500/10 transition cursor-pointer"
                    title="Void Table"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Status Toggle Bar on each table */}
                <div className="px-3.5 py-2 bg-stone-950/80 border-b border-stone-800/80 flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 shrink-0">
                    Status:
                  </span>
                  <div className="flex-1 grid grid-cols-3 gap-1 bg-stone-900/90 p-1 rounded-xl border border-stone-800">
                    <button
                      type="button"
                      onClick={() => handleUpdateTableStatus(table.id, 'occupied')}
                      className={`py-1 px-1.5 rounded-lg text-[10px] sm:text-[11px] font-bold flex items-center justify-center gap-1 transition ${
                        isOccupied
                          ? 'bg-amber-500 text-stone-950 shadow-sm font-black'
                          : 'text-stone-400 hover:text-white hover:bg-stone-800'
                      }`}
                      title={dict.statusOccupied}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${isOccupied ? 'bg-stone-950' : 'bg-emerald-400'}`} />
                      <span>{dict.statusOccupied}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleUpdateTableStatus(table.id, 'cleaning')}
                      className={`py-1 px-1.5 rounded-lg text-[10px] sm:text-[11px] font-bold flex items-center justify-center gap-1 transition ${
                        isCleaning
                          ? 'bg-sky-500 text-stone-950 shadow-sm font-black'
                          : 'text-stone-400 hover:text-white hover:bg-stone-800'
                      }`}
                      title={dict.statusCleaning}
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>{dict.statusCleaning}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleUpdateTableStatus(table.id, 'reserved')}
                      className={`py-1 px-1.5 rounded-lg text-[10px] sm:text-[11px] font-bold flex items-center justify-center gap-1 transition ${
                        isReserved
                          ? 'bg-purple-500 text-stone-950 shadow-sm font-black'
                          : 'text-stone-400 hover:text-white hover:bg-stone-800'
                      }`}
                      title={dict.statusReserved}
                    >
                      <Bookmark className="w-3 h-3" />
                      <span>{dict.statusReserved}</span>
                    </button>
                  </div>
                </div>

                {/* Status Notice Banner if cleaning or reserved */}
                {isCleaning && (
                  <div className="px-4 py-1.5 bg-sky-500/15 border-b border-sky-500/25 text-[11px] text-sky-200 flex items-center gap-1.5 font-medium">
                    <Sparkles className="w-3.5 h-3.5 text-sky-300 shrink-0" />
                    <span>Table is currently being cleaned and sanitized.</span>
                  </div>
                )}
                {isReserved && (
                  <div className="px-4 py-1.5 bg-purple-500/15 border-b border-purple-500/25 text-[11px] text-purple-200 flex items-center gap-1.5 font-medium">
                    <Bookmark className="w-3.5 h-3.5 text-purple-300 shrink-0" />
                    <span>Table is reserved for incoming guests.</span>
                  </div>
                )}

                {/* Table notes banner if any */}
                {table.notes && (
                  <div className="px-4 py-1.5 bg-amber-500/5 border-b border-stone-800/60 text-[11px] text-amber-300/80 italic flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    <span>Note: {table.notes}</span>
                  </div>
                )}

                {/* Items in table list */}
                <div className="p-4 flex-1 space-y-2 overflow-y-auto max-h-56 min-h-[140px]">
                  {table.items.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-stone-500 text-xs py-6">
                      <Coffee className="w-6 h-6 mb-1 opacity-40" />
                      <span>No items ordered yet</span>
                    </div>
                  ) : (
                    table.items.map((item) => (
                      <div
                        key={item.menuItemId}
                        className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-stone-950/40 border border-stone-800/60"
                      >
                        <div className="truncate pr-2">
                          <div className="font-medium text-stone-200 truncate">{item.name}</div>
                          <div className="text-[10px] text-stone-400 font-mono">
                            {item.price} EGP each {item.notes && <span className="italic text-amber-300/80">• {item.notes}</span>}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => handleUpdateItemQuantity(table.id, item.menuItemId, -1)}
                            className="w-6 h-6 rounded bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold flex items-center justify-center"
                          >
                            -
                          </button>
                          <span className="w-5 text-center font-bold text-white text-xs">{item.quantity}</span>
                          <button
                            onClick={() => handleUpdateItemQuantity(table.id, item.menuItemId, 1)}
                            className="w-6 h-6 rounded bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold flex items-center justify-center"
                          >
                            +
                          </button>
                          <span className="w-14 text-right font-mono font-bold text-amber-400">
                            {item.price * item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => promptRemoveItem(table.id, table.tableNumber, item.menuItemId, item.name)}
                            className="text-stone-500 hover:text-red-400 ml-1 p-1 rounded hover:bg-red-500/15 transition cursor-pointer"
                            title="Remove item from table"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Financial Summary & Actions */}
                <div className="p-4 bg-stone-950/80 border-t border-stone-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-stone-400 uppercase tracking-wider block">{dict.estProfit}</span>
                      <span className="text-xs text-stone-300 font-mono">
                        {totalCost.toFixed(0)} {dict.currency} <span className="text-emerald-400 font-semibold">(+{estimatedProfit.toFixed(0)} {dict.currency})</span>
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-stone-400 uppercase tracking-wider block">{dict.total}</span>
                      <span className="text-lg font-black text-amber-400 font-mono">
                        {subtotal} <span className="text-xs font-sans text-stone-400">{dict.currency}</span>
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        sound.playTap();
                        setActiveEditingTableId(table.id);
                      }}
                      className="py-2.5 px-3 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-semibold text-xs flex items-center justify-center gap-1.5 border border-stone-700/80 transition cursor-pointer"
                    >
                      <Plus className="w-4 h-4 text-amber-400" />
                      <span>{dict.addItems}</span>
                    </button>

                    <button
                      type="button"
                      disabled={table.items.length === 0}
                      onClick={() => handleOpenCheckout(table)}
                      className={`py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer ${
                        table.items.length === 0
                          ? 'bg-stone-800/40 text-stone-600 cursor-not-allowed border border-stone-800'
                          : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20 active:scale-95'
                      }`}
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>{dict.payAndClose}</span>
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* MODAL 1: ADD ITEMS TO TABLE DRAWER / MODAL */}
      {currentEditingTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-stone-900 border border-stone-800 rounded-3xl w-[96%] sm:max-w-4xl h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            
            {/* Header */}
            <div className="p-4 sm:p-5 bg-stone-950 border-b border-stone-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-black">
                  T{currentEditingTable.tableNumber}
                </div>
                <div>
                  <h3 className="font-black text-white text-base sm:text-lg">
                    Add Items to Table {currentEditingTable.tableNumber}
                  </h3>
                  <p className="text-xs text-stone-400">
                    {currentEditingTable.customerName || 'Dine-in Guest'} • Current total:{' '}
                    <span className="font-mono text-amber-400 font-bold">
                      {currentEditingTable.items.reduce((s, i) => s + i.price * i.quantity, 0)} EGP
                    </span>
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  sound.playTap();
                  setActiveEditingTableId(null);
                }}
                className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter & Search Bar */}
            <div className="p-4 bg-stone-900 border-b border-stone-800 space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-stone-400" />
                <input
                  type="text"
                  placeholder="Search coffee, drinks, bakery, sandwiches..."
                  value={itemSearch}
                  onChange={(e) => setItemSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-stone-950 border border-stone-800 rounded-xl text-xs sm:text-sm text-white placeholder-stone-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Category Pills */}
              <HorizontalScrollContainer scrollAmount={180}>
                <div className="flex gap-1.5 scrollbar-none">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => {
                        sound.playTap();
                        setSelectedCategory(cat);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition shrink-0 ${
                        selectedCategory === cat
                          ? 'bg-amber-500 text-stone-950 font-bold'
                          : 'bg-stone-800 text-stone-300 hover:bg-stone-700 hover:text-white'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </HorizontalScrollContainer>
            </div>

            {/* Content: Menu items grid (2/3) + Current table order list (1/3) */}
            <div className="flex-1 flex flex-col md:grid md:grid-cols-3 overflow-y-auto md:overflow-hidden">
              
              {/* Menu items picker */}
              <div className="md:col-span-2 p-3 sm:p-4 overflow-y-auto space-y-2 bg-stone-950/30 flex-1 min-h-[240px]">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {filteredMenuItems.map((menuItem) => (
                    <button
                      key={menuItem.id}
                      onClick={() => handleAddItemToTable(currentEditingTable.id, menuItem)}
                      className="p-3 rounded-xl bg-stone-900 hover:bg-stone-850 border border-stone-800 hover:border-amber-500/50 text-left transition flex items-center justify-between group active:scale-[0.98]"
                    >
                      <div className="pr-2 truncate">
                        <div className="font-bold text-white text-xs sm:text-sm truncate group-hover:text-amber-400 transition">
                          {menuItem.name}
                        </div>
                        <div className="text-[10px] text-stone-400 truncate mt-0.5">
                          {menuItem.category} • Cost: {menuItem.totalCost.toFixed(0)} EGP
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="font-mono font-bold text-amber-400 text-sm">
                          {menuItem.price} <span className="text-[10px] font-sans text-stone-400">EGP</span>
                        </span>
                        <div className="text-[9px] text-emerald-400 font-semibold">
                          +{menuItem.netProfit.toFixed(0)} profit
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Table Current Order Review */}
              <div className="p-4 bg-stone-950 border-t md:border-t-0 md:border-l border-stone-800 flex flex-col justify-between">
                <div>
                  <h4 className="font-bold text-stone-200 text-xs uppercase tracking-wider mb-2 flex items-center justify-between">
                    <span>Current Order Items</span>
                    <div className="flex items-center gap-2">
                      <span className="text-amber-400 font-mono text-xs">
                        {currentEditingTable.items.reduce((s, i) => s + i.quantity, 0)} items
                      </span>
                      {currentEditingTable.items.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            sound.playTap();
                            setConfirmModal({
                              isOpen: true,
                              title: `Clear Table ${currentEditingTable.tableNumber}`,
                              message: `Are you sure you want to remove all items from Table ${currentEditingTable.tableNumber}?`,
                              confirmLabel: 'Clear All',
                              onConfirm: () => {
                                const updated = tables.map(t =>
                                  t.id === currentEditingTable.id ? { ...t, items: [] } : t
                                );
                                onUpdateTables(updated, `Cleared all items from Table ${currentEditingTable.tableNumber}.`);
                              }
                            });
                          }}
                          className="text-[10px] text-stone-400 hover:text-red-400 flex items-center gap-1 transition px-1.5 py-0.5 rounded hover:bg-red-500/10 cursor-pointer"
                          title="Clear all items from table"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Clear</span>
                        </button>
                      )}
                    </div>
                  </h4>

                  <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                    {currentEditingTable.items.length === 0 ? (
                      <div className="text-center py-8 text-stone-500 text-xs">
                        Tap any item on the left to add it to Table {currentEditingTable.tableNumber}.
                      </div>
                    ) : (
                      currentEditingTable.items.map((item) => (
                        <div
                          key={item.menuItemId}
                          className="flex items-center justify-between py-1.5 px-2 bg-stone-900 rounded-lg text-xs border border-stone-800"
                        >
                          <div className="truncate pr-1">
                            <span className="font-medium text-stone-200 block truncate">{item.name}</span>
                            <span className="text-[10px] text-stone-400 font-mono">{item.price} EGP</span>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleUpdateItemQuantity(currentEditingTable.id, item.menuItemId, -1)}
                              className="w-5 h-5 rounded bg-stone-800 hover:bg-stone-700 text-white font-bold flex items-center justify-center text-xs cursor-pointer"
                            >
                              -
                            </button>
                            <span className="w-5 text-center font-bold font-mono text-white text-xs">{item.quantity}</span>
                            <button
                              type="button"
                              onClick={() => handleUpdateItemQuantity(currentEditingTable.id, item.menuItemId, 1)}
                              className="w-5 h-5 rounded bg-stone-800 hover:bg-stone-700 text-white font-bold flex items-center justify-center text-xs cursor-pointer"
                            >
                              +
                            </button>
                            <button
                              type="button"
                              onClick={() => promptRemoveItem(currentEditingTable.id, currentEditingTable.tableNumber, item.menuItemId, item.name)}
                              className="p-1 rounded bg-stone-800/80 hover:bg-red-500/20 text-stone-400 hover:text-red-400 ml-1 transition cursor-pointer"
                              title="Remove item from order"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-stone-800 space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-stone-400">Total:</span>
                    <span className="text-lg font-black font-mono text-amber-400">
                      {currentEditingTable.items.reduce((s, i) => s + i.price * i.quantity, 0)} EGP
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      sound.playTap();
                      setActiveEditingTableId(null);
                    }}
                    className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs shadow-md transition"
                  >
                    Done & Return to Tables
                  </button>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* MODAL 2: TABLE SETTLEMENT / CHECKOUT MODAL WITH QUEUE REORDER PROMPT */}
      {checkoutTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-in fade-in">
          <div className="bg-stone-900 border border-stone-800 rounded-3xl w-[95%] sm:max-w-md max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-stone-950 border-b border-stone-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-black">
                  T{checkoutTable.tableNumber}
                </div>
                <div>
                  <h3 className="font-black text-white text-base">
                    Settle Table {checkoutTable.tableNumber}
                  </h3>
                  <p className="text-xs text-stone-400">
                    {checkoutTable.customerName || 'Dine-in Customer'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setCheckoutTable(null)}
                className="p-1.5 rounded-full hover:bg-stone-800 text-stone-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
              
              {/* Order bill summary */}
              <div className="bg-stone-950 p-3.5 rounded-xl border border-stone-800 space-y-2 text-xs">
                <div className="flex justify-between text-stone-400">
                  <span>Subtotal ({checkoutTable.items.reduce((s, i) => s + i.quantity, 0)} items)</span>
                  <span className="font-mono text-white">
                    {checkoutTable.items.reduce((s, i) => s + i.price * i.quantity, 0)} EGP
                  </span>
                </div>

                {/* Discount Input */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-stone-400">Discount (EGP)</span>
                  <input
                    type="number"
                    min="0"
                    value={discountAmount || ''}
                    onChange={(e) => setDiscountAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                    placeholder="0"
                    className="w-20 px-2 py-1 bg-stone-900 border border-stone-700 rounded text-right font-mono text-amber-400 font-bold focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="border-t border-stone-800 pt-2 flex justify-between text-base font-black">
                  <span className="text-white">FINAL TOTAL:</span>
                  <span className="text-amber-400 font-mono">
                    {Math.max(0, checkoutTable.items.reduce((s, i) => s + i.price * i.quantity, 0) - discountAmount)}{' '}
                    EGP
                  </span>
                </div>
              </div>

              {/* Payment Method selector */}
              <div>
                <label className="text-[11px] uppercase font-bold text-stone-400 block mb-2">
                  Payment Method
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => {
                      sound.playTap();
                      setPaymentMethod('cash');
                    }}
                    className={`py-2.5 px-3 rounded-xl border font-bold text-xs flex flex-col items-center gap-1 transition ${
                      paymentMethod === 'cash'
                        ? 'bg-amber-500 text-stone-950 border-amber-500 font-black'
                        : 'bg-stone-950 text-stone-300 border-stone-800 hover:bg-stone-800'
                    }`}
                  >
                    <Banknote className="w-4 h-4" />
                    <span>Cash</span>
                  </button>

                  <button
                    onClick={() => {
                      sound.playTap();
                      setPaymentMethod('card');
                    }}
                    className={`py-2.5 px-3 rounded-xl border font-bold text-xs flex flex-col items-center gap-1 transition ${
                      paymentMethod === 'card'
                        ? 'bg-amber-500 text-stone-950 border-amber-500 font-black'
                        : 'bg-stone-950 text-stone-300 border-stone-800 hover:bg-stone-800'
                    }`}
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Card / POS</span>
                  </button>

                  <button
                    onClick={() => {
                      sound.playTap();
                      setPaymentMethod('wallet');
                    }}
                    className={`py-2.5 px-3 rounded-xl border font-bold text-xs flex flex-col items-center gap-1 transition ${
                      paymentMethod === 'wallet'
                        ? 'bg-amber-500 text-stone-950 border-amber-500 font-black'
                        : 'bg-stone-950 text-stone-300 border-stone-800 hover:bg-stone-800'
                    }`}
                  >
                    <Smartphone className="w-4 h-4" />
                    <span>VF Cash / Insta</span>
                  </button>
                </div>
              </div>

              {/* Cash Tendered & Change calculator (if Cash) */}
              {paymentMethod === 'cash' && (
                <div className="space-y-2 bg-stone-950 p-3.5 rounded-xl border border-stone-800">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-stone-400">Cash Tendered (EGP):</span>
                    <input
                      type="number"
                      value={tenderedAmount}
                      onChange={(e) => setTenderedAmount(e.target.value)}
                      className="w-24 px-2 py-1 bg-stone-900 border border-stone-700 rounded text-right font-mono text-white font-bold"
                    />
                  </div>

                  {/* Cash Quick Presets */}
                  <div className="flex gap-1.5 pt-1">
                    {[50, 100, 200, 500].map((preset) => (
                      <button
                        key={preset}
                        onClick={() => {
                          sound.playTap();
                          setTenderedAmount(String(preset));
                        }}
                        className="flex-1 py-1 bg-stone-850 hover:bg-stone-700 text-stone-300 font-mono text-[11px] rounded border border-stone-700"
                      >
                        {preset}
                      </button>
                    ))}
                  </div>

                  {/* Change due */}
                  {parseFloat(tenderedAmount) >= Math.max(0, checkoutTable.items.reduce((s, i) => s + i.price * i.quantity, 0) - discountAmount) && (
                    <div className="pt-2 border-t border-stone-800 flex justify-between text-xs font-bold text-emerald-400">
                      <span>Change to Return:</span>
                      <span className="font-mono text-sm">
                        {(parseFloat(tenderedAmount) - Math.max(0, checkoutTable.items.reduce((s, i) => s + i.price * i.quantity, 0) - discountAmount)).toFixed(2)} EGP
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Queue Reordering Notice banner */}
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-2.5 text-xs text-amber-300">
                <ArrowRightLeft className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">Dynamic Table Reordering:</span>
                  Closing Table {checkoutTable.tableNumber} will automatically shift subsequent tables up (Table {checkoutTable.tableNumber + 1} becomes Table {checkoutTable.tableNumber}) so the caravan queue stays sequential!
                </div>
              </div>

            </div>

            {/* Modal Bottom Actions */}
            <div className="p-4 bg-stone-950 border-t border-stone-800 flex gap-2">
              <button
                onClick={() => setCheckoutTable(null)}
                className="flex-1 py-3 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-semibold text-xs"
              >
                Cancel
              </button>

              <button
                onClick={handleSettleAndCloseTable}
                className="flex-[2] py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 active:scale-95 transition"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Confirm Payment & Shift Queue</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL 3: EDIT TABLE META (Customer name, guests, notes) */}
      {editingMetaTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-stone-900 border border-stone-800 rounded-3xl w-[95%] sm:max-w-sm max-h-[90vh] overflow-y-auto p-5 space-y-4 shadow-xl">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <span>Edit Details for Table {editingMetaTable.tableNumber}</span>
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-stone-400 block mb-1">Customer / Group Name</label>
                <input
                  type="text"
                  value={editCustomerName}
                  onChange={(e) => setEditCustomerName(e.target.value)}
                  placeholder="e.g. Youssef & Friends"
                  className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-white text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-stone-400 block mb-1">Guest Count</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={editGuestCount}
                  onChange={(e) => setEditGuestCount(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-white text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-stone-400 block mb-1">Caravan Table Notes / Location</label>
                <input
                  type="text"
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="e.g. Near umbrella, Corner stool"
                  className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-white text-xs focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setEditingMetaTable(null)}
                className="flex-1 py-2.5 rounded-xl bg-stone-800 text-stone-300 font-semibold text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveTableMeta}
                className="flex-1 py-2.5 rounded-xl bg-amber-500 text-stone-950 font-bold text-xs hover:bg-amber-400"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* In-app confirmation prompt modal for table and item deletions */}
      <ConfirmModal
        state={confirmModal}
        onClose={() => setConfirmModal(null)}
      />

    </div>
  );
};
