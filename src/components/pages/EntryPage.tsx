import React, { useEffect, useState } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Banknote,
  Briefcase,
  Building2,
  Bus,
  Calendar,
  Check,
  Clock,
  CreditCard,
  Gift,
  HeartPulse,
  Home as HomeIcon,
  MoreHorizontal,
  ShoppingBag,
  Smartphone,
  Store,
  User,
  Utensils,
  Zap,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  EXPENSE_CATEGORIES,
  ExpenseCategory,
  INCOME_CATEGORIES,
  IncomeCategory,
  PAYMENT_METHODS,
  PaymentMethod,
  Transaction,
  TransactionType,
} from '../../types';
import {
  generateId,
  getCurrentTimeString,
  getCurrencySymbol,
  getTodayDateString,
} from '../../utils/formatters';
import { getCategoryLabel, getPaymentLabel, TEXT } from '../../utils/i18n';

const CATEGORY_ICONS: Record<IncomeCategory | ExpenseCategory, React.ReactNode> = {
  Business: <Store className="w-4 h-4" />,
  Job: <Briefcase className="w-4 h-4" />,
  Salary: <Banknote className="w-4 h-4" />,
  Gift: <Gift className="w-4 h-4" />,
  'Other Income': <MoreHorizontal className="w-4 h-4" />,
  Family: <HomeIcon className="w-4 h-4" />,
  Shopping: <ShoppingBag className="w-4 h-4" />,
  Food: <Utensils className="w-4 h-4" />,
  'Utility Bill': <Zap className="w-4 h-4" />,
  Transport: <Bus className="w-4 h-4" />,
  Medical: <HeartPulse className="w-4 h-4" />,
  Personal: <User className="w-4 h-4" />,
  'Other Expense': <MoreHorizontal className="w-4 h-4" />,
};

