import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/common/Header';
import { BottomNav } from './components/common/BottomNav';
import {
  ConfirmModal,
  OfflineBar,
  PinLockOverlay,
  ToastBanner,
} from './components/common/ConfirmModal';
import { HomePage } from './components/pages/HomePage';
import { EntryPage } from './components/pages/EntryPage';
import { TransactionsPage } from './components/pages/TransactionsPage';
import { AnalyticsPage } from './components/pages/AnalyticsPage';
import { SavingsPage } from './components/pages/SavingsPage';
import { LoanPage } from './components/pages/LoanPage';
import { DuePage } from './components/pages/DuePage';
import { BudgetPage } from './components/pages/BudgetPage';
import { ReminderPage } from './components/pages/ReminderPage';
import { NotesPage } from './components/pages/NotesPage';
import { CalculatorPage } from './components/pages/CalculatorPage';
import { TutorialPage } from './components/pages/TutorialPage';
import { SettingsPage } from './components/pages/SettingsPage';

const AppContent: React.FC = () => {
  const { isLoading, currentPage } = useApp();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F0F3FF] dark:bg-slate-950 flex flex-col items-center justify-center p-6">
        <div className="w-16 h-16 rounded-2xl bg-[#E81760] border-2 border-[#174D3C] animate-pulse flex items-center justify-center text-white text-2xl font-extrabold shadow-lg">
          ৳
        </div>
        <p className="mt-3 text-sm font-extrabold text-[#174D3C] dark:text-[#80F5F3]">
          MyHisab...
        </p>
      </div>
    );
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage />;
      case 'entry':
        return <EntryPage />;
      case 'transactions':
        return <TransactionsPage />;
      case 'analytics':
        return <AnalyticsPage />;
      case 'settings':
        return <SettingsPage />;
      case 'savings':
        return <SavingsPage />;
      case 'loan':
        return <LoanPage />;
      case 'due':
        return <DuePage />;
      case 'budget':
        return <BudgetPage />;
      case 'reminder':
        return <ReminderPage />;
      case 'notes':
        return <NotesPage />;
      case 'calculator':
        return <CalculatorPage />;
      case 'tutorial':
        return <TutorialPage />;
      default:
        return <HomePage />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F0F3FF] dark:bg-[#0B1120] text-slate-900 dark:text-slate-100 transition-colors">
      <Header />
      <OfflineBar />
      <ToastBanner />
      <main className="max-w-6xl mx-auto px-3.5 sm:px-6 pt-4 pb-24">
        {renderPage()}
      </main>
      <BottomNav />
      <ConfirmModal />
      <PinLockOverlay />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
