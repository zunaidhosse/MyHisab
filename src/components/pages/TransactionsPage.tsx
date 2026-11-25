import React, { useMemo, useState } from 'react';
import {
  Edit3,
  FileDown,
  Filter,
  Printer,
  RotateCcw,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  PAYMENT_METHODS,
  Transaction,
} from '../../types';
import {
  exportTransactionsPDF,
  formatDate,
  formatMoney,
  formatTime,
} from '../../utils/formatters';
import { getCategoryLabel, getMonthName, getPaymentLabel, TEXT } from '../../utils/i18n';

export const TransactionsPage: React.FC = () => {
  const {
    transactions,
    settings,
    setEditingTransaction,
    navigate,
    deleteTransaction,
    requestConfirm,
  } = useApp();

  const lang = settings.language;
  const curr = settings.currency;
  const t = TEXT[lang];

  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [monthFilter, setMonthFilter] = useState<string>('all');
  const [yearFilter, setYearFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  const availableYears = useMemo(() => {
    const years = new Set<string>([String(new Date().getFullYear())]);
    transactions.forEach((tx) => {
      if (tx.date.length >= 4) years.add(tx.date.slice(0, 4));
    });
    return Array.from(years).sort((a, b) => b.localeCompare(a));
  }, [transactions]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return transactions.filter((tx) => {
      if (typeFilter !== 'all' && tx.type !== typeFilter) return false;
      if (yearFilter !== 'all' && !tx.date.startsWith(yearFilter)) return false;
      if (monthFilter !== 'all') {
        const m = tx.date.slice(5, 7);
        if (m !== monthFilter.padStart(2, '0')) return false;
      }
      if (dateFilter && tx.date !== dateFilter) return false;
      if (categoryFilter !== 'all' && tx.category !== categoryFilter) return false;
      if (paymentFilter !== 'all' && tx.paymentMethod !== paymentFilter) return false;
      if (q) {
        const catEn = getCategoryLabel(tx.category, 'en').toLowerCase();
        const catBn = getCategoryLabel(tx.category, 'bn').toLowerCase();
        const pmStr = getPaymentLabel(tx.paymentMethod, lang).toLowerCase();
        const match =
          tx.note.toLowerCase().includes(q) ||
          catEn.includes(q) ||
          catBn.includes(q) ||
          pmStr.includes(q) ||
          String(tx.amount).includes(q) ||
          tx.date.includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [
    transactions,
    typeFilter,
    yearFilter,
    monthFilter,
    dateFilter,
    categoryFilter,
    paymentFilter,
    searchQuery,
    lang,
  ]);

  const summary = useMemo(() => {
    let income = 0;
    let expense = 0;
    filtered.forEach((tx) => {
      if (tx.type === 'income') income += tx.amount;
      else expense += tx.amount;
    });
    return { income, expense, net: income - expense };
  }, [filtered]);

  const resetFilters = () => {
    setTypeFilter('all');
    setSearchQuery('');
    setMonthFilter('all');
    setYearFilter('all');
    setDateFilter('');
    setCategoryFilter('all');
    setPaymentFilter('all');
  };

  const handleEdit = (tx: Transaction) => {
    setSelectedTx(null);
    setEditingTransaction(tx);
    navigate('entry');
  };

  const handleDelete = (tx: Transaction) => {
    requestConfirm(t.confirmDeleteTitle, t.confirmDeleteMsg, () => {
      deleteTransaction(tx.id);
      if (selectedTx?.id === tx.id) setSelectedTx(null);
    });
  };

  const allCategories = [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES];

  return (
    <div className="space-y-4">
      {/* Top Tabs + Export/Print Controls */}
      <div className="no-print rounded-3xl bg-white dark:bg-slate-900 border-2 border-[#174D3C] p-3 shadow-sm space-y-3">
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => setTypeFilter('all')}
            className={`py-2 px-2 rounded-xl text-xs font-extrabold transition ${
              typeFilter === 'all'
                ? 'bg-[#E81760] text-white shadow-sm'
                : 'bg-[#F0F3FF] dark:bg-slate-800 text-slate-700 dark:text-slate-200'
            }`}
          >
            {t.all}
          </button>
          <button
            type="button"
            onClick={() => setTypeFilter('income')}
            className={`py-2 px-2 rounded-xl text-xs font-extrabold transition ${
              typeFilter === 'income'
                ? 'bg-[#C9E9CE] text-[#174D3C] border border-[#174D3C]'
                : 'bg-[#F0F3FF] dark:bg-slate-800 text-slate-700 dark:text-slate-200'
            }`}
          >
            {t.incomeHistory}
          </button>
          <button
            type="button"
            onClick={() => setTypeFilter('expense')}
            className={`py-2 px-2 rounded-xl text-xs font-extrabold transition ${
              typeFilter === 'expense'
                ? 'bg-[#F7C8CC] text-[#9F1239] border border-[#E81760]'
                : 'bg-[#F0F3FF] dark:bg-slate-800 text-slate-700 dark:text-slate-200'
            }`}
          >
            {t.expenseHistory}
          </button>
        </div>

        {/* Search + Filter Toggle + PDF + Print */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#F0F3FF] dark:bg-slate-800 border border-[#174D3C]/25 text-xs sm:text-sm text-slate-900 dark:text-white focus:border-[#E81760] focus:outline-none"
            />
          </div>

          <button
            type="button"
            onClick={() => setShowFilters((v) => !v)}
            className={`px-3 py-2 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition ${
              showFilters
                ? 'bg-[#80F5F3] text-[#174D3C] border-[#174D3C]'
                : 'bg-[#D2E6FA] dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-[#174D3C]/25'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>{t.filters}</span>
          </button>

          <button
            type="button"
            onClick={() =>
              exportTransactionsPDF(
                filtered,
                curr,
                settings.dateFormat,
                settings.timeFormat,
                lang
              )
            }
            className="px-3 py-2 rounded-xl text-xs font-bold bg-[#174D3C] text-white flex items-center gap-1.5 hover:brightness-110 transition"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>{t.pdfExport}</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="px-3 py-2 rounded-xl text-xs font-bold bg-[#E81760] text-white flex items-center gap-1.5 hover:brightness-110 transition"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>{t.print}</span>
          </button>
        </div>

        {/* Expanded Filter Controls */}
        {showFilters && (
          <div className="pt-2 border-t border-slate-200 dark:border-slate-700 grid grid-cols-2 sm:grid-cols-3 gap-2">
            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="px-2.5 py-2 rounded-xl bg-[#F0F3FF] dark:bg-slate-800 border border-[#174D3C]/25 text-xs font-semibold"
            >
              <option value="all">{t.allYears}</option>
              {availableYears.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>

            <select
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              className="px-2.5 py-2 rounded-xl bg-[#F0F3FF] dark:bg-slate-800 border border-[#174D3C]/25 text-xs font-semibold"
            >
              <option value="all">{t.allMonths}</option>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={String(m)}>
                  {getMonthName(m, lang)}
                </option>
              ))}
            </select>

            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-2.5 py-2 rounded-xl bg-[#F0F3FF] dark:bg-slate-800 border border-[#174D3C]/25 text-xs font-semibold"
            />

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-2.5 py-2 rounded-xl bg-[#F0F3FF] dark:bg-slate-800 border border-[#174D3C]/25 text-xs font-semibold"
            >
              <option value="all">{t.allCategories}</option>
              {allCategories.map((c) => (
                <option key={c} value={c}>
                  {getCategoryLabel(c, lang)}
                </option>
              ))}
            </select>

            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="px-2.5 py-2 rounded-xl bg-[#F0F3FF] dark:bg-slate-800 border border-[#174D3C]/25 text-xs font-semibold"
            >
              <option value="all">{t.allPayments}</option>
              {PAYMENT_METHODS.map((pm) => (
                <option key={pm} value={pm}>
                  {getPaymentLabel(pm, lang)}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={resetFilters}
              className="px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white text-xs font-bold flex items-center justify-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? 'রিসেট' : 'Reset'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Filtered Summary Bar */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-2xl bg-[#C9E9CE] dark:bg-emerald-950/70 border border-[#174D3C] p-2.5 text-center">
          <p className="text-[11px] font-bold text-[#174D3C] dark:text-emerald-200">{t.totalIncome}</p>
          <p className="text-sm font-extrabold font-mono-num text-[#174D3C] dark:text-emerald-100">
            {formatMoney(summary.income, curr)}
          </p>
        </div>
        <div className="rounded-2xl bg-[#F7C8CC] dark:bg-rose-950/70 border border-[#E81760] p-2.5 text-center">
          <p className="text-[11px] font-bold text-[#9F1239] dark:text-rose-200">{t.totalExpense}</p>
          <p className="text-sm font-extrabold font-mono-num text-[#9F1239] dark:text-rose-100">
            {formatMoney(summary.expense, curr)}
          </p>
        </div>
        <div className="rounded-2xl bg-[#D2E6FA] dark:bg-sky-950/70 border border-[#174D3C] p-2.5 text-center">
          <p className="text-[11px] font-bold text-[#174D3C] dark:text-sky-200">
            {lang === 'bn' ? 'নেট ব্যালেন্স' : 'Net Balance'}
          </p>
          <p className="text-sm font-extrabold font-mono-num text-slate-900 dark:text-white">
            {formatMoney(summary.net, curr, true)}
          </p>
        </div>
      </div>

      {/* Transaction Cards */}
      {filtered.length === 0 ? (
        <div className="rounded-3xl bg-white dark:bg-slate-900 border-2 border-[#174D3C] p-8 text-center">
          <p className="text-sm font-bold text-slate-600 dark:text-slate-300">{t.noData}</p>
          <button
            type="button"
            onClick={() => navigate('entry')}
            className="mt-3 px-4 py-2 rounded-xl bg-[#E81760] text-white text-xs font-bold"
          >
            {lang === 'bn' ? 'প্রথম লেনদেন যুক্ত করুন' : 'Add First Transaction'}
          </button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((tx) => {
            const isIncome = tx.type === 'income';
            return (
              <div
                key={tx.id}
                onClick={() => setSelectedTx(tx)}
                className={`cursor-pointer rounded-2xl border-2 p-3.5 shadow-sm transition hover:shadow-md flex items-center justify-between gap-3 ${
                  isIncome
                    ? 'bg-[#C9E9CE]/75 dark:bg-emerald-950/50 border-[#174D3C]/40'
                    : 'bg-[#F7C8CC]/75 dark:bg-rose-950/50 border-[#E81760]/40'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-extrabold text-slate-900 dark:text-white truncate">
                      {getCategoryLabel(tx.category, lang)}
                    </span>
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                      · {getPaymentLabel(tx.paymentMethod, lang)}
                    </span>
                  </div>
                  {tx.note && (
                    <p className="text-xs text-slate-700 dark:text-slate-300 truncate mt-0.5">
                      {tx.note}
                    </p>
                  )}
                  <p className="text-[11px] font-medium text-slate-600 dark:text-slate-400 mt-1">
                    {formatDate(tx.date, settings.dateFormat)} ·{' '}
                    {formatTime(tx.time, settings.timeFormat)}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`text-base font-extrabold font-mono-num ${
                      isIncome
                        ? 'text-[#174D3C] dark:text-emerald-300'
                        : 'text-[#9F1239] dark:text-rose-300'
                    }`}
                  >
                    {isIncome ? '+' : '-'}
                    {formatMoney(tx.amount, curr)}
                  </span>

                  <div className="no-print flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => handleEdit(tx)}
                      aria-label={t.edit}
                      className="w-8 h-8 rounded-lg bg-white/80 dark:bg-slate-800 text-[#174D3C] dark:text-sky-300 flex items-center justify-center hover:bg-white"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(tx)}
                      aria-label={t.delete}
                      className="w-8 h-8 rounded-lg bg-white/80 dark:bg-slate-800 text-[#E81760] flex items-center justify-center hover:bg-white"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Transaction Detail Modal */}
      {selectedTx && (
        <div className="no-print fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 border-2 border-[#174D3C] p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                {lang === 'bn' ? 'লেনদেনের বিস্তারিত' : 'Transaction Details'}
              </h3>
              <button
                type="button"
                onClick={() => setSelectedTx(null)}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div
              className={`rounded-2xl p-4 text-center mb-4 ${
                selectedTx.type === 'income'
                  ? 'bg-[#C9E9CE] text-[#174D3C]'
                  : 'bg-[#F7C8CC] text-[#9F1239]'
              }`}
            >
              <p className="text-xs font-bold uppercase">
                {selectedTx.type === 'income'
                  ? lang === 'bn'
                    ? 'আয়'
                    : 'Income'
                  : lang === 'bn'
                  ? 'ব্যয়'
                  : 'Expense'}
              </p>
              <p className="text-2xl font-extrabold font-mono-num mt-1">
                {formatMoney(selectedTx.amount, curr)}
              </p>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">{lang === 'bn' ? 'ক্যাটাগরি' : 'Category'}</span>
                <span className="font-bold">{getCategoryLabel(selectedTx.category, lang)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">{t.paymentMethod}</span>
                <span className="font-bold">{getPaymentLabel(selectedTx.paymentMethod, lang)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">{t.date}</span>
                <span className="font-bold">
                  {formatDate(selectedTx.date, settings.dateFormat)} ·{' '}
                  {formatTime(selectedTx.time, settings.timeFormat)}
                </span>
              </div>
              <div className="py-1.5">
                <span className="text-slate-500 block mb-1">{t.note}</span>
                <p className="font-medium text-slate-800 dark:text-slate-200 bg-[#F0F3FF] dark:bg-slate-800 p-2.5 rounded-xl">
                  {selectedTx.note || (lang === 'bn' ? 'কোনো নোট নেই' : 'No note')}
                </p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => handleEdit(selectedTx)}
                className="py-2.5 rounded-xl bg-[#174D3C] text-white text-xs font-bold flex items-center justify-center gap-1.5"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>{t.edit}</span>
              </button>
              <button
                type="button"
                onClick={() => handleDelete(selectedTx)}
                className="py-2.5 rounded-xl bg-[#E81760] text-white text-xs font-bold flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{t.delete}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
