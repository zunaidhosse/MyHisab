import React, { useMemo, useState } from 'react';
import {
  BellRing,
  CalendarClock,
  CheckCircle2,
  Circle,
  Edit3,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Reminder } from '../../types';
import {
  formatDate,
  formatTime,
  generateId,
  getCurrentTimeString,
  getTodayDateString,
} from '../../utils/formatters';
import { TEXT } from '../../utils/i18n';

export const ReminderPage: React.FC = () => {
  const { reminders, saveReminder, deleteReminder, settings, requestConfirm, showToast } =
    useApp();
  const lang = settings.language;
  const t = TEXT[lang];

  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Reminder | null>(null);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(getTodayDateString());
  const [time, setTime] = useState(getCurrentTimeString());
  const [note, setNote] = useState('');

  const filtered = useMemo(() => {
    if (filter === 'pending') return reminders.filter((r) => !r.completed);
    if (filter === 'completed') return reminders.filter((r) => r.completed);
    return reminders;
  }, [reminders, filter]);

  const requestNotifyPermission = async () => {
    if (typeof Notification === 'undefined') {
      showToast(
        lang === 'bn'
          ? 'এই ব্রাউজারে সিস্টেম নোটিফিকেশন সমর্থিত নয়।'
          : 'Browser notifications are not supported here.',
        'info'
      );
      return;
    }
    const perm = await Notification.requestPermission();
    showToast(
      perm === 'granted'
        ? lang === 'bn'
          ? 'নোটিফিকেশন চালু হয়েছে!'
          : 'Notifications enabled!'
        : lang === 'bn'
        ? 'নোটিফিকেশন অনুমতি দেওয়া হয়নি।'
        : 'Notification permission denied.',
      perm === 'granted' ? 'success' : 'error'
    );
  };

  const openCreate = () => {
    setEditing(null);
    setTitle('');
    setDate(getTodayDateString());
    setTime(getCurrentTimeString());
    setNote('');
    setShowForm(true);
  };

  const openEdit = (r: Reminder) => {
    setEditing(r);
    setTitle(r.title);
    setDate(r.date);
    setTime(r.time);
    setNote(r.note);
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      showToast(lang === 'bn' ? 'রিমাইন্ডারের নাম লিখুন।' : 'Enter reminder title.', 'error');
      return;
    }
    const now = Date.now();
    await saveReminder({
      id: editing?.id || generateId(),
      title: title.trim(),
      date,
      time,
      note: note.trim(),
      completed: editing?.completed || false,
      notified: false,
      createdAt: editing?.createdAt || now,
      updatedAt: now,
    });
    setShowForm(false);
  };

  const toggleStatus = async (r: Reminder) => {
    await saveReminder({
      ...r,
      completed: !r.completed,
      updatedAt: Date.now(),
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={openCreate}
          className="flex-1 py-3 rounded-2xl bg-[#E81760] text-white font-extrabold text-sm border-2 border-[#174D3C] shadow-md flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          <span>{lang === 'bn' ? 'নতুন রিমাইন্ডার' : 'Add Reminder'}</span>
        </button>
        <button
          type="button"
          onClick={requestNotifyPermission}
          className="px-3.5 py-3 rounded-2xl bg-[#80F5F3] text-[#174D3C] border-2 border-[#174D3C] text-xs font-extrabold flex items-center gap-1.5"
        >
          <BellRing className="w-4 h-4" />
          <span>{lang === 'bn' ? 'অ্যালার্ট' : 'Alert'}</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border-2 border-[#174D3C] p-1.5 grid grid-cols-3 gap-1.5">
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={`py-2 rounded-xl text-xs font-extrabold ${
            filter === 'all' ? 'bg-[#E81760] text-white' : 'text-slate-700 dark:text-slate-200'
          }`}
        >
          {t.all}
        </button>
        <button
          type="button"
          onClick={() => setFilter('pending')}
          className={`py-2 rounded-xl text-xs font-extrabold ${
            filter === 'pending'
              ? 'bg-[#D2E6FA] text-[#174D3C]'
              : 'text-slate-700 dark:text-slate-200'
          }`}
        >
          {lang === 'bn' ? 'বাকি (Pending)' : 'Pending'}
        </button>
        <button
          type="button"
          onClick={() => setFilter('completed')}
          className={`py-2 rounded-xl text-xs font-extrabold ${
            filter === 'completed'
              ? 'bg-[#C9E9CE] text-[#174D3C]'
              : 'text-slate-700 dark:text-slate-200'
          }`}
        >
          {lang === 'bn' ? 'সম্পন্ন' : 'Completed'}
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-3xl bg-white dark:bg-slate-900 border-2 border-[#174D3C] p-8 text-center">
          <CalendarClock className="w-10 h-10 mx-auto text-[#E81760] mb-2" />
          <p className="text-sm font-bold text-slate-600 dark:text-slate-300">{t.noData}</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((r) => (
            <div
              key={r.id}
              className={`rounded-2xl border-2 p-3.5 shadow-sm flex items-start justify-between gap-3 ${
                r.completed
                  ? 'bg-[#C9E9CE]/50 dark:bg-emerald-950/40 border-[#174D3C]/40'
                  : 'bg-white dark:bg-slate-900 border-[#174D3C]'
              }`}
            >
              <button
                type="button"
                onClick={() => toggleStatus(r)}
                className="mt-0.5 text-[#174D3C] dark:text-[#80F5F3] shrink-0"
              >
                {r.completed ? (
                  <CheckCircle2 className="w-5 h-5 text-[#174D3C] dark:text-emerald-300" />
                ) : (
                  <Circle className="w-5 h-5 text-[#E81760]" />
                )}
              </button>

              <div className="min-w-0 flex-1">
                <h3
                  className={`text-sm font-extrabold ${
                    r.completed
                      ? 'line-through text-slate-500'
                      : 'text-slate-900 dark:text-white'
                  }`}
                >
                  {r.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {formatDate(r.date, settings.dateFormat)} ·{' '}
                  {formatTime(r.time, settings.timeFormat)}
                </p>
                {r.note && (
                  <p className="text-xs text-slate-700 dark:text-slate-300 mt-1">{r.note}</p>
                )}
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => openEdit(r)}
                  className="w-8 h-8 rounded-xl bg-[#D2E6FA] text-[#174D3C] flex items-center justify-center"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    requestConfirm(t.confirmDeleteTitle, t.confirmDeleteMsg, () =>
                      deleteReminder(r.id)
                    )
                  }
                  className="w-8 h-8 rounded-xl bg-[#F7C8CC] text-[#E81760] flex items-center justify-center"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
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
                    ? 'রিমাইন্ডার সম্পাদনা'
                    : 'Edit Reminder'
                  : lang === 'bn'
                  ? 'নতুন রিমাইন্ডার'
                  : 'New Reminder'}
              </h3>
              <button type="button" onClick={() => setShowForm(false)} className="p-1.5">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">
                {lang === 'bn' ? 'রিমাইন্ডারের নাম *' : 'Reminder Title *'}
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-[#F0F3FF] dark:bg-slate-800 border border-[#174D3C]/30 text-sm"
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
              <textarea
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#F0F3FF] dark:bg-slate-800 border border-[#174D3C]/30 text-sm"
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
