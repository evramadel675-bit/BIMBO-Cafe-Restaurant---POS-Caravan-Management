import React, { useState } from 'react';
import { ClosedOrder, MenuItem, MonthArchive, POSSettings } from '../types/pos';
import { 
  Archive, 
  Lock, 
  Download, 
  Calendar, 
  CheckCircle2, 
  AlertTriangle, 
  TrendingUp, 
  Clock, 
  FileSpreadsheet, 
  Eye, 
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { exportSingleArchiveToExcel } from '../utils/excel';
import { sound } from '../utils/sound';

interface MonthlyArchiveViewProps {
  orders: ClosedOrder[];
  menuItems: MenuItem[];
  archives: MonthArchive[];
  settings: POSSettings;
  onCloseAndArchiveMonth: () => void;
  onShowToast: (msg: string) => void;
}

export const MonthlyArchiveView: React.FC<MonthlyArchiveViewProps> = ({
  orders,
  archives,
  settings,
  onCloseAndArchiveMonth,
  onShowToast
}) => {
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [selectedArchiveDetail, setSelectedArchiveDetail] = useState<MonthArchive | null>(null);

  const now = new Date();
  const currentMonthName = now.toLocaleString('en-US', { month: 'long', year: 'numeric' });
  
  // Current active month statistics
  const currentRev = orders.reduce((sum, o) => sum + o.total, 0);
  const currentCost = orders.reduce((sum, o) => sum + o.totalCost, 0);
  const currentProfit = currentRev - currentCost;
  const currentMargin = currentRev > 0 ? ((currentProfit / currentRev) * 100).toFixed(1) : '0';

  // Handle archive confirmation
  const handleConfirmArchive = () => {
    sound.playCash();
    setIsConfirmModalOpen(false);
    onCloseAndArchiveMonth();
  };

  const handleDownloadArchive = (arch: MonthArchive) => {
    sound.playTap();
    try {
      exportSingleArchiveToExcel(arch);
      sound.playCash();
      onShowToast(`Downloaded ${arch.monthName} backup spreadsheet!`);
    } catch (err) {
      alert(`Error exporting archive: ${err instanceof Error ? err.message : 'Unknown'}`);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Archive className="w-6 h-6 text-amber-400" />
            <span>Monthly Archiving & Financial Seal System</span>
          </h2>
          <p className="text-xs text-stone-400 mt-1">
            End-of-month financial closing: Lock historical logs in browser memory, auto-download Excel backups, and start fresh cycles.
          </p>
        </div>

        <button
          onClick={() => {
            sound.playTap();
            setIsConfirmModalOpen(true);
          }}
          className="w-full md:w-auto px-5 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-stone-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 transition active:scale-95"
        >
          <Lock className="w-4 h-4 stroke-[2.5]" />
          <span>Close & Archive Month ({currentMonthName})</span>
        </button>
      </div>

      {/* CURRENT ACTIVE CYCLE STATUS CARD */}
      <div className="bg-stone-900 border border-amber-500/40 rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-stone-800 gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-white text-lg">Current Cycle: {currentMonthName}</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 animate-pulse">
                  ACTIVE
                </span>
              </div>
              <p className="text-xs text-stone-400 mt-0.5">
                Orders and daily sales currently recording in live storage.
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-stone-400 block">Cycle Orders</span>
            <span className="text-2xl font-black font-mono text-white">{orders.length}</span>
          </div>
        </div>

        {/* Live Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4">
          <div className="bg-stone-950 p-3.5 rounded-2xl border border-stone-800 text-center">
            <span className="text-[10px] uppercase font-bold text-stone-400 block">Current Revenue</span>
            <span className="text-xl font-black font-mono text-amber-400 mt-1 block">
              {currentRev.toLocaleString()} <span className="text-xs font-sans text-stone-400">EGP</span>
            </span>
          </div>

          <div className="bg-stone-950 p-3.5 rounded-2xl border border-stone-800 text-center">
            <span className="text-[10px] uppercase font-bold text-stone-400 block">Ingredient Costs</span>
            <span className="text-xl font-black font-mono text-rose-300 mt-1 block">
              {currentCost.toLocaleString()} <span className="text-xs font-sans text-stone-400">EGP</span>
            </span>
          </div>

          <div className="bg-stone-950 p-3.5 rounded-2xl border border-stone-800 text-center">
            <span className="text-[10px] uppercase font-bold text-stone-400 block">Net Profit</span>
            <span className="text-xl font-black font-mono text-emerald-400 mt-1 block">
              +{currentProfit.toLocaleString()} <span className="text-xs font-sans text-stone-400">EGP</span>
            </span>
          </div>

          <div className="bg-stone-950 p-3.5 rounded-2xl border border-stone-800 text-center">
            <span className="text-[10px] uppercase font-bold text-stone-400 block">Profit Margin</span>
            <span className="text-xl font-black font-mono text-white mt-1 block">
              {currentMargin}%
            </span>
          </div>
        </div>

      </div>

      {/* HISTORICAL ARCHIVES LOG */}
      <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-stone-800">
          <div>
            <h3 className="font-bold text-white text-base">Historical Month Archives Log</h3>
            <p className="text-xs text-stone-400">
              Permanent vault of past sealed months. Review figures or download past Excel backup files anytime.
            </p>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full bg-stone-800 text-stone-300 font-mono">
            {archives.length} Sealed Periods
          </span>
        </div>

        {archives.length === 0 ? (
          <div className="text-center py-12 text-stone-500 text-xs space-y-2">
            <Archive className="w-10 h-10 mx-auto opacity-30" />
            <p className="font-bold text-stone-400">No sealed months yet.</p>
            <p className="text-[11px] text-stone-600">
              When the current month concludes, click "Close & Archive Month" above to save your first permanent record.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {archives.map((arch) => (
              <div
                key={arch.id}
                className="bg-stone-950/80 hover:bg-stone-950 border border-stone-800 hover:border-stone-700 rounded-2xl p-4 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-stone-850 flex items-center justify-center text-stone-300 font-bold">
                    <Calendar className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm flex items-center gap-2">
                      <span>{arch.monthName}</span>
                      <span className="text-[10px] px-2 py-0.2 rounded-full bg-stone-800 text-stone-400 font-mono">
                        Locked {new Date(arch.archivedAt).toLocaleDateString()}
                      </span>
                    </h4>
                    <span className="text-xs text-stone-400 mt-0.5 block">
                      {arch.totalOrders} total orders processed
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4 sm:gap-6">
                  <div>
                    <span className="text-[10px] text-stone-400 uppercase block">Revenue</span>
                    <span className="font-mono font-bold text-white text-xs sm:text-sm">
                      {arch.totalRevenue.toLocaleString()} EGP
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-stone-400 uppercase block">Net Profit</span>
                    <span className="font-mono font-bold text-emerald-400 text-xs sm:text-sm">
                      +{arch.netProfit.toLocaleString()} EGP
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-stone-400 uppercase block">Margin</span>
                    <span className="font-mono font-bold text-stone-300 text-xs sm:text-sm">
                      {arch.marginPercent}%
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setSelectedArchiveDetail(arch)}
                      className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition"
                      title="Inspect Archive Breakdown"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDownloadArchive(arch)}
                      className="p-2 rounded-xl bg-amber-500/20 hover:bg-amber-500 text-amber-400 hover:text-stone-950 transition flex items-center gap-1.5 text-xs font-semibold"
                      title="Download Excel Backup"
                    >
                      <Download className="w-4 h-4" />
                      <span className="hidden sm:inline">Excel</span>
                    </button>
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>

      {/* CONFIRMATION WORKFLOW MODAL FOR "CLOSE & ARCHIVE MONTH" */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in">
          <div className="bg-stone-900 border border-stone-800 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            
            <div className="flex items-center gap-3 pb-3 border-b border-stone-800">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-black text-white text-lg">Close & Archive {currentMonthName}?</h3>
                <p className="text-xs text-stone-400">Automated end-of-month closing ceremony</p>
              </div>
            </div>

            {/* Month Summary to seal */}
            <div className="bg-stone-950 p-4 rounded-2xl border border-stone-800 space-y-2 text-xs">
              <span className="text-[10px] uppercase font-bold text-stone-400 block">
                Summary of Data Being Sealed:
              </span>
              <div className="grid grid-cols-2 gap-2 text-stone-300 pt-1">
                <div>Total Closed Orders: <strong className="text-white">{orders.length}</strong></div>
                <div>Gross Sales: <strong className="text-amber-400">{currentRev.toLocaleString()} EGP</strong></div>
                <div>Raw Material Costs: <strong className="text-rose-300">{currentCost.toLocaleString()} EGP</strong></div>
                <div>Net Profit: <strong className="text-emerald-400">+{currentProfit.toLocaleString()} EGP</strong></div>
              </div>
            </div>

            {/* Explanation checklist */}
            <div className="space-y-2 text-xs text-stone-300">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>An Excel backup file (<code>BIMBO_Archive_{now.getFullYear()}_{String(now.getMonth()+1).padStart(2,'0')}.xlsx</code>) will be generated and downloaded immediately.</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>All records are permanently preserved in the "Monthly Archive" tab for future reporting and tax inspection.</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>The active register resets to 0 for the upcoming new month cycle.</span>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setIsConfirmModalOpen(false)}
                className="flex-1 py-3 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-semibold text-xs transition"
              >
                Cancel
              </button>

              <button
                onClick={handleConfirmArchive}
                className="flex-[2] py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-stone-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 active:scale-95 transition"
              >
                <Lock className="w-4 h-4" />
                <span>Seal Month & Export Backup</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* INSPECT ARCHIVE DETAIL MODAL */}
      {selectedArchiveDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="bg-stone-900 border border-stone-800 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-stone-800">
              <h3 className="font-bold text-white text-base">Archive Snapshot: {selectedArchiveDetail.monthName}</h3>
              <button onClick={() => setSelectedArchiveDetail(null)} className="text-stone-400 hover:text-white">✕</button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs bg-stone-950 p-4 rounded-xl border border-stone-800 font-mono">
              <div>
                <span className="text-stone-500 block text-[10px]">TOTAL ORDERS</span>
                <span className="text-white font-bold text-sm">{selectedArchiveDetail.totalOrders}</span>
              </div>
              <div>
                <span className="text-stone-500 block text-[10px]">TOTAL REVENUE</span>
                <span className="text-amber-400 font-bold text-sm">{selectedArchiveDetail.totalRevenue.toLocaleString()} EGP</span>
              </div>
              <div>
                <span className="text-stone-500 block text-[10px]">RAW MATERIAL COSTS</span>
                <span className="text-rose-300 font-bold text-sm">{selectedArchiveDetail.totalCost.toLocaleString()} EGP</span>
              </div>
              <div>
                <span className="text-stone-500 block text-[10px]">NET PROFIT</span>
                <span className="text-emerald-400 font-bold text-sm">+{selectedArchiveDetail.netProfit.toLocaleString()} EGP</span>
              </div>
            </div>

            {selectedArchiveDetail.topItems && selectedArchiveDetail.topItems.length > 0 && (
              <div>
                <h4 className="font-bold text-stone-300 text-xs mb-2">Top Selling Recipes in {selectedArchiveDetail.monthName}:</h4>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {selectedArchiveDetail.topItems.map((item, idx) => (
                    <div key={idx} className="flex justify-between py-1.5 px-3 bg-stone-950 rounded-lg text-xs border border-stone-800">
                      <span className="text-white font-medium">{item.name}</span>
                      <span className="text-amber-400 font-mono">{item.quantity} sold • {item.revenue.toLocaleString()} EGP</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setSelectedArchiveDetail(null)}
                className="flex-1 py-2.5 rounded-xl bg-stone-800 text-stone-300 text-xs font-semibold"
              >
                Close
              </button>
              <button
                onClick={() => handleDownloadArchive(selectedArchiveDetail)}
                className="flex-1 py-2.5 rounded-xl bg-amber-500 text-stone-950 text-xs font-bold flex items-center justify-center gap-1.5"
              >
                <Download className="w-4 h-4" />
                <span>Export Excel</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
