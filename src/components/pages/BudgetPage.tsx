import React, { useMemo, useState } from 'react';
import { AlertTriangle, Edit3, Plus, Target, Trash2, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Budget, EXPENSE_CATEGORIES, ExpenseCategory } from '../../types';
import { formatMoney, generateId } from '../../utils/formatters';
import { getCategoryLabel, getMonthName, TEXT } from '../../utils/i18n';

export const BudgetPage: React.FC = () => {
  const { budgets, transactions, saveBudget, deleteBudget, settings, requestConfirm, showToast } =
    useApp();
  const lang = settings.language;
  const curr = settings.currency;
  const t = TEXT[lang];

  const now = new Date();
  const [month, setMonth] = useState<number>(now.getMonth() + 1);
  const [year, setYear] = useState<number>(now.getFullYear());

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Budget | null>(null);
  const [category, setCategory] = useState<ExpenseCategory>('Food');
  const [amount, setAmount] = useState('');

  const monthPrefix = `${year}-${String(month).padStart(2, '0')}`;

  const monthBudgets = useMemo(
    () => budgets.filter((b) => b.month === month && b.year === year),
    [budgets, month, year]
  );

  const spentByCategory = useMemo(() => {
    const map = new Map<ExpenseCategory, number>();
    transactions.forEach((tx) => {
      if (tx.type === 'expense' && tx.date.startsWith(monthPrefix)) {
        const cat = tx.category as ExpenseCategory;
        map.set(cat, (map.get(cat) || 0) + tx.amount);
      }
    });
    return map;
  }, [transactions, monthPrefix]);

  const totals = useMemo(() => {
    const totalBudget = monthBudgets.reduce((s, b) => s + b.amount, 0);
    const totalSpent = monthBudgets.reduce(
      (s, b) => s + (spentByCategory.get(b.category) || 0),
      0
    );
    return {
      totalBudget,
      totalSpent,
      remaining: totalBudget - totalSpent,
    };
  }, [monthBudgets, spentByCategory]);

  const exceededList = monthBudgets.filter(
    (b) => (spentByCategory.get(b.category) || 0) > b.amount
  );

  const openCreate = () => {
    setEditing(null);
    setCategory('Food');
    setAmount('');
    setShowForm(true);
  };

  const openEdit = (b: Budget) => {
    setEditing(b);
    setCategory(b.category);
    setAmount(String(b.amount));
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(amount);
    if (!num || num <= 0) {
      showToast(t.invalidAmount, 'error');
      return;
    }

    const ts = Date.now();
    const existingSameCat = !editing
      ? monthBudgets.find((b) => b.category === category)
      : undefined;

    await saveBudget({
      id: editing?.id || existingSameCat?.id || generateId(),
      category,
      amount: num,
      month,
      year,
      createdAt: editing?.createdAt || existingSameCat?.createdAt || ts,
      updatedAt: ts,
    });
    setShowForm(false);
  };

  return (
    <div className="space-y-4">
      {/* Month / Year Filter */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border-2 border-[#174D3C] p-3.5 grid grid-cols-2 gap-3 shadow-sm">
        <select
          value={month}
          onChange={(e) => setMonth(Number(e.target.value))}
          className="px-3 py-2 rounded-xl bg-[#F0F3FF] dark:bg-slate-800 border border-[#174D3C]/30 text-sm font-bold"
        >
          {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
            <option key={m} value={m}>
              {getMonthName(m, lang)}
            </option>
          ))}
        </select>
        <select
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="px-3 py-2 rounded-xl bg-[#F0F3FF] dark:bg-slate-800 border border-[#174D3C]/30 text-sm font-bold"
        >
          {[now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>

      {/* Warning Banner if any budget exceeded */}
      {exceededList.length > 0 && (
        <div className="rounded-2xl bg-[#F7C8CC] dark:bg-rose-950/80 border-2 border-[#E81760] p-3.5 flex items-center gap-3 text-[#9F1239] dark:text-rose-100">
          <AlertTriangle className="w-5 h-5 text-[#E81760] shrink-0" />
          <p className="text-xs sm:text-sm font-extrabold">
            {lang === 'bn'
              ? `সতর্কবার্তা: ${exceededList
                  .map((b) => getCategoryLabel(b.category, lang))
                  .join(', ')} খাতে বাজেট অতিক্রম করেছে!`
              : `Warning: Budget exceeded for ${exceededList
                  .map((b) => getCategoryLabel(b.category, lang))
                  .join(', ')}!`}
          </p>
        </div>
      )}

      {/* Totals */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="rounded-2xl bg-[#D2E6FA] dark:bg-sky-950/70 border-2 border-[#174D3C] p-3 text-center">
          <p className="text-[11px] font-bold text-[#174D3C] dark:text-sky-200">
            {lang === 'bn' ? 'মোট বাজেট' : 'Total Budget'}
          </p>
          <p className="text-sm sm:text-base font-extrabold font-mono-num mt-1">
            {formatMoney(totals.totalBudget, curr)}
          </p>
        </div>
        <div className="rounded-2xl bg-[#F7C8CC] dark:bg-rose-950/70 border-2 border-[#E81760] p-3 text-center">
          <p className="text-[11px] font-bold text-[#9F1239] dark:text-rose-200">
            {lang === 'bn' ? 'খরচ হয়েছে' : 'Spent'}
          </p>
          <p className="text-sm sm:text-base font-extrabold font-mono-num text-[#9F1239] dark:text-rose-100 mt-1">
            {formatMoney(totals.totalSpent, curr)}
          </p>
        </div>
        <div className="rounded-2xl bg-[#C9E9CE] dark:bg-emerald-950/70 border-2 border-[#174D3C] p-3 text-center">
          <p className="text-[11px] font-bold text-[#174D3C] dark:text-emerald-200">
            {lang === 'bn' ? 'অবশিষ্ট' : 'Remaining'}
          </p>
          <p
            className={`text-sm sm:text-base font-extrabold font-mono-num mt-1 ${
              totals.remaining < 0 ? 'text-[#E81760]' : 'text-[#174D3C] dark:text-emerald-100'
            }`}
          >
            {formatMoney(totals.remaining, curr)}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={openCreate}
        className="w-full py-3 rounded-2xl bg-[#E81760] text-white font-extrabold text-sm border-2 border-[#174D3C] shadow-md flex items-center justify-center gap-2"
      >
        <Plus className="w-5 h-5" />
        <span>{lang === 'bn' ? 'মাসিক বাজেট তৈরি করুন' : 'Create Category Budget'}</span>
      </button>

      {/* Budget Cards */}
      {monthBudgets.length === 0 ? (
        <div className="rounded-3xl bg-white dark:bg-slate-900 border-2 border-[#174D3C] p-8 text-center">
          <Target className="w-10 h-10 mx-auto text-[#E81760] mb-2" />
          <p className="text-sm font-bold text-slate-600 dark:text-slate-300">{t.noData}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {monthBudgets.map((b) => {
            const spent = spentByCategory.get(b.category) || 0;
            const rem = b.amount - spent;
            const pct = b.amount > 0 ? Math.min(100, (spent / b.amount) * 100) : 0;
            const over = spent > b.amount;

            return (
              <div
                key={b.id}
                className={`rounded-3xl bg-white dark:bg-slate-900 border-2 p-4 shadow-sm space-y-2.5 ${
                  over ? 'border-[#E81760]' : 'border-[#174D3C]'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                      {getCategoryLabel(b.category, lang)}
                    </h3>
                    <p className="text-xs text-slate-500">
                      {getMonthName(b.month, lang)} {b.year}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => openEdit(b)}
                      className="w-8 h-8 rounded-xl bg-[#D2E6FA] text-[#174D3C] flex items-center justify-center"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        requestConfirm(t.confirmDeleteTitle, t.confirmDeleteMsg, () =>
                          deleteBudget(b.id)
                        )
                      }
                      className="w-8 h-8 rounded-xl bg-[#F7C8CC] text-[#E81760] flex items-center justify-center"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs font-bold">
                  <span>
                    {lang === 'bn' ? 'খরচ:' : 'Spent:'}{' '}
                    <span className="font-mono-num">{formatMoney(spent, curr)}</span> /{' '}
                    <span className="font-mono-num">{formatMoney(b.amount, curr)}</span>
                  </span>
                  <span className={`font-mono-num ${over ? 'text-[#E81760]' : 'text-[#174D3C] dark:text-emerald-300'}`}>
                    {over
                      ? `${lang === 'bn' ? 'অতিরিক্ত:' : 'Over:'} ${formatMoney(Math.abs(rem), curr)}`
                      : `${lang === 'bn' ? 'বাকি:' : 'Left:'} ${formatMoney(rem, curr)}`}
                  </span>
                </div>

                <div className="h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      over ? 'bg-[#E81760]' : pct >= 80 ? 'bg-amber-500' : 'bg-[#174D3C] dark:bg-[#80F5F3]'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <form
            onSubmit={handleSave}
            className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 border-2 border-[#174D3C] p-5 space-y-3 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold">
                {editing
                  ? lang === 'bn'
                    ? 'বাজেট সম্পাদনা'
                    : 'Edit Budget'
                  : lang === 'bn'
                  ? 'নতুন বাজেট যুক্ত করুন'
                  : 'Add Budget'}
              </h3>
              <button type="button" onClick={() => setShowForm(false)} className="p-1.5">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold mb-1">
                {lang === 'bn' ? 'ক্যাটাগরি' : 'Category'}
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                disabled={!!editing}
                className="w-full px-3 py-2.5 rounded-xl bg-[#F0F3FF] dark:bg-slate-800 border border-[#174D3C]/30 text-sm font-bold"
              >
                {EXPENSE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {getCategoryLabel(c, lang)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold mb-1">
                {lang === 'bn' ? 'বাজেট পরিমাণ *' : 'Budget Limit *'}
              </label>
              <input
                type="number"
                min="0"
                step="any"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-[#F0F3FF] dark:bg-slate-800 border border-[#174D3C]/30 text-base font-bold font-mono-num"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold"
              >
                {t.cancel}
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-[#E81760] text-white text-xs font-extrabold"
              >
                {t.save}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
