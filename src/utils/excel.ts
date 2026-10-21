import * as XLSX from 'xlsx';
import { ClosedOrder, MenuItem, MonthArchive, POSSettings } from '../types/pos';

/**
 * Excel export and import services using SheetJS (XLSX)
 */

export function exportFullReportToExcel(
  closedOrders: ClosedOrder[],
  menuItems: MenuItem[],
  archives: MonthArchive[],
  settings: POSSettings
) {
  const wb = XLSX.utils.book_new();
  const dateStr = new Date().toISOString().split('T')[0];

  // 1. Sales Summary Sheet
  const totalRev = closedOrders.reduce((sum, o) => sum + o.total, 0);
  const totalCost = closedOrders.reduce((sum, o) => sum + o.totalCost, 0);
  const netProfit = totalRev - totalCost;
  const marginPct = totalRev > 0 ? ((netProfit / totalRev) * 100).toFixed(1) : '0';

  const dineInOrders = closedOrders.filter(o => o.type === 'table');
  const takeawayOrders = closedOrders.filter(o => o.type === 'takeaway');

  const cashRev = closedOrders.filter(o => o.paymentMethod === 'cash').reduce((sum, o) => sum + o.total, 0);
  const cardRev = closedOrders.filter(o => o.paymentMethod === 'card').reduce((sum, o) => sum + o.total, 0);
  const walletRev = closedOrders.filter(o => o.paymentMethod === 'wallet').reduce((sum, o) => sum + o.total, 0);

  const summaryData = [
    ['BIMBO Cafe & Restaurant - Performance Report', ''],
    ['Generated Date:', new Date().toLocaleString()],
    ['Currency:', settings.currency || 'EGP'],
    ['Location / Caravan:', settings.caravanName],
    ['', ''],
    ['KEY PERFORMANCE INDICATORS', 'AMOUNT'],
    ['Total Closed Orders', closedOrders.length],
    ['Dine-in (Table) Orders', dineInOrders.length],
    ['Takeaway (Window) Orders', takeawayOrders.length],
    ['Total Revenue (EGP)', Number(totalRev.toFixed(2))],
    ['Total Raw Material & Packaging Cost (EGP)', Number(totalCost.toFixed(2))],
    ['Total Net Profit (EGP)', Number(netProfit.toFixed(2))],
    ['Overall Profit Margin (%)', `${marginPct}%`],
    ['Average Order Value (AOV)', closedOrders.length > 0 ? Number((totalRev / closedOrders.length).toFixed(2)) : 0],
    ['', ''],
    ['PAYMENT REVENUE BREAKDOWN', 'AMOUNT (EGP)'],
    ['Cash', Number(cashRev.toFixed(2))],
    ['Card / Visa / POS', Number(cardRev.toFixed(2))],
    ['Mobile Wallet (InstaPay / VF Cash)', Number(walletRev.toFixed(2))]
  ];

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  wsSummary['!cols'] = [{ wch: 38 }, { wch: 24 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Sales_Summary');

  // 2. Order Logs Sheet
  const orderRows = closedOrders.map(order => ({
    'Order #': order.orderNumber,
    'Timestamp': new Date(order.timestamp).toLocaleString(),
    'Type': order.type === 'table' ? `Table ${order.tableNumber ?? '-'}` : 'Takeaway',
    'Items Summary': order.items.map(i => `${i.name} (x${i.quantity})`).join(', '),
    'Item Count': order.items.reduce((sum, i) => sum + i.quantity, 0),
    'Subtotal (EGP)': order.subtotal,
    'Discount (EGP)': order.discount,
    'Total Paid (EGP)': order.total,
    'Total Cost (EGP)': Number(order.totalCost.toFixed(2)),
    'Net Profit (EGP)': Number(order.netProfit.toFixed(2)),
    'Payment Method': order.paymentMethod.toUpperCase(),
    'Customer Notes': order.customerNotes || ''
  }));

  const wsOrders = XLSX.utils.json_to_sheet(orderRows);
  wsOrders['!cols'] = [
    { wch: 20 },
    { wch: 22 },
    { wch: 12 },
    { wch: 45 },
    { wch: 12 },
    { wch: 14 },
    { wch: 14 },
    { wch: 16 },
    { wch: 16 },
    { wch: 16 },
    { wch: 16 },
    { wch: 25 }
  ];
  XLSX.utils.book_append_sheet(wb, wsOrders, 'Order_Logs');

  // 3. Menu Cost & Profit Breakdown Sheet
  const menuRows = menuItems.map(item => ({
    'Category': item.category,
    'Item Name': item.name,
    'Selling Price (EGP)': item.price,
    'Cup & Lid (EGP)': item.costs.cupAndLid,
    'Coffee / Base (EGP)': item.costs.coffeeOrBase,
    'Milk / Dairy (EGP)': item.costs.milk,
    'Sugar / Sweeteners (EGP)': item.costs.sugar,
    'Syrups & Sauces (EGP)': item.costs.syrupAndSauce,
    'Packaging & Napkins (EGP)': item.costs.coverPackaging,
    'Other / Garnish (EGP)': item.costs.other,
    'Total Unit Cost (EGP)': item.totalCost,
    'Net Profit (EGP)': item.netProfit,
    'Profit Margin (%)': `${item.marginPercent}%`,
    'Status': item.isAvailable ? 'Available' : 'Unavailable'
  }));

  const wsMenu = XLSX.utils.json_to_sheet(menuRows);
  wsMenu['!cols'] = [
    { wch: 20 },
    { wch: 30 },
    { wch: 18 },
    { wch: 16 },
    { wch: 18 },
    { wch: 16 },
    { wch: 18 },
    { wch: 20 },
    { wch: 22 },
    { wch: 18 },
    { wch: 18 },
    { wch: 16 },
    { wch: 16 },
    { wch: 14 }
  ];
  XLSX.utils.book_append_sheet(wb, wsMenu, 'Menu_Cost_Breakdown');

  // 4. Daily Performance Breakdown Sheet
  const dailyMap = new Map<string, { count: number; rev: number; cost: number; profit: number }>();
  closedOrders.forEach(o => {
    const day = o.timestamp.split('T')[0];
    const prev = dailyMap.get(day) || { count: 0, rev: 0, cost: 0, profit: 0 };
    dailyMap.set(day, {
      count: prev.count + 1,
      rev: prev.rev + o.total,
      cost: prev.cost + o.totalCost,
      profit: prev.profit + o.netProfit
    });
  });

  const dailyRows = Array.from(dailyMap.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([day, stats]) => ({
      'Date': day,
      'Orders Count': stats.count,
      'Revenue (EGP)': Number(stats.rev.toFixed(2)),
      'Cost (EGP)': Number(stats.cost.toFixed(2)),
      'Net Profit (EGP)': Number(stats.profit.toFixed(2)),
      'Margin (%)': stats.rev > 0 ? `${((stats.profit / stats.rev) * 100).toFixed(1)}%` : '0%'
    }));

  const wsDaily = XLSX.utils.json_to_sheet(dailyRows);
  wsDaily['!cols'] = [{ wch: 14 }, { wch: 14 }, { wch: 16 }, { wch: 16 }, { wch: 16 }, { wch: 14 }];
  XLSX.utils.book_append_sheet(wb, wsDaily, 'Daily_Breakdown');

  // 5. Past Archives Sheet (if any)
  if (archives && archives.length > 0) {
    const archiveRows = archives.map(a => ({
      'Month Period': a.monthName,
      'Archived Date': new Date(a.archivedAt).toLocaleDateString(),
      'Total Orders': a.totalOrders,
      'Total Revenue (EGP)': a.totalRevenue,
      'Total Cost (EGP)': a.totalCost,
      'Net Profit (EGP)': a.netProfit,
      'Margin (%)': `${a.marginPercent}%`
    }));
    const wsArch = XLSX.utils.json_to_sheet(archiveRows);
    wsArch['!cols'] = [{ wch: 20 }, { wch: 16 }, { wch: 14 }, { wch: 18 }, { wch: 16 }, { wch: 16 }, { wch: 14 }];
    XLSX.utils.book_append_sheet(wb, wsArch, 'Past_Archives');
  }

  // Trigger Excel file download in browser
  const filename = `BIMBO_Cafe_Report_${dateStr}.xlsx`;
  XLSX.writeFile(wb, filename);
}

/**
 * Export specific month archive snapshot
 */
export function exportSingleArchiveToExcel(archive: MonthArchive) {
  const wb = XLSX.utils.book_new();

  const summary = [
    ['BIMBO Cafe & Restaurant - Monthly Archive Report', ''],
    ['Month Period:', archive.monthName],
    ['Archive Timestamp:', new Date(archive.archivedAt).toLocaleString()],
    ['', ''],
    ['METRIC', 'VALUE'],
    ['Total Orders', archive.totalOrders],
    ['Total Revenue (EGP)', archive.totalRevenue],
    ['Total Material Cost (EGP)', archive.totalCost],
    ['Net Profit (EGP)', archive.netProfit],
    ['Profit Margin (%)', `${archive.marginPercent}%`]
  ];

  const wsSummary = XLSX.utils.aoa_to_sheet(summary);
  wsSummary['!cols'] = [{ wch: 30 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Month_Summary');

  if (archive.topItems && archive.topItems.length > 0) {
    const wsTop = XLSX.utils.json_to_sheet(
      archive.topItems.map((t, idx) => ({
        'Rank': idx + 1,
        'Item Name': t.name,
        'Quantity Sold': t.quantity,
        'Revenue (EGP)': t.revenue,
        'Net Profit (EGP)': t.profit
      }))
    );
    wsTop['!cols'] = [{ wch: 8 }, { wch: 30 }, { wch: 16 }, { wch: 16 }, { wch: 16 }];
    XLSX.utils.book_append_sheet(wb, wsTop, 'Top_Selling_Items');
  }

  if (archive.orders && archive.orders.length > 0) {
    const orderRows = archive.orders.map(order => ({
      'Order #': order.orderNumber,
      'Timestamp': new Date(order.timestamp).toLocaleString(),
      'Type': order.type,
      'Table #': order.tableNumber ?? '-',
      'Total (EGP)': order.total,
      'Cost (EGP)': order.totalCost,
      'Net Profit (EGP)': order.netProfit,
      'Payment Method': order.paymentMethod.toUpperCase()
    }));
    const wsOrders = XLSX.utils.json_to_sheet(orderRows);
    XLSX.utils.book_append_sheet(wb, wsOrders, 'Archived_Orders');
  }

  const filename = `BIMBO_Archive_${archive.monthKey}.xlsx`;
  XLSX.writeFile(wb, filename);
}

/**
 * Generate a blank or pre-filled Menu Import Template for the user
 */
export function downloadMenuExcelTemplate() {
  const wb = XLSX.utils.book_new();

  const templateRows = [
    {
      'Category': 'Hot Coffee',
      'Item Name': 'Caramel Macchiato',
      'Price EGP': 85,
      'Cup & Lid': 3.5,
      'Coffee Base': 12,
      'Milk': 18,
      'Sugar': 0.5,
      'Syrup & Sauce': 10,
      'Packaging & Cover': 1.5,
      'Other': 0.5,
      'Description': 'Layered espresso with vanilla and caramel drizzle'
    },
    {
      'Category': 'Cold Brew & Iced',
      'Item Name': 'Pistachio Iced Latte',
      'Price EGP': 105,
      'Cup & Lid': 4.5,
      'Coffee Base': 12,
      'Milk': 20,
      'Sugar': 0.5,
      'Syrup & Sauce': 18,
      'Packaging & Cover': 1.8,
      'Other': 2.0,
      'Description': 'Cold milk infused with Italian pistachio paste & double espresso'
    },
    {
      'Category': 'Food & Sandwiches',
      'Item Name': 'Roast Beef Bagel',
      'Price EGP': 110,
      'Cup & Lid': 0,
      'Coffee Base': 0,
      'Milk': 0,
      'Sugar': 0,
      'Syrup & Sauce': 4,
      'Packaging & Cover': 3.5,
      'Other': 55,
      'Description': 'Toasted everything bagel with deli roast beef and mustard sauce'
    }
  ];

  const ws = XLSX.utils.json_to_sheet(templateRows);
  ws['!cols'] = [
    { wch: 18 },
    { wch: 28 },
    { wch: 12 },
    { wch: 12 },
    { wch: 14 },
    { wch: 10 },
    { wch: 10 },
    { wch: 16 },
    { wch: 18 },
    { wch: 10 },
    { wch: 40 }
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Menu_Template');
  XLSX.writeFile(wb, 'BIMBO_Menu_Import_Template.xlsx');
}

/**
 * Parse an uploaded Excel / CSV file to extract menu items
 */
export async function parseMenuExcelFile(file: File): Promise<{
  success: boolean;
  items: MenuItem[];
  message: string;
  count: number;
}> {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert sheet to JSON array
        const rawJson = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet);

        if (!rawJson || rawJson.length === 0) {
          resolve({
            success: false,
            items: [],
            message: 'Uploaded file contains no rows or is empty.',
            count: 0
          });
          return;
        }

        const parsedItems: MenuItem[] = [];

        rawJson.forEach((row, index) => {
          // Normalize keys by lowercase and strip non-alphanumeric
          const normalized: Record<string, unknown> = {};
          Object.keys(row).forEach(k => {
            const cleanKey = k.toLowerCase().replace(/[^a-z0-9]/g, '');
            normalized[cleanKey] = row[k];
          });

          // Helper getter
          const getNum = (aliases: string[], fallback = 0): number => {
            for (const alias of aliases) {
              const val = normalized[alias];
              if (val !== undefined && val !== null && val !== '') {
                const num = parseFloat(String(val));
                if (!isNaN(num)) return num;
              }
            }
            return fallback;
          };

          const getString = (aliases: string[], fallback = ''): string => {
            for (const alias of aliases) {
              const val = normalized[alias];
              if (val !== undefined && val !== null && String(val).trim() !== '') {
                return String(val).trim();
              }
            }
            return fallback;
          };

          const name = getString(['itemname', 'name', 'item', 'productname'], `Imported Item ${index + 1}`);
          const category = getString(['category', 'cat', 'section'], 'Caravan Specials');
          const price = getNum(['priceegp', 'price', 'sellingprice', 'sellingpriceegp'], 50);
          const description = getString(['description', 'desc', 'notes'], '');

          const cupAndLid = getNum(['cuplid', 'cupandlid', 'cup', 'cups'], 0);
          const coffeeOrBase = getNum(['coffeebase', 'coffee', 'base', 'beans', 'tea'], 0);
          const milk = getNum(['milk', 'dairy', 'freshmilk'], 0);
          const sugar = getNum(['sugar', 'sweetener'], 0);
          const syrupAndSauce = getNum(['syrupsauce', 'syrup', 'sauce', 'flavoring'], 0);
          const coverPackaging = getNum(['packagingcover', 'packaging', 'cover', 'straw', 'box'], 0);
          const other = getNum(['other', 'extras', 'misc', 'garnish', 'ingredients'], 0);

          const costs = {
            cupAndLid: Number(cupAndLid.toFixed(2)),
            coffeeOrBase: Number(coffeeOrBase.toFixed(2)),
            milk: Number(milk.toFixed(2)),
            sugar: Number(sugar.toFixed(2)),
            syrupAndSauce: Number(syrupAndSauce.toFixed(2)),
            coverPackaging: Number(coverPackaging.toFixed(2)),
            other: Number(other.toFixed(2))
          };

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

          parsedItems.push({
            id: `imp-${Date.now()}-${index}`,
            name,
            category,
            price,
            costs,
            totalCost,
            netProfit,
            marginPercent,
            isAvailable: true,
            description: description || undefined
          });
        });

        resolve({
          success: true,
          items: parsedItems,
          message: `Successfully parsed ${parsedItems.length} menu items from Excel!`,
          count: parsedItems.length
        });
      } catch (err) {
        resolve({
          success: false,
          items: [],
          message: `Error reading Excel file: ${err instanceof Error ? err.message : 'Invalid format'}`,
          count: 0
        });
      }
    };

    reader.onerror = () => {
      resolve({
        success: false,
        items: [],
        message: 'Failed to read file from disk.',
        count: 0
      });
    };

    reader.readAsArrayBuffer(file);
  });
}
