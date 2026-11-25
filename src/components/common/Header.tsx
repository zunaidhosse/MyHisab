import React, { useState } from 'react';
import { ArrowLeft, Download, Lock, Moon, Sun, Wallet, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { PageRoute } from '../../types';
import { TEXT } from '../../utils/i18n';

const MAIN_TABS: PageRoute[] = ['home', 'transactions', 'analytics', 'settings'];

export const Header: React.FC = () => {
  const { currentPage, navigate, settings, updateSettings, lockAppNow } = useApp();
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSModal, setShowIOSModal] = useState(false);

  const lang = settings.language;
  const t = TEXT[lang];
  const isMainTab = MAIN_TABS.includes(currentPage);

  const getPageTitle = (): string => {
    switch (currentPage) {
      case 'home':
        return t.appName;
      case 'transactions':
        return t.allTransactions;
      case 'entry':
        return t.addIncome + ' / ' + t.addExpense;
      case 'analytics':
        return t.analytics;
      case 'settings':
        return t.settings;
      case 'savings':
        return t.savings;
      case 'loan':
        return t.loan;
      case 'due':
        return t.due;
      case 'budget':
        return t.budget;
      case 'reminder':
        return t.reminder;
      case 'notes':
        return t.notes;
      case 'calculator':
        return t.calculator;
      case 'tutorial':
        return t.tutorial;
      default:
        return t.appName;
    }
  };

  return (
    <>
      <header className="no-print sticky top-0 z-30 bg-gradient-to-r from-[#E81760] to-[#D11154] text-white shadow-md border-b-2 border-[#174D3C]">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
          {/* Left: Wallet Brand or Back Button */}
          <div className="flex items-center gap-2.5 min-w-0">
            {isMainTab ? (
              <button
                type="button"
                onClick={() => navigate('home')}
                className="flex items-center gap-2.5 min-w-0 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white rounded-xl py-1"
              >
                <span className="w-9 h-9 rounded-xl bg-white text-[#E81760] border-2 border-[#174D3C] flex items-center justify-center shadow-sm shrink-0">
                  <Wallet className="w-5 h-5" />
                </span>
                <span className="text-lg font-extrabold tracking-tight truncate whitespace-nowrap">
                  {getPageTitle()}
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => navigate('home')}
                aria-label={t.back}
                className="flex items-center gap-2 min-h-[40px] pr-2 text-white hover:opacity-90 active:scale-95 transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white rounded-lg min-w-0"
              >
                <span className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                  <ArrowLeft className="w-4 h-4" />
                </span>
                <span className="text-base font-bold truncate">{getPageTitle()}</span>
              </button>
            )}
          </div>

          {/* Right: Contextual Actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            {!isInstalled && (isInstallable || isIOS) && (
              <button
                type="button"
                onClick={() => (isInstallable ? install() : setShowIOSModal(true))}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#80F5F3] text-[#174D3C] font-bold text-xs shadow-sm hover:brightness-95 active:scale-95 transition whitespace-nowrap shrink-0"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{lang === 'bn' ? 'ইনস্টল' : 'Install'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => updateSettings({ language: lang === 'bn' ? 'en' : 'bn' })}
              aria-label="Toggle Language"
              className="px-2.5 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white text-xs font-bold border border-white/25 transition whitespace-nowrap shrink-0"
            >
              {lang === 'bn' ? 'EN' : 'বাংলা'}
            </button>

            <button
              type="button"
              onClick={() => updateSettings({ darkMode: !settings.darkMode })}
              aria-label="Toggle Theme"
              className="w-9 h-9 rounded-lg bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition shrink-0"
            >
              {settings.darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {settings.appLockEnabled && settings.pinCode.length === 4 && (
              <button
                type="button"
                onClick={lockAppNow}
                aria-label="Lock App"
                className="w-9 h-9 rounded-lg bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition shrink-0"
              >
                <Lock className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </header>

      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 border-2 border-[#174D3C] p-5 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {lang === 'bn' ? 'iPhone / iPad এ ইনস্টল করুন' : 'Install on iPhone / iPad'}
              </h3>
              <button
                type="button"
                onClick={() => setShowIOSModal(false)}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <ol className="text-sm text-slate-700 dark:text-slate-300 space-y-2 list-decimal pl-5">
              <li>
                {lang === 'bn'
                  ? 'Safari ব্রাউজারের নিচের Share বাটনে ট্যাপ করুন।'
                  : 'Tap the Share button in the Safari toolbar.'}
              </li>
              <li>
                {lang === 'bn'
                  ? 'নিচে স্ক্রল করে "Add to Home Screen" নির্বাচন করুন।'
                  : 'Scroll down and tap "Add to Home Screen".'}
              </li>
            </ol>
            <button
              type="button"
              onClick={() => setShowIOSModal(false)}
              className="mt-4 w-full py-2.5 rounded-xl bg-[#E81760] text-white font-semibold text-sm"
            >
              {lang === 'bn' ? 'বুঝেছি' : 'Got it'}
            </button>
          </div>
        </div>
      )}
    </>
  );
};
