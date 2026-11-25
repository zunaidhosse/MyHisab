import {
  AppSettings,
  BackupPayload,
  Budget,
  DuePerson,
  Loan,
  NoteItem,
  Reminder,
  SavingGoal,
  Transaction,
} from '../types';

const DB_NAME = 'MyHisabDB';
const DB_VERSION = 1;

export const DEFAULT_SETTINGS: AppSettings = {
  id: 'app_settings',
  language: 'bn',
  currency: 'BDT',
  darkMode: false,
  appLockEnabled: false,
  pinCode: '',
  notificationsEnabled: true,
  defaultPaymentMethod: 'Cash',
  dateFormat: 'DD/MM/YYYY',
  timeFormat: '12h',
  userName: 'MyHisab User',
  guestMode: true,
  isPremium: false,
  lastBackupAt: null,
  pendingSync: false,
};

export type StoreName =
  | 'transactions'
  | 'savings'
  | 'loans'
  | 'dues'
  | 'budgets'
  | 'reminders'
  | 'notes'
  | 'settings'
  | 'backups';

const ALL_STORES: StoreName[] = [
  'transactions',
  'savings',
  'loans',
  'dues',
  'budgets',
  'reminders',
  'notes',
  'settings',
  'backups',
];

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      ALL_STORES.forEach((store) => {
        if (!db.objectStoreNames.contains(store)) {
          db.createObjectStore(store, { keyPath: 'id' });
        }
      });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getAllFromStore<T>(storeName: StoreName): Promise<T[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const req = store.getAll();
    req.onsuccess = () => resolve((req.result as T[]) || []);
    req.onerror = () => reject(req.error);
  });
}

export async function putInStore<T extends { id: string }>(
  storeName: StoreName,
  item: T
): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const req = store.put(item);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function deleteFromStore(storeName: StoreName, id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function clearStore(storeName: StoreName): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const req = store.clear();
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function loadAllDatabaseData(): Promise<{
  transactions: Transaction[];
  savings: SavingGoal[];
  loans: Loan[];
  dues: DuePerson[];
  budgets: Budget[];
  reminders: Reminder[];
  notes: NoteItem[];
  settings: AppSettings;
}> {
  const [transactions, savings, loans, dues, budgets, reminders, notes, settingsList] =
    await Promise.all([
      getAllFromStore<Transaction>('transactions'),
      getAllFromStore<SavingGoal>('savings'),
      getAllFromStore<Loan>('loans'),
      getAllFromStore<DuePerson>('dues'),
      getAllFromStore<Budget>('budgets'),
      getAllFromStore<Reminder>('reminders'),
      getAllFromStore<NoteItem>('notes'),
      getAllFromStore<AppSettings>('settings'),
    ]);

  const savedSettings = settingsList.find((s) => s.id === 'app_settings');
  const settings: AppSettings = savedSettings
    ? { ...DEFAULT_SETTINGS, ...savedSettings }
    : DEFAULT_SETTINGS;

  if (!savedSettings) {
    await putInStore('settings', settings);
  }

  return {
    transactions: transactions.sort((a, b) =>
      `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`)
    ),
    savings: savings.sort((a, b) => b.updatedAt - a.updatedAt),
    loans: loans.sort((a, b) => b.updatedAt - a.updatedAt),
    dues: dues.sort((a, b) => b.updatedAt - a.updatedAt),
    budgets: budgets.sort((a, b) => b.updatedAt - a.updatedAt),
    reminders: reminders.sort((a, b) =>
      `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`)
    ),
    notes: notes.sort((a, b) => b.updatedAt - a.updatedAt),
    settings,
  };
}

export async function restoreFullBackup(payload: BackupPayload): Promise<void> {
  const storesToReplace: StoreName[] = [
    'transactions',
    'savings',
    'loans',
    'dues',
    'budgets',
    'reminders',
    'notes',
  ];

  for (const s of storesToReplace) {
    await clearStore(s);
  }

  for (const item of payload.transactions || []) {
    await putInStore('transactions', item);
  }
  for (const item of payload.savings || []) {
    await putInStore('savings', item);
  }
  for (const item of payload.loans || []) {
    await putInStore('loans', item);
  }
  for (const item of payload.dues || []) {
    await putInStore('dues', item);
  }
  for (const item of payload.budgets || []) {
    await putInStore('budgets', item);
  }
  for (const item of payload.reminders || []) {
    await putInStore('reminders', item);
  }
  for (const item of payload.notes || []) {
    await putInStore('notes', item);
  }
  if (payload.settings) {
    await putInStore('settings', { ...DEFAULT_SETTINGS, ...payload.settings, id: 'app_settings' });
  }
}

export interface AutoBackupRecord {
  id: string;
  savedAt: number;
  payload: BackupPayload;
}

export async function saveLocalSnapshot(payload: BackupPayload): Promise<void> {
  const record: AutoBackupRecord = {
    id: 'latest_snapshot',
    savedAt: Date.now(),
    payload,
  };
  await putInStore('backups', record);
}

export async function getLocalSnapshot(): Promise<AutoBackupRecord | null> {
  const list = await getAllFromStore<AutoBackupRecord>('backups');
  return list.find((r) => r.id === 'latest_snapshot') ?? null;
}
