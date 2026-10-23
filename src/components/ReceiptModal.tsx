import React from 'react';
import { ClosedOrder, POSSettings } from '../types/pos';
import { Printer, Check, X, Copy } from 'lucide-react';
import { sound } from '../utils/sound';

interface ReceiptModalProps {
  order: ClosedOrder | null;
  onClose: () => void;
  settings: POSSettings;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ order, onClose, settings }) => {
  const [copied, setCopied] = React.useState(false);

  if (!order) return null;

  const handlePrint = () => {
    sound.playTap();
    window.print();
  };

  const copyReceiptText = () => {
    sound.playTap();
    const text = `
========================================
       ${settings.caravanName}
       ${settings.address}
       Tel: ${settings.phone}
========================================
Order #: ${order.orderNumber}
Date: ${new Date(order.timestamp).toLocaleString()}
Type: ${order.type === 'table' ? `Table ${order.tableNumber}` : 'Takeaway (Caravan Window)'}
Payment: ${order.paymentMethod.toUpperCase()}
----------------------------------------
${order.items.map(i => `${i.name.padEnd(24)} x${i.quantity}  ${(i.price * i.quantity).toFixed(2)} EGP`).join('\n')}
----------------------------------------
Subtotal:       ${order.subtotal.toFixed(2)} EGP
Discount:       ${order.discount.toFixed(2)} EGP
TOTAL:          ${order.total.toFixed(2)} EGP
${order.paymentMethod === 'cash' ? `Paid Tender:    ${(order.tendered || order.total).toFixed(2)} EGP\nChange:         ${(order.change || 0).toFixed(2)} EGP` : ''}
========================================
   Thank you for visiting BIMBO!
      Fresh Beans & Caravan Smiles
========================================
`.trim();

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-stone-900 border border-stone-800 rounded-3xl w-[95%] sm:max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-800 bg-stone-950/60">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
            <h3 className="font-bold text-white text-base">Receipt Preview & Print</h3>
          </div>
          <button
            onClick={() => {
              sound.playTap();
              onClose();
            }}
            className="p-1.5 rounded-full hover:bg-stone-800 text-stone-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Thermal Receipt Paper View (Printable Target) */}
        <div className="p-6 overflow-y-auto flex-1 bg-stone-950/40 flex justify-center">
          <div 
            id="printable-receipt"
            className="bg-white text-stone-950 font-mono text-xs p-6 rounded-xl shadow-lg w-full max-w-xs border border-stone-200 relative select-text"
          >
            {/* Top caravan header */}
            <div className="text-center pb-3 border-b border-dashed border-stone-400 flex flex-col items-center">
              <img 
                src="/assets/aistudio/Gemini_Generated_Image_cbgr2zcbgr2zcbgr_cddd89ba.jpg" 
                alt="BIMBO Cafe & Restaurant Logo" 
                className="w-16 h-16 rounded-full object-cover mb-2 border border-stone-300 shadow-sm"
              />
              <h2 className="text-lg font-black tracking-tight text-stone-900">BIMBO</h2>
              <p className="text-[11px] font-sans font-medium text-stone-700 tracking-wide uppercase">Cafe & Restaurant</p>
              <p className="text-[10px] text-stone-500 mt-0.5">{settings.address}</p>
              <p className="text-[10px] text-stone-500">Phone: {settings.phone}</p>
            </div>

            {/* Order meta */}
            <div className="py-2.5 border-b border-dashed border-stone-400 space-y-1 text-[11px]">
              <div className="flex justify-between font-bold">
                <span>Order #{order.orderNumber.split('-').pop()}</span>
                <span className="bg-stone-200 px-1.5 py-0.2 rounded font-sans text-[10px] uppercase">
                  {order.type === 'table' ? `Table ${order.tableNumber}` : 'Takeaway'}
                </span>
              </div>
              <div className="flex justify-between text-stone-600 text-[10px]">
                <span>{new Date(order.timestamp).toLocaleDateString()}</span>
                <span>{new Date(order.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <div className="flex justify-between text-stone-600 text-[10px]">
                <span>Payment Method</span>
                <span className="font-bold text-stone-900 uppercase">{order.paymentMethod}</span>
              </div>
            </div>

            {/* Items list */}
            <div className="py-3 border-b border-dashed border-stone-400 space-y-2">
              {order.items.map((item, idx) => (
                <div key={idx} className="space-y-0.5">
                  <div className="flex justify-between font-medium">
                    <span className="truncate pr-2">{item.name}</span>
                    <span className="font-bold">{(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-stone-500">
                    <span>{item.quantity} x {item.price.toFixed(2)} EGP</span>
                    {item.notes && <span className="italic truncate max-w-[120px]">({item.notes})</span>}
                  </div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="py-3 border-b border-dashed border-stone-400 space-y-1.5">
              <div className="flex justify-between text-stone-600 text-[11px]">
                <span>Subtotal</span>
                <span>{order.subtotal.toFixed(2)} EGP</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-emerald-700 text-[11px] font-medium">
                  <span>Discount</span>
                  <span>-{order.discount.toFixed(2)} EGP</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-black pt-1 border-t border-stone-300">
                <span>TOTAL DUE</span>
                <span className="text-stone-950 font-bold">{order.total.toFixed(2)} EGP</span>
              </div>
              {order.paymentMethod === 'cash' && order.tendered && (
                <div className="pt-1 text-[11px] text-stone-600 space-y-0.5">
                  <div className="flex justify-between">
                    <span>Cash Tendered</span>
                    <span>{order.tendered.toFixed(2)} EGP</span>
                  </div>
                  <div className="flex justify-between font-bold text-stone-900">
                    <span>Change Due</span>
                    <span>{(order.change || 0).toFixed(2)} EGP</span>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="pt-3 text-center text-stone-500 text-[10px] space-y-1">
              <p className="font-sans font-medium text-stone-700">Thank you for visiting BIMBO Caravan! ☕</p>
              <p className="text-[9px]">Fresh Brews • Made with Passion</p>
              <p className="text-[8px] text-stone-400 pt-1 font-mono tracking-widest">{order.orderNumber}</p>
            </div>
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div className="p-4 bg-stone-900 border-t border-stone-800 flex gap-3">
          <button
            onClick={copyReceiptText}
            className="flex-1 py-3 px-4 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-semibold text-xs flex items-center justify-center gap-2 border border-stone-700 transition"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied Text' : 'Copy Text'}</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition"
          >
            <Printer className="w-4 h-4" />
            <span>Print Receipt</span>
          </button>
        </div>

      </div>
    </div>
  );
};
