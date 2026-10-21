import React, { useState } from 'react';
import { ClosedOrder, MenuItem, POSSettings } from '../types/pos';
import { 
  TrendingUp, 
  DollarSign, 
  Calendar, 
  ShoppingBag, 
  Printer, 
  Search, 
  CreditCard, 
  Banknote, 
  Smartphone,
  Eye,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { sound } from '../utils/sound';
import { HorizontalScrollContainer } from './HorizontalScrollContainer';

interface DashboardViewProps {
  orders: ClosedOrder[];
  menuItems: MenuItem[];
  settings: POSSettings;
  onShowReceipt: (order: ClosedOrder) => void;
}

type TimeframeFilter = 'today' | 'week' | 'month' | 'all';

export const DashboardView: React.FC<DashboardViewProps> = ({
  orders,
  onShowReceipt
}) => {
  const [selectedTimeframe, setSelectedTimeframe] = useState<TimeframeFilter>('month');
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [channelFilter, setChannelFilter] = useState<'all' | 'table' | 'takeaway'>('all');
  const [inspectOrder, setInspectOrder] = useState<ClosedOrder | null>(null);

  const now = new Date();

  // Helper for date checks
  const isToday = (iso: string) => {
    const d = new Date(iso);
    return d.toDateString() === now.toDateString();
  };

  const isThisWeek = (iso: string) => {
    const d = new Date(iso);
    const diffDays = (now.getTime() - d.getTime()) / (1000 * 3600 * 24);
    return diffDays <= 7 && diffDays >= 0;
  };

  const isThisMonth = (iso: string) => {
    const d = new Date(iso);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  };

  // Specific periods calculations
  const todayOrders = orders.filter(o => isToday(o.timestamp));
  const weekOrders = orders.filter(o => isThisWeek(o.timestamp));
  const monthOrders = orders.filter(o => isThisMonth(o.timestamp));

  const calcStats = (orderList: ClosedOrder[]) => {
    const rev = orderList.reduce((acc, o) => acc + o.total, 0);
    const cost = orderList.reduce((acc, o) => acc + o.totalCost, 0);
    const profit = rev - cost;
    const margin = rev > 0 ? ((profit / rev) * 100).toFixed(1) : '0';
    return { rev, cost, profit, margin, count: orderList.length };
  };

  const todayStats = calcStats(todayOrders);
  const weekStats = calcStats(weekOrders);
  const monthStats = calcStats(monthOrders);

  // Active filtered orders based on selected timeframe
  const filteredByTimeframe = orders.filter(o => {
    if (selectedTimeframe === 'today') return isToday(o.timestamp);
    if (selectedTimeframe === 'week') return isThisWeek(o.timestamp);
    if (selectedTimeframe === 'month') return isThisMonth(o.timestamp);
    return true; // all
  });

  const activeStats = calcStats(filteredByTimeframe);

  // Payment Breakdown
  const cashTotal = filteredByTimeframe.filter(o => o.paymentMethod === 'cash').reduce((s, o) => s + o.total, 0);
  const cardTotal = filteredByTimeframe.filter(o => o.paymentMethod === 'card').reduce((s, o) => s + o.total, 0);
  const walletTotal = filteredByTimeframe.filter(o => o.paymentMethod === 'wallet').reduce((s, o) => s + o.total, 0);

  // Top Selling Items in filtered period
  const itemMap = new Map<string, { name: string; category: string; quantity: number; revenue: number; cost: number; profit: number }>();
  filteredByTimeframe.forEach(order => {
    order.items.forEach(item => {
      const existing = itemMap.get(item.menuItemId) || {
        name: item.name,
        category: item.category,
        quantity: 0,
        revenue: 0,
        cost: 0,
        profit: 0
      };
      const lineRev = item.price * item.quantity;
      const lineCost = item.unitCost * item.quantity;
      existing.quantity += item.quantity;
      existing.revenue += lineRev;
      existing.cost += lineCost;
      existing.profit += (lineRev - lineCost);
      itemMap.set(item.menuItemId, existing);
    });
  });

  const topItems = Array.from(itemMap.values())
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 8);

  // Filtered order log rows
  const displayedOrderLogs = filteredByTimeframe.filter(order => {
    const matchesChannel = channelFilter === 'all' || order.type === channelFilter;
    const matchesSearch = 
      order.orderNumber.toLowerCase().includes(orderSearchQuery.toLowerCase()) ||
      order.items.some(i => i.name.toLowerCase().includes(orderSearchQuery.toLowerCase())) ||
      (order.customerNotes && order.customerNotes.toLowerCase().includes(orderSearchQuery.toLowerCase()));
    return matchesChannel && matchesSearch;
  });

  return (
    <div className="space-y-6">
      
      {/* Top Header & Timeframe Switcher */}
      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-emerald-400" />
            <span>Sales, Costs & Profit Dashboard</span>
          </h2>
          <p className="text-xs text-stone-400 mt-1">
            Real-time financial performance and recipe margin intelligence for BIMBO Caravan.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex bg-stone-950 p-1.5 rounded-xl border border-stone-800 gap-1 self-start md:self-auto">
          {[
            { id: 'today' as TimeframeFilter, label: 'Today' },
            { id: 'week' as TimeframeFilter, label: 'This Week (7D)' },
            { id: 'month' as TimeframeFilter, label: 'This Month' },
            { id: 'all' as TimeframeFilter, label: 'All Time' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => {
                sound.playTap();
                setSelectedTimeframe(f.id);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                selectedTimeframe === f.id
                  ? 'bg-amber-500 text-stone-950 font-bold shadow'
                  : 'text-stone-400 hover:text-white hover:bg-stone-850'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3 Core Metric Cards: Daily, Weekly, Monthly (as explicitly specified) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Card 1: Today */}
        <div className="bg-stone-900 border border-stone-800/90 rounded-2xl p-4.5 relative overflow-hidden shadow-lg group hover:border-amber-500/40 transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" /> Today's Sales & Profit
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono">
              {todayStats.count} orders
            </span>
          </div>

          <div className="mt-3 flex items-baseline justify-between">
            <div>
              <span className="text-2xl font-black font-mono text-white">
                {todayStats.rev.toLocaleString()} <span className="text-xs font-sans text-stone-400">EGP</span>
              </span>
              <span className="text-[11px] text-stone-400 block mt-0.5">
                Ingredients Cost: {todayStats.cost.toFixed(0)} EGP
              </span>
            </div>
            <div className="text-right">
              <span className="text-base font-black font-mono text-emerald-400 block">
                +{todayStats.profit.toFixed(0)} EGP
              </span>
              <span className="text-[10px] text-emerald-500 font-semibold font-mono">
                {todayStats.margin}% margin
              </span>
            </div>
          </div>
          <div className="w-full bg-stone-950 rounded-full h-1.5 mt-3 overflow-hidden">
            <div 
              className="bg-emerald-500 h-1.5 rounded-full" 
              style={{ width: `${Math.min(100, Math.max(10, parseFloat(todayStats.margin)))}%` }} 
            />
          </div>
        </div>

        {/* Card 2: This Week */}
        <div className="bg-stone-900 border border-stone-800/90 rounded-2xl p-4.5 relative overflow-hidden shadow-lg group hover:border-amber-500/40 transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-amber-400" /> Weekly (Last 7 Days)
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono">
              {weekStats.count} orders
            </span>
          </div>

          <div className="mt-3 flex items-baseline justify-between">
            <div>
              <span className="text-2xl font-black font-mono text-white">
                {weekStats.rev.toLocaleString()} <span className="text-xs font-sans text-stone-400">EGP</span>
              </span>
              <span className="text-[11px] text-stone-400 block mt-0.5">
                Ingredients Cost: {weekStats.cost.toFixed(0)} EGP
              </span>
            </div>
            <div className="text-right">
              <span className="text-base font-black font-mono text-emerald-400 block">
                +{weekStats.profit.toFixed(0)} EGP
              </span>
              <span className="text-[10px] text-emerald-500 font-semibold font-mono">
                {weekStats.margin}% margin
              </span>
            </div>
          </div>
          <div className="w-full bg-stone-950 rounded-full h-1.5 mt-3 overflow-hidden">
            <div 
              className="bg-amber-500 h-1.5 rounded-full" 
              style={{ width: `${Math.min(100, Math.max(10, parseFloat(weekStats.margin)))}%` }} 
            />
          </div>
        </div>

        {/* Card 3: This Month */}
        <div className="bg-stone-900 border border-stone-800/90 rounded-2xl p-4.5 relative overflow-hidden shadow-lg group hover:border-amber-500/40 transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-emerald-400" /> Monthly (Current Cycle)
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
              {monthStats.count} orders
            </span>
          </div>

          <div className="mt-3 flex items-baseline justify-between">
            <div>
              <span className="text-2xl font-black font-mono text-white">
                {monthStats.rev.toLocaleString()} <span className="text-xs font-sans text-stone-400">EGP</span>
              </span>
              <span className="text-[11px] text-stone-400 block mt-0.5">
                Ingredients Cost: {monthStats.cost.toFixed(0)} EGP
              </span>
            </div>
            <div className="text-right">
              <span className="text-base font-black font-mono text-emerald-400 block">
                +{monthStats.profit.toFixed(0)} EGP
              </span>
              <span className="text-[10px] text-emerald-500 font-semibold font-mono">
                {monthStats.margin}% margin
              </span>
            </div>
          </div>
          <div className="w-full bg-stone-950 rounded-full h-1.5 mt-3 overflow-hidden">
            <div 
              className="bg-emerald-400 h-1.5 rounded-full" 
              style={{ width: `${Math.min(100, Math.max(10, parseFloat(monthStats.margin)))}%` }} 
            />
          </div>
        </div>

      </div>

      {/* DETAILED BREAKDOWN OF EXPENSES VS EARNINGS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Expenses vs Earnings Visual Card */}
        <div className="lg:col-span-2 bg-stone-900 border border-stone-800 rounded-3xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-stone-800">
            <div>
              <h3 className="font-bold text-white text-base">
                Expenses vs Earnings Breakdown ({selectedTimeframe.toUpperCase()})
              </h3>
              <p className="text-xs text-stone-400">
                Gross sales compared to raw material costs and net caravan profit.
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs text-stone-400 block">Net Margin</span>
              <span className="text-base font-black font-mono text-emerald-400">
                {activeStats.margin}%
              </span>
            </div>
          </div>

          {/* Visual Split Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-medium">
              <span className="text-rose-400">Raw Material & Packaging Costs: {activeStats.cost.toFixed(1)} EGP</span>
              <span className="text-emerald-400">Net Profit: {activeStats.profit.toFixed(1)} EGP</span>
            </div>
            <div className="h-5 w-full bg-stone-950 rounded-xl overflow-hidden flex border border-stone-800">
              <div 
                style={{ width: `${activeStats.rev > 0 ? (activeStats.cost / activeStats.rev) * 100 : 50}%` }}
                className="bg-rose-500/80 hover:bg-rose-500 transition-all flex items-center justify-center text-[10px] font-bold text-white"
                title={`Raw material costs: ${activeStats.cost.toFixed(0)} EGP`}
              >
                {activeStats.rev > 0 && `${((activeStats.cost / activeStats.rev) * 100).toFixed(0)}%`}
              </div>
              <div 
                style={{ width: `${activeStats.rev > 0 ? (activeStats.profit / activeStats.rev) * 100 : 50}%` }}
                className="bg-emerald-500 hover:bg-emerald-400 transition-all flex items-center justify-center text-[10px] font-bold text-stone-950"
                title={`Net profit: ${activeStats.profit.toFixed(0)} EGP`}
              >
                {activeStats.rev > 0 && `${((activeStats.profit / activeStats.rev) * 100).toFixed(0)}%`}
              </div>
            </div>
          </div>

          {/* 3 Metric Sub-tiles */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            <div className="bg-stone-950 p-3 rounded-2xl border border-stone-800 text-center">
              <span className="text-[10px] uppercase font-bold text-stone-400 block">Total Revenue</span>
              <span className="text-lg font-black font-mono text-white mt-0.5 block">
                {activeStats.rev.toLocaleString()} <span className="text-[10px] font-sans text-stone-400">EGP</span>
              </span>
            </div>

            <div className="bg-stone-950 p-3 rounded-2xl border border-stone-800 text-center">
              <span className="text-[10px] uppercase font-bold text-rose-400 block">Total Costs (COGS)</span>
              <span className="text-lg font-black font-mono text-rose-300 mt-0.5 block">
                {activeStats.cost.toLocaleString()} <span className="text-[10px] font-sans text-stone-400">EGP</span>
              </span>
            </div>

            <div className="bg-stone-950 p-3 rounded-2xl border border-stone-800 text-center">
              <span className="text-[10px] uppercase font-bold text-emerald-400 block">Net Profit</span>
              <span className="text-lg font-black font-mono text-emerald-400 mt-0.5 block">
                +{activeStats.profit.toLocaleString()} <span className="text-[10px] font-sans text-stone-400">EGP</span>
              </span>
            </div>
          </div>

          {/* Channel breakdown */}
          <div className="bg-stone-950/60 p-3 rounded-2xl border border-stone-800/80 flex items-center justify-around text-xs">
            <div className="text-center">
              <span className="text-stone-400 block text-[11px]">Dine-In Tables</span>
              <span className="font-bold text-white">
                {filteredByTimeframe.filter(o => o.type === 'table').length} orders
              </span>
            </div>
            <div className="w-px h-6 bg-stone-800" />
            <div className="text-center">
              <span className="text-stone-400 block text-[11px]">Takeaway Fast-Lane</span>
              <span className="font-bold text-white">
                {filteredByTimeframe.filter(o => o.type === 'takeaway').length} orders
              </span>
            </div>
            <div className="w-px h-6 bg-stone-800" />
            <div className="text-center">
              <span className="text-stone-400 block text-[11px]">Average Ticket (AOV)</span>
              <span className="font-bold text-amber-400 font-mono">
                {activeStats.count > 0 ? (activeStats.rev / activeStats.count).toFixed(1) : 0} EGP
              </span>
            </div>
          </div>
        </div>

        {/* Payment Methods Card */}
        <div className="bg-stone-900 border border-stone-800 rounded-3xl p-5 shadow-xl flex flex-col justify-between space-y-4">
          <div>
            <h3 className="font-bold text-white text-base pb-2 border-b border-stone-800">
              Payment Settlement Channels
            </h3>
            <p className="text-xs text-stone-400 mt-1">
              Distribution of incoming revenue by payment rail.
            </p>
          </div>

          <div className="space-y-3">
            {/* Cash */}
            <div className="bg-stone-950 p-3 rounded-xl border border-stone-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
                  <Banknote className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-white text-xs block">Cash Drawer</span>
                  <span className="text-[10px] text-stone-400">
                    {activeStats.rev > 0 ? ((cashTotal / activeStats.rev) * 100).toFixed(0) : 0}% of revenue
                  </span>
                </div>
              </div>
              <span className="font-mono font-bold text-white text-sm">{cashTotal.toLocaleString()} EGP</span>
            </div>

            {/* Card */}
            <div className="bg-stone-950 p-3 rounded-xl border border-stone-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-white text-xs block">Card / POS Terminal</span>
                  <span className="text-[10px] text-stone-400">
                    {activeStats.rev > 0 ? ((cardTotal / activeStats.rev) * 100).toFixed(0) : 0}% of revenue
                  </span>
                </div>
              </div>
              <span className="font-mono font-bold text-white text-sm">{cardTotal.toLocaleString()} EGP</span>
            </div>

            {/* Mobile Wallet */}
            <div className="bg-stone-950 p-3 rounded-xl border border-stone-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-white text-xs block">InstaPay / VF Cash</span>
                  <span className="text-[10px] text-stone-400">
                    {activeStats.rev > 0 ? ((walletTotal / activeStats.rev) * 100).toFixed(0) : 0}% of revenue
                  </span>
                </div>
              </div>
              <span className="font-mono font-bold text-white text-sm">{walletTotal.toLocaleString()} EGP</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-stone-950 text-center border border-stone-800/80">
            <span className="text-[11px] text-stone-400">Total Tender Captured: </span>
            <span className="font-mono font-bold text-amber-400 text-xs">{activeStats.rev.toLocaleString()} EGP</span>
          </div>
        </div>

      </div>

      {/* TOP SELLING MENU ITEMS TABLE */}
      <div className="bg-stone-900 border border-stone-800 rounded-3xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-stone-800">
          <div>
            <h3 className="font-bold text-white text-base">Top Performing Menu Items</h3>
            <p className="text-xs text-stone-400">
              Ranked by quantity sold during selected timeframe.
            </p>
          </div>
        </div>

        {topItems.length === 0 ? (
          <div className="text-center py-8 text-stone-500 text-xs">
            No sales recorded in this timeframe yet.
          </div>
        ) : (
          <HorizontalScrollContainer scrollAmount={250}>
            <table className="w-full text-left text-xs min-w-[650px]">
              <thead>
                <tr className="border-b border-stone-800 text-stone-400 uppercase text-[10px]">
                  <th className="py-2.5 px-3">Rank</th>
                  <th className="py-2.5 px-3">Item Name</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3 text-center">Qty Sold</th>
                  <th className="py-2.5 px-3 text-right">Revenue (EGP)</th>
                  <th className="py-2.5 px-3 text-right">Raw Cost (EGP)</th>
                  <th className="py-2.5 px-3 text-right">Net Profit (EGP)</th>
                  <th className="py-2.5 px-3 text-right">Margin %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800/60 font-medium">
                {topItems.map((item, idx) => {
                  const margin = item.revenue > 0 ? ((item.profit / item.revenue) * 100).toFixed(1) : '0';
                  return (
                    <tr key={idx} className="hover:bg-stone-850/60 transition">
                      <td className="py-3 px-3">
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                          idx === 0 ? 'bg-amber-500 text-stone-950' : idx === 1 ? 'bg-stone-400 text-stone-950' : 'bg-stone-800 text-stone-300'
                        }`}>
                          {idx + 1}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-bold text-white">{item.name}</td>
                      <td className="py-3 px-3 text-stone-400">{item.category}</td>
                      <td className="py-3 px-3 text-center font-mono font-bold text-amber-400">{item.quantity}</td>
                      <td className="py-3 px-3 text-right font-mono text-white">{item.revenue.toFixed(0)}</td>
                      <td className="py-3 px-3 text-right font-mono text-rose-300">{item.cost.toFixed(0)}</td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-emerald-400">+{item.profit.toFixed(0)}</td>
                      <td className="py-3 px-3 text-right font-mono text-stone-300">{margin}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </HorizontalScrollContainer>
        )}
      </div>

      {/* RECENT CLOSED ORDER LOGS TABLE */}
      <div className="bg-stone-900 border border-stone-800 rounded-3xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-800">
          <div>
            <h3 className="font-bold text-white text-base">Closed Orders History & Audit Log</h3>
            <p className="text-xs text-stone-400">
              Complete transaction log with items, method, and instant receipt re-print.
            </p>
          </div>

          {/* Filter channel & search */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex bg-stone-950 p-1 rounded-xl border border-stone-800 text-xs">
              <button
                onClick={() => setChannelFilter('all')}
                className={`px-2.5 py-1 rounded-lg ${channelFilter === 'all' ? 'bg-amber-500 text-stone-950 font-bold' : 'text-stone-400'}`}
              >
                All
              </button>
              <button
                onClick={() => setChannelFilter('table')}
                className={`px-2.5 py-1 rounded-lg ${channelFilter === 'table' ? 'bg-amber-500 text-stone-950 font-bold' : 'text-stone-400'}`}
              >
                Table
              </button>
              <button
                onClick={() => setChannelFilter('takeaway')}
                className={`px-2.5 py-1 rounded-lg ${channelFilter === 'takeaway' ? 'bg-amber-500 text-stone-950 font-bold' : 'text-stone-400'}`}
              >
                Takeaway
              </button>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-stone-400" />
              <input
                type="text"
                placeholder="Search orders..."
                value={orderSearchQuery}
                onChange={(e) => setOrderSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1 bg-stone-950 border border-stone-800 rounded-xl text-xs text-white placeholder-stone-500 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>
        </div>

        {displayedOrderLogs.length === 0 ? (
          <div className="text-center py-8 text-stone-500 text-xs">
            No matching orders found.
          </div>
        ) : (
          <HorizontalScrollContainer scrollAmount={250}>
            <table className="w-full text-left text-xs min-w-[750px]">
              <thead>
                <tr className="border-b border-stone-800 text-stone-400 uppercase text-[10px]">
                  <th className="py-2.5 px-3">Order #</th>
                  <th className="py-2.5 px-3">Time</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Items Summary</th>
                  <th className="py-2.5 px-3 text-right">Total (EGP)</th>
                  <th className="py-2.5 px-3 text-right">Cost (EGP)</th>
                  <th className="py-2.5 px-3 text-right">Profit (EGP)</th>
                  <th className="py-2.5 px-3 text-center">Payment</th>
                  <th className="py-2.5 px-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800/60 font-medium">
                {displayedOrderLogs.map((order) => (
                  <tr key={order.id} className="hover:bg-stone-850/60 transition">
                    <td className="py-3 px-3 font-mono font-bold text-amber-400">
                      {order.orderNumber.split('-').pop()}
                    </td>
                    <td className="py-3 px-3 text-stone-400 font-mono text-[11px]">
                      {new Date(order.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        order.type === 'table' ? 'bg-amber-500/20 text-amber-300' : 'bg-blue-500/20 text-blue-300'
                      }`}>
                        {order.type === 'table' ? `Table ${order.tableNumber ?? '-'}` : 'Takeaway'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-stone-300 max-w-xs truncate">
                      {order.items.map(i => `${i.name} (x${i.quantity})`).join(', ')}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-white">
                      {order.total.toFixed(0)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-rose-300">
                      {order.totalCost.toFixed(0)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-emerald-400">
                      +{order.netProfit.toFixed(0)}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-stone-800 text-stone-300">
                        {order.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setInspectOrder(order)}
                          className="p-1 rounded bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white"
                          title="Inspect Order Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            sound.playTap();
                            onShowReceipt(order);
                          }}
                          className="p-1 rounded bg-amber-500/20 hover:bg-amber-500 text-amber-400 hover:text-stone-950 transition"
                          title="Print Receipt"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </HorizontalScrollContainer>
        )}
      </div>

      {/* INSPECT ORDER DETAILS MODAL */}
      {inspectOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-stone-900 border border-stone-800 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-stone-800">
              <h3 className="font-bold text-white text-base">Order Details: {inspectOrder.orderNumber}</h3>
              <button onClick={() => setInspectOrder(null)} className="text-stone-400 hover:text-white text-sm">
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 text-stone-400 bg-stone-950 p-3 rounded-xl border border-stone-800">
                <div>Type: <span className="text-white font-bold">{inspectOrder.type.toUpperCase()}</span></div>
                <div>Payment: <span className="text-white font-bold">{inspectOrder.paymentMethod.toUpperCase()}</span></div>
                <div>Date: <span className="text-white font-mono">{new Date(inspectOrder.timestamp).toLocaleDateString()}</span></div>
                <div>Time: <span className="text-white font-mono">{new Date(inspectOrder.timestamp).toLocaleTimeString()}</span></div>
              </div>

              <div>
                <h4 className="font-bold text-stone-300 uppercase text-[10px] tracking-wider mb-1.5">Items</h4>
                <div className="space-y-1 bg-stone-950 p-2.5 rounded-xl border border-stone-800 max-h-40 overflow-y-auto">
                  {inspectOrder.items.map((i, idx) => (
                    <div key={idx} className="flex justify-between py-1 border-b border-stone-800/60 last:border-none">
                      <div>
                        <span className="text-white font-medium">{i.name}</span>
                        <span className="text-stone-500 text-[10px] block">Qty: {i.quantity} @ {i.price} EGP</span>
                      </div>
                      <span className="font-mono text-amber-400 font-bold">{(i.price * i.quantity).toFixed(0)} EGP</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-stone-950 p-3 rounded-xl border border-stone-800 space-y-1 font-mono">
                <div className="flex justify-between text-stone-400">
                  <span>Subtotal:</span>
                  <span>{inspectOrder.subtotal.toFixed(2)} EGP</span>
                </div>
                {inspectOrder.discount > 0 && (
                  <div className="flex justify-between text-emerald-400">
                    <span>Discount:</span>
                    <span>-{inspectOrder.discount.toFixed(2)} EGP</span>
                  </div>
                )}
                <div className="flex justify-between text-white font-bold pt-1 border-t border-stone-800">
                  <span>Total Paid:</span>
                  <span className="text-amber-400">{inspectOrder.total.toFixed(2)} EGP</span>
                </div>
                <div className="flex justify-between text-stone-400 text-[11px]">
                  <span>Total Cost:</span>
                  <span>{inspectOrder.totalCost.toFixed(2)} EGP</span>
                </div>
                <div className="flex justify-between text-emerald-400 font-bold text-[11px]">
                  <span>Net Profit:</span>
                  <span>+{inspectOrder.netProfit.toFixed(2)} EGP</span>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setInspectOrder(null)}
                className="flex-1 py-2.5 rounded-xl bg-stone-800 text-stone-300 font-semibold text-xs"
              >
                Close
              </button>
              <button
                onClick={() => {
                  sound.playTap();
                  onShowReceipt(inspectOrder);
                  setInspectOrder(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-amber-500 text-stone-950 font-bold text-xs flex items-center justify-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Print Receipt</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
