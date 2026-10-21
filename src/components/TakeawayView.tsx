import React, { useState } from 'react';
import { MenuItem, OrderItem, ClosedOrder, PaymentMethod, POSSettings } from '../types/pos';
import { 
  Store, 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  Banknote, 
  CreditCard, 
  Smartphone, 
  Sparkles,
  Receipt,
  RotateCcw
} from 'lucide-react';
import { sound } from '../utils/sound';
import { HorizontalScrollContainer } from './HorizontalScrollContainer';
import { ConfirmModal, ConfirmModalState } from './ConfirmModal';
import { Language, Translations, translations } from '../utils/i18n';

interface TakeawayViewProps {
  menuItems: MenuItem[];
  settings: POSSettings;
  onOrderCompleted: (order: ClosedOrder) => void;
  onShowReceipt: (order: ClosedOrder) => void;
  language?: Language;
  t?: Translations;
}

export const TakeawayView: React.FC<TakeawayViewProps> = ({
  menuItems,
  settings,
  onOrderCompleted,
  onShowReceipt,
  language = 'en',
  t,
}) => {
  const dict = t || translations[language];
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Current Cart State
  const [cartItems, setCartItems] = useState<OrderItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [tenderedAmount, setTenderedAmount] = useState<string>('');
  const [customerNote, setCustomerNote] = useState('');
  const [confirmModal, setConfirmModal] = useState<ConfirmModalState | null>(null);

  const categories = ['All', ...Array.from(new Set(menuItems.map(m => m.category)))];

  // Add item to cart
  const handleAddToCart = (item: MenuItem) => {
    sound.playTap();
    setCartItems(prev => {
      const idx = prev.findIndex(i => i.menuItemId === item.id);
      if (idx > -1) {
        return prev.map((it, i) => i === idx ? { ...it, quantity: it.quantity + 1 } : it);
      }
      return [
        ...prev,
        {
          menuItemId: item.id,
          name: item.name,
          category: item.category,
          price: item.price,
          unitCost: item.totalCost,
          quantity: 1,
          notes: ''
        }
      ];
    });
  };

  const handleUpdateQuantity = (itemId: string, delta: number) => {
    sound.playTap();
    const item = cartItems.find(i => i.menuItemId === itemId);
    if (!item) return;

    if (delta < 0 && item.quantity <= 1) {
      handleRemoveFromCart(itemId);
      return;
    }

    setCartItems(prev =>
      prev
        .map(i => {
          if (i.menuItemId === itemId) {
            const nextQty = i.quantity + delta;
            return nextQty > 0 ? { ...i, quantity: nextQty } : null;
          }
          return i;
        })
        .filter((i): i is OrderItem => i !== null)
    );
  };

  const handleRemoveFromCart = (itemId: string) => {
    sound.playTap();
    const item = cartItems.find(i => i.menuItemId === itemId);
    const itemName = item?.name || 'this item';
    setConfirmModal({
      isOpen: true,
      title: 'Remove Item from Cart',
      message: `Are you sure you want to remove "${itemName}" from the order?`,
      confirmLabel: 'Remove Item',
      onConfirm: () => {
        setCartItems(prev => prev.filter(i => i.menuItemId !== itemId));
      }
    });
  };

  const handleClearCart = () => {
    sound.playTap();
    if (cartItems.length === 0) return;
    setConfirmModal({
      isOpen: true,
      title: 'Clear Takeaway Order',
      message: `Are you sure you want to clear all ${cartItems.reduce((s, i) => s + i.quantity, 0)} items from this order?`,
      confirmLabel: 'Clear All',
      onConfirm: () => {
        setCartItems([]);
        setDiscountAmount(0);
        setTenderedAmount('');
        setCustomerNote('');
      }
    });
  };

  // Calculations
  const subtotal = cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const total = Math.max(0, subtotal - discountAmount);
  const totalCost = cartItems.reduce((sum, i) => sum + i.unitCost * i.quantity, 0);
  const netProfit = total - totalCost;
  const marginPct = total > 0 ? ((netProfit / total) * 100).toFixed(1) : '0';

  const numericTendered = parseFloat(tenderedAmount) || 0;
  const changeDue = Math.max(0, numericTendered - total);

  // Settlement & Immediate Archiving
  const handleCheckoutTakeaway = () => {
    if (cartItems.length === 0) return;

    const orderNumber = `BIMBO-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(Date.now()).slice(-4)}`;
    
    const paidTender = paymentMethod === 'cash' ? (numericTendered || total) : total;

    const closedOrder: ClosedOrder = {
      id: `ord-takeaway-${Date.now()}`,
      orderNumber,
      type: 'takeaway',
      timestamp: new Date().toISOString(),
      items: [...cartItems],
      subtotal,
      discount: discountAmount,
      total,
      totalCost,
      netProfit,
      paymentMethod,
      tendered: paidTender,
      change: paymentMethod === 'cash' ? Math.max(0, paidTender - total) : 0,
      customerNotes: customerNote.trim() || 'Drive-thru / Caravan Window'
    };

    sound.playCash();
    onOrderCompleted(closedOrder);
    onShowReceipt(closedOrder);

    // Reset fast lane for next customer
    handleClearCart();
  };

  const filteredItems = menuItems.filter(item => {
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      
      {/* LEFT: FAST-LANE MENU SELECTION */}
      <div className="lg:col-span-7 xl:col-span-8 flex flex-col space-y-3 min-h-[calc(100vh-190px)]">
        
        {/* Fast-lane header & search */}
        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-3.5 sm:p-4 space-y-3 shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                <Store className="w-5 h-5 text-amber-400" />
                <span>{dict.fastLaneTakeaway}</span>
              </h2>
              <p className="text-xs text-stone-400">
                {dict.takeawaySubtitle}
              </p>
            </div>

            {/* Quick search */}
            <div className="relative sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
              <input
                type="text"
                placeholder={dict.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-stone-950 border border-stone-800 rounded-xl text-xs text-white placeholder-stone-500 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Category Tabs with Horizontal Scroll Buttons */}
          <HorizontalScrollContainer scrollAmount={220}>
            <div className="flex gap-1.5 scrollbar-none">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    sound.playTap();
                    setSelectedCategory(cat);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition shrink-0 cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-amber-500 text-stone-950 font-bold shadow-md shadow-amber-500/20'
                      : 'bg-stone-950 text-stone-300 border border-stone-800/80 hover:bg-stone-800 hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </HorizontalScrollContainer>
        </div>

        {/* Menu Items Touch Grid - Expanded vertically with multi-column responsiveness */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-2.5 flex-1 min-h-[calc(100vh-260px)] auto-rows-max overflow-y-auto pr-1 pb-4">
          {filteredItems.map((item) => {
            const inCart = cartItems.find(c => c.menuItemId === item.id);

            return (
              <button
                key={item.id}
                onClick={() => handleAddToCart(item)}
                className={`p-3 rounded-2xl border text-left transition-all relative flex flex-col justify-between group active:scale-[0.97] min-h-[105px] cursor-pointer ${
                  inCart
                    ? 'bg-amber-500/15 border-amber-500 shadow-lg shadow-amber-500/10 ring-1 ring-amber-500/40'
                    : 'bg-stone-900 border-stone-800 hover:border-amber-500/50 hover:bg-stone-850 shadow-sm'
                }`}
              >
                {/* Badge if any */}
                {item.badge && (
                  <span className="absolute top-2 right-2 text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {item.badge}
                  </span>
                )}

                {/* Cart qty indicator badge */}
                {inCart && (
                  <span className="absolute top-2 left-2 w-5 h-5 rounded-full bg-amber-500 text-stone-950 font-black text-xs flex items-center justify-center shadow">
                    {inCart.quantity}
                  </span>
                )}

                <div className={`mt-0.5 ${inCart ? 'pt-4' : ''}`}>
                  <h4 className="font-bold text-white text-xs sm:text-sm line-clamp-2 leading-tight group-hover:text-amber-400 transition">
                    {item.name}
                  </h4>
                  <span className="text-[10px] text-stone-400 block mt-0.5">{item.category}</span>
                </div>

                <div className="mt-2.5 pt-2 border-t border-stone-800/60 flex items-center justify-between">
                  <span className="font-mono font-black text-amber-400 text-xs sm:text-sm">
                    {item.price} <span className="text-[9px] font-sans text-stone-400">EGP</span>
                  </span>
                  <span className="text-[9px] text-emerald-400 font-semibold font-mono">
                    +{item.netProfit.toFixed(0)} net
                  </span>
                </div>
              </button>
            );
          })}
        </div>

      </div>

      {/* RIGHT: LIVE FAST-LANE CART & SETTLEMENT */}
      <div className="lg:col-span-5 xl:col-span-4 bg-stone-900 border border-stone-800 rounded-3xl p-5 shadow-2xl flex flex-col justify-between sticky top-24">
        
        {/* Cart Header */}
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-stone-800">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                <Receipt className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-black text-white text-base">{dict.currentTakeaway}</h3>
                <span className="text-[11px] text-stone-400">{dict.driveThruTicket}</span>
              </div>
            </div>

            {cartItems.length > 0 && (
              <button
                type="button"
                onClick={handleClearCart}
                className="text-stone-400 hover:text-red-400 text-xs flex items-center gap-1.5 transition px-2 py-1 rounded-lg hover:bg-red-500/10 cursor-pointer"
                title={dict.clearAll}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{dict.clearAll}</span>
              </button>
            )}
          </div>

          {/* Cart items list */}
          <div className="py-3 space-y-2 max-h-56 overflow-y-auto pr-1">
            {cartItems.length === 0 ? (
              <div className="py-8 text-center text-stone-500 space-y-2">
                <img 
                  src="/assets/aistudio/Gemini_Generated_Image_cbgr2zcbgr2zcbgr_cddd89ba.jpg" 
                  alt="BIMBO Cafe & Restaurant" 
                  className="w-12 h-12 rounded-full object-cover mx-auto opacity-70 border border-stone-700"
                />
                <p className="text-xs font-medium text-stone-400">{dict.emptyCartNotice}</p>
                <p className="text-[11px] text-stone-600">{dict.emptyCartSub}</p>
              </div>
            ) : (
              cartItems.map((item) => (
                <div
                  key={item.menuItemId}
                  className="p-2.5 rounded-xl bg-stone-950/60 border border-stone-800/80 flex items-center justify-between text-xs"
                >
                  <div className="truncate pr-2">
                    <div className="font-bold text-stone-200 truncate">{item.name}</div>
                    <div className="text-[10px] text-stone-400 font-mono">
                      {item.price} EGP • Unit Cost: {item.unitCost.toFixed(0)} EGP
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleUpdateQuantity(item.menuItemId, -1)}
                      className="w-6 h-6 rounded bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold flex items-center justify-center"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-5 text-center font-bold text-white font-mono">{item.quantity}</span>
                    <button
                      onClick={() => handleUpdateQuantity(item.menuItemId, 1)}
                      className="w-6 h-6 rounded bg-stone-800 hover:bg-stone-700 text-stone-300 font-bold flex items-center justify-center"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                    <span className="w-12 text-right font-mono font-bold text-amber-400">
                      {item.price * item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveFromCart(item.menuItemId)}
                      className="p-1 rounded bg-stone-850 hover:bg-red-500/20 text-stone-400 hover:text-red-400 ml-1 transition cursor-pointer"
                      title="Remove item from order"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Customer / Caravan Window note */}
          <div className="pt-2">
            <input
              type="text"
              placeholder="Order Note (e.g. Car plate / White SUV / Extra ice)..."
              value={customerNote}
              onChange={(e) => setCustomerNote(e.target.value)}
              className="w-full px-3 py-1.5 bg-stone-950 border border-stone-800 rounded-xl text-xs text-white placeholder-stone-600 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {/* Financial & Settlement Section */}
        <div className="pt-4 border-t border-stone-800 space-y-3">
          
          {/* Subtotal, discount, margin stats */}
          <div className="bg-stone-950 p-3 rounded-xl border border-stone-800 space-y-1.5 text-xs">
            <div className="flex justify-between text-stone-400">
              <span>Subtotal ({cartItems.reduce((s, i) => s + i.quantity, 0)} items)</span>
              <span className="font-mono text-white">{subtotal} EGP</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-stone-400">Discount (EGP)</span>
              <input
                type="number"
                min="0"
                value={discountAmount || ''}
                onChange={(e) => setDiscountAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                placeholder="0"
                className="w-20 px-2 py-0.5 bg-stone-900 border border-stone-700 rounded text-right font-mono text-amber-400 text-xs focus:outline-none"
              />
            </div>

            <div className="flex justify-between text-stone-400 text-[11px] pt-0.5">
              <span>Cost of Goods (COGS)</span>
              <span className="font-mono text-stone-400">{totalCost.toFixed(1)} EGP</span>
            </div>

            <div className="flex justify-between text-emerald-400 text-[11px] font-semibold">
              <span>Net Profit (Margin: {marginPct}%)</span>
              <span className="font-mono">+{netProfit.toFixed(1)} EGP</span>
            </div>

            <div className="border-t border-stone-800 pt-1.5 flex justify-between text-base font-black">
              <span className="text-white">TOTAL PAYABLE:</span>
              <span className="text-amber-400 font-mono">{total} EGP</span>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => {
                sound.playTap();
                setPaymentMethod('cash');
              }}
              className={`py-2 px-2 rounded-xl border font-bold text-xs flex flex-col items-center gap-1 transition ${
                paymentMethod === 'cash'
                  ? 'bg-amber-500 text-stone-950 border-amber-500 font-black shadow'
                  : 'bg-stone-950 text-stone-300 border-stone-800 hover:bg-stone-800'
              }`}
            >
              <Banknote className="w-3.5 h-3.5" />
              <span>{dict.paymentCash}</span>
            </button>

            <button
              onClick={() => {
                sound.playTap();
                setPaymentMethod('card');
              }}
              className={`py-2 px-2 rounded-xl border font-bold text-xs flex flex-col items-center gap-1 transition ${
                paymentMethod === 'card'
                  ? 'bg-amber-500 text-stone-950 border-amber-500 font-black shadow'
                  : 'bg-stone-950 text-stone-300 border-stone-800 hover:bg-stone-800'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>{dict.paymentVisa}</span>
            </button>

            <button
              onClick={() => {
                sound.playTap();
                setPaymentMethod('wallet');
              }}
              className={`py-2 px-2 rounded-xl border font-bold text-xs flex flex-col items-center gap-1 transition ${
                paymentMethod === 'wallet'
                  ? 'bg-amber-500 text-stone-950 border-amber-500 font-black shadow'
                  : 'bg-stone-950 text-stone-300 border-stone-800 hover:bg-stone-800'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>{dict.paymentInstaPay}</span>
            </button>
          </div>

          {/* Cash Tender & Change shortcuts */}
          {paymentMethod === 'cash' && cartItems.length > 0 && (
            <div className="space-y-1.5 bg-stone-950 p-2.5 rounded-xl border border-stone-800">
              <div className="flex items-center justify-between text-xs">
                <span className="text-stone-400">Cash Received:</span>
                <input
                  type="number"
                  placeholder={String(total)}
                  value={tenderedAmount}
                  onChange={(e) => setTenderedAmount(e.target.value)}
                  className="w-24 px-2 py-1 bg-stone-900 border border-stone-700 rounded text-right font-mono text-white text-xs font-bold"
                />
              </div>

              {/* Denomination buttons */}
              <div className="flex gap-1">
                {[
                  { label: 'Exact', val: total },
                  { label: '50', val: 50 },
                  { label: '100', val: 100 },
                  { label: '200', val: 200 },
                  { label: '500', val: 500 }
                ].map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      sound.playTap();
                      setTenderedAmount(String(item.val));
                    }}
                    className="flex-1 py-1 bg-stone-850 hover:bg-stone-700 text-stone-300 font-mono text-[10px] rounded border border-stone-700"
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {numericTendered >= total && numericTendered > 0 && (
                <div className="flex justify-between items-center text-xs font-bold text-emerald-400 pt-1 border-t border-stone-800">
                  <span>{dict.changeDue}:</span>
                  <span className="font-mono text-sm">{changeDue.toFixed(2)} {dict.currency}</span>
                </div>
              )}
            </div>
          )}

          {/* Settle & Archive Action Button */}
          <button
            type="button"
            disabled={cartItems.length === 0}
            onClick={handleCheckoutTakeaway}
            className={`w-full py-3.5 px-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-xl transition active:scale-95 cursor-pointer ${
              cartItems.length === 0
                ? 'bg-stone-800 text-stone-600 cursor-not-allowed border border-stone-800'
                : 'bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-stone-950 shadow-amber-500/25'
            }`}
          >
            <Sparkles className="w-4 h-4 fill-stone-950" />
            <span>{dict.completeOrder} ({total} {dict.currency})</span>
          </button>

        </div>

      </div>

      {/* In-app confirmation modal for cart item deletion and clearing */}
      <ConfirmModal
        state={confirmModal}
        onClose={() => setConfirmModal(null)}
      />

    </div>
  );
};
