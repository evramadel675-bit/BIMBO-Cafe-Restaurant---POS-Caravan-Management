import React from 'react';
import { Sparkles, CheckCircle, Info, X } from 'lucide-react';

interface ToastProps {
  message: string | null;
  onDismiss: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, onDismiss }) => {
  if (!message) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-md animate-in slide-in-from-bottom-5 fade-in duration-200">
      <div className="bg-stone-900 border border-amber-500/50 text-white rounded-2xl p-4 shadow-2xl flex items-start gap-3 backdrop-blur-md">
        <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
          <Sparkles className="w-4 h-4" />
        </div>
        <div className="flex-1 pr-2">
          <p className="text-xs font-medium text-stone-200 leading-relaxed">
            {message}
          </p>
        </div>
        <button
          onClick={onDismiss}
          className="text-stone-400 hover:text-white p-1 rounded-lg hover:bg-stone-800 transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
