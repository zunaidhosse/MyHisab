import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  Edit3,
  FileDown,
  MapPin,
  MessageCircle,
  Phone,
  Plus,
  Printer,
  Search,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { DueEntry, DuePerson } from '../../types';
import {
  exportDueDetailPDF,
  formatDate,
  formatMoney,
  formatTime,
  generateId,
  getCurrentTimeString,
  getTodayDateString,
} from '../../utils/formatters';
import { TEXT } from '../../utils/i18n';

export const DuePage: React.FC = () => {
  const { dues, saveDue, deleteDue, settings, requestConfirm, showToast } = useApp();
  const lang = settings.language;
  const curr = settings.currency;
  const t = TEXT[lang];

  const [search, setSearch] = useState('');
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);

  // New / Edit Person Modal
  const [showPersonForm, setShowPersonForm] = useState(false);
  const [editingPerson, setEditingPerson] = useState<DuePerson | null>(null);
  const [personName, setPersonName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [initialDue, setInitialDue] = useState('');
  const [initialPaid, setInitialPaid] = useState('');
  const [productName, setProductName] = useState('');
  const [date, setDate] = useState(getTodayDateString());
  const [time, setTime] = useState(getCurrentTimeString());
  const [note, setNote] = useState('');

  // Add Due / Add Payment Modal inside Details
  const [entryModal, setEntryModal] = useState<'due' | 'payment' | null>(null);
  const [entryAmount, setEntryAmount] = useState('');
  const [entryProduct, setEntryProduct] = useState('');
  const [entryDate, setEntryDate] = useState(getTodayDateString());
  const [entryTime, setEntryTime] = useState(getCurrentTimeString());
  const [entryNote, setEntryNote] = useState('');

  const selectedPerson = useMemo(
    () => dues.find((d) => d.id === selectedPersonId) || null,
    [dues, selectedPersonId]
  );

  const totals = useMemo(() => {
    const totalDue = dues.reduce((s, d) => s + d.totalDue, 0);
    const totalPaid = dues.reduce((s, d) => s + d.totalPaid, 0);
    return {
      totalDue,
      totalPaid,
      remaining: Math.max(0, totalDue - totalPaid),
    };
  }, [dues]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return dues;
    return dues.filter(
      (d) =>
        d.personName.toLowerCase().includes(q) ||
        d.phone.toLowerCase().includes(q) ||
        d.address.toLowerCase().includes(q)
    );
  }, [dues, search]);

  const openCreatePerson = () => {
    setEditingPerson(null);
    setPersonName('');
    setPhone('');
    setAddress('');
    setInitialDue('');
    setInitialPaid('');
    setProductName('');
    setDate(getTodayDateString());
    setTime(getCurrentTimeString());
    setNote('');
    setShowPersonForm(true);
  };

  const openEditPerson = (p: DuePerson) => {
    setEditingPerson(p);
    setPersonName(p.personName);
    setPhone(p.phone);
    setAddress(p.address);
    setShowPersonForm(true);
  };

  const handleSavePerson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!personName.trim()) {
      showToast(lang === 'bn' ? 'ব্যক্তির নাম লিখুন।' : 'Enter person name.', 'error');
      return;
    }

    const now = Date.now();
    if (editingPerson) {
      await saveDue({
        ...editingPerson,
        personName: personName.trim(),
        phone: phone.trim(),
        address: address.trim(),
        updatedAt: now,
      });
      setShowPersonForm(false);
      return;
    }

    const dueAmt = parseFloat(initialDue) || 0;
    const paidAmt = parseFloat(initialPaid) || 0;
    if (dueAmt < 0 || paidAmt < 0) {
      showToast(t.invalidAmount, 'error');
      return;
    }

    const records: DueEntry[] = [];
    if (dueAmt > 0) {
      records.push({
        id: generateId(),
        type: 'due',
        amount: dueAmt,
        productName: productName.trim(),
        date,
        time,
        note: note.trim(),
        createdAt: now,
      });
    }
    if (paidAmt > 0) {
      records.push({
        id: generateId(),
        type: 'payment',
        amount: paidAmt,
        productName: productName.trim(),
        date,
        time,
        note: note.trim(),
        createdAt: now + 1,
      });
    }

    const newPerson: DuePerson = {
      id: generateId(),
      personName: personName.trim(),
      phone: phone.trim(),
      address: address.trim(),
      totalDue: dueAmt,
      totalPaid: paidAmt,
      records: records.sort((a, b) => b.createdAt - a.createdAt),
      createdAt: now,
      updatedAt: now,
    };

    await saveDue(newPerson);
    setShowPersonForm(false);
  };

  const handleAddRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPerson || !entryModal) return;
    const amt = parseFloat(entryAmount);
    if (!amt || amt <= 0) {
      showToast(t.invalidAmount, 'error');
      return;
    }

    const now = Date.now();
    const rec: DueEntry = {
      id: generateId(),
      type: entryModal,
      amount: amt,
      productName: entryProduct.trim(),
      date: entryDate,
      time: entryTime,
      note: entryNote.trim(),
      createdAt: now,
    };

    const nextTotalDue =
      entryModal === 'due' ? selectedPerson.totalDue + amt : selectedPerson.totalDue;
    const nextTotalPaid =
      entryModal === 'payment' ? selectedPerson.totalPaid + amt : selectedPerson.totalPaid;

    await saveDue({
      ...selectedPerson,
      totalDue: nextTotalDue,
      totalPaid: nextTotalPaid,
      records: [rec, ...selectedPerson.records],
      updatedAt: now,
    });

    setEntryModal(null);
    setEntryAmount('');
    setEntryProduct('');
    setEntryNote('');
  };

  const handleDeleteRecord = (person: DuePerson, rec: DueEntry) => {
    requestConfirm(t.confirmDeleteTitle, t.confirmDeleteMsg, async () => {
      const nextRecords = person.records.filter((r) => r.id !== rec.id);
      const nextTotalDue = nextRecords
        .filter((r) => r.type === 'due')
        .reduce((s, r) => s + r.amount, 0);
      const nextTotalPaid = nextRecords
        .filter((r) => r.type === 'payment')
        .reduce((s, r) => s + r.amount, 0);

      await saveDue({
        ...person,
        totalDue: nextTotalDue,
        totalPaid: nextTotalPaid,
        records: nextRecords,
        updatedAt: Date.now(),
      });
    });
  };

  // Dedicated Person Details View
  if (selectedPerson) {
    const remaining = Math.max(0, selectedPerson.totalDue - selectedPerson.totalPaid);
    const cleanPhone = selectedPerson.phone.replace(/[^0-9+]/g, '');

    return (
      <div className="space-y-4">
        <div className="no-print flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => setSelectedPersonId(null)}
            className="px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border-2 border-[#174D3C] text-xs font-extrabold flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{lang === 'bn' ? 'সকল বাকি' : 'All Dues'}</span>
          </button>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() =>
                exportDueDetailPDF(
                  selectedPerson,
                  curr,
                  settings.dateFormat,
                  settings.timeFormat
                )
              }
              className="px-3 py-2 rounded-xl bg-[#174D3C] text-white text-xs font-bold flex items-center gap-1"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>PDF</span>
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="px-3 py-2 rounded-xl bg-[#E81760] text-white text-xs font-bold flex items-center gap-1"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{t.print}</span>
            </button>
          </div>
        </div>

        {/* Customer Info Card */}
        <section className="rounded-3xl bg-white dark:bg-slate-900 border-2 border-[#174D3C] p-4 shadow-sm space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
                {selectedPerson.personName}
              </h2>
              {selectedPerson.phone && (
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 mt-0.5">
                  {selectedPerson.phone}
                </p>
              )}
              {selectedPerson.address && (
                <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 shrink-0" />
                  <span>{selectedPerson.address}</span>
                </p>
              )}
            </div>

            <div className="no-print flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => openEditPerson(selectedPerson)}
                className="w-8 h-8 rounded-xl bg-[#D2E6FA] text-[#174D3C] flex items-center justify-center"
              >
                <Edit3 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() =>
                  requestConfirm(t.confirmDeleteTitle, t.confirmDeleteMsg, async () => {
                    await deleteDue(selectedPerson.id);
                    setSelectedPersonId(null);
                  })
                }
                className="w-8 h-8 rounded-xl bg-[#F7C8CC] text-[#E81760] flex items-center justify-center"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Call & WhatsApp / SMS Buttons */}
          {cleanPhone && (
            <div className="no-print grid grid-cols-3 gap-2">
              <a
                href={`tel:${cleanPhone}`}
                className="py-2 rounded-xl bg-[#C9E9CE] text-[#174D3C] border border-[#174D3C]/40 text-xs font-extrabold flex items-center justify-center gap-1.5"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>{lang === 'bn' ? 'কল' : 'Call'}</span>
              </a>
              <a
                href={`https://wa.me/${cleanPhone.replace(/^\+/, '')}?text=${encodeURIComponent(
                  `MyHisab Due Reminder: Remaining due is ${formatMoney(remaining, curr)}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2 rounded-xl bg-[#80F5F3] text-[#174D3C] border border-[#174D3C]/40 text-xs font-extrabold flex items-center justify-center gap-1.5"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </a>
              <a
                href={`sms:${cleanPhone}`}
                className="py-2 rounded-xl bg-[#D2E6FA] text-[#174D3C] border border-[#174D3C]/40 text-xs font-extrabold flex items-center justify-center gap-1.5"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>SMS</span>
              </a>
            </div>
          )}

          {/* 3 Summary Totals */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-2xl bg-[#F7C8CC] dark:bg-rose-950/70 p-2.5">
              <p className="text-[11px] font-bold text-[#9F1239] dark:text-rose-200">
                {lang === 'bn' ? 'মোট বাকি' : 'Total Due'}
              </p>
              <p className="text-sm font-extrabold font-mono-num text-[#9F1239] dark:text-rose-100 mt-0.5">
                {formatMoney(selectedPerson.totalDue, curr)}
              </p>
            </div>
            <div className="rounded-2xl bg-[#C9E9CE] dark:bg-emerald-950/70 p-2.5">
              <p className="text-[11px] font-bold text-[#174D3C] dark:text-emerald-200">
                {lang === 'bn' ? 'মোট জমা' : 'Total Paid'}
              </p>
              <p className="text-sm font-extrabold font-mono-num text-[#174D3C] dark:text-emerald-100 mt-0.5">
                {formatMoney(selectedPerson.totalPaid, curr)}
              </p>
            </div>
            <div className="rounded-2xl bg-[#D2E6FA] dark:bg-sky-950/70 p-2.5">
              <p className="text-[11px] font-bold text-[#174D3C] dark:text-sky-200">
                {lang === 'bn' ? 'অবশিষ্ট টাকা' : 'Remaining'}
              </p>
              <p className="text-sm font-extrabold font-mono-num text-slate-900 dark:text-white mt-0.5">
                {formatMoney(remaining, curr)}
              </p>
            </div>
          </div>

          {/* Add Due / Add Deposit Buttons */}
          <div className="no-print grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => {
                setEntryModal('due');
                setEntryDate(getTodayDateString());
                setEntryTime(getCurrentTimeString());
              }}
              className="py-2.5 rounded-xl bg-[#E81760] text-white text-xs font-extrabold shadow-sm"
            >
              {lang === 'bn' ? '+ বাকি যুক্ত করুন' : '+ Add Due'}
            </button>
            <button
              type="button"
              onClick={() => {
                setEntryModal('payment');
                setEntryDate(getTodayDateString());
                setEntryTime(getCurrentTimeString());
              }}
              className="py-2.5 rounded-xl bg-[#174D3C] text-white text-xs font-extrabold shadow-sm"
            >
              {lang === 'bn' ? '+ টাকা জমা যুক্ত করুন' : '+ Add Payment'}
            </button>
          </div>
        </section>

        {/* Full History */}
        <section className="rounded-3xl bg-white dark:bg-slate-900 border-2 border-[#174D3C] p-4 shadow-sm space-y-2.5">
          <h3 className="text-sm font-extrabold text-[#174D3C] dark:text-[#80F5F3]">
            {lang === 'bn' ? 'সম্পূর্ণ হিস্টোরি' : 'Complete History'}
          </h3>
          {selectedPerson.records.length === 0 ? (
            <p className="text-xs text-center text-slate-500 py-4">{t.noData}</p>
          ) : (
            <div className="space-y-2">
              {selectedPerson.records.map((rec) => (
                <div
                  key={rec.id}
                  className={`rounded-2xl p-3 flex items-center justify-between gap-2 ${
                    rec.type === 'due'
                      ? 'bg-[#F7C8CC]/70 text-[#9F1239] dark:bg-rose-950/50 dark:text-rose-200'
                      : 'bg-[#C9E9CE]/70 text-[#174D3C] dark:bg-emerald-950/50 dark:text-emerald-200'
                  }`}
                >
                  <div className="min-w-0">
                    <p className="text-xs font-extrabold">
                      {rec.type === 'due'
                        ? lang === 'bn'
                          ? 'বাকি'
                          : 'Due Added'
                        : lang === 'bn'
                        ? 'জমা'
                        : 'Payment Received'}
                      {rec.productName ? ` · ${rec.productName}` : ''}
                    </p>
                    <p className="text-[11px] opacity-85">
                      {formatDate(rec.date, settings.dateFormat)} ·{' '}
                      {formatTime(rec.time, settings.timeFormat)}
                      {rec.note ? ` · ${rec.note}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-extrabold font-mono-num text-sm">
                      {rec.type === 'due' ? '+' : '-'}
                      {formatMoney(rec.amount, curr)}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDeleteRecord(selectedPerson, rec)}
                      className="no-print w-7 h-7 rounded-lg bg-white/80 text-[#E81760] flex items-center justify-center"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Add Due / Payment Modal */}
        {entryModal && (
          <div className="no-print fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <form
              onSubmit={handleAddRecord}
              className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 border-2 border-[#174D3C] p-5 space-y-3 shadow-2xl"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-extrabold">
                  {entryModal === 'due'
                    ? lang === 'bn'
                      ? 'বাকি যুক্ত করুন'
                      : 'Add Due'
                    : lang === 'bn'
                    ? 'টাকা জমা যুক্ত করুন'
                    : 'Add Payment'}
                </h3>
                <button type="button" onClick={() => setEntryModal(null)} className="p-1.5">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">{t.amount} *</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  required
                  value={entryAmount}
                  onChange={(e) => setEntryAmount(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#F0F3FF] dark:bg-slate-800 border border-[#174D3C]/30 text-base font-bold font-mono-num"
                />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">
                  {lang === 'bn' ? 'পণ্যের নাম / বিবরণ' : 'Product / Item'}
                </label>
                <input
                  type="text"
                  value={entryProduct}
                  onChange={(e) => setEntryProduct(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#F0F3FF] dark:bg-slate-800 border border-[#174D3C]/30 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={entryDate}
                  onChange={(e) => setEntryDate(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-[#F0F3FF] dark:bg-slate-800 border border-[#174D3C]/30 text-xs"
                />
                <input
                  type="time"
                  value={entryTime}
                  onChange={(e) => setEntryTime(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-[#F0F3FF] dark:bg-slate-800 border border-[#174D3C]/30 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">{t.note}</label>
                <input
                  type="text"
                  value={entryNote}
                  onChange={(e) => setEntryNote(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#F0F3FF] dark:bg-slate-800 border border-[#174D3C]/30 text-sm"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEntryModal(null)}
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

        {/* Edit Person Modal if opened from Details */}
        {showPersonForm && (
          <div className="no-print fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <form
              onSubmit={handleSavePerson}
              className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border-2 border-[#174D3C] p-5 space-y-3 shadow-2xl"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-extrabold">
                  {lang === 'bn' ? 'ব্যক্তির তথ্য সম্পাদনা' : 'Edit Customer Info'}
                </h3>
                <button type="button" onClick={() => setShowPersonForm(false)} className="p-1.5">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <input
                type="text"
                required
                value={personName}
                onChange={(e) => setPersonName(e.target.value)}
                placeholder={lang === 'bn' ? 'ব্যক্তির নাম' : 'Person Name'}
                className="w-full px-3 py-2.5 rounded-xl bg-[#F0F3FF] dark:bg-slate-800 border border-[#174D3C]/30 text-sm"
              />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={lang === 'bn' ? 'মোবাইল নম্বর' : 'Phone'}
                className="w-full px-3 py-2.5 rounded-xl bg-[#F0F3FF] dark:bg-slate-800 border border-[#174D3C]/30 text-sm"
              />
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder={lang === 'bn' ? 'ঠিকানা' : 'Address'}
                className="w-full px-3 py-2.5 rounded-xl bg-[#F0F3FF] dark:bg-slate-800 border border-[#174D3C]/30 text-sm"
              />
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPersonForm(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#E81760] text-white text-xs font-extrabold"
                >
                  {t.update}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    );
  }

  // Main Due List View
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2.5">
        <div className="rounded-2xl bg-[#F7C8CC] dark:bg-rose-950/70 border-2 border-[#E81760] p-3 text-center">
          <p className="text-[11px] font-bold text-[#9F1239] dark:text-rose-200">
            {lang === 'bn' ? 'মোট বাকি' : 'Total Due'}
          </p>
          <p className="text-sm sm:text-base font-extrabold font-mono-num text-[#9F1239] dark:text-rose-100 mt-1">
            {formatMoney(totals.totalDue, curr)}
          </p>
        </div>
        <div className="rounded-2xl bg-[#C9E9CE] dark:bg-emerald-950/70 border-2 border-[#174D3C] p-3 text-center">
          <p className="text-[11px] font-bold text-[#174D3C] dark:text-emerald-200">
            {lang === 'bn' ? 'মোট জমা' : 'Total Paid'}
          </p>
          <p className="text-sm sm:text-base font-extrabold font-mono-num text-[#174D3C] dark:text-emerald-100 mt-1">
            {formatMoney(totals.totalPaid, curr)}
          </p>
        </div>
        <div className="rounded-2xl bg-[#D2E6FA] dark:bg-sky-950/70 border-2 border-[#174D3C] p-3 text-center">
          <p className="text-[11px] font-bold text-[#174D3C] dark:text-sky-200">
            {lang === 'bn' ? 'অবশিষ্ট বাকি' : 'Remaining'}
          </p>
          <p className="text-sm sm:text-base font-extrabold font-mono-num text-slate-900 dark:text-white mt-1">
            {formatMoney(totals.remaining, curr)}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={lang === 'bn' ? 'নাম বা নম্বর খুঁজুন...' : 'Search name or phone...'}
            className="w-full pl-9 pr-3 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border-2 border-[#174D3C]/30 text-sm"
          />
        </div>
        <button
          type="button"
          onClick={openCreatePerson}
          className="px-4 py-2.5 rounded-2xl bg-[#E81760] text-white font-extrabold text-xs border-2 border-[#174D3C] flex items-center gap-1.5 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>{lang === 'bn' ? 'নতুন বাকি' : 'Add Due'}</span>
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-3xl bg-white dark:bg-slate-900 border-2 border-[#174D3C] p-8 text-center">
          <Users className="w-10 h-10 mx-auto text-[#E81760] mb-2" />
          <p className="text-sm font-bold text-slate-600 dark:text-slate-300">{t.noData}</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((p) => {
            const rem = Math.max(0, p.totalDue - p.totalPaid);
            return (
              <div
                key={p.id}
                onClick={() => setSelectedPersonId(p.id)}
                className="cursor-pointer rounded-2xl bg-white dark:bg-slate-900 border-2 border-[#174D3C] p-3.5 shadow-sm hover:shadow-md flex items-center justify-between gap-3 transition"
              >
                <div className="min-w-0">
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white truncate">
                    {p.personName}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {p.phone || (lang === 'bn' ? 'নম্বর নেই' : 'No phone')}
                    {p.address ? ` · ${p.address}` : ''}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[11px] font-bold text-slate-500">
                    {lang === 'bn' ? 'অবশিষ্ট বাকি' : 'Remaining'}
                  </p>
                  <p
                    className={`text-base font-extrabold font-mono-num ${
                      rem > 0 ? 'text-[#E81760]' : 'text-[#174D3C] dark:text-emerald-300'
                    }`}
                  >
                    {formatMoney(rem, curr)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create New Due Person Modal */}
      {showPersonForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <form
            onSubmit={handleSavePerson}
            className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-3xl bg-white dark:bg-slate-900 border-2 border-[#174D3C] p-5 space-y-3 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold">
                {lang === 'bn' ? 'নতুন বাকি যুক্ত করুন' : 'Add New Due'}
              </h3>
              <button type="button" onClick={() => setShowPersonForm(false)} className="p-1.5">
                <X className="w-4 h-4" />
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
                className="w-full px-3 py-2 rounded-xl bg-[#F0F3FF] dark:bg-slate-800 border border-[#174D3C]/30 text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-bold mb-1">
                  {lang === 'bn' ? 'মোবাইল নম্বর' : 'Mobile Number'}
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F0F3FF] dark:bg-slate-800 border border-[#174D3C]/30 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">
                  {lang === 'bn' ? 'ঠিকানা' : 'Address'}
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#F0F3FF] dark:bg-slate-800 border border-[#174D3C]/30 text-sm"
                />
              </div>
            </div>

            {!editingPerson && (
              <>
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-bold mb-1">
                      {lang === 'bn' ? 'মোট বাকি' : 'Due Amount'}
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={initialDue}
                      onChange={(e) => setInitialDue(e.target.value)}
                      placeholder="0"
                      className="w-full px-3 py-2 rounded-xl bg-[#F0F3FF] dark:bg-slate-800 border border-[#174D3C]/30 text-sm font-mono-num"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1">
                      {lang === 'bn' ? 'জমার পরিমাণ' : 'Deposit Amount'}
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={initialPaid}
                      onChange={(e) => setInitialPaid(e.target.value)}
                      placeholder="0"
                      className="w-full px-3 py-2 rounded-xl bg-[#F0F3FF] dark:bg-slate-800 border border-[#174D3C]/30 text-sm font-mono-num"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1">
                    {lang === 'bn' ? 'পণ্যের নাম বা বিবরণ' : 'Product Name / Description'}
                  </label>
                  <input
                    type="text"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#F0F3FF] dark:bg-slate-800 border border-[#174D3C]/30 text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="px-3 py-2 rounded-xl bg-[#F0F3FF] dark:bg-slate-800 border border-[#174D3C]/30 text-xs"
                  />
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="px-3 py-2 rounded-xl bg-[#F0F3FF] dark:bg-slate-800 border border-[#174D3C]/30 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1">{t.note}</label>
                  <input
                    type="text"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#F0F3FF] dark:bg-slate-800 border border-[#174D3C]/30 text-sm"
                  />
                </div>
              </>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowPersonForm(false)}
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
