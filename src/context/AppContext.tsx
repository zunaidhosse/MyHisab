import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  DEFAULT_SETTINGS,
  deleteFromStore,
  getLocalSnapshot,
  loadAllDatabaseData,
  putInStore,
  restoreFullBackup,
  saveLocalSnapshot,
} from '../db/indexedDb';
import { useOnlineStatus } from '../hooks/usePWAInstall';
import {
  AppSettings,
  BackupPayload,
  Budget,
  DuePerson,
  Loan,
  NoteItem,
  PageRoute,
  PaymentMethod,
  Reminder,
  SavingGoal,
  Transaction,
  TransactionType,
} from '../types';
import { getTodayDateString } from '../utils/formatters';
import { TEXT } from '../utils/i18n';

interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface ConfirmDialogState {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
}

export interface DashboardMetrics {
  lifetimeBalance: number;
  thisYearBalance: number;
  bankBalance: number;
  bkashBalance: number;
  cashBalance: number;
  paymentBalances: Record<PaymentMethod, number>;
  totalIncome: number;
  totalExpense: number;
  totalLoanGiven: number;
  totalLoanTaken: number;
  totalDue: number;
  totalSavings: number;
  todayIncome: number;
  todayExpense: number;
  todayProfit: number;
}

interface AppContextValue {
  isLoading: boolean;
  isLocked: boolean;
  unlockApp: (pin: string) => boolean;
  lockAppNow: () => void;
  currentPage: PageRoute;
  navigate: (page: PageRoute) => void;
  editingTransaction: Transaction | null;
  setEditingTransaction: (tx: Transaction | null) => void;
  prefilledEntryAmount: number | null;
  setPrefilledEntryAmount: (amt: number | null) => void;
  prefilledEntryType: TransactionType | null;
  setPrefilledEntryType: (t: TransactionType | null) => void;
  transactions: Transaction[];
  savings: SavingGoal[];
  loans: Loan[];
  dues: DuePerson[];
  budgets: Budget[];
  reminders: Reminder[];
  notes: NoteItem[];
  settings: AppSettings;
  metrics: DashboardMetrics;
  saveTransaction: (tx: Transaction) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  saveSaving: (goal: SavingGoal) => Promise<void>;
  deleteSaving: (id: string) => Promise<void>;
  saveLoan: (loan: Loan) => Promise<void>;
  deleteLoan: (id: string) => Promise<void>;
  saveDue: (due: DuePerson) => Promise<void>;
  deleteDue: (id: string) => Promise<void>;
  saveBudget: (budget: Budget) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;
  saveReminder: (reminder: Reminder) => Promise<void>;
  deleteReminder: (id: string) => Promise<void>;
  saveNote: (note: NoteItem) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  updateSettings: (partial: Partial<AppSettings>) => Promise<void>;
  createBackupPayload: () => BackupPayload;
  triggerManualBackup: () => Promise<BackupPayload>;
  importBackupPayload: (payload: BackupPayload) => Promise<void>;
  restoreFromLocalSnapshot: () => Promise<boolean>;
  toast: ToastMessage | null;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  confirmDialog: ConfirmDialogState;
  requestConfirm: (title: string, message: string, onConfirm: () => void, confirmLabel?: string) => void;
  closeConfirm: () => void;
  isOnline: boolean;
}

