import React, { useMemo, useState } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Banknote,
  Bell,
  BookOpen,
  Building2,
  Calculator,
  CalendarClock,
  ChevronDown,
  ChevronUp,
  HandCoins,
  PiggyBank,
  Receipt,
  Smartphone,
  StickyNote,
  Target,
  TrendingDown,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PageRoute, PAYMENT_METHODS } from '../../types';
import { formatMoney, getTodayDateString } from '../../utils/formatters';
import { getPaymentLabel, TEXT } from '../../utils/i18n';

export const HomePage: React.FC = () => {
  const {
    metrics,
    settings,
    reminders,
    budgets,
    transactions,
    navigate,
    setEditingTransaction,
    setPrefilledEntryType,
    setPrefilledEntryAmount,
  } = useApp();

  const [showAllWallets, setShowAllWallets] = useState(false);

  const lang = settings.language;
  const curr = settings.currency;
  const t = TEXT[lang];

  // Dynamic Notice Banner computation
  const noticeInfo = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const today = getTodayDateString();

    const exceededBudget = budgets.find((b) => {
      if (b.month !== currentMonth || b.year !== currentYear) return false;
      const spent = transactions
        .filter(
          (tx) =>
            tx.type === 'expense' &&
            tx.category === b.category &&
            tx.date.startsWith(`${currentYear}-${String(currentMonth).padStart(2, '0')}`)
        )
        .reduce((s, tx) => s + tx.amount, 0);
      return spent > b.amount;
    });

    if (exceededBudget) {
      return {
        type: 'warning' as const,
        route: 'budget' as PageRoute,
        text:
          lang === 'bn'
            ? `সতর্কতা: "${exceededBudget.category}" খাতে মাসিক বাজেট অতিক্রম করেছে!`
            : `Alert: "${exceededBudget.category}" exceeded its monthly budget!`,
      };
    }

    const pendingToday = reminders.filter((r) => !r.completed && r.date <= today);
    if (pendingToday.length > 0) {
      return {
        type: 'reminder' as const,
        route: 'reminder' as PageRoute,
        text:
          lang === 'bn'
            ? `আপনার ${pendingToday.length}টি রিমাইন্ডার বাকি আছে: "${pendingToday[0].title}"`
            : `You have ${pendingToday.length} due reminder(s): "${pendingToday[0].title}"`,
      };
    }

    return {
      type: 'info' as const,
      route: 'tutorial' as PageRoute,
      text:
        lang === 'bn'
          ? 'MyHisab-এ স্বাগতম! আপনার প্রতিদিনের আয়, ব্যয়, সঞ্চয় ও বাকি সহজে হিসাব রাখুন।'
          : 'Welcome to MyHisab! Track your daily income, expenses, savings & dues offline.',
    };
  }, [budgets, transactions, reminders, lang]);

  const shortcuts: {
    route: PageRoute;
    label: string;
    icon: React.ReactNode;
    bg: string;
    iconColor: string;
  }[] = [
    {
      route: 'savings',
      label: t.savings,
      icon: <PiggyBank className="w-6 h-6" />,
      bg: 'bg-[#C9E9CE] dark:bg-emerald-950/70',
      iconColor: 'text-[#174D3C] dark:text-emerald-300',
    },
    {
      route: 'loan',
      label: t.loan,
      icon: <HandCoins className="w-6 h-6" />,
      bg: 'bg-[#D2E6FA] dark:bg-sky-950/70',
      iconColor: 'text-[#174D3C] dark:text-sky-300',
    },
    {
      route: 'due',
      label: t.due,
      icon: <Users className="w-6 h-6" />,
      bg: 'bg-[#F7C8CC] dark:bg-rose-950/70',
      iconColor: 'text-[#E81760] dark:text-rose-300',
    },
    {
      route: 'budget',
      label: t.budget,
      icon: <Target className="w-6 h-6" />,
      bg: 'bg-[#80F5F3]/50 dark:bg-teal-950/70',
      iconColor: 'text-[#174D3C] dark:text-teal-300',
    },
    {
      route: 'reminder',
      label: t.reminder,
      icon: <CalendarClock className="w-6 h-6" />,
      bg: 'bg-[#D2E6FA] dark:bg-indigo-950/70',
      iconColor: 'text-[#E81760] dark:text-indigo-300',
    },
    {
      route: 'notes',
      label: t.notes,
      icon: <StickyNote className="w-6 h-6" />,
      bg: 'bg-[#C9E9CE] dark:bg-emerald-950/70',
      iconColor: 'text-[#174D3C] dark:text-emerald-300',
    },
    {
      route: 'calculator',
      label: t.calculator,
      icon: <Calculator className="w-6 h-6" />,
      bg: 'bg-[#F7C8CC] dark:bg-pink-950/70',
      iconColor: 'text-[#E81760] dark:text-pink-300',
    },
    {
      route: 'tutorial',
      label: t.tutorial,
      icon: <BookOpen className="w-6 h-6" />,
      bg: 'bg-[#80F5F3]/50 dark:bg-cyan-950/70',
      iconColor: 'text-[#174D3C] dark:text-cyan-300',
    },
  ];

  const openQuickEntry = (type: 'income' | 'expense') => {
    setEditingTransaction(null);
    setPrefilledEntryAmount(null);
    setPrefilledEntryType(type);
    navigate('entry');
  };

  return (
    <div className="space-y-4">
      {/* 1. Hero Balance Card: MyHisab Wallet, Lifetime Balance & This Year Balance */}
      <section className="rounded-3xl bg-gradient-to-br from-[#E81760] via-[#D81358] to-[#174D3C] text-white p-5 shadow-lg border-2 border-[#174D3C]">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-white text-[#E81760] border-2 border-[#80F5F3] flex items-center justify-center shadow shrink-0">
              <Wallet className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg font-extrabold tracking-tight truncate">{t.appName}</h1>
              <p className="text-xs text-[#80F5F3] font-medium truncate">
                {settings.guestMode
                  ? lang === 'bn'
                    ? 'গেস্ট মোড · অফলাইন প্রস্তুত'
                    : 'Guest Mode · Offline Ready'
                  : settings.userName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => openQuickEntry('income')}
              className="px-3 py-1.5 rounded-xl bg-[#C9E9CE] text-[#174D3C] font-bold text-xs flex items-center gap-1 shadow-sm hover:brightness-95 active:scale-95 transition whitespace-nowrap"
            >
              <ArrowDownLeft className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? '+ আয়' : '+ Income'}</span>
            </button>
            <button
              type="button"
              onClick={() => openQuickEntry('expense')}
              className="px-3 py-1.5 rounded-xl bg-[#F7C8CC] text-[#9F1239] font-bold text-xs flex items-center gap-1 shadow-sm hover:brightness-95 active:scale-95 transition whitespace-nowrap"
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? '- ব্যয়' : '- Expense'}</span>
            </button>
          </div>
        </div>

        {/* Lifetime Balance & Year Balance */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="rounded-2xl bg-white/15 backdrop-blur-sm border border-white/20 p-3.5">
            <p className="text-xs font-medium text-white/85">{t.lifetimeBalance}</p>
            <p className="mt-1 text-2xl sm:text-3xl font-extrabold font-mono-num tracking-tight">
              {formatMoney(metrics.lifetimeBalance, curr)}
            </p>
          </div>
          <div className="rounded-2xl bg-black/20 backdrop-blur-sm border border-[#80F5F3]/35 p-3.5">
            <p className="text-xs font-medium text-[#80F5F3]">{t.yearlyBalance}</p>
            <p className="mt-1 text-2xl sm:text-3xl font-extrabold font-mono-num tracking-tight text-[#80F5F3]">
              {formatMoney(metrics.thisYearBalance, curr)}
            </p>
          </div>
        </div>

        {/* Bank, bKash, Cash Balance Strip */}
        <div className="mt-3 grid grid-cols-3 gap-2">
          <div className="rounded-2xl bg-white text-slate-900 p-2.5 shadow-sm border border-[#174D3C]/20">
            <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-600">
              <Building2 className="w-3.5 h-3.5 text-[#174D3C] shrink-0" />
              <span className="truncate">{t.bankBalance}</span>
            </div>
            <p className="mt-1 text-sm sm:text-base font-extrabold font-mono-num text-[#174D3C] truncate">
              {formatMoney(metrics.bankBalance, curr)}
            </p>
          </div>

          <div className="rounded-2xl bg-white text-slate-900 p-2.5 shadow-sm border border-[#174D3C]/20">
            <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-600">
              <Smartphone className="w-3.5 h-3.5 text-[#E81760] shrink-0" />
              <span className="truncate">{t.bkashBalance}</span>
            </div>
            <p className="mt-1 text-sm sm:text-base font-extrabold font-mono-num text-[#E81760] truncate">
              {formatMoney(metrics.bkashBalance, curr)}
            </p>
          </div>

          <div className="rounded-2xl bg-white text-slate-900 p-2.5 shadow-sm border border-[#174D3C]/20">
            <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-600">
              <Banknote className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
              <span className="truncate">{t.cashBalance}</span>
            </div>
            <p className="mt-1 text-sm sm:text-base font-extrabold font-mono-num text-emerald-800 truncate">
              {formatMoney(metrics.cashBalance, curr)}
            </p>
          </div>
        </div>

        {/* Expandable Other Wallets (Rocket, Nagad, Tap, Upay, OK Wallet) */}
        <button
          type="button"
          onClick={() => setShowAllWallets((v) => !v)}
          className="mt-2.5 w-full flex items-center justify-center gap-1 text-xs font-semibold text-white/90 hover:text-[#80F5F3] py-1 transition"
        >
          <span>
            {showAllWallets
              ? lang === 'bn'
                ? 'অন্যান্য ওয়ালেট লুকান'
                : 'Hide Other Wallets'
              : lang === 'bn'
              ? 'সব পেমেন্ট মাধ্যম ব্যালেন্স দেখুন'
              : 'View All Payment Method Balances'}
          </span>
          {showAllWallets ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showAllWallets && (
          <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2">
            {PAYMENT_METHODS.map((pm) => (
              <div
                key={pm}
                className="rounded-xl bg-white/95 text-slate-900 px-3 py-2 flex items-center justify-between text-xs shadow-sm"
              >
                <span className="font-semibold truncate">{getPaymentLabel(pm, lang)}</span>
                <span className="font-bold font-mono-num text-[#174D3C] ml-1">
                  {formatMoney(metrics.paymentBalances[pm], curr)}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 2. Notice / Notification Banner */}
      <button
        type="button"
        onClick={() => navigate(noticeInfo.route)}
        className={`w-full text-left rounded-2xl p-3.5 border-2 shadow-sm flex items-center gap-3 transition hover:brightness-[0.98] active:scale-[0.99] ${
          noticeInfo.type === 'warning'
            ? 'bg-[#F7C8CC] dark:bg-rose-950/70 border-[#E81760] text-slate-900 dark:text-rose-100'
            : noticeInfo.type === 'reminder'
            ? 'bg-[#80F5F3] dark:bg-teal-950/80 border-[#174D3C] text-[#174D3C] dark:text-teal-100'
            : 'bg-[#D2E6FA] dark:bg-slate-800 border-[#174D3C] text-slate-900 dark:text-slate-100'
        }`}
      >
        <div className="w-9 h-9 rounded-xl bg-white dark:bg-slate-900 border border-[#174D3C] flex items-center justify-center shrink-0 text-[#E81760]">
          <Bell className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-bold opacity-80">{t.noticeTitle}</p>
          <p className="text-xs sm:text-sm font-semibold leading-snug">{noticeInfo.text}</p>
        </div>
      </button>

      {/* 3. Financial Summary Grid (Total Income, Expense, Loan Given, Loan Taken, Due, Savings) */}
      <section className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <button
          type="button"
          onClick={() => navigate('transactions')}
          className="text-left rounded-2xl bg-[#C9E9CE] dark:bg-emerald-950/70 border-2 border-[#174D3C] p-3.5 shadow-sm hover:shadow-md transition"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#174D3C] dark:text-emerald-200">
              {t.totalIncome}
            </span>
            <TrendingUp className="w-4 h-4 text-[#174D3C] dark:text-emerald-300" />
          </div>
          <p className="mt-1.5 text-lg sm:text-xl font-extrabold font-mono-num text-[#174D3C] dark:text-emerald-100 truncate">
            {formatMoney(metrics.totalIncome, curr)}
          </p>
        </button>

        <button
          type="button"
          onClick={() => navigate('transactions')}
          className="text-left rounded-2xl bg-[#F7C8CC] dark:bg-rose-950/70 border-2 border-[#174D3C] p-3.5 shadow-sm hover:shadow-md transition"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#9F1239] dark:text-rose-200">
              {t.totalExpense}
            </span>
            <TrendingDown className="w-4 h-4 text-[#E81760] dark:text-rose-300" />
          </div>
          <p className="mt-1.5 text-lg sm:text-xl font-extrabold font-mono-num text-[#9F1239] dark:text-rose-100 truncate">
            {formatMoney(metrics.totalExpense, curr)}
          </p>
        </button>

        <button
          type="button"
          onClick={() => navigate('loan')}
          className="text-left rounded-2xl bg-[#D2E6FA] dark:bg-sky-950/70 border-2 border-[#174D3C] p-3.5 shadow-sm hover:shadow-md transition"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#174D3C] dark:text-sky-200">
              {t.totalLoanGiven}
            </span>
            <ArrowUpRight className="w-4 h-4 text-[#174D3C] dark:text-sky-300" />
          </div>
          <p className="mt-1.5 text-lg sm:text-xl font-extrabold font-mono-num text-slate-900 dark:text-white truncate">
            {formatMoney(metrics.totalLoanGiven, curr)}
          </p>
        </button>

        <button
          type="button"
          onClick={() => navigate('loan')}
          className="text-left rounded-2xl bg-white dark:bg-slate-800 border-2 border-[#174D3C] p-3.5 shadow-sm hover:shadow-md transition"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#E81760] dark:text-pink-300">
              {t.totalLoanTaken}
            </span>
            <ArrowDownLeft className="w-4 h-4 text-[#E81760] dark:text-pink-300" />
          </div>
          <p className="mt-1.5 text-lg sm:text-xl font-extrabold font-mono-num text-slate-900 dark:text-white truncate">
            {formatMoney(metrics.totalLoanTaken, curr)}
          </p>
        </button>

        <button
          type="button"
          onClick={() => navigate('due')}
          className="text-left rounded-2xl bg-[#D2E6FA] dark:bg-indigo-950/70 border-2 border-[#174D3C] p-3.5 shadow-sm hover:shadow-md transition"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#174D3C] dark:text-indigo-200">
              {t.totalDue}
            </span>
            <Receipt className="w-4 h-4 text-[#E81760] dark:text-indigo-300" />
          </div>
          <p className="mt-1.5 text-lg sm:text-xl font-extrabold font-mono-num text-slate-900 dark:text-white truncate">
            {formatMoney(metrics.totalDue, curr)}
          </p>
        </button>

        <button
          type="button"
          onClick={() => navigate('savings')}
          className="text-left rounded-2xl bg-[#80F5F3]/55 dark:bg-teal-950/70 border-2 border-[#174D3C] p-3.5 shadow-sm hover:shadow-md transition"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#174D3C] dark:text-teal-200">
              {t.totalSavings}
            </span>
            <PiggyBank className="w-4 h-4 text-[#174D3C] dark:text-teal-300" />
          </div>
          <p className="mt-1.5 text-lg sm:text-xl font-extrabold font-mono-num text-[#174D3C] dark:text-teal-100 truncate">
            {formatMoney(metrics.totalSavings, curr)}
          </p>
        </button>
      </section>

      {/* 4. Shortcut Menu (8 Modules) */}
      <section className="rounded-3xl bg-white dark:bg-slate-900 border-2 border-[#174D3C] p-4 shadow-sm">
        <h2 className="text-sm font-extrabold text-[#174D3C] dark:text-[#80F5F3] mb-3">
          {t.shortcutMenu}
        </h2>
        <div className="grid grid-cols-4 gap-2.5 sm:gap-3">
          {shortcuts.map((item) => (
            <button
              key={item.route}
              type="button"
              onClick={() => navigate(item.route)}
              className="flex flex-col items-center justify-center p-2.5 rounded-2xl border border-[#174D3C]/20 dark:border-slate-700 hover:border-[#E81760] bg-[#F0F3FF]/60 dark:bg-slate-800/80 active:scale-95 transition min-h-[82px]"
            >
              <div
                className={`w-11 h-11 rounded-2xl ${item.bg} ${item.iconColor} flex items-center justify-center border border-[#174D3C]/25 shadow-xs`}
              >
                {item.icon}
              </div>
              <span className="mt-1.5 text-xs font-bold text-slate-800 dark:text-slate-100 text-center leading-tight">
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* 5. Bottom Today Summary: Today's Income, Expense, Profit */}
      <section className="rounded-3xl bg-white dark:bg-slate-900 border-2 border-[#174D3C] p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-extrabold text-[#174D3C] dark:text-[#80F5F3]">
            {t.todaySummary}
          </h2>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            {getTodayDateString()}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2.5">
          <div className="rounded-2xl bg-[#C9E9CE] dark:bg-emerald-950/70 border border-[#174D3C]/30 p-3 text-center">
            <p className="text-[11px] font-bold text-[#174D3C] dark:text-emerald-200">
              {t.todayIncome}
            </p>
            <p className="mt-1 text-sm sm:text-base font-extrabold font-mono-num text-[#174D3C] dark:text-emerald-100 truncate">
              {formatMoney(metrics.todayIncome, curr)}
            </p>
          </div>

          <div className="rounded-2xl bg-[#F7C8CC] dark:bg-rose-950/70 border border-[#E81760]/30 p-3 text-center">
            <p className="text-[11px] font-bold text-[#9F1239] dark:text-rose-200">
              {t.todayExpense}
            </p>
            <p className="mt-1 text-sm sm:text-base font-extrabold font-mono-num text-[#9F1239] dark:text-rose-100 truncate">
              {formatMoney(metrics.todayExpense, curr)}
            </p>
          </div>

          <div className="rounded-2xl bg-[#D2E6FA] dark:bg-sky-950/70 border border-[#174D3C]/30 p-3 text-center">
            <p className="text-[11px] font-bold text-[#174D3C] dark:text-sky-200">
              {t.todayProfit}
            </p>
            <p
              className={`mt-1 text-sm sm:text-base font-extrabold font-mono-num truncate ${
                metrics.todayProfit >= 0
                  ? 'text-[#174D3C] dark:text-emerald-300'
                  : 'text-[#E81760] dark:text-rose-300'
              }`}
            >
              {formatMoney(metrics.todayProfit, curr, true)}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