export const EntryPage: React.FC = () => {
  const {
    settings,
    editingTransaction,
    setEditingTransaction,
    prefilledEntryAmount,
    setPrefilledEntryAmount,
    prefilledEntryType,
    setPrefilledEntryType,
    saveTransaction,
    navigate,
    showToast,
  } = useApp();

  const lang = settings.language;
  const t = TEXT[lang];

  const [type, setType] = useState<TransactionType>(
    editingTransaction?.type || prefilledEntryType || 'expense'
  );
  const [amount, setAmount] = useState<string>(
    editingTransaction ? String(editingTransaction.amount) : prefilledEntryAmount ? String(prefilledEntryAmount) : ''
  );
  const [category, setCategory] = useState<IncomeCategory | ExpenseCategory>(
    editingTransaction?.category ||
      ((editingTransaction?.type || prefilledEntryType || 'expense') === 'income'
        ? 'Salary'
        : 'Food')
  );
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    editingTransaction?.paymentMethod || settings.defaultPaymentMethod
  );
  const [date, setDate] = useState<string>(editingTransaction?.date || getTodayDateString());
  const [time, setTime] = useState<string>(editingTransaction?.time || getCurrentTimeString());
  const [note, setNote] = useState<string>(editingTransaction?.note || '');
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    if (editingTransaction) {
      setType(editingTransaction.type);
      setAmount(String(editingTransaction.amount));
      setCategory(editingTransaction.category);
      setPaymentMethod(editingTransaction.paymentMethod);
      setDate(editingTransaction.date);
      setTime(editingTransaction.time);
      setNote(editingTransaction.note);
    } else if (prefilledEntryType) {
      setType(prefilledEntryType);
      setCategory(prefilledEntryType === 'income' ? 'Salary' : 'Food');
      setPrefilledEntryType(null);
    }
    if (prefilledEntryAmount !== null && !editingTransaction) {
      setAmount(String(prefilledEntryAmount));
      setPrefilledEntryAmount(null);
    }
  }, [
    editingTransaction,
    prefilledEntryType,
    prefilledEntryAmount,
    setPrefilledEntryType,
    setPrefilledEntryAmount,
  ]);

  const handleTypeSwitch = (nextType: TransactionType) => {
    setType(nextType);
    if (nextType === 'income') {
      if (!INCOME_CATEGORIES.includes(category as IncomeCategory)) {
        setCategory('Business');
      }
    } else {
      if (!EXPENSE_CATEGORIES.includes(category as ExpenseCategory)) {
        setCategory('Food');
      }
    }
  };

  const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = parseFloat(amount);
    if (!amount || isNaN(numericAmount) || numericAmount <= 0) {
      setErrorMsg(t.invalidAmount);
      showToast(t.invalidAmount, 'error');
      return;
    }
    if (!date) {
      setErrorMsg(lang === 'bn' ? 'তারিখ নির্বাচন করুন।' : 'Please select a date.');
      return;
    }

    const now = Date.now();
    const tx: Transaction = {
      id: editingTransaction?.id || generateId(),
      type,
      amount: numericAmount,
      category,
      paymentMethod,
      date,
      time: time || getCurrentTimeString(),
      note: note.trim(),
      createdAt: editingTransaction?.createdAt || now,
      updatedAt: now,
    };

    await saveTransaction(tx);
    setEditingTransaction(null);
    navigate('home');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pb-6">
      {/* Income / Expense Toggle */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border-2 border-[#174D3C] p-2 grid grid-cols-2 gap-2 shadow-sm">
        <button
          type="button"
          onClick={() => handleTypeSwitch('income')}
          className={`py-3 px-4 rounded-2xl font-extrabold text-sm flex items-center justify-center gap-2 transition ${
            type === 'income'
              ? 'bg-[#C9E9CE] text-[#174D3C] border-2 border-[#174D3C] shadow-sm'
              : 'bg-transparent text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <ArrowDownLeft className="w-4 h-4" />
          <span>{t.addIncome}</span>
        </button>

        <button
          type="button"
          onClick={() => handleTypeSwitch('expense')}
          className={`py-3 px-4 rounded-2xl font-extrabold text-sm flex items-center justify-center gap-2 transition ${
            type === 'expense'
              ? 'bg-[#F7C8CC] text-[#9F1239] border-2 border-[#E81760] shadow-sm'
              : 'bg-transparent text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <ArrowUpRight className="w-4 h-4" />
          <span>{t.addExpense}</span>
        </button>
      </div>

      {/* Amount & Note Card */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border-2 border-[#174D3C] p-4 space-y-4 shadow-sm">
        <div>
          <label className="block text-xs font-bold text-[#174D3C] dark:text-[#80F5F3] mb-1.5">
            {t.amount} *
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-extrabold text-[#E81760]">
              {getCurrencySymbol(settings.currency)}
            </span>
            <input
              type="number"
              step="any"
              min="0"
              inputMode="decimal"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                setErrorMsg('');
              }}
              placeholder="0.00"
              className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-[#F0F3FF] dark:bg-slate-800 border-2 border-[#174D3C]/25 focus:border-[#E81760] focus:outline-none text-2xl font-extrabold font-mono-num text-slate-900 dark:text-white"
            />
          </div>
          {errorMsg && <p className="mt-1.5 text-xs font-bold text-[#E81760]">{errorMsg}</p>}
        </div>

        {/* Date & Time */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="flex items-center gap-1.5 text-xs font-bold text-[#174D3C] dark:text-[#80F5F3] mb-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>{t.date}</span>
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-[#F0F3FF] dark:bg-slate-800 border border-[#174D3C]/30 text-sm font-semibold text-slate-900 dark:text-white focus:border-[#E81760] focus:outline-none"
            />
          </div>
          <div>
            <label className="flex items-center gap-1.5 text-xs font-bold text-[#174D3C] dark:text-[#80F5F3] mb-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>{t.time}</span>
            </label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-[#F0F3FF] dark:bg-slate-800 border border-[#174D3C]/30 text-sm font-semibold text-slate-900 dark:text-white focus:border-[#E81760] focus:outline-none"
            />
          </div>
        </div>

        {/* Note */}
        <div>
          <label className="block text-xs font-bold text-[#174D3C] dark:text-[#80F5F3] mb-1.5">
            {t.note}
          </label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={
              lang === 'bn'
                ? 'কিসের জন্য আয় বা ব্যয় হলো তা লিখুন...'
                : 'Enter short description or note...'
            }
            className="w-full px-3.5 py-2.5 rounded-xl bg-[#F0F3FF] dark:bg-slate-800 border border-[#174D3C]/30 text-sm font-medium text-slate-900 dark:text-white focus:border-[#E81760] focus:outline-none"
          />
        </div>
      </div>

      {/* Category Selection */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border-2 border-[#174D3C] p-4 shadow-sm">
        <h3 className="text-xs font-extrabold text-[#174D3C] dark:text-[#80F5F3] mb-3">
          {t.category}
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {categories.map((cat) => {
            const active = category === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`px-3 py-2.5 rounded-2xl border-2 text-xs font-bold flex items-center gap-2 transition ${
                  active
                    ? type === 'income'
                      ? 'bg-[#C9E9CE] text-[#174D3C] border-[#174D3C] shadow-sm'
                      : 'bg-[#F7C8CC] text-[#9F1239] border-[#E81760] shadow-sm'
                    : 'bg-[#F0F3FF]/70 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-transparent hover:border-[#174D3C]/40'
                }`}
              >
                <span className="shrink-0">{CATEGORY_ICONS[cat]}</span>
                <span className="truncate">{getCategoryLabel(cat, lang)}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Payment Methods */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border-2 border-[#174D3C] p-4 shadow-sm">
        <h3 className="text-xs font-extrabold text-[#174D3C] dark:text-[#80F5F3] mb-3">
          {t.paymentMethod}
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {PAYMENT_METHODS.map((pm) => {
            const active = paymentMethod === pm;
            return (
              <button
                key={pm}
                type="button"
                onClick={() => setPaymentMethod(pm)}
                className={`px-3 py-2.5 rounded-2xl border-2 text-xs font-bold flex items-center gap-2 transition ${
                  active
                    ? 'bg-[#80F5F3] text-[#174D3C] border-[#174D3C] shadow-sm'
                    : 'bg-[#D2E6FA]/50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-transparent hover:border-[#174D3C]/40'
                }`}
              >
                {pm === 'Bank' ? (
                  <Building2 className="w-4 h-4 shrink-0" />
                ) : pm === 'Cash' ? (
                  <Banknote className="w-4 h-4 shrink-0" />
                ) : pm === 'OK Wallet' ? (
                  <CreditCard className="w-4 h-4 shrink-0" />
                ) : (
                  <Smartphone className="w-4 h-4 shrink-0" />
                )}
                <span className="truncate">{getPaymentLabel(pm, lang)}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Circular / Pill Prominent Save Button */}
      <div className="flex flex-col items-center justify-center pt-2 gap-2">
        <button
          type="submit"
          aria-label={editingTransaction ? t.update : t.save}
          className="w-20 h-20 rounded-full bg-gradient-to-br from-[#FF2D78] to-[#E81760] text-white border-4 border-[#174D3C] shadow-xl flex flex-col items-center justify-center hover:scale-105 active:scale-95 transition-transform"
        >
          <Check className="w-7 h-7 stroke-[3]" />
          <span className="text-[11px] font-extrabold mt-0.5">
            {editingTransaction ? t.update : t.save}
          </span>
        </button>
        {editingTransaction && (
          <button
            type="button"
            onClick={() => {
              setEditingTransaction(null);
              navigate('transactions');
            }}
            className="text-xs font-bold text-slate-500 hover:text-[#E81760] underline"
          >
            {t.cancel}
          </button>
        )}
      </div>
    </form>
  );
};
