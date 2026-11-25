import React, { useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ExpenseCategory, IncomeCategory, PAYMENT_METHODS } from '../../types';
import { formatMoney } from '../../utils/formatters';
import { getCategoryLabel, getMonthName, getPaymentLabel, TEXT } from '../../utils/i18n';

const CHART_COLORS = [
  '#E81760',
  '#174D3C',
  '#0EA5E9',
  '#F59E0B',
  '#8B5CF6',
  '#10B981',
  '#F97316',
  '#EC4899',
];

interface SliceData {
  label: string;
  amount: number;
  pct: number;
  color: string;
}

const SvgPieOrDonut: React.FC<{
  slices: SliceData[];
  donut?: boolean;
  centerLabel?: string;
  centerValue?: string;
}> = ({ slices, donut = false, centerLabel, centerValue }) => {
  const total = slices.reduce((s, d) => s + d.amount, 0);
  if (total <= 0) {
    return (
      <div className="w-44 h-44 mx-auto rounded-full border-4 border-dashed border-slate-200 dark:border-slate-700 flex items-center justify-center text-xs font-bold text-slate-400">
        0%
      </div>
    );
  }

  const radius = 72;
  const circumference = 2 * Math.PI * radius;
  let accumulated = 0;

  if (!donut) {
    // True Pie Chart using polar coordinates
    let startAngle = -Math.PI / 2;
    return (
      <svg viewBox="0 0 200 200" className="w-48 h-48 mx-auto">
        {slices.map((s, idx) => {
          const angle = (s.amount / total) * 2 * Math.PI;
          if (slices.length === 1) {
            return <circle key={idx} cx="100" cy="100" r="85" fill={s.color} />;
          }
          const endAngle = startAngle + angle;
          const x1 = 100 + 85 * Math.cos(startAngle);
          const y1 = 100 + 85 * Math.sin(startAngle);
          const x2 = 100 + 85 * Math.cos(endAngle);
          const y2 = 100 + 85 * Math.sin(endAngle);
          const largeArc = angle > Math.PI ? 1 : 0;
          const d = `M 100 100 L ${x1} ${y1} A 85 85 0 ${largeArc} 1 ${x2} ${y2} Z`;
          startAngle = endAngle;
          return <path key={idx} d={d} fill={s.color} stroke="#FFFFFF" strokeWidth="2" />;
        })}
      </svg>
    );
  }

  return (
    <div className="relative w-48 h-48 mx-auto flex items-center justify-center">
      <svg viewBox="0 0 200 200" className="w-48 h-48 -rotate-90">
        {slices.map((s, idx) => {
          const segLen = (s.amount / total) * circumference;
          const offset = -accumulated;
          accumulated += segLen;
          return (
            <circle
              key={idx}
              cx="100"
              cy="100"
              r={radius}
              fill="transparent"
              stroke={s.color}
              strokeWidth="28"
              strokeDasharray={`${segLen} ${circumference}`}
              strokeDashoffset={offset}
            />
          );
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
        <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
          {centerLabel}
        </span>
        <span className="text-sm font-extrabold font-mono-num text-slate-900 dark:text-white truncate max-w-full">
          {centerValue}
        </span>
      </div>
    </div>
  );
};

export const AnalyticsPage: React.FC = () => {
  const { transactions, savings, metrics, settings } = useApp();
  const lang = settings.language;
  const curr = settings.currency;
  const t = TEXT[lang];

  const currentYear = String(new Date().getFullYear());
  const [selectedYear, setSelectedYear] = useState<string>(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<string>('all');

  const availableYears = useMemo(() => {
    const set = new Set<string>([currentYear]);
    transactions.forEach((tx) => {
      if (tx.date.length >= 4) set.add(tx.date.slice(0, 4));
    });
    return Array.from(set).sort((a, b) => b.localeCompare(a));
  }, [transactions, currentYear]);

  const filteredTx = useMemo(() => {
    return transactions.filter((tx) => {
      if (!tx.date.startsWith(selectedYear)) return false;
      if (selectedMonth !== 'all') {
        if (tx.date.slice(5, 7) !== selectedMonth.padStart(2, '0')) return false;
      }
      return true;
    });
  }, [transactions, selectedYear, selectedMonth]);

  const { totalIncome, totalExpense, incomeSlices, expenseSlices } = useMemo(() => {
    let inc = 0;
    let exp = 0;
    const incMap = new Map<string, number>();
    const expMap = new Map<string, number>();

    filteredTx.forEach((tx) => {
      if (tx.type === 'income') {
        inc += tx.amount;
        incMap.set(tx.category, (incMap.get(tx.category) || 0) + tx.amount);
      } else {
        exp += tx.amount;
        expMap.set(tx.category, (expMap.get(tx.category) || 0) + tx.amount);
      }
    });

    const iSlices: SliceData[] = Array.from(incMap.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([cat, amount], i) => ({
        label: getCategoryLabel(cat as IncomeCategory, lang),
        amount,
        pct: inc > 0 ? (amount / inc) * 100 : 0,
        color: CHART_COLORS[i % CHART_COLORS.length],
      }));

    const eSlices: SliceData[] = Array.from(expMap.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([cat, amount], i) => ({
        label: getCategoryLabel(cat as ExpenseCategory, lang),
        amount,
        pct: exp > 0 ? (amount / exp) * 100 : 0,
        color: CHART_COLORS[i % CHART_COLORS.length],
      }));

    return {
      totalIncome: inc,
      totalExpense: exp,
      incomeSlices: iSlices,
      expenseSlices: eSlices,
    };
  }, [filteredTx, lang]);

  // 12-Month Breakdown for selected Year
  const monthlyData = useMemo(() => {
    const arr = Array.from({ length: 12 }, (_, idx) => ({
      month: idx + 1,
      income: 0,
      expense: 0,
    }));
    transactions.forEach((tx) => {
      if (!tx.date.startsWith(selectedYear)) return;
      const mIdx = parseInt(tx.date.slice(5, 7), 10) - 1;
      if (mIdx >= 0 && mIdx < 12) {
        if (tx.type === 'income') arr[mIdx].income += tx.amount;
        else arr[mIdx].expense += tx.amount;
      }
    });
    return arr;
  }, [transactions, selectedYear]);

  const maxMonthlyVal = useMemo(() => {
    const max = Math.max(...monthlyData.map((d) => Math.max(d.income, d.expense)), 1);
    return max;
  }, [monthlyData]);

  const savingsReport = useMemo(() => {
    const deposited = savings.reduce((s, g) => s + g.totalDeposited, 0);
    const withdrawn = savings.reduce((s, g) => s + g.totalWithdrawn, 0);
    const target = savings.reduce((s, g) => s + g.targetAmount, 0);
    return {
      deposited,
      withdrawn,
      balance: Math.max(0, deposited - withdrawn),
      target,
    };
  }, [savings]);

  return (
    <div className="space-y-4">
      {/* Year & Month Filters */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border-2 border-[#174D3C] p-3.5 shadow-sm grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] font-bold text-[#174D3C] dark:text-[#80F5F3] mb-1">
            {t.year}
          </label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-[#F0F3FF] dark:bg-slate-800 border border-[#174D3C]/30 text-sm font-bold"
          >
            {availableYears.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-[#174D3C] dark:text-[#80F5F3] mb-1">
            {t.month}
          </label>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-[#F0F3FF] dark:bg-slate-800 border border-[#174D3C]/30 text-sm font-bold"
          >
            <option value="all">{t.allMonths}</option>
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={String(m)}>
                {getMonthName(m, lang)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Total Income & Expense Summary Chart Bar */}
      <section className="rounded-3xl bg-white dark:bg-slate-900 border-2 border-[#174D3C] p-4 shadow-sm space-y-3">
        <h2 className="text-sm font-extrabold text-[#174D3C] dark:text-[#80F5F3]">
          {t.balanceReport}
        </h2>
        <div className="grid grid-cols-3 gap-2.5">
          <div className="rounded-2xl bg-[#C9E9CE] dark:bg-emerald-950/70 p-3 text-center">
            <p className="text-[11px] font-bold text-[#174D3C] dark:text-emerald-200">{t.totalIncome}</p>
            <p className="text-sm sm:text-base font-extrabold font-mono-num text-[#174D3C] dark:text-emerald-100 mt-0.5">
              {formatMoney(totalIncome, curr)}
            </p>
          </div>
          <div className="rounded-2xl bg-[#F7C8CC] dark:bg-rose-950/70 p-3 text-center">
            <p className="text-[11px] font-bold text-[#9F1239] dark:text-rose-200">{t.totalExpense}</p>
            <p className="text-sm sm:text-base font-extrabold font-mono-num text-[#9F1239] dark:text-rose-100 mt-0.5">
              {formatMoney(totalExpense, curr)}
            </p>
          </div>
          <div className="rounded-2xl bg-[#D2E6FA] dark:bg-sky-950/70 p-3 text-center">
            <p className="text-[11px] font-bold text-[#174D3C] dark:text-sky-200">
              {lang === 'bn' ? 'অবশিষ্ট' : 'Net'}
            </p>
            <p className="text-sm sm:text-base font-extrabold font-mono-num text-slate-900 dark:text-white mt-0.5">
              {formatMoney(totalIncome - totalExpense, curr, true)}
            </p>
          </div>
        </div>

        {/* Income vs Expense Ratio Bar */}
        <div>
          <div className="flex justify-between text-xs font-bold mb-1">
            <span className="text-[#174D3C] dark:text-emerald-300">
              {t.totalIncome}:{' '}
              {totalIncome + totalExpense > 0
                ? Math.round((totalIncome / (totalIncome + totalExpense)) * 100)
                : 0}
              %
            </span>
            <span className="text-[#E81760] dark:text-rose-300">
              {t.totalExpense}:{' '}
              {totalIncome + totalExpense > 0
                ? Math.round((totalExpense / (totalIncome + totalExpense)) * 100)
                : 0}
              %
            </span>
          </div>
          <div className="w-full h-4 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex border border-[#174D3C]/20">
            <div
              style={{
                width: `${
                  totalIncome + totalExpense > 0
                    ? (totalIncome / (totalIncome + totalExpense)) * 100
                    : 50
                }%`,
              }}
              className="bg-[#174D3C] h-full transition-all"
            />
            <div
              style={{
                width: `${
                  totalIncome + totalExpense > 0
                    ? (totalExpense / (totalIncome + totalExpense)) * 100
                    : 50
                }%`,
              }}
              className="bg-[#E81760] h-full transition-all"
            />
          </div>
        </div>
      </section>

      {/* Pie Chart (Income) & Donut Chart (Expense) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Income Pie Chart + Breakdown */}
        <section className="rounded-3xl bg-white dark:bg-slate-900 border-2 border-[#174D3C] p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-[#174D3C] dark:text-[#80F5F3]">
              {t.incomeBreakdown}
            </h3>
            <span className="text-xs font-bold text-slate-500">{t.pieChart}</span>
          </div>

          <SvgPieOrDonut slices={incomeSlices} donut={false} />

          <div className="space-y-2 pt-2">
            {incomeSlices.length === 0 ? (
              <p className="text-xs text-center text-slate-500">{t.noData}</p>
            ) : (
              incomeSlices.map((s) => (
                <div key={s.label} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-100">
                      <span
                        className="w-3 h-3 rounded-sm shrink-0"
                        style={{ backgroundColor: s.color }}
                      />
                      {s.label}
                    </span>
                    <span className="font-mono-num font-bold text-[#174D3C] dark:text-emerald-300">
                      {formatMoney(s.amount, curr)} ({s.pct.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${s.pct}%`, backgroundColor: s.color }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Expense Donut Chart + Breakdown */}
        <section className="rounded-3xl bg-white dark:bg-slate-900 border-2 border-[#174D3C] p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-[#E81760] dark:text-rose-300">
              {t.expenseBreakdown}
            </h3>
            <span className="text-xs font-bold text-slate-500">{t.donutChart}</span>
          </div>

          <SvgPieOrDonut
            slices={expenseSlices}
            donut={true}
            centerLabel={t.totalExpense}
            centerValue={formatMoney(totalExpense, curr)}
          />

          <div className="space-y-2 pt-2">
            {expenseSlices.length === 0 ? (
              <p className="text-xs text-center text-slate-500">{t.noData}</p>
            ) : (
              expenseSlices.map((s) => (
                <div key={s.label} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-100">
                      <span
                        className="w-3 h-3 rounded-sm shrink-0"
                        style={{ backgroundColor: s.color }}
                      />
                      {s.label}
                    </span>
                    <span className="font-mono-num font-bold text-[#9F1239] dark:text-rose-300">
                      {formatMoney(s.amount, curr)} ({s.pct.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${s.pct}%`, backgroundColor: s.color }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      {/* Monthly Income & Expense Graph */}
      <section className="rounded-3xl bg-white dark:bg-slate-900 border-2 border-[#174D3C] p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="text-sm font-extrabold text-[#174D3C] dark:text-[#80F5F3]">
            {t.monthlyGraph} ({selectedYear})
          </h3>
          <div className="flex items-center gap-3 text-xs font-bold">
            <span className="flex items-center gap-1 text-[#174D3C] dark:text-emerald-300">
              <span className="w-2.5 h-2.5 rounded-xs bg-[#174D3C] dark:bg-emerald-400" />
              {lang === 'bn' ? 'আয়' : 'Income'}
            </span>
            <span className="flex items-center gap-1 text-[#E81760]">
              <span className="w-2.5 h-2.5 rounded-xs bg-[#E81760]" />
              {lang === 'bn' ? 'ব্যয়' : 'Expense'}
            </span>
          </div>
        </div>

        <div className="overflow-x-auto pb-2">
          <div className="min-w-[520px] grid grid-cols-12 gap-2 items-end h-44 pt-4 border-b border-slate-200 dark:border-slate-700">
            {monthlyData.map((d) => {
              const incH = Math.round((d.income / maxMonthlyVal) * 100);
              const expH = Math.round((d.expense / maxMonthlyVal) * 100);
              return (
                <div key={d.month} className="flex flex-col items-center h-full justify-end">
                  <div className="flex items-end gap-1 h-32 w-full justify-center">
                    <div
                      title={`${getMonthName(d.month, lang)} Income: ${formatMoney(d.income, curr)}`}
                      style={{ height: `${Math.max(incH, d.income > 0 ? 6 : 2)}%` }}
                      className="w-2.5 rounded-t-md bg-[#174D3C] dark:bg-emerald-400 transition-all"
                    />
                    <div
                      title={`${getMonthName(d.month, lang)} Expense: ${formatMoney(d.expense, curr)}`}
                      style={{ height: `${Math.max(expH, d.expense > 0 ? 6 : 2)}%` }}
                      className="w-2.5 rounded-t-md bg-[#E81760] transition-all"
                    />
                  </div>
                  <span className="mt-1.5 text-[10px] font-bold text-slate-600 dark:text-slate-300">
                    {getMonthName(d.month, 'en').slice(0, 3)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Savings Report & Payment Method Balance Report */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <section className="rounded-3xl bg-white dark:bg-slate-900 border-2 border-[#174D3C] p-4 shadow-sm space-y-3">
          <h3 className="text-sm font-extrabold text-[#174D3C] dark:text-[#80F5F3]">
            {t.savingsReport}
          </h3>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-2xl bg-[#C9E9CE] dark:bg-emerald-950/70 p-2.5">
              <p className="text-[11px] font-bold text-[#174D3C] dark:text-emerald-200">
                {lang === 'bn' ? 'মোট জমা' : 'Deposited'}
              </p>
              <p className="text-xs sm:text-sm font-extrabold font-mono-num text-[#174D3C] dark:text-emerald-100 mt-1">
                {formatMoney(savingsReport.deposited, curr)}
              </p>
            </div>
            <div className="rounded-2xl bg-[#F7C8CC] dark:bg-rose-950/70 p-2.5">
              <p className="text-[11px] font-bold text-[#9F1239] dark:text-rose-200">
                {lang === 'bn' ? 'উত্তোলন' : 'Withdrawn'}
              </p>
              <p className="text-xs sm:text-sm font-extrabold font-mono-num text-[#9F1239] dark:text-rose-100 mt-1">
                {formatMoney(savingsReport.withdrawn, curr)}
              </p>
            </div>
            <div className="rounded-2xl bg-[#80F5F3]/60 dark:bg-teal-950/70 p-2.5">
              <p className="text-[11px] font-bold text-[#174D3C] dark:text-teal-200">
                {lang === 'bn' ? 'অবশিষ্ট' : 'Remaining'}
              </p>
              <p className="text-xs sm:text-sm font-extrabold font-mono-num text-[#174D3C] dark:text-teal-100 mt-1">
                {formatMoney(savingsReport.balance, curr)}
              </p>
            </div>
          </div>
          {savingsReport.target > 0 && (
            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span>{lang === 'bn' ? 'লক্ষ্য অগ্রগতি' : 'Goal Progress'}</span>
                <span>
                  {Math.min(100, Math.round((savingsReport.balance / savingsReport.target) * 100))}%
                </span>
              </div>
              <div className="h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-[#174D3C] rounded-full"
                  style={{
                    width: `${Math.min(100, (savingsReport.balance / savingsReport.target) * 100)}%`,
                  }}
                />
              </div>
            </div>
          )}
        </section>

        <section className="rounded-3xl bg-white dark:bg-slate-900 border-2 border-[#174D3C] p-4 shadow-sm space-y-2.5">
          <h3 className="text-sm font-extrabold text-[#174D3C] dark:text-[#80F5F3]">
            {lang === 'bn' ? 'পেমেন্ট মাধ্যম অনুযায়ী ব্যালেন্স' : 'Balance by Payment Method'}
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {PAYMENT_METHODS.map((pm) => (
              <div
                key={pm}
                className="rounded-xl bg-[#F0F3FF] dark:bg-slate-800 px-3 py-2 flex items-center justify-between text-xs"
              >
                <span className="font-bold truncate">{getPaymentLabel(pm, lang)}</span>
                <span className="font-mono-num font-extrabold text-[#174D3C] dark:text-[#80F5F3] ml-1">
                  {formatMoney(metrics.paymentBalances[pm], curr)}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
