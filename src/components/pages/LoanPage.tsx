import React, { useMemo, useState } from 'react';
import {
  CheckCircle,
  Edit3,
  HandCoins,
  History,
  Phone,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Loan, LoanRepayment } from '../../types';
import { formatDate, formatMoney, generateId, getTodayDateString } from '../../utils/formatters';
import { TEXT } from '../../utils/i18n';

export const LoanPage: React.FC = () => {
  const { loans, saveLoan, deleteLoan, settings, requestConfirm, showToast } = useApp();
  const lang = settings.language;
  const curr = settings.currency;
  const t = TEXT[lang];

  const [tab, setTab] = useState<'all' | 'given' | 'taken'>('all');
  const [showForm, setShowForm] = useState(false);
  const [editingLoan, setEditingLoan] = useState<Loan | null>(null);
  const [direction, setDirection] = useState<'given' | 'taken'>('given');
  const [personName, setPersonName] = useState('');
  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(getTodayDateString());
  const [note, setNote] = useState('');

  const [repayLoan, setRepayLoan] = useState<Loan | null>(null);
  const [repayAmount, setRepayAmount] = useState('');
  const [repayDate, setRepayDate] = useState(getTodayDateString());
  const [repayNote, setRepayNote] = useState('');
  const [historyLoan, setHistoryLoan] = useState<Loan | null>(null);

  const summary = useMemo(() => {
    const givenList = loans.filter((l) => l.direction === 'given');
    const takenList = loans.filter((l) => l.direction === 'taken');
    return {
      givenRemaining: givenList.reduce((s, l) => s + Math.max(0, l.amount - l.repaidAmount), 0),
      takenRemaining: takenList.reduce((s, l) => s + Math.max(0, l.amount - l.repaidAmount), 0),
    };
  }, [loans]);

  const filtered = useMemo(() => {
    if (tab === 'all') return loans;
    return loans.filter((l) => l.direction === tab);
  }, [loans, tab]);

  const openCreate = () => {
    setEditingLoan(null);
    setDirection(tab === 'taken' ? 'taken' : 'given');
    setPersonName('');
    setPhone('');
    setAmount('');
    setDate(getTodayDateString());
    setNote('');
    setShowForm(true);
  };

  const openEdit = (l: Loan) => {
    setEditingLoan(l);
    setDirection(l.direction);
    setPersonName(l.personName);
    setPhone(l.phone);
    setAmount(String(l.amount));
    setDate(l.date);
    setNote(l.note);
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmt = parseFloat(amount);
    if (!personName.trim()) {
      showToast(lang === 'bn' ? 'ব্যক্তির নাম লিখুন।' : 'Enter person name.', 'error');
      return;
    }
    if (!numAmt || numAmt <= 0) {
      showToast(t.invalidAmount, 'error');
      return;
    }

    const now = Date.now();
    const item: Loan = {
      id: editingLoan?.id || generateId(),
      direction,
      personName: personName.trim(),
      phone: phone.trim(),
      amount: numAmt,
      repaidAmount: editingLoan?.repaidAmount || 0,
      date,
      note: note.trim(),
      repayments: editingLoan?.repayments || [],
      createdAt: editingLoan?.createdAt || now,
      updatedAt: now,
    };

    await saveLoan(item);
    setShowForm(false);
  };

  const handleRepay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repayLoan) return;
    const amt = parseFloat(repayAmount);
    if (!amt || amt <= 0) {
      showToast(t.invalidAmount, 'error');
      return;
    }
    const remaining = Math.max(0, repayLoan.amount - repayLoan.repaidAmount);
    if (amt > remaining) {
      showToast(
        lang === 'bn'
          ? 'বাকি পরিমাণের চেয়ে বেশি পরিশোধ করা যাবে না!'
          : 'Repayment cannot exceed remaining amount!',
        'error'
      );
      return;
    }
    const now = Date.now();
    const rep: LoanRepayment = {
      id: generateId(),
      amount: amt,
      date: repayDate,
      note: repayNote.trim(),
      createdAt: now,
    };
    await saveLoan({
      ...repayLoan,
      repaidAmount: repayLoan.repaidAmount + amt,
      repayments: [rep, ...repayLoan.repayments],
      updatedAt: now,
    });
    setRepayLoan(null);
    setRepayAmount('');
    setRepayNote('');
  };

  return (
    <div className="space-y-4">
      {/* Top Totals */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-[#D2E6FA] dark:bg-sky-950/70 border-2 border-[#174D3C] p-3.5">
          <p className="text-xs font-bold text-[#174D3C] dark:text-sky-200">
            {lang === 'bn' ? 'আমি দিয়েছি (বাকি)' : 'Loan Given (Remaining)'}
          </p>
          <p className="text-lg font-extrabold font-mono-num text-[#174D3C] dark:text-white mt-1">
            {formatMoney(summary.givenRemaining, curr)}
          </p>
        </div>

        <div className="rounded-2xl bg-[#F7C8CC] dark:bg-rose-950/70 border-2 border-[#E81760] p-3.5">
          <p className="text-xs font-bold text-[#9F1239] dark:text-rose-200">
            {lang === 'bn' ? 'আমি নিয়েছি (বাকি)' : 'Loan Taken (Remaining)'}
          </p>
          <p className="text-lg font-extrabold font-mono-num text-[#9F1239] dark:text-white mt-1">
            {formatMoney(summary.takenRemaining, curr)}
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border-2 border-[#174D3C] p-1.5 grid grid-cols-3 gap-1.5">
        <button
          type="button"
          onClick={() => setTab('all')}
          className={`py-2 rounded-xl text-xs font-extrabold ${
            tab === 'all' ? 'bg-[#E81760] text-white' : 'text-slate-700 dark:text-slate-200'
          }`}
        >
          {t.all}
        </button>
        <button
          type="button"
          onClick={() => setTab('given')}
          className={`py-2 rounded-xl text-xs font-extrabold ${
            tab === 'given'
              ? 'bg-[#D2E6FA] text-[#174D3C] border border-[#174D3C]'
              : 'text-slate-700 dark:text-slate-200'
          }`}
        >
          {lang === 'bn' ? 'টাকা দিয়েছি' : 'Given'}
        </button>
        <button
          type="button"
          onClick={() => setTab('taken')}
          className={`py-2 rounded-xl text-xs font-extrabold ${
            tab === 'taken'
              ? 'bg-[#F7C8CC] text-[#9F1239] border border-[#E81760]'
              : 'text-slate-700 dark:text-slate-200'
          }`}
        >
          {lang === 'bn' ? 'টাকা নিয়েছি' : 'Taken'}
        </button>
      </div>

      <button
        type="button"
        onClick={openCreate}
        className="w-full py-3 rounded-2xl bg-[#E81760] text-white font-extrabold text-sm border-2 border-[#174D3C] shadow-md flex items-center justify-center gap-2"
      >
        <Plus className="w-5 h-5" />
        <span>{lang === 'bn' ? 'নতুন লোন যুক্ত করুন' : 'Add New Loan'}</span>
      </button>

      {/* Loan List */}
      {filtered.length === 0 ? (
        <div className="rounded-3xl bg-white dark:bg-slate-900 border-2 border-[#174D3C] p-8 text-center">
          <HandCoins className="w-10 h-10 mx-auto text-[#E81760] mb-2" />
          <p className="text-sm font-bold text-slate-600 dark:text-slate-300">{t.noData}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((l) => {
            const remaining = Math.max(0, l.amount - l.repaidAmount);
            const pct = l.amount > 0 ? Math.min(100, (l.repaidAmount / l.amount) * 100) : 0;
            return (
              <div
                key={l.id}
                className="rounded-3xl bg-white dark:bg-slate-900 border-2 border-[#174D3C] p-4 shadow-sm space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-extrabold text-slate-900 dark:text-white truncate">
                        {l.personName}
                      </h3>
                      <span
                        className={`text-[11px] font-bold ${
                          l.direction === 'given' ? 'text-[#174D3C] dark:text-sky-300' : 'text-[#E81760]'
                        }`}
                      >
                        · {l.direction === 'given' ? (lang === 'bn' ? 'দিয়েছি' : 'Given') : lang === 'bn' ? 'নিয়েছি' : 'Taken'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {l.phone ? `${l.phone} · ` : ''}
                      {formatDate(l.date, settings.dateFormat)}
                      {l.note ? ` · ${l.note}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {l.phone && (
                      <a
                        href={`tel:${l.phone}`}
                        aria-label="Call"
                        className="w-8 h-8 rounded-xl bg-[#C9E9CE] text-[#174D3C] flex items-center justify-center"
                      >
                        <Phone className="w-3.5 h-3.5" />
                      </a>
                    )}
                    <button
                      type="button"
                      onClick={() => setHistoryLoan(l)}
                      aria-label="History"
                      className="w-8 h-8 rounded-xl bg-[#D2E6FA] text-[#174D3C] flex items-center justify-center"
                    >
                      <History className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => openEdit(l)}
                      aria-label={t.edit}
                      className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-white flex items-center justify-center"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        requestConfirm(t.confirmDeleteTitle, t.confirmDeleteMsg, () =>
                          deleteLoan(l.id)
                        )
                      }
                      aria-label={t.delete}
                      className="w-8 h-8 rounded-xl bg-[#F7C8CC] text-[#E81760] flex items-center justify-center"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs bg-[#F0F3FF] dark:bg-slate-800 rounded-2xl p-2.5">
                  <div>
                    <span className="text-slate-500 block">
                      {lang === 'bn' ? 'মোট লোন' : 'Total'}
                    </span>
                    <span className="font-extrabold font-mono-num">
                      {formatMoney(l.amount, curr)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">
                      {lang === 'bn' ? 'পরিশোধ' : 'Paid'}
                    </span>
                    <span className="font-extrabold font-mono-num text-[#174D3C] dark:text-emerald-300">
                      {formatMoney(l.repaidAmount, curr)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">
                      {lang === 'bn' ? 'বাকি' : 'Remaining'}
                    </span>
                    <span className="font-extrabold font-mono-num text-[#E81760]">
                      {formatMoney(remaining, curr)}
                    </span>
                  </div>
                </div>

                <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-[#174D3C] dark:bg-[#80F5F3] rounded-full transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>

                {remaining > 0 ? (
                  <button
                    type="button"
                    onClick={() => {
                      setRepayLoan(l);
                      setRepayDate(getTodayDateString());
                    }}
                    className="w-full py-2 rounded-xl bg-[#80F5F3] text-[#174D3C] border border-[#174D3C] text-xs font-extrabold"
                  >
                    {lang === 'bn' ? 'পরিশোধের হিসাব যুক্ত করুন' : 'Add Repayment'}
                  </button>
                ) : (
                  <div className="flex items-center justify-center gap-1.5 text-xs font-extrabold text-[#174D3C] dark:text-emerald-300 py-1">
                    <CheckCircle className="w-4 h-4" />
                    <span>{lang === 'bn' ? 'সম্পূর্ণ পরিশোধিত' : 'Fully Settled'}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Loan Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <form
            onSubmit={handleSave}
            className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border-2 border-[#174D3C] p-5 space-y-3 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold">
                {editingLoan
                  ? lang === 'bn'
                    ? 'লোন সম্পাদনা'
                    : 'Edit Loan'
                  : lang === 'bn'
                  ? 'নতুন লোন যুক্ত করুন'
                  : 'New Loan'}
              </h3>
              <button type="button" onClick={() => setShowForm(false)} className="p-1.5">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDirection('given')}
                className={`py-2 rounded-xl text-xs font-extrabold border-2 ${
                  direction === 'given'
                    ? 'bg-[#D2E6FA] text-[#174D3C] border-[#174D3C]'
                    : 'border-slate-200 dark:border-slate-700'
                }`}
              >
                {lang === 'bn' ? 'আমি টাকা দিয়েছি' : 'I Gave Loan'}
              </button>
              <button
                type="button"
                onClick={() => setDirection('taken')}
                className={`py-2 rounded-xl text-xs font-extrabold border-2 ${
                  direction === 'taken'
                    ? 'bg-[#F7C8CC] text-[#9F1239] border-[#E81760]'
                    : 'border-slate-200 dark:border-slate-700'
                }`}
              >
                {lang === 'bn' ? 'আমি টাকা নিয়েছি' : 'I Took Loan'}
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold mb-1">
                {lang === 'bn' ? 'ব্যক্তির নাম *' : 'Person Name *'}
              </label>
              <input
                type="text"
                required
                value={personName}
                onChange={(e) => setPersonName(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-[#F0F3FF] dark:bg-slate-800 border border-[#174D3C]/30 text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold mb-1">
                  {lang === 'bn' ? 'মোবাইল নম্বর' : 'Mobile Number'}
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#F0F3FF] dark:bg-slate-800 border border-[#174D3C]/30 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">{t.amount} *</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#F0F3FF] dark:bg-slate-800 border border-[#174D3C]/30 text-sm font-mono-num"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold mb-1">{t.date}</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-[#F0F3FF] dark:bg-slate-800 border border-[#174D3C]/30 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold mb-1">{t.note}</label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-[#F0F3FF] dark:bg-slate-800 border border-[#174D3C]/30 text-sm"
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

      {/* Repayment Modal */}
      {repayLoan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <form
            onSubmit={handleRepay}
            className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 border-2 border-[#174D3C] p-5 space-y-3 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold">
                {lang === 'bn' ? 'পরিশোধ যুক্ত করুন' : 'Add Repayment'}
              </h3>
              <button type="button" onClick={() => setRepayLoan(null)} className="p-1.5">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs font-bold text-[#174D3C] dark:text-[#80F5F3]">
              {repayLoan.personName} · {lang === 'bn' ? 'বাকি:' : 'Remaining:'}{' '}
              {formatMoney(Math.max(0, repayLoan.amount - repayLoan.repaidAmount), curr)}
            </p>
            <div>
              <label className="block text-xs font-bold mb-1">{t.amount} *</label>
              <input
                type="number"
                min="0"
                step="any"
                required
                value={repayAmount}
                onChange={(e) => setRepayAmount(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-[#F0F3FF] dark:bg-slate-800 border border-[#174D3C]/30 text-base font-bold font-mono-num"
              />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">{t.date}</label>
              <input
                type="date"
                value={repayDate}
                onChange={(e) => setRepayDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-[#F0F3FF] dark:bg-slate-800 border border-[#174D3C]/30 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">{t.note}</label>
              <input
                type="text"
                value={repayNote}
                onChange={(e) => setRepayNote(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-[#F0F3FF] dark:bg-slate-800 border border-[#174D3C]/30 text-sm"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRepayLoan(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold"
              >
                {t.cancel}
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-[#174D3C] text-white text-xs font-extrabold"
              >
                {t.save}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Loan History Modal */}
      {historyLoan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md max-h-[80vh] flex flex-col rounded-3xl bg-white dark:bg-slate-900 border-2 border-[#174D3C] p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-extrabold">
                {historyLoan.personName} — {lang === 'bn' ? 'লোন হিস্টোরি' : 'Loan History'}
              </h3>
              <button type="button" onClick={() => setHistoryLoan(null)} className="p-1.5">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="overflow-y-auto space-y-2 flex-1">
              <div className="rounded-xl bg-[#D2E6FA] text-[#174D3C] p-3 flex justify-between text-xs font-bold">
                <span>
                  {lang === 'bn' ? 'মূল লোন' : 'Initial Loan'} ({formatDate(historyLoan.date, settings.dateFormat)})
                </span>
                <span className="font-mono-num">{formatMoney(historyLoan.amount, curr)}</span>
              </div>
              {historyLoan.repayments.length === 0 ? (
                <p className="text-xs text-center text-slate-500 py-4">
                  {lang === 'bn' ? 'এখনও কোনো পরিশোধ হয়নি' : 'No repayments yet'}
                </p>
              ) : (
                historyLoan.repayments.map((rep) => (
                  <div
                    key={rep.id}
                    className="rounded-xl bg-[#C9E9CE] text-[#174D3C] p-3 flex items-center justify-between"
                  >
                    <div>
                      <p className="text-xs font-extrabold">
                        {lang === 'bn' ? 'পরিশোধ' : 'Repayment'}
                      </p>
                      <p className="text-[11px] opacity-80">
                        {formatDate(rep.date, settings.dateFormat)}
                        {rep.note ? ` · ${rep.note}` : ''}
                      </p>
                    </div>
                    <span className="font-extrabold font-mono-num text-sm">
                      -{formatMoney(rep.amount, curr)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
