import React, { useState, useRef } from 'react';
import { ClosedOrder, MenuItem, MonthArchive, POSSettings } from '../types/pos';
import { 
  FileSpreadsheet, 
  Download, 
  Upload, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles,
  Layers,
  ArrowRight,
  Database
} from 'lucide-react';
import { 
  exportFullReportToExcel, 
  downloadMenuExcelTemplate, 
  parseMenuExcelFile 
} from '../utils/excel';
import { exportDatabaseBackupJSON } from '../utils/storage';
import { sound } from '../utils/sound';

interface ExcelIOViewProps {
  orders: ClosedOrder[];
  menuItems: MenuItem[];
  archives: MonthArchive[];
  settings: POSSettings;
  onImportMenu: (importedItems: MenuItem[], mode: 'replace' | 'append') => void;
  onShowToast: (msg: string) => void;
}

export const ExcelIOView: React.FC<ExcelIOViewProps> = ({
  orders,
  menuItems,
  archives,
  settings,
  onImportMenu,
  onShowToast
}) => {
  const [isParsing, setIsParsing] = useState(false);
  const [importResult, setImportResult] = useState<{
    items: MenuItem[];
    count: number;
    filename: string;
  } | null>(null);
  const [importMode, setImportMode] = useState<'append' | 'replace'>('append');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. Export Full Monthly Report
  const handleExportFullReport = () => {
    sound.playTap();
    try {
      exportFullReportToExcel(orders, menuItems, archives, settings);
      sound.playCash();
      onShowToast('Excel workbook exported and downloaded successfully!');
    } catch (err) {
      onShowToast(`Export error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  // 2. Download Template
  const handleDownloadTemplate = () => {
    sound.playTap();
    downloadMenuExcelTemplate();
    onShowToast('Downloaded BIMBO_Menu_Import_Template.xlsx');
  };

  // 3. Handle File Upload
  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    sound.playTap();
    setIsParsing(true);

    try {
      const res = await parseMenuExcelFile(file);
      setIsParsing(false);
      if (res.success && res.items.length > 0) {
        setImportResult({
          items: res.items,
          count: res.count,
          filename: file.name
        });
      } else {
        onShowToast(res.message);
      }
    } catch (err) {
      setIsParsing(false);
      onShowToast(`Failed to parse Excel file: ${err instanceof Error ? err.message : 'Unknown'}`);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Commit import
  const handleConfirmImport = () => {
    if (!importResult) return;
    sound.playCash();
    onImportMenu(importResult.items, importMode);
    onShowToast(`Successfully imported ${importResult.count} recipes into BIMBO menu!`);
    setImportResult(null);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-emerald-400" />
            <span>Excel (.xlsx) Import & Export Hub</span>
          </h2>
          <p className="text-xs text-stone-400 mt-1">
            Seamless interoperability with Microsoft Excel, Google Sheets, and accounting workflows using SheetJS.
          </p>
        </div>

        <button
          onClick={handleDownloadTemplate}
          className="w-full md:w-auto px-4 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-semibold text-xs flex items-center justify-center gap-2 border border-stone-700 transition"
        >
          <FileText className="w-4 h-4 text-amber-400" />
          <span>Download Excel Template</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* EXPORT SECTION */}
        <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Download className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-black text-white text-lg">Export Financial & Order Reports</h3>
                <p className="text-xs text-stone-400">Generates comprehensive multi-tab .xlsx workbook</p>
              </div>
            </div>

            <div className="bg-stone-950 p-4 rounded-2xl border border-stone-800 space-y-3">
              <h4 className="text-xs font-bold text-stone-300 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-emerald-400" /> Included Workbook Sheets:
              </h4>

              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2 text-stone-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span><strong>1. Sales_Summary:</strong> Executive totals, net revenue, costs, margin %, and cash vs card splits.</span>
                </div>
                <div className="flex items-center gap-2 text-stone-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span><strong>2. Order_Logs:</strong> Full transaction audit trail with {orders.length} closed orders and item details.</span>
                </div>
                <div className="flex items-center gap-2 text-stone-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span><strong>3. Menu_Cost_Breakdown:</strong> All {menuItems.length} recipe formulas with raw materials and profits.</span>
                </div>
                <div className="flex items-center gap-2 text-stone-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span><strong>4. Daily_Breakdown:</strong> Day-by-day sales velocity and profitability calendar.</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-stone-950 p-3 rounded-xl border border-stone-800 text-center">
                <span className="text-[10px] text-stone-400 block uppercase">Ready Orders</span>
                <span className="text-lg font-black font-mono text-amber-400">{orders.length}</span>
              </div>
              <div className="bg-stone-950 p-3 rounded-xl border border-stone-800 text-center">
                <span className="text-[10px] text-stone-400 block uppercase">Menu Recipes</span>
                <span className="text-lg font-black font-mono text-emerald-400">{menuItems.length}</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleExportFullReport}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-emerald-600/25 active:scale-95 transition"
          >
            <Download className="w-5 h-5 stroke-[2.5]" />
            <span>Download Full Report (.xlsx)</span>
          </button>
        </div>

        {/* IMPORT SECTION */}
        <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-black text-white text-lg">Import Menu & Recipes from Excel</h3>
                <p className="text-xs text-stone-400">Populate or update recipes, selling prices & material costs</p>
              </div>
            </div>

            {/* Drop / Upload Box */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-stone-700 hover:border-amber-500 bg-stone-950/60 rounded-2xl p-8 text-center cursor-pointer transition group"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                className="hidden"
                onChange={handleFileSelected}
              />

              <div className="w-14 h-14 rounded-2xl bg-stone-900 group-hover:bg-amber-500/20 text-stone-400 group-hover:text-amber-400 flex items-center justify-center mx-auto mb-3 transition">
                <Upload className="w-7 h-7" />
              </div>

              <h4 className="font-bold text-white text-sm">
                {isParsing ? 'Reading Excel file...' : 'Choose .xlsx or .csv spreadsheet'}
              </h4>
              <p className="text-xs text-stone-400 mt-1">
                Drag & drop your inventory or recipe spreadsheet here, or browse files.
              </p>
              <span className="inline-block mt-3 px-3 py-1 rounded-full bg-stone-900 text-stone-300 text-[11px] font-semibold border border-stone-800 group-hover:border-amber-500/40">
                Supports XLSX, XLS & CSV
              </span>
            </div>

            {/* Template Notice */}
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex items-start gap-2 text-xs text-amber-300">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Need the exact Excel format?</span>
                Download our pre-made template with all recipe cost columns (Cup, Coffee, Milk, Sugar, Syrup, Cover, Price).
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleDownloadTemplate}
              className="w-full py-3 px-4 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-semibold text-xs flex items-center justify-center gap-1.5 transition border border-stone-700"
            >
              <FileSpreadsheet className="w-4 h-4 text-amber-400" />
              <span>Get Excel Template</span>
            </button>
          </div>
        </div>

      </div>

      {/* 100% OFFLINE LOCAL BACKUP CARD */}
      <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-black text-white text-base sm:text-lg flex items-center gap-2">
              <span>100% Offline Local Database Backup</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold uppercase">
                Zero Cloud
              </span>
            </h3>
            <p className="text-xs text-stone-400 max-w-xl">
              All tables, menu prices, recipe costs, and sales records are stored locally on this device in localStorage &amp; IndexedDB. Download a complete offline backup file (.json) to store on a USB drive or transfer to another device.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            sound.playCash();
            exportDatabaseBackupJSON();
            onShowToast('Offline database backup (.json) saved to your device!');
          }}
          className="px-5 py-3 rounded-2xl bg-stone-800 hover:bg-stone-700 text-stone-100 font-bold text-xs flex items-center gap-2 border border-stone-700 hover:border-amber-500/50 transition shadow shrink-0 cursor-pointer active:scale-95"
        >
          <Download className="w-4 h-4 text-amber-400" />
          <span>Export Local Backup (.json)</span>
        </button>
      </div>

      {/* IMPORT PREVIEW & CONFIRMATION MODAL */}
      {importResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in">
          <div className="bg-stone-900 border border-stone-800 rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            
            <div className="p-5 bg-stone-950 border-b border-stone-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="font-bold text-white text-base">Excel Import Preview</h3>
                  <p className="text-xs text-stone-400">{importResult.filename} • {importResult.count} recipes found</p>
                </div>
              </div>
              <button
                onClick={() => setImportResult(null)}
                className="text-stone-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 text-xs flex-1">
              {/* Import Mode Radio */}
              <div className="bg-stone-950 p-3.5 rounded-xl border border-stone-800 space-y-2">
                <span className="font-bold text-white block uppercase text-[10px] tracking-wider">
                  Import Action Mode:
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setImportMode('append')}
                    className={`p-2.5 rounded-xl border text-left transition ${
                      importMode === 'append'
                        ? 'bg-amber-500/10 border-amber-500 text-white font-bold'
                        : 'bg-stone-900 border-stone-800 text-stone-400'
                    }`}
                  >
                    <span className="block text-white">Append / Add to Menu</span>
                    <span className="text-[10px] text-stone-400 block font-normal">
                      Keep existing {menuItems.length} items and add new items.
                    </span>
                  </button>

                  <button
                    onClick={() => setImportMode('replace')}
                    className={`p-2.5 rounded-xl border text-left transition ${
                      importMode === 'replace'
                        ? 'bg-red-500/10 border-red-500 text-white font-bold'
                        : 'bg-stone-900 border-stone-800 text-stone-400'
                    }`}
                  >
                    <span className="block text-red-400">Replace Entire Menu</span>
                    <span className="text-[10px] text-stone-400 block font-normal">
                      Overwrites current menu with these {importResult.count} items.
                    </span>
                  </button>
                </div>
              </div>

              {/* Sample preview table */}
              <div>
                <span className="font-bold text-stone-300 block mb-2 uppercase text-[10px] tracking-wider">
                  Sample Preview of Parsed Items:
                </span>
                <div className="bg-stone-950 rounded-xl border border-stone-800 overflow-x-auto max-h-52">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-stone-800 text-stone-400 text-[10px] uppercase">
                        <th className="p-2">Item Name</th>
                        <th className="p-2">Category</th>
                        <th className="p-2 text-right">Price</th>
                        <th className="p-2 text-right">Raw Cost</th>
                        <th className="p-2 text-right">Net Profit</th>
                        <th className="p-2 text-right">Margin %</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-800/60 font-mono">
                      {importResult.items.slice(0, 10).map((it, idx) => (
                        <tr key={idx} className="text-[11px]">
                          <td className="p-2 text-white font-sans font-bold">{it.name}</td>
                          <td className="p-2 text-stone-400 font-sans">{it.category}</td>
                          <td className="p-2 text-right text-amber-400">{it.price} EGP</td>
                          <td className="p-2 text-right text-rose-300">{it.totalCost.toFixed(1)}</td>
                          <td className="p-2 text-right text-emerald-400">+{it.netProfit.toFixed(1)}</td>
                          <td className="p-2 text-right text-stone-300">{it.marginPercent}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {importResult.items.length > 10 && (
                  <p className="text-[10px] text-stone-500 mt-1 italic">
                    + {importResult.items.length - 10} more recipes will be imported.
                  </p>
                )}
              </div>
            </div>

            <div className="p-4 bg-stone-950 border-t border-stone-800 flex gap-2">
              <button
                onClick={() => setImportResult(null)}
                className="flex-1 py-3 rounded-xl bg-stone-800 text-stone-300 font-semibold text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmImport}
                className="flex-[2] py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirm & Import {importResult.count} Items</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
