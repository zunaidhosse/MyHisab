import React, { useState } from 'react';
import { AlertTriangle, CheckCircle2, Info, Lock, WifiOff, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { TEXT } from '../../utils/i18n';

export const ConfirmModal: React.FC = () => {
  const { confirmDialog, closeConfirm, settings } = useApp();
  const lang = settings.language;

  if (!confirmDialog.isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 border-2 border-[#174D3C] p-5 shadow-2xl">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#F7C8CC] text-[#E81760] flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {confirmDialog.title}
            </h3>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              {confirmDialog.message}
            </p>
          </div>
        </div>
        <div className="mt-5 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={closeConfirm}
            className="px-4 py-2 rounded-xl text-sm font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
          >
            {TEXT[lang].cancel}
          </button>
          <button
            type="button"
            onClick={() => {
              confirmDialog.onConfirm();
              closeConfirm();
            }}
            className="px-4 py-2 rounded-xl text-sm font-semibold bg-[#E81760] text-white hover:brightness-95 transition"
          >
            {confirmDialog.confirmLabel || TEXT[lang].delete}
          </button>
        </div>
      </div>
    </div>
  );
};

export const ToastBanner: React.FC = () => {
  const { toast } = useApp();
  if (!toast) return null;

  const styleMap = {
    success: 'bg-[#174D3C] text-white border-[#80F5F3]',
    error: 'bg-[#E81760] text-white border-white/40',
    info: 'bg-slate-900 text-white border-[#80F5F3]',
  };

  return (
    <div className="no-print fixed top-16 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-md pointer-events-none">
      <div
        className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl border shadow-xl text-sm font-semibold ${styleMap[toast.type]}`}
      >
        {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 shrink-0 text-[#80F5F3]" />}
        {toast.type === 'error' && <AlertTriangle className="w-4 h-4 shrink-0" />}
        {toast.type === 'info' && <Info className="w-4 h-4 shrink-0 text-[#80F5F3]" />}
        <span className="flex-1">{toast.message}</span>
      </div>
    </div>
  );
};

export const OfflineBar: React.FC = () => {
  const { isOnline, settings } = useApp();
  if (isOnline) return null;

  return (
    <div className="no-print bg-amber-500 text-slate-950 px-4 py-1.5 text-xs font-bold flex items-center justify-center gap-2">
      <WifiOff className="w-3.5 h-3.5 shrink-0" />
      <span>{TEXT[settings.language].offlineBanner}</span>
    </div>
  );
};

export const PinLockOverlay: React.FC = () => {
  const { isLocked, unlockApp, settings } = useApp();
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  if (!isLocked) return null;

  const lang = settings.language;

  const handleDigit = (d: string) => {
    if (pin.length >= 4) return;
    const next = pin + d;
    setPin(next);
    setError(false);
    if (next.length === 4) {
      const ok = unlockApp(next);
      if (!ok) {
        setError(true);
        setTimeout(() => setPin(''), 400);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-[#E81760] via-[#C81050] to-[#174D3C] flex flex-col items-center justify-center p-6 text-white">
      <div className="w-16 h-16 rounded-2xl bg-white text-[#E81760] border-2 border-[#80F5F3] flex items-center justify-center shadow-xl mb-4">
        <Lock className="w-8 h-8" />
      </div>
      <h2 className="text-xl font-extrabold">{TEXT[lang].appName}</h2>
      <p className="text-sm text-white/85 mt-1">
        {lang === 'bn' ? 'অ্যাপ আনলক করতে ৪-সংখ্যার পিন দিন' : 'Enter 4-digit PIN to unlock'}
      </p>

      <div className="flex items-center gap-3 my-6">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`w-4 h-4 rounded-full border-2 transition-all ${
              pin.length > i
                ? 'bg-[#80F5F3] border-[#80F5F3] scale-110'
                : 'border-white/60 bg-transparent'
            }`}
          />
        ))}
      </div>

      {error && (
        <p className="text-xs font-bold bg-black/30 px-3 py-1 rounded-lg mb-3 text-[#80F5F3]">
          {lang === 'bn' ? 'ভুল পিন! আবার চেষ্টা করুন।' : 'Incorrect PIN! Try again.'}
        </p>
      )}

      <div className="grid grid-cols-3 gap-3 w-full max-w-[260px]">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'].map((key, idx) => {
          if (key === '') return <div key={idx} />;
          if (key === 'del') {
            return (
              <button
                key={key}
                type="button"
                onClick={() => setPin((p) => p.slice(0, -1))}
                className="h-14 rounded-2xl bg-white/15 hover:bg-white/25 flex items-center justify-center font-bold text-sm active:scale-95 transition"
              >
                <X className="w-5 h-5" />
              </button>
            );
          }
          return (
            <button
              key={key}
              type="button"
              onClick={() => handleDigit(key)}
              className="h-14 rounded-2xl bg-white/20 hover:bg-white/30 text-xl font-bold active:scale-95 transition"
            >
              {key}
            </button>
          );
        })}
      </div>
    </div>
  );
};
