export type Language = 'bn' | 'en';

export type CurrencyCode = 'BDT' | 'USD' | 'EUR' | 'GBP' | 'INR' | 'SAR';

export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  labelBn: string;
  labelEn: string;
}

export const CURRENCIES: CurrencyConfig[] = [
  { code: 'BDT', symbol: '৳', labelBn: 'বাংলাদেশি টাকা (৳)', labelEn: 'Bangladeshi Taka (৳)' },
  { code: 'USD', symbol: '$', labelBn: 'ইউএস ডলার ($)', labelEn: 'US Dollar ($)' },
  { code: 'EUR', symbol: '€', labelBn: 'ইউরো (€)', labelEn: 'Euro (€)' },
  { code: 'GBP', symbol: '£', labelBn: 'ব্রিটিশ পাউন্ড (£)', labelEn: 'British Pound (£)' },
  { code: 'INR', symbol: '₹', labelBn: 'ভারতীয় রুপি (₹)', labelEn: 'Indian Rupee (₹)' },
  { code: 'SAR', symbol: '﷼', labelBn: 'সৌদি রিয়াল (﷼)', labelEn: 'Saudi Riyal (﷼)' },
];

export type TransactionType = 'income' | 'expense';

export type IncomeCategory = 'Business' | 'Job' | 'Salary' | 'Gift' | 'Other Income';

export type ExpenseCategory =
  | 'Family'
  | 'Shopping'
  | 'Food'
  | 'Utility Bill'
  | 'Transport'
  | 'Medical'
  | 'Personal'
  | 'Other Expense';

export type PaymentMethod =
  | 'Cash'
  | 'Bank'
  | 'bKash'
  | 'Rocket'
  | 'Nagad'
  | 'Tap'
  | 'Upay'
  | 'OK Wallet';

export const INCOME_CATEGORIES: IncomeCategory[] = [
  'Business',
  'Job',
  'Salary',
  'Gift',
  'Other Income',
];

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'Family',
  'Shopping',
  'Food',
  'Utility Bill',
  'Transport',
  'Medical',
  'Personal',
  'Other Expense',
];

export const PAYMENT_METHODS: PaymentMethod[] = [
  'Cash',
  'Bank',
  'bKash',
  'Rocket',
  'Nagad',
  'Tap',
  'Upay',
  'OK Wallet',
];

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: IncomeCategory | ExpenseCategory;
  paymentMethod: PaymentMethod;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  note: string;
  createdAt: number;
  updatedAt: number;
}

export interface SavingRecord {
  id: string;
  type: 'deposit' | 'withdraw';
  amount: number;
  date: string;
  note: string;
  createdAt: number;
}

export interface SavingGoal {
  id: string;
  name: string;
  targetAmount: number;
  totalDeposited: number;
  totalWithdrawn: number;
  date: string;
  note: string;
  history: SavingRecord[];
  createdAt: number;
  updatedAt: number;
}

export interface LoanRepayment {
  id: string;
  amount: number;
  date: string;
  note: string;
  createdAt: number;
}

export interface Loan {
  id: string;
  direction: 'given' | 'taken';
  personName: string;
  phone: string;
  amount: number;
  repaidAmount: number;
  date: string;
  note: string;
  repayments: LoanRepayment[];
  createdAt: number;
  updatedAt: number;
}

export interface DueEntry {
  id: string;
  type: 'due' | 'payment';
  amount: number;
  productName: string;
  date: string;
  time: string;
  note: string;
  createdAt: number;
}

export interface DuePerson {
  id: string;
  personName: string;
  phone: string;
  address: string;
  totalDue: number;
  totalPaid: number;
  records: DueEntry[];
  createdAt: number;
  updatedAt: number;
}

export interface Budget {
  id: string;
  category: ExpenseCategory;
  amount: number;
  month: number; // 1-12
  year: number;
  createdAt: number;
  updatedAt: number;
}

export interface Reminder {
  id: string;
  title: string;
  date: string;
  time: string;
  note: string;
  completed: boolean;
  notified?: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface NoteItem {
  id: string;
  title: string;
  content: string;
  date: string;
  createdAt: number;
  updatedAt: number;
}

export type DateFormatOption = 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
export type TimeFormatOption = '12h' | '24h';

export interface AppSettings {
  id: 'app_settings';
  language: Language;
  currency: CurrencyCode;
  darkMode: boolean;
  appLockEnabled: boolean;
  pinCode: string;
  notificationsEnabled: boolean;
  defaultPaymentMethod: PaymentMethod;
  dateFormat: DateFormatOption;
  timeFormat: TimeFormatOption;
  userName: string;
  guestMode: boolean;
  isPremium: boolean;
  lastBackupAt: number | null;
  pendingSync: boolean;
}

export type PageRoute =
  | 'home'
  | 'transactions'
  | 'entry'
  | 'analytics'
  | 'settings'
  | 'savings'
  | 'loan'
  | 'due'
  | 'budget'
  | 'reminder'
  | 'notes'
  | 'calculator'
  | 'tutorial';

export interface BackupPayload {
  version: number;
  exportedAt: number;
  appName: 'MyHisab';
  transactions: Transaction[];
  savings: SavingGoal[];
  loans: Loan[];
  dues: DuePerson[];
  budgets: Budget[];
  reminders: Reminder[];
  notes: NoteItem[];
  settings: AppSettings;
}
