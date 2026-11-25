import React, { useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  Calculator,
  CalendarClock,
  ChevronDown,
  ChevronUp,
  HandCoins,
  Home,
  ListOrdered,
  PieChart,
  PiggyBank,
  PlusCircle,
  Settings,
  StickyNote,
  Target,
  Users,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PageRoute } from '../../types';

export const TutorialPage: React.FC = () => {
  const { settings, navigate } = useApp();
  const lang = settings.language;
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const guides: {
    titleBn: string;
    titleEn: string;
    descBn: string;
    descEn: string;
    route: PageRoute;
    icon: React.ReactNode;
  }[] = [
    {
      titleBn: '১. হোম ড্যাশবোর্ড',
      titleEn: '1. Home Dashboard',
      descBn:
        'হোম পেজে আপনার লাইফটাইম ব্যালেন্স, চলতি বছরের ব্যালেন্স, ব্যাংক, বিকাশ ও ক্যাশ ব্যালেন্স, মোট আয়, ব্যয়, লোন, বাকি, সঞ্চয় এবং আজকের লাভ দেখতে পারবেন। সব হিসাব স্বয়ংক্রিয়ভাবে আপডেট হয়।',
      descEn:
        'View your Lifetime Balance, Yearly Balance, Bank/bKash/Cash balances, Total Income, Expense, Loan, Due, Savings, and Today Summary automatically.',
      route: 'home',
      icon: <Home className="w-5 h-5" />,
    },
    {
      titleBn: '২. আয়-ব্যয় এন্ট্রি (+ বাটন)',
      titleEn: '2. Income & Expense Entry (+ Button)',
      descBn:
        'নিচের মাঝখানের বড় গোলাকার গোলাপি (+) বাটনে ক্লিক করে নতুন আয় বা ব্যয় যুক্ত করুন। টাকার পরিমাণ, তারিখ, সময়, ক্যাটাগরি, পেমেন্ট মাধ্যম এবং নোট লিখে Save করুন।',
      descEn:
        'Tap the center pink (+) button in the bottom bar to log Income or Expense with category, payment method (Cash, Bank, bKash, Rocket, Nagad, Tap, Upay, OK Wallet), date, time, and note.',
      route: 'entry',
      icon: <PlusCircle className="w-5 h-5" />,
    },
    {
      titleBn: '৩. সকল লেনদেন, ফিল্টার ও PDF',
      titleEn: '3. All Transactions, Filters & PDF',
      descBn:
        'লেনদেন পেজে মাস, বছর, তারিখ, ক্যাটাগরি এবং পেমেন্ট মাধ্যম অনুযায়ী ফিল্টার ও সার্চ করতে পারবেন। যেকোনো লেনদেন Edit বা Delete করা যায় এবং PDF ডাউনলোড ও Print করা যায়।',
      descEn:
        'Search and filter transactions by month, year, date, category, or payment method. Tap any item to view details, edit, delete, export PDF, or print.',
      route: 'transactions',
      icon: <ListOrdered className="w-5 h-5" />,
    },
    {
      titleBn: '৪. অ্যানালিটিক্স ড্যাশবোর্ড',
      titleEn: '4. Analytics Dashboard',
      descBn:
        'বছর ও মাস অনুযায়ী আয়-ব্যয়ের পাই চার্ট, ডোনাট চার্ট, মাসিক গ্রাফ, ক্যাটাগরি শতকরা হার, ব্যালেন্স রিপোর্ট এবং সঞ্চয় রিপোর্ট দেখুন।',
      descEn:
        'Analyze yearly and monthly Pie charts, Donut charts, 12-month bar graphs, category percentages, Balance report, and Savings report.',
      route: 'analytics',
      icon: <PieChart className="w-5 h-5" />,
    },
    {
      titleBn: '৫. সঞ্চয় ব্যবস্থাপনা',
      titleEn: '5. Savings Management',
      descBn:
        'নতুন সঞ্চয় লক্ষ্য তৈরি করুন, টাকা জমা দিন বা উত্তোলন করুন এবং প্রতিটি সঞ্চয়ের আলাদা হিস্টোরি দেখুন।',
      descEn:
        'Create savings goals with target amounts, deposit or withdraw funds, and track full deposit/withdrawal history.',
      route: 'savings',
      icon: <PiggyBank className="w-5 h-5" />,
    },
    {
      titleBn: '৬. লোন ব্যবস্থাপনা',
      titleEn: '6. Loan Management',
      descBn:
        'আপনি কাকে টাকা ধার দিয়েছেন এবং কার কাছ থেকে নিয়েছেন তার পূর্ণাঙ্গ হিসাব, মোবাইল নম্বর, পরিশোধের হিসাব এবং হিস্টোরি রাখুন।',
      descEn:
        'Track loans given and taken with contact info, repayment installments, remaining balances, and full history.',
      route: 'loan',
      icon: <HandCoins className="w-5 h-5" />,
    },
    {
      titleBn: '৭. পাওনা / বাকি সিস্টেম',
      titleEn: '7. Due Management System',
      descBn:
        'ক্রেতা বা ব্যক্তির নামে বাকি যুক্ত করুন। প্রতিটি ব্যক্তির আলাদা ডিটেইলস পেজ থেকে কল, WhatsApp, টাকা জমা, নতুন বাকি যুক্ত এবং PDF স্টেটমেন্ট ডাউনলোড করুন।',
      descEn:
        'Manage customer dues with individual detail pages, direct Call/WhatsApp/SMS buttons, add dues/payments, and PDF statement export.',
      route: 'due',
      icon: <Users className="w-5 h-5" />,
    },
    {
      titleBn: '৮. বাজেট, রিমাইন্ডার, নোট ও ক্যালকুলেটর',
      titleEn: '8. Budget, Reminder, Notes & Calculator',
      descBn:
        'মাসিক ক্যাটাগরি বাজেট সেট করুন (বাজেট অতিক্রম করলে সতর্কবার্তা পাবেন), সময়মতো রিমাইন্ডার দিন, গুরুত্বপূর্ণ নোট লিখুন এবং বিল্ট-ইন ক্যালকুলেটর ব্যবহার করুন।',
      descEn:
        'Set monthly category budgets with overspend alerts, schedule reminders with notifications, save searchable notes, and calculate amounts quickly.',
      route: 'budget',
      icon: <Target className="w-5 h-5" />,
    },
    {
      titleBn: '৯. সেটিংস, পিন লক, ব্যাকআপ ও PWA ইনস্টল',
      titleEn: '9. Settings, PIN Lock, Backup & PWA Install',
      descBn:
        'সেটিংস থেকে বাংলা/English ভাষা, মুদ্রা, ডার্ক মোড, ৪-সংখ্যার পিন লক, JSON ব্যাকআপ ডাউনলোড ও রিস্টোর এবং হোম স্ক্রিনে অ্যাপ ইনস্টল করতে পারবেন।',
      descEn:
        'Switch Bengali/English language, currency, Dark Mode, 4-digit PIN lock, download/restore JSON backups, and install MyHisab as an offline PWA.',
      route: 'settings',
      icon: <Settings className="w-5 h-5" />,
    },
  ];

  void Calculator;
  void CalendarClock;
  void StickyNote;

  return (
    <div className="space-y-3">
      <div className="rounded-3xl bg-gradient-to-r from-[#E81760] to-[#174D3C] text-white p-4 border-2 border-[#174D3C] shadow-sm flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl bg-white text-[#E81760] flex items-center justify-center shrink-0">
          <BookOpen className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-base font-extrabold">
            {lang === 'bn' ? 'MyHisab ব্যবহারের নির্দেশিকা' : 'MyHisab User Guide'}
          </h2>
          <p className="text-xs text-[#80F5F3]">
            {lang === 'bn'
              ? 'প্রতিটি ফিচার কীভাবে কাজ করে জানতে নিচের ধাপগুলো দেখুন'
              : 'Tap any section below to learn how each feature works'}
          </p>
        </div>
      </div>

      <div className="space-y-2.5">
        {guides.map((g, idx) => {
          const open = openIdx === idx;
          return (
            <div
              key={idx}
              className="rounded-2xl bg-white dark:bg-slate-900 border-2 border-[#174D3C] overflow-hidden shadow-sm"
            >
              <button
                type="button"
                onClick={() => setOpenIdx(open ? null : idx)}
                className="w-full px-4 py-3.5 flex items-center justify-between gap-3 text-left"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-9 h-9 rounded-xl bg-[#D2E6FA] text-[#174D3C] flex items-center justify-center shrink-0">
                    {g.icon}
                  </span>
                  <span className="text-sm font-extrabold text-slate-900 dark:text-white truncate">
                    {lang === 'bn' ? g.titleBn : g.titleEn}
                  </span>
                </div>
                {open ? (
                  <ChevronUp className="w-4 h-4 text-[#E81760] shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                )}
              </button>

              {open && (
                <div className="px-4 pb-4 pt-1 border-t border-slate-100 dark:border-slate-800 space-y-3">
                  <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                    {lang === 'bn' ? g.descBn : g.descEn}
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate(g.route)}
                    className="px-3.5 py-2 rounded-xl bg-[#E81760] text-white text-xs font-extrabold inline-flex items-center gap-1.5"
                  >
                    <span>{lang === 'bn' ? 'এখনই খুলুন' : 'Open Feature'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
