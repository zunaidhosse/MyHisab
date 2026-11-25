import React, { useMemo, useState } from 'react';
import { Edit3, Plus, Search, StickyNote, Trash2, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { NoteItem } from '../../types';
import { formatDate, generateId, getTodayDateString } from '../../utils/formatters';
import { TEXT } from '../../utils/i18n';

export const NotesPage: React.FC = () => {
  const { notes, saveNote, deleteNote, settings, requestConfirm, showToast } = useApp();
  const lang = settings.language;
  const t = TEXT[lang];

  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<NoteItem | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [date, setDate] = useState(getTodayDateString());

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return notes;
    return notes.filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        n.content.toLowerCase().includes(q) ||
        n.date.includes(q)
    );
  }, [notes, search]);

  const openCreate = () => {
    setEditing(null);
    setTitle('');
    setContent('');
    setDate(getTodayDateString());
    setShowForm(true);
  };

  const openEdit = (n: NoteItem) => {
    setEditing(n);
    setTitle(n.title);
    setContent(n.content);
    setDate(n.date);
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      showToast(lang === 'bn' ? 'নোটের শিরোনাম লিখুন।' : 'Enter note title.', 'error');
      return;
    }
    const now = Date.now();
    await saveNote({
      id: editing?.id || generateId(),
      title: title.trim(),
      content: content.trim(),
      date,
      createdAt: editing?.createdAt || now,
      updatedAt: now,
    });
    setShowForm(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={lang === 'bn' ? 'নোট খুঁজুন...' : 'Search notes...'}
            className="w-full pl-9 pr-3 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border-2 border-[#174D3C]/30 text-sm"
          />
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="px-4 py-2.5 rounded-2xl bg-[#E81760] text-white font-extrabold text-xs border-2 border-[#174D3C] flex items-center gap-1.5 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>{lang === 'bn' ? 'নতুন নোট' : 'New Note'}</span>
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-3xl bg-white dark:bg-slate-900 border-2 border-[#174D3C] p-8 text-center">
          <StickyNote className="w-10 h-10 mx-auto text-[#E81760] mb-2" />
          <p className="text-sm font-bold text-slate-600 dark:text-slate-300">{t.noData}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filtered.map((n) => (
            <div
              key={n.id}
              className="rounded-3xl bg-white dark:bg-slate-900 border-2 border-[#174D3C] p-4 shadow-sm flex flex-col justify-between gap-3"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    {n.title}
                  </h3>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => openEdit(n)}
                      className="w-8 h-8 rounded-xl bg-[#D2E6FA] text-[#174D3C] flex items-center justify-center"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        requestConfirm(t.confirmDeleteTitle, t.confirmDeleteMsg, () =>
                          deleteNote(n.id)
                        )
                      }
                      className="w-8 h-8 rounded-xl bg-[#F7C8CC] text-[#E81760] flex items-center justify-center"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <p className="text-[11px] font-semibold text-slate-500 mt-0.5">
                  {formatDate(n.date, settings.dateFormat)}
                </p>
                {n.content && (
                  <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 mt-2 whitespace-pre-wrap leading-relaxed">
                    {n.content}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <form
            onSubmit={handleSave}
            className="w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border-2 border-[#174D3C] p-5 space-y-3 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold">
                {editing
                  ? lang === 'bn'
                    ? 'নোট সম্পাদনা'
                    : 'Edit Note'
                  : lang === 'bn'
                  ? 'নতুন নোট তৈরি করুন'
                  : 'Create Note'}
              </h3>
              <button type="button" onClick={() => setShowForm(false)} className="p-1.5">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">
                {lang === 'bn' ? 'নোটের শিরোনাম *' : 'Note Title *'}
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-[#F0F3FF] dark:bg-slate-800 border border-[#174D3C]/30 text-sm"
              />
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
              <label className="block text-xs font-bold mb-1">
                {lang === 'bn' ? 'বিস্তারিত লেখা' : 'Details'}
              </label>
              <textarea
                rows={5}
                value={content}
                onChange={(e) => setContent(e.target.value)}
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
                {lang === 'bn' ? 'নোট সংরক্ষণ' : 'Save Note'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
