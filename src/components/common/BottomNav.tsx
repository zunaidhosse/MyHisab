import React from 'react';
import { Home, ListOrdered, PieChart, Plus, Settings } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PageRoute } from '../../types';
import { TEXT } from '../../utils/i18n';

export const BottomNav: React.FC = () => {
  const { currentPage, navigate, setEditingTransaction, setPrefilledEntryAmount, settings } = useApp();
  const t = TEXT[settings.language];

  const handleOpenEntry = () => {
    setEditingTransaction(null);
    setPrefilledEntryAmount(null);
    navigate('entry');
  };

  const navItemClass = (page: PageRoute) => {
    const active = currentPage === page;
    return `flex flex-col items-center justify-center min-h-[44px] px-1 py-1 rounded-xl transition-colors ${
      active
        ? 'text-[#E81760] font-bold'
        : 'text-[#174D3C] dark:text-[#174D3C] font-medium hover:text-[#E81760]'
    }`;
  };

  return (
    <nav
      aria-label="Bottom Navigation"
      className="no-print fixed bottom-0 left-0 right-0 z-40 bg-[#80F5F3] border-t-2 border-[#174D3C] shadow-[0_-4px_16px_rgba(23,77,60,0.14)] pb-safe"
    >
      <div className="max-w-2xl mx-auto grid grid-cols-5 items-center h-16 px-1">
        <button
          type="button"
          onClick={() => navigate('home')}
          className={navItemClass('home')}
        >
          <Home className={`w-5 h-5 ${currentPage === 'home' ? 'stroke-[2.6]' : 'stroke-2'}`} />
          <span className="text-[11px] mt-0.5 whitespace-nowrap truncate max-w-full">
            {t.navHome}
          </span>
        </button>

        <button
          type="button"
          onClick={() => navigate('transactions')}
          className={navItemClass('transactions')}
        >
          <ListOrdered
            className={`w-5 h-5 ${currentPage === 'transactions' ? 'stroke-[2.6]' : 'stroke-2'}`}
          />
          <span className="text-[11px] mt-0.5 whitespace-nowrap truncate max-w-full">
            {t.navTransactions}
          </span>
        </button>

        {/* Center Large Circular Pink Plus Button */}
        <div className="flex items-center justify-center -mt-6">
          <button
            type="button"
            onClick={handleOpenEntry}
            aria-label={t.addIncome}
            className="w-14 h-14 rounded-full bg-gradient-to-br from-[#FF2D78] to-[#E81760] text-white border-[3px] border-[#174D3C] shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-transform focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#E81760]/40"
          >
            <Plus className="w-7 h-7 stroke-[3]" />
          </button>
        </div>

        <button
          type="button"
          onClick={() => navigate('analytics')}
          className={navItemClass('analytics')}
        >
          <PieChart
            className={`w-5 h-5 ${currentPage === 'analytics' ? 'stroke-[2.6]' : 'stroke-2'}`}
          />
          <span className="text-[11px] mt-0.5 whitespace-nowrap truncate max-w-full">
            {t.navAnalytics}
          </span>
        </button>

        <button
          type="button"
          onClick={() => navigate('settings')}
          className={navItemClass('settings')}
        >
          <Settings
            className={`w-5 h-5 ${currentPage === 'settings' ? 'stroke-[2.6]' : 'stroke-2'}`}
          />
          <span className="text-[11px] mt-0.5 whitespace-nowrap truncate max-w-full">
            {t.navSettings}
          </span>
        </button>
      </div>
    </nav>
  );
};
