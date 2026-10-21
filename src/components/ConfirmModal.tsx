import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { sound } from '../utils/sound';

export interface ConfirmModalState {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
}

interface ConfirmModalProps {
  state: ConfirmModalState | null;
  onClose: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({ state, onClose }) => {
  if (!state || !state.isOpen) return null;

  const handleConfirm = () => {
    sound.playTap();
    state.onConfirm();
    onClose();
  };

  const handleCancel = () => {
    sound.playTap();
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={handleCancel}
    >
      <div 
        className="bg-stone-900 border border-stone-800 rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div className="w-11 h-11 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-400 flex items-center justify-center">
            <Trash2 className="w-5 h-5" />
          </div>
          <button
            onClick={handleCancel}
            className="p-1 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div>
          <h3 className="text-base font-bold text-white tracking-tight">
            {state.title}
          </h3>
          <p className="text-xs text-stone-300 mt-1 leading-relaxed">
            {state.message}
          </p>
        </div>

        <div className="flex gap-2.5 pt-2">
          <button
            type="button"
            onClick={handleCancel}
            className="flex-1 py-2.5 px-3 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 font-semibold text-xs border border-stone-700/80 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="flex-1 py-2.5 px-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-lg shadow-red-600/25 active:scale-95 transition flex items-center justify-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{state.confirmLabel || 'Delete'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
