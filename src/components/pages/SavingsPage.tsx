import React, { useMemo, useState } from 'react';
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Edit3,
  History,
  PiggyBank,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SavingGoal, SavingRecord } from '../../types';
import { formatDate, formatMoney, generateId, getTodayDateString } from '../../utils/formatters';
import { TEXT } from '../../utils/i18n';

export const SavingsPage: React.FC = () => {
  const { savings, saveSaving, deleteSaving, settings, requestConfirm, showToast } = useApp();
  const lang = settings.language;
  const curr = settings.currency;
  const t = TEXT[lang];

  const [showForm, setShowForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState<SavingGoal | null>(null);
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [initialDeposit, setInitialDeposit] = useState('');
  const [date, setDate] = useState(getTodayDateString());
  const [note, setNote] = useState('');

  const [actionModal, setActionModal] = useState<{
    goal: SavingGoal;
    mode: 'deposit' | 'withdraw';
  } | null>(null);
  const [actionAmount, setActionAmount] = useState('');
  const [actionDate, setActionDate] = useState(getTodayDateString());
  const [actionNote, setActionNote] = useState('');
  const [historyGoal, setHistoryGoal] = useState<SavingGoal | null>(null);

  const totals = useMemo(() => {
    const deposited = savings.reduce((s, g) => s + g.totalDeposited, 0);
    const withdrawn = savings.reduce((s, g) => s + g.totalWithdrawn, 0);
    return {
      deposited,
      withdrawn,
      remaining: Math.max(0, deposited - withdrawn),
    };
  }, [savings]);

  const openCreate = () => {
    setEditingGoal(null);
    setName('');
    setTargetAmount('');
    setInitialDeposit('');
    setDate(getTodayDateString());
    setNote('');
    setShowForm(true);
  };

  const openEdit = (goal: SavingGoal) => {
    setEditingGoal(goal);
    setName(goal.name);
    setTargetAmount(String(goal.targetAmount));
    setInitialDeposit('');
    setDate(goal.date);
    setNote(goal.note);
    setShowForm(true);
  };

  const handleSaveGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast(lang === 'bn' ? 'সঞ্চয়ের নাম লিখুন।' : 'Enter savings name.', 'error');
      return;
    }
    const targetNum = parseFloat(targetAmount) || 0;
    const depositNum = parseFloat(initialDeposit) || 0;
    if (targetNum < 0 || depositNum < 0) {
      showToast(t.invalidAmount, 'error');
      return;
    }

    const now = Date.now();
    if (editingGoal) {
      await saveSaving({
        ...editingGoal,
        name: name.trim(),
        targetAmount: targetNum,
        date,
        note: note.trim(),
        updatedAt: now,
      });
    } else {
      const history: SavingRecord[] =
        depositNum > 0
          ? [
              {
                id: generateId(),
                type: 'deposit',
                amount: depositNum,
                date,
                note: note.trim(),
                createdAt: now,
              },
            ]
          : [];
      await saveSaving({
        id: generateId(),
        name: name.trim(),
        targetAmount: targetNum,
        totalDeposited: depositNum,
        totalWithdrawn: 0,
        date,
        note: note.trim(),
        history,
        createdAt: now,
        updatedAt: now,
      });
    }
    setShowForm(false);
  };

  const handleDepositWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionModal) return;
    const amt = parseFloat(actionAmount);
    if (!amt || amt <= 0) {
      showToast(t.invalidAmount, 'error');
      return;
    }
    const { goal, mode } = actionModal;
    const currentBal = goal.totalDeposited - goal.totalWithdrawn;
    if (mode === 'withdraw' && amt > currentBal) {
      showToast(
        lang === 'bn'
          ? 'বর্তমান ব্যালেন্সের চেয়ে বেশি উত্তোলন করা যাবে না!'
          : 'Cannot withdraw more than current balance!',
        'error'
      );
      return;
    }

    const now = Date.now();
    const record: SavingRecord = {
      id: generateId(),
      type: mode,
      amount: amt,
      date: actionDate,
      note: actionNote.trim(),
      createdAt: now,
    };

    const updated: SavingGoal = {
      ...goal,
      totalDeposited: mode === 'deposit' ? goal.totalDeposited + amt : goal.totalDeposited,
      totalWithdrawn: mode === 'withdraw' ? goal.totalWithdrawn + amt : goal.totalWithdrawn,
      history: [record, ...goal.history],
      updatedAt: now,
    };

    await saveSaving(updated);
    setActionModal(null);
    setActionAmount('');
    setActionNote('');
  };

  return (
    <div className="space-y-4">
      {/* Top Totals */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="rounded-2xl bg-[#C9E9CE] dark:bg-emerald-950/70 border-2 border-[#174D3C] p-3 text-center">
          <p className="text-[11px] font-bold text-[#174D3C] dark:text-emerald-200">
            {lang === 'bn' ? 'মোট জমা' : 'Total Deposited'}
          </p>
          <p className="text-sm sm:text-base font-extrabold font-mono-num text-[#174D3C] dark:text-emerald-100 mt-1">
            {formatMoney(totals.deposited, curr)}
          </p>
        </div>

        <div className="rounded-2xl bg-[#F7C8CC] dark:bg-rose-950/70 border-2 border-[#E81760] p-3 text-center">
          <p className="text-[11px] font-bold text-[#9F1239] dark:text-rose-200">
            {lang === 'bn' ? 'মোট উত্তোলন' : 'Total Withdrawn'}
          </p>
          <p className="text-sm sm:text-base font-extrabold font-mono-num text-[#9F1239] dark:text-rose-100 mt-1">
            {formatMoney(totals.withdrawn, curr)}
          </p>
        </div>

        <div className="rounded-2xl bg-[#80F5F3]/60 dark:bg-teal-950/70 border-2 border-[#174D3C] p-3 text-center">
          <p className="text-[11px] font-bold text-[#174D3C] dark:text-teal-200">
            {lang === 'bn' ? 'অবশিষ্ট সঞ্চয়' : 'Remaining'}
          </p>
          <p className="text-sm sm:text-base font-extrabold font-mono-num text-[#174D3C] dark:text-teal-100 mt-1">
            {formatMoney(totals.remaining, curr)}
          </p>
        </div>
      </div>

      {/* Add Button */}
      <button
        type="button"
        onClick={openCreate}
        className="w-full py-3 rounded-2xl bg-[#E81760] text-white font-extrabold text-sm border-2 border-[#174D3C] shadow-md flex items-center justify-center gap-2 hover:brightness-95 active:scale-[0.99] transition"
      >
        <Plus className="w-5 h-5" />
        <span>{lang === 'bn' ? 'নতুন সঞ্চয় যুক্ত করুন' : 'Add New Savings'}</span>
      </button>

      {/* Savings List */}
      {savings.length === 0 ? (
        <div className="rounded-3xl bg-white dark:bg-slate-900 border-2 border-[#174D3C] p-8 text-center">
          <PiggyBank className="w-10 h-10 mx-auto text-[#E81760] mb-2" />
          <p className="text-sm font-bold text-slate-600 dark:text-slate-300">{t.noData}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {savings.map((g) => {
            const balance = Math.max(0, g.totalDeposited - g.totalWithdrawn);
            const pct = g.targetAmount > 0 ? Math.min(100, (balance / g.targetAmount) * 100) : 0;
            return (
              <div
                key={g.id}
                className="rounded-3xl bg-white dark:bg-slate-900 border-2 border-[#174D3C] p-4 shadow-sm space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white truncate">
                      {g.name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {formatDate(g.date, settings.dateFormat)}
                      {g.note ? ` · ${g.note}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setHistoryGoal(g)}
                      aria-label="History"
                      className="w-8 h-8 rounded-xl bg-[#D2E6FA] text-[#174D3C] flex items-center justify-center"
                    >
                      <History className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => openEdit(g)}
                      aria-label={t.edit}
                      className="w-8 h-8 rounded-xl bg-[#C9E9CE] text-[#174D3C] flex items-center justify-center"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        requestConfirm(t.confirmDeleteTitle, t.confirmDeleteMsg, () =>
                          deleteSaving(g.id)
                        )
                      }
                      aria-label={t.delete}
                      className="w-8 h-8 rounded-xl bg-[#F7C8CC] text-[#E81760] flex items-center justify-center"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs bg-[#F0F3FF] dark:bg-slate-800 rounded-2xl p-2.5">
                  <div>
                    <span className="text-slate-500 block">
                      {lang === 'bn' ? 'বর্তমান ব্যালেন্স' : 'Balance'}
                    </span>
                    <span className="font-extrabold font-mono-num text-sm text-[#174D3C] dark:text-[#80F5F3]">
                      {formatMoney(balance, curr)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">
                      {lang === 'bn' ? 'লক্ষ্য' : 'Target'}
                    </span>
                    <span className="font-bold font-mono-num">
                      {formatMoney(g.targetAmount, curr)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">
                      {lang === 'bn' ? 'উত্তোলন' : 'Withdrawn'}
                    </span>
                    <span className="font-bold font-mono-num text-[#E81760]">
                      {formatMoney(g.totalWithdrawn, curr)}
                    </span>
                  </div>
                </div>

                {g.targetAmount > 0 && (
                  <div>
                    <div className="flex justify-between text-[11px] font-bold mb-1">
                      <span>{lang === 'bn' ? 'অগ্রগতি' : 'Progress'}</span>
                      <span>{pct.toFixed(0)}%</span>
                    </div>
                    <div className="h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-[#174D3C] dark:bg-[#80F5F3] rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setActionModal({ goal: g, mode: 'deposit' });
                      setActionDate(getTodayDateString());
                    }}
                    className="py-2 rounded-xl bg-[#C9E9CE] text-[#174D3C] border border-[#174D3C]/40 text-xs font-extrabold flex items-center justify-center gap-1.5"
                  >
                    <ArrowDownCircle className="w-4 h-4" />
                    <span>{lang === 'bn' ? 'টাকা জমা' : 'Deposit'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActionModal({ goal: g, mode: 'withdraw' });
                      setActionDate(getTodayDateString());
                    }}
                    className="py-2 rounded-xl bg-[#F7C8CC] text-[#9F1239] border border-[#E81760]/40 text-xs font-extrabold flex items-center justify-center gap-1.5"
                  >
                    <ArrowUpCircle className="w-4 h-4" />
                    <span>{lang === 'bn' ? 'টাকা উত্তোলন' : 'Withdraw'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <form
            onSubmit={handleSaveGoal}
            className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border-2 border-[#174D3C] p-5 space-y-3 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold">
                {editingGoal
                  ? lang === 'bn'
                    ? 'সঞ্চয় সম্পাদনা'
                    : 'Edit Savings'
                  : lang === 'bn'
                  ? 'নতুন সঞ্চয় যুক্ত করুন'
                  : 'New Savings Goal'}
              </h3>
              <button type="button" onClick={() => setShowForm(false)} className="p-1.5">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold mb-1">
                {lang === 'bn' ? 'সঞ্চয়ের নাম *' : 'Savings Name *'}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3 py-2.5 rounded-xl bg-[#F0F3FF] dark:bg-slate-800 border border-[#174D3C]/30 text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold mb-1">
                  {lang === 'bn' ? 'সঞ্চয়ের লক্ষ্য' : 'Target Goal'}
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={targetAmount}
                  onChange={(e) => setTargetAmount(e.target.value)}
                  placeholder="0"
                  className="w-full px-3 py-2.5 rounded-xl bg-[#F0F3FF] dark:bg-slate-800 border border-[#174D3C]/30 text-sm font-mono-num"
                />
              </div>
              {!editingGoal && (
                <div>
                  <label className="block text-xs font-bold mb-1">
                    {lang === 'bn' ? 'জমার পরিমাণ' : 'Initial Deposit'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={initialDeposit}
                    onChange={(e) => setInitialDeposit(e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2.5 rounded-xl bg-[#F0F3FF] dark:bg-slate-800 border border-[#174D3C]/30 text-sm font-mono-num"
                  />
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold mb-1">
                {lang === 'bn' ? 'জমার তারিখ' : 'Date'}
              </label>
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

      {/* Deposit / Withdraw Modal */}
      {actionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <form
            onSubmit={handleDepositWithdraw}
            className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 border-2 border-[#174D3C] p-5 space-y-3 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold">
                {actionModal.mode === 'deposit'
                  ? lang === 'bn'
                    ? 'সঞ্চয় জমা করুন'
                    : 'Deposit to Savings'
                  : lang === 'bn'
                  ? 'সঞ্চয় উত্তোলন করুন'
                  : 'Withdraw from Savings'}
              </h3>
              <button type="button" onClick={() => setActionModal(null)} className="p-1.5">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs font-bold text-[#174D3C] dark:text-[#80F5F3]">
              {actionModal.goal.name}
            </p>
            <div>
              <label className="block text-xs font-bold mb-1">{t.amount} *</label>
              <input
                type="number"
                min="0"
                step="any"
                required
                value={actionAmount}
                onChange={(e) => setActionAmount(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-[#F0F3FF] dark:bg-slate-800 border border-[#174D3C]/30 text-base font-bold font-mono-num"
              />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">{t.date}</label>
              <input
                type="date"
                value={actionDate}
                onChange={(e) => setActionDate(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-[#F0F3FF] dark:bg-slate-800 border border-[#174D3C]/30 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">{t.note}</label>
              <input
                type="text"
                value={actionNote}
                onChange={(e) => setActionNote(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-[#F0F3FF] dark:bg-slate-800 border border-[#174D3C]/30 text-sm"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setActionModal(null)}
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

      {/* History Modal */}
      {historyGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md max-h-[80vh] flex flex-col rounded-3xl bg-white dark:bg-slate-900 border-2 border-[#174D3C] p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-extrabold">{historyGoal.name} — {lang === 'bn' ? 'হিস্টোরি' : 'History'}</h3>
              <button type="button" onClick={() => setHistoryGoal(null)} className="p-1.5">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="overflow-y-auto space-y-2 flex-1">
              {historyGoal.history.length === 0 ? (
                <p className="text-xs text-center text-slate-500 py-6">{t.noData}</p>
              ) : (
                historyGoal.history.map((h) => (
                  <div
                    key={h.id}
                    className={`rounded-xl p-3 flex items-center justify-between ${
                      h.type === 'deposit'
                        ? 'bg-[#C9E9CE]/70 text-[#174D3C]'
                        : 'bg-[#F7C8CC]/70 text-[#9F1239]'
                    }`}
                  >
                    <div>
                      <p className="text-xs font-extrabold">
                        {h.type === 'deposit'
                          ? lang === 'bn'
                            ? 'জমা'
                            : 'Deposit'
                          : lang === 'bn'
                          ? 'উত্তোলন'
                          : 'Withdraw'}
                      </p>
                      <p className="text-[11px] opacity-80">
                        {formatDate(h.date, settings.dateFormat)}
                        {h.note ? ` · ${h.note}` : ''}
                      </p>
                    </div>
                    <span className="font-extrabold font-mono-num text-sm">
                      {h.type === 'deposit' ? '+' : '-'}
                      {formatMoney(h.amount, curr)}
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
