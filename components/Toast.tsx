
import React, { useEffect } from 'react';

interface ToastProps {
  message: string;
  isVisible: boolean;
  onClose: () => void;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const Toast: React.FC<ToastProps> = ({ message, isVisible, onClose, action }) => {
  useEffect(() => {
    if (isVisible && !action) {
      // Only auto-close if there is no action required
      const timer = setTimeout(onClose, 3000); 
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose, action]);

  if (!isVisible) return null;

  return (
    <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] animate-fade-in-up w-full max-w-xs px-4">
      <div className="bg-slate-900/95 backdrop-blur-md text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center justify-between gap-3 border border-white/10">
        <div className="flex items-center gap-2">
           {!action && <span className="text-lg">✅</span>}
           <span className="text-xs font-bold leading-tight">{message}</span>
        </div>
        {action ? (
          <div className="flex gap-2">
              <button 
                onClick={() => { action.onClick(); onClose(); }}
                className="bg-brand-DEFAULT text-white px-3 py-1.5 rounded-lg text-xs font-black hover:bg-brand-dark transition-colors whitespace-nowrap"
              >
                {action.label}
              </button>
              <button onClick={onClose} className="text-slate-400 hover:text-white px-2">✕</button>
          </div>
        ) : (
             <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
        )}
      </div>
    </div>
  );
};
