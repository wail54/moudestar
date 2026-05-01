'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface Toast {
  message: string;
  type: 'success' | 'error' | 'info';
}

interface ToastContextValue {
  showToast: (message: string, type?: Toast['type']) => void;
}

const ToastContext = createContext<ToastContextValue>({ showToast: () => {} });

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<Toast | null>(null);
  const [visible, setVisible] = useState(false);

  const showToast = useCallback((message: string, type: Toast['type'] = 'info') => {
    setToast({ message, type });
    setVisible(true);
    setTimeout(() => setVisible(false), 3000);
  }, []);

  const colors = {
    success: 'bg-emerald-900/80 border-emerald-500/30 text-emerald-100',
    error: 'bg-red-900/80 border-red-500/30 text-red-100',
    info: 'bg-[var(--dark-3)] border-white/10 text-[var(--light)]',
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] transition-all duration-300 ${
          visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
      >
        {toast && (
          <div
            className={`px-6 py-3 rounded-lg border backdrop-blur-md text-sm font-medium shadow-xl ${colors[toast.type]}`}
          >
            {toast.message}
          </div>
        )}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
