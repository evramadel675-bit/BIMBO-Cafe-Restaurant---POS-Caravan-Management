import React, { useState, useRef } from 'react';
import { MenuItem, CostBreakdown, POSSettings } from '../types/pos';
import { 
  Coffee, 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Sparkles, 
  X, 
  TrendingUp, 
  Percent,
  CheckCircle2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { sound } from '../utils/sound';
import { HorizontalScrollContainer } from './HorizontalScrollContainer';
import { ConfirmModal, ConfirmModalState } from './ConfirmModal';

interface MenuManagementViewProps {
  menuItems: MenuItem[];
  settings: POSSettings;
  onUpdateMenu: (items: MenuItem[], message?: string) => void;
}

export const MenuManagementView: React.FC<MenuManagementViewProps> = ({
  menuItems,
  onUpdateMenu
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [confirmModal, setConfirmModal] = useState<ConfirmModalState | null>(null);
  const categoryScrollRef = useRef<HTMLDivElement>(null);
  
  // State for Add / Edit modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('Hot Coffee');
  const [formPrice, setFormPrice] = useState<number>(60);
  const [formDesc, setFormDesc] = useState('');
  const [formBadge, setFormBadge] = useState('');

  // Cost Breakdown fields
  const [costCup, setCostCup] = useState<number>(3.5);
  const [costCoffee, setCostCoffee] = useState<number>(12);
  const [costMilk, setCostMilk] = useState<number>(15);
  const [costSugar, setCostSugar] = useState<number>(0.5);
  const [costSyrup, setCostSyrup] = useState<number>(0);
  const [costCover, setCostCover] = useState<number>(1.5);
  const [costOther, setCostOther] = useState<number>(0);

  const categories = ['All', ...Array.from(new Set(menuItems.map(m => m.category)))];
  const standardCategories = [
    'Hot Coffee',
    'Cold Brew & Iced',
    'Caravan Shakes',
    'Food & Sandwiches',
    'Bakery & Sweets',
    'Specialty Drinks'
  ];

  // Dynamic live calculation for the form
  const computedTotalCost = Number(
    (costCup + costCoffee + costMilk + costSugar + costSyrup + costCover + costOther).toFixed(2)
  );
  const computedNetProfit = Number((formPrice - computedTotalCost).toFixed(2));
  const computedMargin = formPrice > 0 ? Number(((computedNetProfit / formPrice) * 100).toFixed(1)) : 0;

  const handleOpenAddModal = () => {
    sound.playTap();
    setEditingItem(null);
    setFormName('');
    setFormCategory('Hot Coffee');
    setFormPrice(65);
    setFormDesc('');
    setFormBadge('');
    setCostCup(3.5);
    setCostCoffee(12);
    setCostMilk(15);
    setCostSugar(0.5);
    setCostSyrup(0);
    setCostCover(1.5);
    setCostOther(0);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: MenuItem) => {
    sound.playTap();
    setEditingItem(item);
    setFormName(item.name);
    setFormCategory(item.category);
    setFormPrice(item.price);
    setFormDesc(item.description || '');
    setFormBadge(item.badge || '');
    setCostCup(item.costs.cupAndLid);
    setCostCoffee(item.costs.coffeeOrBase);
    setCostMilk(item.costs.milk);
    setCostSugar(item.costs.sugar);
    setCostSyrup(item.costs.syrupAndSauce);
    setCostCover(item.costs.coverPackaging);
    setCostOther(item.costs.other);
    setIsModalOpen(true);
  };

  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    sound.playTap();

    const costs: CostBreakdown = {
      cupAndLid: Number(costCup.toFixed(2)),
      coffeeOrBase: Number(costCoffee.toFixed(2)),
      milk: Number(costMilk.toFixed(2)),
      sugar: Number(costSugar.toFixed(2)),
      syrupAndSauce: Number(costSyrup.toFixed(2)),
      coverPackaging: Number(costCover.toFixed(2)),
      other: Number(costOther.toFixed(2))
    };

    const totalCost = computedTotalCost;
    const netProfit = computedNetProfit;
    const marginPercent = computedMargin;

    if (editingItem) {
      // Edit existing
      const updated = menuItems.map(item =>
        item.id === editingItem.id
          ? {
              ...item,
              name: formName.trim(),
              category: formCategory,
              price: formPrice,
              costs,
              totalCost,
              netProfit,
              marginPercent,
              description: formDesc.trim() || undefined,
              badge: formBadge.trim() || undefined
            }
          : item
      );
      onUpdateMenu(updated, `Updated "${formName.trim()}" recipe and pricing!`);
    } else {
      // Add new
      const newItem: MenuItem = {
        id: `item-${Date.now()}`,
        name: formName.trim(),
        category: formCategory,
        price: formPrice,
        costs,
        totalCost,
        netProfit,
        marginPercent,
        isAvailable: true,
        description: formDesc.trim() || undefined,
        badge: formBadge.trim() || undefined
      };
      onUpdateMenu([newItem, ...menuItems], `Added new recipe "${formName.trim()}" to menu!`);
    }

    setIsModalOpen(false);
  };

  const handleDeleteItem = (itemId: string, itemName: string) => {
    sound.playTap();
    setConfirmModal({
      isOpen: true,
      title: 'Delete Menu Recipe',
      message: `Are you sure you want to permanently remove "${itemName}" from the caravan menu?`,
      confirmLabel: 'Delete Recipe',
      onConfirm: () => {
        const updated = menuItems.filter(i => i.id !== itemId);
        onUpdateMenu(updated, `Removed "${itemName}" from menu.`);
      }
    });
  };

  const handleToggleAvailability = (itemId: string) => {
    sound.playTap();
    const updated = menuItems.map(i =>
      i.id === itemId ? { ...i, isAvailable: !i.isAvailable } : i
    );
    onUpdateMenu(updated);
  };

  const filteredItems = menuItems.filter(item => {
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleScrollCategories = (direction: 'left' | 'right') => {
    sound.playTap();
    if (categoryScrollRef.current) {
      const scrollOffset = 260;
      categoryScrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollOffset : scrollOffset,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Controls Bar */}
      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Coffee className="w-6 h-6 text-amber-400" />
            <span>Menu & Recipe Cost Breakdown</span>
          </h2>
          <p className="text-xs text-stone-400 mt-1">
            Ingredient cost tracking: Cup, Coffee, Milk, Sugar, Syrups & Packaging with real-time profit margins.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="w-full md:w-auto px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 transition active:scale-95 cursor-pointer"
        >
          <Plus className="w-5 h-5 stroke-[2.5]" />
          <span>Add New Menu Recipe</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-lg overflow-hidden">
        {/* Search Input Row */}
        <div className="relative w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-stone-400" />
          <input
            type="text"
            placeholder="Search recipes, coffee, bakery..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-xs sm:text-sm text-white placeholder-stone-500 focus:outline-none focus:border-amber-500 transition"
          />
        </div>

        {/* Categories Bar with Horizontal Scroll and Navigation Arrow Buttons */}
        <div className="w-full min-w-0">
          <div className="flex items-center w-full min-w-0 gap-2">
            {/* Left (<) Arrow Button */}
            <button
              type="button"
              onClick={() => handleScrollCategories('left')}
              aria-label="Scroll categories left"
              className="shrink-0 z-10 w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-stone-800 hover:bg-amber-500 text-stone-200 hover:text-stone-950 border border-stone-700/80 transition shadow-md active:scale-95 cursor-pointer flex items-center justify-center group"
              title="Scroll Categories Left"
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5] group-hover:-translate-x-0.5 transition-transform" />
            </button>

            {/* Scrollable categories container */}
            <div
              ref={categoryScrollRef}
              className="flex-1 min-w-0 w-full overflow-x-auto flex-nowrap scrollbar-none horizontal-scroll-smooth py-1"
            >
              <div className="flex flex-nowrap items-center gap-2 w-max px-1">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      sound.playTap();
                      setSelectedCategory(cat);
                    }}
                    className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all duration-150 shrink-0 cursor-pointer ${
                      selectedCategory === cat
                        ? 'bg-amber-500 text-stone-950 font-bold shadow-md shadow-amber-500/25 scale-[1.02]'
                        : 'bg-stone-950 text-stone-300 border border-stone-800 hover:bg-stone-800 hover:text-white'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Right (>) Arrow Button */}
            <button
              type="button"
              onClick={() => handleScrollCategories('right')}
              aria-label="Scroll categories right"
              className="shrink-0 z-10 w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-stone-800 hover:bg-amber-500 text-stone-200 hover:text-stone-950 border border-stone-700/80 transition shadow-md active:scale-95 cursor-pointer flex items-center justify-center group"
              title="Scroll Categories Right"
            >
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5] group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>
      </div>

      {/* Menu Items Detailed Table & Cards */}
      <div className="bg-stone-900 border border-stone-800 rounded-3xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-stone-800">
          <span className="text-xs font-bold text-stone-300 uppercase tracking-wider">
            Total Recipes: {filteredItems.length}
          </span>
          <span className="text-xs text-amber-400 font-mono">
            Avg Profit Margin:{' '}
            {filteredItems.length > 0
              ? (
                  filteredItems.reduce((s, i) => s + i.marginPercent, 0) /
                  filteredItems.length
                ).toFixed(1)
              : 0}
            %
          </span>
        </div>

        <HorizontalScrollContainer scrollAmount={260}>
          <table className="w-full text-left text-xs min-w-[700px]">
            <thead>
              <tr className="border-b border-stone-800 text-stone-400 uppercase text-[10px]">
                <th className="py-2.5 px-3">Item / Category</th>
                <th className="py-2.5 px-3 text-right">Selling Price</th>
                <th className="py-2.5 px-3 text-center">Cost Breakdown (Cup / Base / Milk / Sugar / Syrup / Cover)</th>
                <th className="py-2.5 px-3 text-right">Total Cost</th>
                <th className="py-2.5 px-3 text-right">Net Profit</th>
                <th className="py-2.5 px-3 text-right">Margin %</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800/60 font-medium">
              {filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-stone-850/60 transition group">
                  
                  {/* Name & category */}
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <div>
                        <div className="font-bold text-white text-sm group-hover:text-amber-400 transition flex items-center gap-1.5">
                          <span>{item.name}</span>
                          {item.badge && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-sans">
                              {item.badge}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-stone-400">{item.category}</span>
                      </div>
                    </div>
                  </td>

                  {/* Selling Price */}
                  <td className="py-3 px-3 text-right font-mono font-bold text-amber-400 text-sm">
                    {item.price} <span className="text-[10px] font-sans text-stone-400">EGP</span>
                  </td>

                  {/* Cost breakdown badges */}
                  <td className="py-3 px-3 text-center">
                    <div className="inline-flex flex-wrap gap-1 items-center justify-center text-[10px] font-mono">
                      {item.costs.cupAndLid > 0 && (
                        <span className="px-1.5 py-0.5 rounded bg-stone-950 text-stone-400 border border-stone-800" title="Cup & Lid">
                          Cup: {item.costs.cupAndLid}
                        </span>
                      )}
                      {item.costs.coffeeOrBase > 0 && (
                        <span className="px-1.5 py-0.5 rounded bg-amber-950/40 text-amber-300 border border-amber-900/40" title="Coffee / Base">
                          Coffee: {item.costs.coffeeOrBase}
                        </span>
                      )}
                      {item.costs.milk > 0 && (
                        <span className="px-1.5 py-0.5 rounded bg-sky-950/40 text-sky-300 border border-sky-900/40" title="Milk">
                          Milk: {item.costs.milk}
                        </span>
                      )}
                      {item.costs.sugar > 0 && (
                        <span className="px-1.5 py-0.5 rounded bg-stone-950 text-stone-400 border border-stone-800" title="Sugar">
                          Sugar: {item.costs.sugar}
                        </span>
                      )}
                      {item.costs.syrupAndSauce > 0 && (
                        <span className="px-1.5 py-0.5 rounded bg-purple-950/40 text-purple-300 border border-purple-900/40" title="Syrups / Flavor">
                          Syrup: {item.costs.syrupAndSauce}
                        </span>
                      )}
                      {item.costs.coverPackaging > 0 && (
                        <span className="px-1.5 py-0.5 rounded bg-stone-950 text-stone-400 border border-stone-800" title="Cover & Packaging">
                          Pack: {item.costs.coverPackaging}
                        </span>
                      )}
                      {item.costs.other > 0 && (
                        <span className="px-1.5 py-0.5 rounded bg-stone-950 text-stone-400 border border-stone-800" title="Other Ingredients">
                          Other: {item.costs.other}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Total cost */}
                  <td className="py-3 px-3 text-right font-mono text-rose-300 font-bold">
                    {item.totalCost.toFixed(2)} EGP
                  </td>

                  {/* Net profit */}
                  <td className="py-3 px-3 text-right font-mono font-bold text-emerald-400">
                    +{item.netProfit.toFixed(2)} EGP
                  </td>

                  {/* Margin % */}
                  <td className="py-3 px-3 text-right">
                    <span className={`font-mono font-bold px-2 py-0.5 rounded-full text-[11px] ${
                      item.marginPercent >= 50
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}>
                      {item.marginPercent}%
                    </span>
                  </td>

                  {/* Available Toggle */}
                  <td className="py-3 px-3 text-center">
                    <button
                      onClick={() => handleToggleAvailability(item.id)}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition ${
                        item.isAvailable
                          ? 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30'
                          : 'bg-stone-800 text-stone-500 hover:bg-stone-700'
                      }`}
                    >
                      {item.isAvailable ? 'In Stock' : '86 Out'}
                    </button>
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-3 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => handleOpenEditModal(item)}
                        className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition"
                        title="Edit Recipe & Pricing"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteItem(item.id, item.name)}
                        className="p-1.5 rounded-lg bg-stone-800 hover:bg-red-500/20 text-stone-400 hover:text-red-400 transition"
                        title="Delete Item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </HorizontalScrollContainer>
      </div>

      {/* ADD / EDIT ITEM MODAL WITH REAL-TIME PROFIT CALCULATOR */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/85 backdrop-blur-sm animate-in fade-in">
          <div className="bg-stone-900 border border-stone-800 rounded-3xl w-[95%] sm:max-w-2xl max-h-[92vh] flex flex-col overflow-hidden shadow-2xl">
            
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-stone-950 border-b border-stone-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Coffee className="w-5 h-5 text-amber-400" />
                <h3 className="font-black text-white text-base sm:text-lg">
                  {editingItem ? 'Edit Recipe & Raw Costs' : 'New Recipe & Cost Breakdown'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-stone-800 text-stone-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form Content */}
            <form onSubmit={handleSaveItem} className="p-5 overflow-y-auto space-y-4 flex-1 text-xs">
              
              {/* Basic Meta */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-stone-300 font-bold block mb-1">Item / Drink Name *</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Spanish Latte (Hot)"
                    className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-white text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-stone-300 font-bold block mb-1">Menu Category *</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-white text-xs focus:outline-none focus:border-amber-500"
                  >
                    {standardCategories.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Selling Price & Badge */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-stone-300 font-bold block mb-1">Selling Price (EGP) *</label>
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    required
                    value={formPrice}
                    onChange={(e) => setFormPrice(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-amber-400 font-mono font-bold text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-stone-300 font-bold block mb-1">Badge (Optional)</label>
                  <input
                    type="text"
                    value={formBadge}
                    onChange={(e) => setFormBadge(e.target.value)}
                    placeholder="e.g. Best Seller / Classic / New"
                    className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-white text-xs focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* RAW MATERIAL COST BREAKDOWN SECTION */}
              <div className="pt-2 border-t border-stone-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold uppercase tracking-wider text-stone-300 text-[11px] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    Raw Material & Packaging Costs Breakdown (EGP)
                  </span>
                  <span className="text-stone-400 text-[10px]">Per single unit serving</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 bg-stone-950 p-3.5 rounded-2xl border border-stone-800">
                  <div>
                    <label className="text-stone-400 block text-[10px] mb-1">Cup & Lid</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={costCup}
                      onChange={(e) => setCostCup(parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1.5 bg-stone-900 border border-stone-700 rounded-lg text-white font-mono text-xs focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="text-stone-400 block text-[10px] mb-1">Coffee / Base Beans</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={costCoffee}
                      onChange={(e) => setCostCoffee(parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1.5 bg-stone-900 border border-stone-700 rounded-lg text-white font-mono text-xs focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="text-stone-400 block text-[10px] mb-1">Milk / Dairy</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={costMilk}
                      onChange={(e) => setCostMilk(parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1.5 bg-stone-900 border border-stone-700 rounded-lg text-white font-mono text-xs focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="text-stone-400 block text-[10px] mb-1">Sugar / Sweetener</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={costSugar}
                      onChange={(e) => setCostSugar(parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1.5 bg-stone-900 border border-stone-700 rounded-lg text-white font-mono text-xs focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="text-stone-400 block text-[10px] mb-1">Syrup & Sauce</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={costSyrup}
                      onChange={(e) => setCostSyrup(parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1.5 bg-stone-900 border border-stone-700 rounded-lg text-white font-mono text-xs focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="text-stone-400 block text-[10px] mb-1">Cover, Straw & Box</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={costCover}
                      onChange={(e) => setCostCover(parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1.5 bg-stone-900 border border-stone-700 rounded-lg text-white font-mono text-xs focus:border-amber-500"
                    />
                  </div>

                  <div className="col-span-2 sm:col-span-3">
                    <label className="text-stone-400 block text-[10px] mb-1">Other / Food Fillings / Garnish</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={costOther}
                      onChange={(e) => setCostOther(parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1.5 bg-stone-900 border border-stone-700 rounded-lg text-white font-mono text-xs focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>

              {/* LIVE PROFIT & MARGIN PREVIEW BANNER */}
              <div className="bg-stone-950 p-4 rounded-2xl border border-stone-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-stone-400 uppercase tracking-wider block">Total Unit Cost</span>
                  <span className="text-base font-bold font-mono text-rose-300">
                    {computedTotalCost} <span className="text-[10px] font-sans text-stone-400">EGP</span>
                  </span>
                </div>

                <div className="w-px h-8 bg-stone-800" />

                <div>
                  <span className="text-[10px] text-stone-400 uppercase tracking-wider block">Net Unit Profit</span>
                  <span className="text-base font-bold font-mono text-emerald-400">
                    +{computedNetProfit} <span className="text-[10px] font-sans text-stone-400">EGP</span>
                  </span>
                </div>

                <div className="w-px h-8 bg-stone-800" />

                <div className="text-right">
                  <span className="text-[10px] text-stone-400 uppercase tracking-wider block">Profit Margin</span>
                  <span className="text-base font-black font-mono text-amber-400">
                    {computedMargin}%
                  </span>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-stone-300 font-bold block mb-1">Short Description</label>
                <input
                  type="text"
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="e.g. Double shot espresso pulled over sweet cold milk and vanilla"
                  className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-white text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Modal Buttons */}
              <div className="pt-3 border-t border-stone-800 flex gap-2">
                {editingItem && (
                  <button
                    type="button"
                    onClick={() => {
                      const itemToDelete = editingItem;
                      setIsModalOpen(false);
                      handleDeleteItem(itemToDelete.id, itemToDelete.name);
                    }}
                    className="py-3 px-3.5 rounded-xl bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer"
                    title="Permanently Delete Recipe"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Recipe</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-semibold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs shadow-lg shadow-amber-500/20 active:scale-95 transition cursor-pointer"
                >
                  {editingItem ? 'Save Changes' : 'Create Recipe'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* In-app confirmation prompt modal for deletions */}
      <ConfirmModal
        state={confirmModal}
        onClose={() => setConfirmModal(null)}
      />

    </div>
  );
};