const AppContext = createContext<AppContextValue | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isLocked, setIsLocked] = useState(false);
  const [currentPage, setCurrentPage] = useState<PageRoute>('home');
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [prefilledEntryAmount, setPrefilledEntryAmount] = useState<number | null>(null);
  const [prefilledEntryType, setPrefilledEntryType] = useState<TransactionType | null>(null);

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [savings, setSavings] = useState<SavingGoal[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [dues, setDues] = useState<DuePerson[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const isOnline = useOnlineStatus();

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = String(Date.now());
    setToast({ id, type, message });
    setTimeout(() => {
      setToast((prev) => (prev?.id === id ? null : prev));
    }, 3000);
  }, []);

  const requestConfirm = useCallback(
    (title: string, message: string, onConfirm: () => void, confirmLabel?: string) => {
      setConfirmDialog({ isOpen: true, title, message, onConfirm, confirmLabel });
    },
    []
  );

  const closeConfirm = useCallback(() => {
    setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
  }, []);

  const refreshFromDB = useCallback(async () => {
    try {
      const data = await loadAllDatabaseData();
      setTransactions(data.transactions);
      setSavings(data.savings);
      setLoans(data.loans);
      setDues(data.dues);
      setBudgets(data.budgets);
      setReminders(data.reminders);
      setNotes(data.notes);
      setSettings(data.settings);
      if (data.settings.appLockEnabled && data.settings.pinCode.length === 4) {
        setIsLocked(true);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshFromDB();
  }, [refreshFromDB]);

  // Sync dark mode class on <html>
  useEffect(() => {
    const root = document.documentElement;
    if (settings.darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    root.lang = settings.language;
  }, [settings.darkMode, settings.language]);

  // Auto-sync queued offline snapshot when internet comes back
  useEffect(() => {
    if (isOnline && settings.pendingSync && !isLoading) {
      const payload: BackupPayload = {
        version: 1,
        exportedAt: Date.now(),
        appName: 'MyHisab',
        transactions,
        savings,
        loans,
        dues,
        budgets,
        reminders,
        notes,
        settings: { ...settings, pendingSync: false, lastBackupAt: Date.now() },
      };
      saveLocalSnapshot(payload).then(() => {
        const updated = { ...settings, pendingSync: false, lastBackupAt: Date.now() };
        setSettings(updated);
        putInStore('settings', updated);
        showToast(
          settings.language === 'bn'
            ? 'ইন্টারনেট সংযুক্ত হয়েছে — ব্যাকআপ সিঙ্ক সম্পন্ন!'
            : 'Back online — Backup snapshot synced!',
          'info'
        );
      });
    }
  }, [
    isOnline,
    settings,
    isLoading,
    transactions,
    savings,
    loans,
    dues,
    budgets,
    reminders,
    notes,
    showToast,
  ]);

  // Reminder due notification checker every 30s
  useEffect(() => {
    if (!settings.notificationsEnabled || isLoading) return;
    const checkReminders = () => {
      const now = new Date();
      const today = getTodayDateString();
      const hhmm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      reminders.forEach((rem) => {
        if (!rem.completed && !rem.notified && rem.date <= today && (rem.date < today || rem.time <= hhmm)) {
          const updated = { ...rem, notified: true };
          putInStore('reminders', updated);
          setReminders((prev) => prev.map((r) => (r.id === rem.id ? updated : r)));
          if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
            try {
              new Notification(`MyHisab: ${rem.title}`, {
                body: rem.note || `${rem.date} ${rem.time}`,
                icon: '/pwa-192x192.png',
              });
            } catch {
              // ignore notification error in restricted iframe
            }
          }
          showToast(
            `${settings.language === 'bn' ? 'রিমাইন্ডার:' : 'Reminder:'} ${rem.title}`,
            'info'
          );
        }
      });
    };
    const timer = setInterval(checkReminders, 30000);
    return () => clearInterval(timer);
  }, [reminders, settings.notificationsEnabled, settings.language, isLoading, showToast]);

  const navigate = useCallback((page: PageRoute) => {
    if (page !== 'entry') {
      setEditingTransaction(null);
    }
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const unlockApp = useCallback(
    (pin: string) => {
      if (pin === settings.pinCode) {
        setIsLocked(false);
        return true;
      }
      return false;
    },
    [settings.pinCode]
  );

  const lockAppNow = useCallback(() => {
    if (settings.appLockEnabled && settings.pinCode.length === 4) {
      setIsLocked(true);
    }
  }, [settings.appLockEnabled, settings.pinCode]);

  const markPendingSyncIfOffline = useCallback(async () => {
    if (!isOnline && !settings.pendingSync) {
      const updated = { ...settings, pendingSync: true };
      setSettings(updated);
      await putInStore('settings', updated);
    }
  }, [isOnline, settings]);

  const saveTransaction = useCallback(
    async (tx: Transaction) => {
      await putInStore('transactions', tx);
      setTransactions((prev) => {
        const exists = prev.some((item) => item.id === tx.id);
        const next = exists ? prev.map((item) => (item.id === tx.id ? tx : item)) : [tx, ...prev];
        return next.sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`));
      });
      await markPendingSyncIfOffline();
      showToast(TEXT[settings.language].saveSuccess, 'success');
    },
    [markPendingSyncIfOffline, settings.language, showToast]
  );

  const deleteTransaction = useCallback(
    async (id: string) => {
      await deleteFromStore('transactions', id);
      setTransactions((prev) => prev.filter((t) => t.id !== id));
      await markPendingSyncIfOffline();
      showToast(TEXT[settings.language].deleteSuccess, 'success');
    },
    [markPendingSyncIfOffline, settings.language, showToast]
  );

  const saveSaving = useCallback(
    async (goal: SavingGoal) => {
      await putInStore('savings', goal);
      setSavings((prev) => {
        const exists = prev.some((g) => g.id === goal.id);
        const next = exists ? prev.map((g) => (g.id === goal.id ? goal : g)) : [goal, ...prev];
        return next.sort((a, b) => b.updatedAt - a.updatedAt);
      });
      await markPendingSyncIfOffline();
      showToast(TEXT[settings.language].saveSuccess, 'success');
    },
    [markPendingSyncIfOffline, settings.language, showToast]
  );

  const deleteSaving = useCallback(
    async (id: string) => {
      await deleteFromStore('savings', id);
      setSavings((prev) => prev.filter((g) => g.id !== id));
      await markPendingSyncIfOffline();
      showToast(TEXT[settings.language].deleteSuccess, 'success');
    },
    [markPendingSyncIfOffline, settings.language, showToast]
  );

  const saveLoan = useCallback(
    async (loan: Loan) => {
      await putInStore('loans', loan);
      setLoans((prev) => {
        const exists = prev.some((l) => l.id === loan.id);
        const next = exists ? prev.map((l) => (l.id === loan.id ? loan : l)) : [loan, ...prev];
        return next.sort((a, b) => b.updatedAt - a.updatedAt);
      });
      await markPendingSyncIfOffline();
      showToast(TEXT[settings.language].saveSuccess, 'success');
    },
    [markPendingSyncIfOffline, settings.language, showToast]
  );

  const deleteLoan = useCallback(
    async (id: string) => {
      await deleteFromStore('loans', id);
      setLoans((prev) => prev.filter((l) => l.id !== id));
      await markPendingSyncIfOffline();
      showToast(TEXT[settings.language].deleteSuccess, 'success');
    },
    [markPendingSyncIfOffline, settings.language, showToast]
  );

  const saveDue = useCallback(
    async (due: DuePerson) => {
      await putInStore('dues', due);
      setDues((prev) => {
        const exists = prev.some((d) => d.id === due.id);
        const next = exists ? prev.map((d) => (d.id === due.id ? due : d)) : [due, ...prev];
        return next.sort((a, b) => b.updatedAt - a.updatedAt);
      });
      await markPendingSyncIfOffline();
      showToast(TEXT[settings.language].saveSuccess, 'success');
    },
    [markPendingSyncIfOffline, settings.language, showToast]
  );

  const deleteDue = useCallback(
    async (id: string) => {
      await deleteFromStore('dues', id);
      setDues((prev) => prev.filter((d) => d.id !== id));
      await markPendingSyncIfOffline();
      showToast(TEXT[settings.language].deleteSuccess, 'success');
    },
    [markPendingSyncIfOffline, settings.language, showToast]
  );

  const saveBudget = useCallback(
    async (budget: Budget) => {
      await putInStore('budgets', budget);
      setBudgets((prev) => {
        const exists = prev.some((b) => b.id === budget.id);
        const next = exists ? prev.map((b) => (b.id === budget.id ? budget : b)) : [budget, ...prev];
        return next.sort((a, b) => b.updatedAt - a.updatedAt);
      });
      await markPendingSyncIfOffline();
      showToast(TEXT[settings.language].saveSuccess, 'success');
    },
    [markPendingSyncIfOffline, settings.language, showToast]
  );

  const deleteBudget = useCallback(
    async (id: string) => {
      await deleteFromStore('budgets', id);
      setBudgets((prev) => prev.filter((b) => b.id !== id));
      await markPendingSyncIfOffline();
      showToast(TEXT[settings.language].deleteSuccess, 'success');
    },
    [markPendingSyncIfOffline, settings.language, showToast]
  );

  const saveReminder = useCallback(
    async (reminder: Reminder) => {
      await putInStore('reminders', reminder);
      setReminders((prev) => {
        const exists = prev.some((r) => r.id === reminder.id);
        const next = exists
          ? prev.map((r) => (r.id === reminder.id ? reminder : r))
          : [reminder, ...prev];
        return next.sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));
      });
      await markPendingSyncIfOffline();
      showToast(TEXT[settings.language].saveSuccess, 'success');
    },
    [markPendingSyncIfOffline, settings.language, showToast]
  );

  const deleteReminder = useCallback(
    async (id: string) => {
      await deleteFromStore('reminders', id);
      setReminders((prev) => prev.filter((r) => r.id !== id));
      await markPendingSyncIfOffline();
      showToast(TEXT[settings.language].deleteSuccess, 'success');
    },
    [markPendingSyncIfOffline, settings.language, showToast]
  );

  const saveNote = useCallback(
    async (note: NoteItem) => {
      await putInStore('notes', note);
      setNotes((prev) => {
        const exists = prev.some((n) => n.id === note.id);
        const next = exists ? prev.map((n) => (n.id === note.id ? note : n)) : [note, ...prev];
        return next.sort((a, b) => b.updatedAt - a.updatedAt);
      });
      await markPendingSyncIfOffline();
      showToast(TEXT[settings.language].saveSuccess, 'success');
    },
    [markPendingSyncIfOffline, settings.language, showToast]
  );

  const deleteNote = useCallback(
    async (id: string) => {
      await deleteFromStore('notes', id);
      setNotes((prev) => prev.filter((n) => n.id !== id));
      await markPendingSyncIfOffline();
      showToast(TEXT[settings.language].deleteSuccess, 'success');
    },
    [markPendingSyncIfOffline, settings.language, showToast]
  );

  const updateSettings = useCallback(
    async (partial: Partial<AppSettings>) => {
      const updated = { ...settings, ...partial, id: 'app_settings' as const };
      setSettings(updated);
      await putInStore('settings', updated);
    },
    [settings]
  );

  const createBackupPayload = useCallback((): BackupPayload => {
    return {
      version: 1,
      exportedAt: Date.now(),
      appName: 'MyHisab',
      transactions,
      savings,
      loans,
      dues,
      budgets,
      reminders,
      notes,
      settings,
    };
  }, [transactions, savings, loans, dues, budgets, reminders, notes, settings]);

  const triggerManualBackup = useCallback(async () => {
    const payload = createBackupPayload();
    await saveLocalSnapshot(payload);
    await updateSettings({ lastBackupAt: Date.now(), pendingSync: false });
    return payload;
  }, [createBackupPayload, updateSettings]);

  const importBackupPayload = useCallback(
    async (payload: BackupPayload) => {
      await restoreFullBackup(payload);
      await refreshFromDB();
      showToast(
        settings.language === 'bn'
          ? 'ডাটা সফলভাবে পুনরুদ্ধার করা হয়েছে!'
          : 'Backup restored successfully!',
        'success'
      );
    },
    [refreshFromDB, settings.language, showToast]
  );

  const restoreFromLocalSnapshot = useCallback(async () => {
    const snap = await getLocalSnapshot();
    if (!snap) return false;
    await restoreFullBackup(snap.payload);
    await refreshFromDB();
    showToast(
      settings.language === 'bn'
        ? 'লোকাল ব্যাকআপ থেকে পুনরুদ্ধার সম্পন্ন হয়েছে!'
        : 'Restored from local snapshot!',
      'success'
    );
    return true;
  }, [refreshFromDB, settings.language, showToast]);

  const metrics: DashboardMetrics = useMemo(() => {
    const currentYear = String(new Date().getFullYear());
    const today = getTodayDateString();

    let totalIncome = 0;
    let totalExpense = 0;
    let yearIncome = 0;
    let yearExpense = 0;
    let todayIncome = 0;
    let todayExpense = 0;

    const paymentBalances: Record<PaymentMethod, number> = {
      Cash: 0,
      Bank: 0,
      bKash: 0,
      Rocket: 0,
      Nagad: 0,
      Tap: 0,
      Upay: 0,
      'OK Wallet': 0,
    };

    for (const tx of transactions) {
      const sign = tx.type === 'income' ? 1 : -1;
      if (tx.type === 'income') {
        totalIncome += tx.amount;
        if (tx.date.startsWith(currentYear)) yearIncome += tx.amount;
        if (tx.date === today) todayIncome += tx.amount;
      } else {
        totalExpense += tx.amount;
        if (tx.date.startsWith(currentYear)) yearExpense += tx.amount;
        if (tx.date === today) todayExpense += tx.amount;
      }
      if (paymentBalances[tx.paymentMethod] !== undefined) {
        paymentBalances[tx.paymentMethod] += sign * tx.amount;
      }
    }

    const totalLoanGiven = loans
      .filter((l) => l.direction === 'given')
      .reduce((sum, l) => sum + Math.max(0, l.amount - l.repaidAmount), 0);

    const totalLoanTaken = loans
      .filter((l) => l.direction === 'taken')
      .reduce((sum, l) => sum + Math.max(0, l.amount - l.repaidAmount), 0);

    const totalDue = dues.reduce(
      (sum, d) => sum + Math.max(0, d.totalDue - d.totalPaid),
      0
    );

    const totalSavings = savings.reduce(
      (sum, s) => sum + Math.max(0, s.totalDeposited - s.totalWithdrawn),
      0
    );

    return {
      lifetimeBalance: totalIncome - totalExpense,
      thisYearBalance: yearIncome - yearExpense,
      bankBalance: paymentBalances.Bank,
      bkashBalance: paymentBalances.bKash,
      cashBalance: paymentBalances.Cash,
      paymentBalances,
      totalIncome,
      totalExpense,
      totalLoanGiven,
      totalLoanTaken,
      totalDue,
      totalSavings,
      todayIncome,
      todayExpense,
      todayProfit: todayIncome - todayExpense,
    };
  }, [transactions, loans, dues, savings]);

  const value: AppContextValue = {
    isLoading,
    isLocked,
    unlockApp,
    lockAppNow,
    currentPage,
    navigate,
    editingTransaction,
    setEditingTransaction,
    prefilledEntryAmount,
    setPrefilledEntryAmount,
    prefilledEntryType,
    setPrefilledEntryType,
    transactions,
    savings,
    loans,
    dues,
    budgets,
    reminders,
    notes,
    settings,
    metrics,
    saveTransaction,
    deleteTransaction,
    saveSaving,
    deleteSaving,
    saveLoan,
    deleteLoan,
    saveDue,
    deleteDue,
    saveBudget,
    deleteBudget,
    saveReminder,
    deleteReminder,
    saveNote,
    deleteNote,
    updateSettings,
    createBackupPayload,
    triggerManualBackup,
    importBackupPayload,
    restoreFromLocalSnapshot,
    toast,
    showToast,
    confirmDialog,
    requestConfirm,
    closeConfirm,
    isOnline,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
