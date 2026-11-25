import { jsPDF } from 'jspdf';
import {
  CURRENCIES,
  CurrencyCode,
  DateFormatOption,
  DuePerson,
  Language,
  TimeFormatOption,
  Transaction,
} from '../types';
import { getCategoryLabel, getPaymentLabel } from './i18n';

export function getCurrencySymbol(code: CurrencyCode): string {
  return CURRENCIES.find((c) => c.code === code)?.symbol ?? '৳';
}

export function formatMoney(amount: number, currency: CurrencyCode, showSign = false): string {
  const symbol = getCurrencySymbol(currency);
  const absVal = Math.abs(amount);
  const formatted = absVal.toLocaleString('en-US', {
    minimumFractionDigits: absVal % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });
  if (amount < 0) {
    return `-${symbol}${formatted}`;
  }
  if (showSign && amount > 0) {
    return `+${symbol}${formatted}`;
  }
  return `${symbol}${formatted}`;
}

export function formatDate(dateStr: string, format: DateFormatOption): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const [y, m, d] = parts;
  if (format === 'DD/MM/YYYY') return `${d}/${m}/${y}`;
  if (format === 'MM/DD/YYYY') return `${m}/${d}/${y}`;
  return `${y}-${m}-${d}`;
}

export function formatTime(timeStr: string, format: TimeFormatOption): string {
  if (!timeStr) return '';
  if (format === '24h') return timeStr;
  const [hStr, mStr] = timeStr.split(':');
  const h = parseInt(hStr, 10);
  if (isNaN(h)) return timeStr;
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${mStr} ${ampm}`;
}

export function getTodayDateString(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getCurrentTimeString(): string {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, '0');
  const m = String(now.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

export function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

// Sanitize non-ASCII for standard jsPDF Helvetica fallback while preserving clean English/numeric readability
function pdfSafe(text: string): string {
  return text.replace(/[^\x20-\x7E]/g, '').trim() || '-';
}

export function exportTransactionsPDF(
  transactions: Transaction[],
  currency: CurrencyCode,
  dateFormat: DateFormatOption,
  timeFormat: TimeFormatOption,
  lang: Language,
  titleLabel = 'MyHisab Transaction Report'
): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const totalIn = transactions.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalOut = transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const net = totalIn - totalOut;
  const currCode = currency;

  doc.setFillColor(232, 23, 96);
  doc.rect(0, 0, 210, 28, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.text('MyHisab - Financial Report', 14, 13);
  doc.setFontSize(10);
  doc.text(`${pdfSafe(titleLabel)} | Generated: ${new Date().toLocaleDateString('en-US')}`, 14, 21);

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(11);
  doc.text(`Total Income: ${currCode} ${totalIn.toLocaleString('en-US')}`, 14, 38);
  doc.text(`Total Expense: ${currCode} ${totalOut.toLocaleString('en-US')}`, 80, 38);
  doc.text(`Net Balance: ${currCode} ${net.toLocaleString('en-US')}`, 146, 38);

  doc.setDrawColor(23, 77, 60);
  doc.line(14, 42, 196, 42);

  let y = 50;
  doc.setFontSize(9);
  doc.setFillColor(240, 243, 255);
  doc.rect(14, y - 5, 182, 8, 'F');
  doc.text('Date & Time', 16, y);
  doc.text('Type', 54, y);
  doc.text('Category', 74, y);
  doc.text('Method', 110, y);
  doc.text('Note', 136, y);
  doc.text(`Amount (${currCode})`, 194, y, { align: 'right' });

  y += 8;
  transactions.forEach((tx, idx) => {
    if (y > 278) {
      doc.addPage();
      y = 20;
    }
    if (idx % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(14, y - 4.5, 182, 7, 'F');
    }
    const dt = `${formatDate(tx.date, dateFormat)} ${formatTime(tx.time, timeFormat)}`;
    const cat = pdfSafe(getCategoryLabel(tx.category, 'en'));
    const pm = pdfSafe(getPaymentLabel(tx.paymentMethod, 'en'));
    const noteStr = pdfSafe(tx.note).slice(0, 24);
    const amtStr = `${tx.type === 'income' ? '+' : '-'}${tx.amount.toLocaleString('en-US')}`;

    doc.setTextColor(30, 41, 59);
    doc.text(dt.slice(0, 20), 16, y);
    doc.setTextColor(tx.type === 'income' ? 22 : 220, tx.type === 'income' ? 163 : 38, tx.type === 'income' ? 74 : 38);
    doc.text(tx.type.toUpperCase(), 54, y);
    doc.setTextColor(30, 41, 59);
    doc.text(cat, 74, y);
    doc.text(pm, 110, y);
    doc.text(noteStr, 136, y);
    doc.text(amtStr, 194, y, { align: 'right' });
    y += 7;
  });

  doc.save(`myhisab-transactions-${getTodayDateString()}.pdf`);
  void lang;
}

export function exportDueDetailPDF(
  person: DuePerson,
  currency: CurrencyCode,
  dateFormat: DateFormatOption,
  timeFormat: TimeFormatOption
): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const remaining = Math.max(0, person.totalDue - person.totalPaid);

  doc.setFillColor(232, 23, 96);
  doc.rect(0, 0, 210, 30, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.text('MyHisab - Customer Due Statement', 14, 13);
  doc.setFontSize(10);
  doc.text(`Customer: ${pdfSafe(person.personName)} | Phone: ${pdfSafe(person.phone)}`, 14, 22);

  doc.setTextColor(15, 23, 42);
  doc.setFontSize(11);
  doc.text(`Total Due: ${currency} ${person.totalDue.toLocaleString('en-US')}`, 14, 40);
  doc.text(`Total Paid: ${currency} ${person.totalPaid.toLocaleString('en-US')}`, 78, 40);
  doc.text(`Remaining Due: ${currency} ${remaining.toLocaleString('en-US')}`, 142, 40);

  doc.setDrawColor(23, 77, 60);
  doc.line(14, 45, 196, 45);

  let y = 53;
  doc.setFontSize(9);
  doc.setFillColor(240, 243, 255);
  doc.rect(14, y - 5, 182, 8, 'F');
  doc.text('Date & Time', 16, y);
  doc.text('Type', 56, y);
  doc.text('Item / Product', 80, y);
  doc.text('Note', 128, y);
  doc.text(`Amount (${currency})`, 194, y, { align: 'right' });

  y += 8;
  person.records.forEach((rec) => {
    if (y > 278) {
      doc.addPage();
      y = 20;
    }
    const dt = `${formatDate(rec.date, dateFormat)} ${formatTime(rec.time, timeFormat)}`;
    doc.setTextColor(30, 41, 59);
    doc.text(dt.slice(0, 20), 16, y);
    doc.text(rec.type === 'due' ? 'DUE (+)' : 'PAID (-)', 56, y);
    doc.text(pdfSafe(rec.productName).slice(0, 22), 80, y);
    doc.text(pdfSafe(rec.note).slice(0, 24), 128, y);
    doc.text(rec.amount.toLocaleString('en-US'), 194, y, { align: 'right' });
    y += 7;
  });

  doc.save(`myhisab-due-${pdfSafe(person.personName).toLowerCase().replace(/\s+/g, '-')}.pdf`);
}
