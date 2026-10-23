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
  RotateCcw,
  ChevronUp,
  X,
  ShoppingBag
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
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);

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
        setIsMobileCartOpen(false);
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
    setIsMobileCartOpen(false);
  };

  const filteredItems = menuItems.filter(item => {
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const renderCartContent = (isDrawer = false) => (
    <div className={`flex flex-col h-full justify-between ${isDrawer ? 'space-y-4' : ''}`}>
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

          <div className="flex items-center gap-2">
            {cartItems.length > 0 && (
              <button
                type="button"
                onClick={handleClearCart}
                className="text-stone-400 hover:text-red-400 text-xs flex items-center gap-1.5 transition px-2.5 py-1.5 rounded-lg hover:bg-red-500/10 cursor-pointer"
                title={dict.clearAll}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{dict.clearAll}</span>
              </button>
            )}
            {isDrawer && (
              <button
                type="button"
                onClick={() => setIsMobileCartOpen(false)}
                className="p-1.5 rounded-xl bg-stone-800 text-stone-400 hover:text-white cursor-pointer"
                title="Close Drawer"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Cart items list */}
        <div className={`py-3 space-y-2 overflow-y-auto pr-1 ${isDrawer ? 'max-h-[38vh]' : 'max-h-56'}`}>
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
                className="p-2.5 rounded-xl bg-stone-950/60 border border-stone-800/80 flex items-center justify-between text-xs gap-2"
              >
                <div className="truncate pr-1 flex-1 min-w-0">
                  <div className="font-bold text-stone-200 truncate text-xs sm:text-sm">{item.name}</div>
                  <div className="text-[10px] text-stone-400 font-mono">
                    {item.price} EGP • Unit Cost: {item.unitCost.toFixed(0)} EGP
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleUpdateQuantity(item.menuItemId, -1)}
                    className="w-7 h-7 sm:w-6 sm:h-6 rounded-lg bg-stone-800 hover:bg-stone-700 active:scale-90 text-stone-200 font-bold flex items-center justify-center text-sm cursor-pointer"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-6 text-center font-bold text-white font-mono text-xs">{item.quantity}</span>
                  <button
                    type="button"
                    onClick={() => handleUpdateQuantity(item.menuItemId, 1)}
                    className="w-7 h-7 sm:w-6 sm:h-6 rounded-lg bg-stone-800 hover:bg-stone-700 active:scale-90 text-stone-200 font-bold flex items-center justify-center text-sm cursor-pointer"
                    aria-label="Increase quantity"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-12 text-right font-mono font-bold text-amber-400 text-xs">
                    {item.price * item.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveFromCart(item.menuItemId)}
                    className="p-1.5 sm:p-1 rounded-lg bg-stone-850 hover:bg-red-500/20 text-stone-400 hover:text-red-400 ml-1 transition cursor-pointer"
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
            placeholder={dict.orderNotePlaceholder || "Order Note (e.g. Car plate / White SUV / Extra ice)..."}
            value={customerNote}
            onChange={(e) => setCustomerNote(e.target.value)}
            className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-xs text-white placeholder-stone-600 focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* Financial & Settlement Section */}
      <div className="pt-4 border-t border-stone-800 space-y-3">
        {/* Subtotal, discount, margin stats */}
        <div className="bg-stone-950 p-3 rounded-xl border border-stone-800 space-y-1.5 text-xs">
          <div className="flex justify-between text-stone-400">
            <span>Subtotal ({cartItems.reduce((s, i) => s + i.quantity, 0)} items)</span>
            <span className="font-mono text-white font-bold">{subtotal} EGP</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-stone-400">{dict.discount} (EGP)</span>
            <input
              type="number"
              min="0"
              value={discountAmount || ''}
              onChange={(e) => setDiscountAmount(Math.max(0, parseFloat(e.target.value) || 0))}
              placeholder="0"
              className="w-20 px-2 py-1 bg-stone-900 border border-stone-700 rounded text-right font-mono text-amber-400 text-xs focus:outline-none focus:border-amber-500 font-bold"
            />
          </div>

          <div className="flex justify-between text-[11px] text-stone-400 pt-1 border-t border-stone-850">
            <span>Caravan Cost: <strong className="font-mono text-stone-300">{totalCost.toFixed(0)} EGP</strong></span>
            <span className="text-emerald-400 font-bold font-mono">
              +{netProfit.toFixed(0)} EGP ({marginPct}%)
            </span>
          </div>

          <div className="pt-1.5 border-t border-stone-800 flex justify-between items-center">
            <span className="font-black text-white text-sm">{dict.total}:</span>
            <span className="font-mono font-black text-amber-400 text-lg">
              {total} <span className="text-xs font-sans text-stone-400">{dict.currency}</span>
            </span>
          </div>
        </div>

        {/* Payment Method Selector */}
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => {
              sound.playTap();
              setPaymentMethod('cash');
            }}
            className={`py-2 px-2 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition cursor-pointer ${
              paymentMethod === 'cash'
                ? 'bg-amber-500 text-stone-950 border-amber-500 shadow-sm'
                : 'bg-stone-950 text-stone-300 border-stone-800 hover:bg-stone-800'
            }`}
          >
            <Banknote className="w-4 h-4" />
            <span>{dict.paymentCash}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              sound.playTap();
              setPaymentMethod('card');
            }}
            className={`py-2 px-2 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition cursor-pointer ${
              paymentMethod === 'card'
                ? 'bg-amber-500 text-stone-950 border-amber-500 shadow-sm'
                : 'bg-stone-950 text-stone-300 border-stone-800 hover:bg-stone-800'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>{dict.paymentVisa}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              sound.playTap();
              setPaymentMethod('wallet');
            }}
            className={`py-2 px-2 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition cursor-pointer ${
              paymentMethod === 'wallet'
                ? 'bg-amber-500 text-stone-950 border-amber-500 shadow-sm'
                : 'bg-stone-950 text-stone-300 border-stone-800 hover:bg-stone-800'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>{dict.paymentInstaPay}</span>
          </button>
        </div>

        {/* Cash Tendered Input & Presets */}
        {paymentMethod === 'cash' && cartItems.length > 0 && (
          <div className="space-y-1.5 bg-stone-950 p-2.5 rounded-xl border border-stone-800 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-stone-400">{dict.tenderedCash}:</span>
              <input
                type="number"
                placeholder={String(total)}
                value={tenderedAmount}
                onChange={(e) => setTenderedAmount(e.target.value)}
                className="w-24 px-2 py-1 bg-stone-900 border border-stone-700 rounded text-right font-mono text-white text-xs font-bold focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Quick cash presets */}
            <div className="flex gap-1 pt-1">
              {[
                { label: 'Exact', val: total },
                { label: '50', val: 50 },
                { label: '100', val: 100 },
                { label: '200', val: 200 },
                { label: '500', val: 500 }
              ].map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    sound.playTap();
                    setTenderedAmount(String(item.val));
                  }}
                  className="flex-1 py-1 rounded bg-stone-850 hover:bg-stone-700 text-stone-300 font-mono text-[10px] border border-stone-700 active:scale-95 cursor-pointer"
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

        {/* Complete Order Button */}
        <button
          type="button"
          disabled={cartItems.length === 0}
          onClick={() => {
            handleCheckoutTakeaway();
            if (isDrawer) setIsMobileCartOpen(false);
          }}
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
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      
      {/* LEFT / CENTER: FAST-LANE MENU SELECTION */}
      <div className="lg:col-span-7 xl:col-span-8 flex flex-col space-y-3 min-h-[calc(100vh-190px)] w-full">
        
        {/* Fast-lane header & search */}
        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-3.5 sm:p-4 space-y-3 shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
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

        {/* Menu Items Touch Grid - 2 cols on mobile, 3-4 on tablet, 4-5 on desktop */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-2.5 flex-1 min-h-[calc(100vh-260px)] auto-rows-max overflow-y-auto pr-1 pb-28 lg:pb-4">
          {filteredItems.map((item) => {
            const inCart = cartItems.find(c => c.menuItemId === item.id);

            return (
              <button
                key={item.id}
                onClick={() => handleAddToCart(item)}
                className={`p-2.5 sm:p-3 rounded-2xl border text-left transition-all relative flex flex-col justify-between group active:scale-[0.97] min-h-[105px] cursor-pointer ${
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

      {/* RIGHT: DESKTOP FAST-LANE CART & SETTLEMENT (SIDE-BY-SIDE ON LG+) */}
      <div className="hidden lg:flex lg:col-span-5 xl:col-span-4 bg-stone-900 border border-stone-800 rounded-3xl p-5 shadow-2xl flex-col justify-between sticky top-24 min-h-[500px]">
        {renderCartContent(false)}
      </div>

      {/* MOBILE FLOATING CART SUMMARY BAR (VISIBLE ON < LG WHEN CART HAS ITEMS) */}
      {cartItems.length > 0 && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 p-3 bg-stone-900/95 backdrop-blur-md border-t border-stone-800 shadow-[0_-8px_25px_rgba(0,0,0,0.5)]">
          <div className="max-w-md mx-auto flex items-center justify-between gap-3">
            <div 
              onClick={() => setIsMobileCartOpen(true)}
              className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0 active:opacity-80"
            >
              <div className="relative shrink-0">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                  <ShoppingBag className="w-5 h-5 text-amber-400" />
                </div>
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-500 text-stone-950 font-black text-xs flex items-center justify-center shadow">
                  {cartItems.reduce((s, i) => s + i.quantity, 0)}
                </span>
              </div>
              <div className="truncate">
                <span className="text-[11px] text-stone-400 block leading-tight">
                  {cartItems.reduce((s, i) => s + i.quantity, 0)} {language === 'ar' ? 'أصناف' : 'items'}
                </span>
                <span className="font-mono font-black text-white text-base">
                  {total} <span className="text-xs text-amber-400">{dict.currency}</span>
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsMobileCartOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/25 active:scale-95 cursor-pointer shrink-0"
            >
              <span>{language === 'ar' ? 'عرض السلة والمحاسبة' : 'View Cart & Pay'}</span>
              <ChevronUp className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </div>
      )}

      {/* MOBILE SLIDE-UP DRAWER MODAL (DRAWER FOR FULL CHECKOUT ON MOBILE) */}
      {isMobileCartOpen && (
        <div 
          className="lg:hidden fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setIsMobileCartOpen(false)}
        >
          <div 
            className="bg-stone-900 border-t border-x border-stone-800 rounded-t-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-4 sm:p-5 shadow-2xl animate-in slide-in-from-bottom duration-250 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-1 rounded-full bg-stone-700 mx-auto mb-3 shrink-0" />
            {renderCartContent(true)}
          </div>
        </div>
      )}

      {/* In-app confirmation modal for cart item deletion and clearing */}
      <ConfirmModal
        state={confirmModal}
        onClose={() => setConfirmModal(null)}
      />

    </div>
  );
};
