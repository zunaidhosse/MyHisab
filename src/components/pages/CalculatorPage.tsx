import React, { useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, Delete, Trash2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const CalculatorPage: React.FC = () => {
  const { settings, navigate, setEditingTransaction, setPrefilledEntryAmount, setPrefilledEntryType } =
    useApp();
  const lang = settings.language;

  const [display, setDisplay] = useState('0');
  const [prevValue, setPrevValue] = useState<number | null>(null);
  const [operator, setOperator] = useState<string | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);
  const [history, setHistory] = useState<string[]>([]);

  const inputDigit = (digit: string) => {
    if (waitingForOperand) {
      setDisplay(digit);
      setWaitingForOperand(false);
    } else {
      setDisplay(display === '0' ? digit : display + digit);
    }
  };

  const inputDecimal = () => {
    if (waitingForOperand) {
      setDisplay('0.');
      setWaitingForOperand(false);
    } else if (!display.includes('.')) {
      setDisplay(display + '.');
    }
  };

  const clearAll = () => {
    setDisplay('0');
    setPrevValue(null);
    setOperator(null);
    setWaitingForOperand(false);
  };

  const backspace = () => {
    if (waitingForOperand) return;
    setDisplay(display.length > 1 ? display.slice(0, -1) : '0');
  };

  const toggleSign = () => {
    const val = parseFloat(display);
    if (!isNaN(val) && val !== 0) {
      setDisplay(String(-val));
    }
  };

  const handlePercent = () => {
    const current = parseFloat(display);
    if (isNaN(current)) return;
    if (prevValue !== null && operator) {
      const pctVal = (prevValue * current) / 100;
      setDisplay(String(pctVal));
    } else {
      setDisplay(String(current / 100));
    }
  };

  const compute = (a: number, b: number, op: string): number => {
    switch (op) {
      case '+':
        return a + b;
      case '-':
        return a - b;
      case '×':
        return a * b;
      case '÷':
        return b === 0 ? NaN : a / b;
      default:
        return b;
    }
  };

  const performOperation = (nextOp: string) => {
    const inputValue = parseFloat(display);
    if (prevValue === null) {
      setPrevValue(inputValue);
    } else if (operator && !waitingForOperand) {
      const result = compute(prevValue, inputValue, operator);
      const formatted = Number.isNaN(result)
        ? 'Error'
        : String(Math.round(result * 1e8) / 1e8);
      setHistory((h) => [`${prevValue} ${operator} ${inputValue} = ${formatted}`, ...h].slice(0, 8));
      setDisplay(formatted);
      setPrevValue(Number.isNaN(result) ? null : result);
    }
    setWaitingForOperand(true);
    setOperator(nextOp);
  };

  const handleEquals = () => {
    if (prevValue === null || !operator) return;
    const inputValue = parseFloat(display);
    const result = compute(prevValue, inputValue, operator);
    const formatted = Number.isNaN(result)
      ? 'Error'
      : String(Math.round(result * 1e8) / 1e8);
    setHistory((h) => [`${prevValue} ${operator} ${inputValue} = ${formatted}`, ...h].slice(0, 8));
    setDisplay(formatted);
    setPrevValue(null);
    setOperator(null);
    setWaitingForOperand(true);
  };

  const useInEntry = (type: 'income' | 'expense') => {
    const val = parseFloat(display);
    if (isNaN(val) || val <= 0) return;
    setEditingTransaction(null);
    setPrefilledEntryType(type);
    setPrefilledEntryAmount(val);
    navigate('entry');
  };

  const btnBase =
    'h-14 rounded-2xl font-extrabold text-lg flex items-center justify-center active:scale-95 transition border border-[#174D3C]/20 shadow-xs';

  return (
    <div className="max-w-md mx-auto space-y-4">
      <div className="rounded-3xl bg-white dark:bg-slate-900 border-2 border-[#174D3C] p-4 shadow-lg space-y-4">
        {/* Display */}
        <div className="rounded-2xl bg-gradient-to-br from-[#174D3C] to-[#0F3328] text-white p-4 text-right">
          <p className="text-xs font-mono-num text-[#80F5F3] h-4">
            {prevValue !== null && operator ? `${prevValue} ${operator}` : ''}
          </p>
          <p className="text-3xl sm:text-4xl font-extrabold font-mono-num mt-1 truncate">
            {display}
          </p>
        </div>

        {/* Use Result in Entry */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => useInEntry('income')}
            className="py-2 rounded-xl bg-[#C9E9CE] text-[#174D3C] text-xs font-extrabold flex items-center justify-center gap-1"
          >
            <ArrowDownLeft className="w-3.5 h-3.5" />
            <span>{lang === 'bn' ? 'আয় হিসেবে লিখুন' : 'Use as Income'}</span>
          </button>
          <button
            type="button"
            onClick={() => useInEntry('expense')}
            className="py-2 rounded-xl bg-[#F7C8CC] text-[#9F1239] text-xs font-extrabold flex items-center justify-center gap-1"
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>{lang === 'bn' ? 'ব্যয় হিসেবে লিখুন' : 'Use as Expense'}</span>
          </button>
        </div>

        {/* Keypad */}
        <div className="grid grid-cols-4 gap-2.5">
          <button
            type="button"
            onClick={clearAll}
            className={`${btnBase} bg-[#F7C8CC] text-[#9F1239]`}
          >
            AC
          </button>
          <button
            type="button"
            onClick={backspace}
            aria-label="Backspace"
            className={`${btnBase} bg-[#D2E6FA] text-[#174D3C]`}
          >
            <Delete className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={handlePercent}
            className={`${btnBase} bg-[#D2E6FA] text-[#174D3C]`}
          >
            %
          </button>
          <button
            type="button"
            onClick={() => performOperation('÷')}
            className={`${btnBase} bg-[#80F5F3] text-[#174D3C]`}
          >
            ÷
          </button>

          {['7', '8', '9'].map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => inputDigit(d)}
              className={`${btnBase} bg-[#F0F3FF] dark:bg-slate-800 text-slate-900 dark:text-white`}
            >
              {d}
            </button>
          ))}
          <button
            type="button"
            onClick={() => performOperation('×')}
            className={`${btnBase} bg-[#80F5F3] text-[#174D3C]`}
          >
            ×
          </button>

          {['4', '5', '6'].map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => inputDigit(d)}
              className={`${btnBase} bg-[#F0F3FF] dark:bg-slate-800 text-slate-900 dark:text-white`}
            >
              {d}
            </button>
          ))}
          <button
            type="button"
            onClick={() => performOperation('-')}
            className={`${btnBase} bg-[#80F5F3] text-[#174D3C]`}
          >
            -
          </button>

          {['1', '2', '3'].map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => inputDigit(d)}
              className={`${btnBase} bg-[#F0F3FF] dark:bg-slate-800 text-slate-900 dark:text-white`}
            >
              {d}
            </button>
          ))}
          <button
            type="button"
            onClick={() => performOperation('+')}
            className={`${btnBase} bg-[#80F5F3] text-[#174D3C]`}
          >
            +
          </button>

          <button
            type="button"
            onClick={toggleSign}
            className={`${btnBase} bg-[#F0F3FF] dark:bg-slate-800 text-slate-900 dark:text-white`}
          >
            +/-
          </button>
          <button
            type="button"
            onClick={() => inputDigit('0')}
            className={`${btnBase} bg-[#F0F3FF] dark:bg-slate-800 text-slate-900 dark:text-white`}
          >
            0
          </button>
          <button
            type="button"
            onClick={inputDecimal}
            className={`${btnBase} bg-[#F0F3FF] dark:bg-slate-800 text-slate-900 dark:text-white`}
          >
            .
          </button>
          <button
            type="button"
            onClick={handleEquals}
            className={`${btnBase} bg-[#E81760] text-white`}
          >
            =
          </button>
        </div>
      </div>

      {/* History Tape */}
      {history.length > 0 && (
        <div className="rounded-3xl bg-white dark:bg-slate-900 border-2 border-[#174D3C] p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-extrabold text-[#174D3C] dark:text-[#80F5F3]">
              {lang === 'bn' ? 'হিসাবের তালিকা' : 'Calculation History'}
            </h3>
            <button
              type="button"
              onClick={() => setHistory([])}
              className="text-xs font-bold text-[#E81760] flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? 'মুছুন' : 'Clear'}</span>
            </button>
          </div>
          <ul className="space-y-1 text-xs font-mono-num text-slate-700 dark:text-slate-300">
            {history.map((item, idx) => (
              <li key={idx} className="py-1 border-b border-slate-100 dark:border-slate-800 last:border-0">
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
