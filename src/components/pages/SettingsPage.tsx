import React, { useRef, useState } from 'react';
import {
  Bell,
  Check,
  Clock,
  CloudUpload,
  Crown,
  DatabaseBackup,
  Download,
  ExternalLink,
  FileJson,
  FileText,
  Globe,
  HardDriveUpload,
  HelpCircle,
  Info,
  KeyRound,
  Lock,
  Moon,
  Share2,
  ShieldCheck,
  Smartphone,
  Star,
  Sun,
  UserCheck,
  Wallet,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import {
  BackupPayload,
  CURRENCIES,
  CurrencyCode,
  DateFormatOption,
  PAYMENT_METHODS,
  PaymentMethod,
  TimeFormatOption,
} from '../../types';
import { getTodayDateString } from '../../utils/formatters';
import { getPaymentLabel } from '../../utils/i18n';

export const SettingsPage: React.FC = () => {
  const {
    settings,
    updateSettings,
    triggerManualBackup,
    importBackupPayload,
    restoreFromLocalSnapshot,
    requestConfirm,
    showToast,
    lockAppNow,
  } = useApp();

  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const lang = settings.language;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState(settings.pinCode || '');
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [infoModal, setInfoModal] = useState<
    'info' | 'privacy' | 'terms' | 'about' | 'rate' | 'ios' | null
  >(null);
  const [rating, setRating] = useState(5);
  const [rateComment, setRateComment] = useState('');
  const [editingProfileName, setEditingProfileName] = useState(false);
  const [profileNameInput, setProfileNameInput] = useState(settings.userName);

  const downloadBackupJson = async (label: string) => {
    const payload = await triggerManualBackup();
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `myhisab-backup-${getTodayDateString()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(label, 'success');
  };

  const handleGoogleDriveOrShareBackup = async () => {
    const payload = await triggerManualBackup();
    const jsonStr = JSON.stringify(payload, null, 2);
    const fileName = `myhisab-backup-${getTodayDateString()}.json`;
    const file = new File([jsonStr], fileName, { type: 'application/json' });

    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          title: 'MyHisab Backup',
          text: 'MyHisab Google Drive / Cloud Backup',
          files: [file],
        });
        showToast(
          lang === 'bn' ? 'ব্যাকআপ ফাইল শেয়ার সম্পন্ন!' : 'Backup file shared!',
          'success'
        );
        return;
      } catch {
        // user cancelled or unsupported -> fall back to download
      }
    }

    await downloadBackupJson(
      lang === 'bn'
        ? 'ব্যাকআপ ডাউনলোড হয়েছে! এখন Google Drive অ্যাপে আপলোড করুন।'
        : 'Backup downloaded! Upload this JSON file to Google Drive.'
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as BackupPayload;
        if (!parsed || parsed.appName !== 'MyHisab' || !Array.isArray(parsed.transactions)) {
          showToast(
            lang === 'bn' ? 'সঠিক MyHisab ব্যাকআপ ফাইল নয়!' : 'Invalid MyHisab backup file!',
            'error'
          );
          return;
        }
        requestConfirm(
          lang === 'bn' ? 'ডাটা পুনরুদ্ধার নিশ্চিত করুন' : 'Confirm Data Restore',
          lang === 'bn'
            ? 'JSON ব্যাকআপ রিস্টোর করলে বর্তমান ডাটার সাথে প্রতিস্থাপিত হবে। আপনি কি নিশ্চিত?'
            : 'Restoring this JSON backup will replace your current data. Continue?',
          () => {
            importBackupPayload(parsed);
          },
          lang === 'bn' ? 'রিস্টোর করুন' : 'Restore'
        );
      } catch {
        showToast(
          lang === 'bn' ? 'ফাইল পড়তে সমস্যা হয়েছে!' : 'Failed to parse JSON file!',
          'error'
        );
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleRestoreSnapshot = () => {
    requestConfirm(
      lang === 'bn' ? 'পূর্বের ব্যাকআপ পুনরুদ্ধার' : 'Restore Previous Snapshot',
      lang === 'bn'
        ? 'সর্বশেষ সংরক্ষিত ব্যাকআপ থেকে হিসাব পুনরুদ্ধার করতে চান?'
        : 'Restore data from your latest saved snapshot?',
      async () => {
        const ok = await restoreFromLocalSnapshot();
        if (!ok) {
          showToast(
            lang === 'bn'
              ? 'কোনো সংরক্ষিত স্ন্যাপশট পাওয়া যায়নি। প্রথমে ব্যাকআপ নিন।'
              : 'No saved snapshot found. Create a backup first.',
            'info'
          );
        }
      },
      lang === 'bn' ? 'পুনরুদ্ধার' : 'Restore'
    );
  };

  const handleSavePin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{4}$/.test(pinInput)) {
      showToast(
        lang === 'bn' ? 'ঠিক ৪ সংখ্যার নম্বর পিন দিন।' : 'Enter an exact 4-digit numeric PIN.',
        'error'
      );
      return;
    }
    await updateSettings({ pinCode: pinInput, appLockEnabled: true });
    setShowPinModal(false);
    showToast(lang === 'bn' ? 'পিন লক চালু হয়েছে!' : 'PIN Lock enabled!', 'success');
  };

  const handleShareApp = async () => {
    const shareUrl = window.location.origin;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'MyHisab',
          text:
            lang === 'bn'
              ? 'MyHisab – দৈনিক আয়-ব্যয়, সঞ্চয়, লোন ও বাকি হিসাবের সেরা অ্যাপ!'
              : 'MyHisab – Daily Income, Expense, Savings, Loan & Due Manager!',
          url: shareUrl,
        });
        return;
      } catch {
        // fallback to clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      showToast(
        lang === 'bn' ? 'অ্যাপের লিংক কপি হয়েছে!' : 'App link copied to clipboard!',
        'success'
      );
    } catch {
      showToast(shareUrl, 'info');
    }
  };

  const sectionTitleClass =
    'text-xs font-extrabold text-[#174D3C] dark:text-[#80F5F3] uppercase tracking-wide px-1 mb-2';
  const cardClass =
    'rounded-3xl bg-white dark:bg-slate-900 border-2 border-[#174D3C] divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden shadow-sm';
  const rowClass = 'w-full px-4 py-3.5 flex items-center justify-between gap-3 text-left';

  return (
    <div className="space-y-5 pb-4">
      {/* 1. App Profile Card */}
      <section className="rounded-3xl bg-gradient-to-br from-[#E81760] to-[#174D3C] text-white p-5 border-2 border-[#174D3C] shadow-md space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-14 h-14 rounded-2xl bg-white text-[#E81760] border-2 border-[#80F5F3] flex items-center justify-center shadow shrink-0">
              <Wallet className="w-7 h-7" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-extrabold truncate">MyHisab</h2>
              <p className="text-xs text-[#80F5F3] font-semibold truncate">
                {settings.guestMode
                  ? lang === 'bn'
                    ? 'গেস্ট মোড চালু'
                    : 'Guest Mode Active'
                  : settings.userName}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowPremiumModal(true)}
            className="px-3 py-2 rounded-xl bg-[#80F5F3] text-[#174D3C] font-extrabold text-xs flex items-center gap-1.5 shadow hover:brightness-95 shrink-0"
          >
            <Crown className="w-4 h-4 text-[#E81760]" />
            <span>
              {settings.isPremium
                ? lang === 'bn'
                  ? 'প্রিমিয়াম সক্রিয়'
                  : 'Pro Active'
                : lang === 'bn'
                ? 'প্রিমিয়াম'
                : 'Premium'}
            </span>
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/20 text-xs">
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-[#80F5F3]" />
            {editingProfileName ? (
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={profileNameInput}
                  onChange={(e) => setProfileNameInput(e.target.value)}
                  className="px-2 py-1 rounded-lg bg-white text-slate-900 text-xs font-bold w-36"
                />
                <button
                  type="button"
                  onClick={async () => {
                    await updateSettings({
                      userName: profileNameInput.trim() || 'MyHisab User',
                      guestMode: false,
                    });
                    setEditingProfileName(false);
                  }}
                  className="px-2 py-1 rounded-lg bg-[#80F5F3] text-[#174D3C] font-bold"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setProfileNameInput(settings.userName);
                  setEditingProfileName(true);
                }}
                className="underline font-semibold"
              >
                {lang === 'bn' ? 'প্রোফাইল নাম পরিবর্তন' : 'Edit Profile Name'}
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => updateSettings({ guestMode: !settings.guestMode })}
            className="px-2.5 py-1 rounded-lg bg-white/15 hover:bg-white/25 font-bold"
          >
            {settings.guestMode
              ? lang === 'bn'
                ? 'গেস্ট মোড: চালু'
                : 'Guest Mode: ON'
              : lang === 'bn'
              ? 'গেস্ট মোড: বন্ধ'
              : 'Guest Mode: OFF'}
          </button>
        </div>
      </section>

      {/* PWA Install Banner in Settings */}
      {!isInstalled && (isInstallable || isIOS) && (
        <button
          type="button"
          onClick={() => (isInstallable ? install() : setInfoModal('ios'))}
          className="w-full py-3.5 px-4 rounded-2xl bg-[#80F5F3] text-[#174D3C] border-2 border-[#174D3C] font-extrabold text-sm flex items-center justify-center gap-2 shadow-sm"
        >
          <Download className="w-5 h-5" />
          <span>
            {lang === 'bn'
              ? 'ফোনে MyHisab অ্যাপ ইনস্টল করুন (PWA)'
              : 'Install MyHisab App on Home Screen'}
          </span>
        </button>
      )}

      {/* 2. App Settings */}
      <div>
        <h3 className={sectionTitleClass}>
          {lang === 'bn' ? 'অ্যাপ সেটিংস' : 'App Settings'}
        </h3>
        <div className={cardClass}>
          {/* Language */}
          <div className={rowClass}>
            <div className="flex items-center gap-3">
              <Globe className="w-5 h-5 text-[#E81760]" />
              <span className="text-sm font-bold">
                {lang === 'bn' ? 'ভাষা (Language)' : 'Language'}
              </span>
            </div>
            <div className="flex rounded-xl bg-[#F0F3FF] dark:bg-slate-800 p-1">
              <button
                type="button"
                onClick={() => updateSettings({ language: 'bn' })}
                className={`px-3 py-1 rounded-lg text-xs font-extrabold ${
                  lang === 'bn' ? 'bg-[#E81760] text-white' : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                বাংলা
              </button>
              <button
                type="button"
                onClick={() => updateSettings({ language: 'en' })}
                className={`px-3 py-1 rounded-lg text-xs font-extrabold ${
                  lang === 'en' ? 'bg-[#E81760] text-white' : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                English
              </button>
            </div>
          </div>

          {/* Currency */}
          <div className={rowClass}>
            <div className="flex items-center gap-3">
              <span className="w-5 h-5 rounded-md bg-[#C9E9CE] text-[#174D3C] font-extrabold text-xs flex items-center justify-center">
                ৳
              </span>
              <span className="text-sm font-bold">
                {lang === 'bn' ? 'মুদ্রা পরিবর্তন' : 'Currency'}
              </span>
            </div>
            <select
              value={settings.currency}
              onChange={(e) => updateSettings({ currency: e.target.value as CurrencyCode })}
              className="px-2.5 py-1.5 rounded-xl bg-[#F0F3FF] dark:bg-slate-800 border border-[#174D3C]/25 text-xs font-bold"
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {lang === 'bn' ? c.labelBn : c.labelEn}
                </option>
              ))}
            </select>
          </div>

          {/* App Lock */}
          <div className={rowClass}>
            <div className="flex items-center gap-3">
              <Lock className="w-5 h-5 text-[#174D3C] dark:text-[#80F5F3]" />
              <div>
                <p className="text-sm font-bold">{lang === 'bn' ? 'অ্যাপ লক' : 'App Lock'}</p>
                <p className="text-[11px] text-slate-500">
                  {settings.appLockEnabled && settings.pinCode
                    ? lang === 'bn'
                      ? '৪-সংখ্যার পিন সক্রিয়'
                      : '4-digit PIN active'
                    : lang === 'bn'
                    ? 'বন্ধ আছে'
                    : 'Disabled'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {settings.appLockEnabled && settings.pinCode && (
                <button
                  type="button"
                  onClick={lockAppNow}
                  className="px-2.5 py-1 rounded-lg bg-[#D2E6FA] text-[#174D3C] text-xs font-bold"
                >
                  {lang === 'bn' ? 'লক করুন' : 'Lock'}
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  if (settings.appLockEnabled) {
                    updateSettings({ appLockEnabled: false });
                  } else {
                    setPinInput(settings.pinCode || '');
                    setShowPinModal(true);
                  }
                }}
                className={`w-12 h-7 rounded-full p-1 transition-colors ${
                  settings.appLockEnabled ? 'bg-[#174D3C]' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    settings.appLockEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* PIN / Password Setup */}
          <button
            type="button"
            onClick={() => {
              setPinInput(settings.pinCode || '');
              setShowPinModal(true);
            }}
            className={`${rowClass} hover:bg-slate-50 dark:hover:bg-slate-800/60`}
          >
            <div className="flex items-center gap-3">
              <KeyRound className="w-5 h-5 text-[#E81760]" />
              <span className="text-sm font-bold">
                {lang === 'bn' ? 'পিন বা পাসওয়ার্ড সেট/পরিবর্তন' : 'PIN / Password Protection'}
              </span>
            </div>
            <span className="text-xs font-extrabold text-[#E81760]">
              {settings.pinCode ? (lang === 'bn' ? 'পরিবর্তন' : 'Change') : lang === 'bn' ? 'সেট করুন' : 'Set PIN'}
            </span>
          </button>
        </div>
      </div>

      {/* 3. Data Backup */}
      <div>
        <h3 className={sectionTitleClass}>{lang === 'bn' ? 'ডাটা ব্যাকআপ' : 'Data Backup'}</h3>
        <div className={cardClass}>
          <button
            type="button"
            onClick={() =>
              downloadBackupJson(
                lang === 'bn' ? 'JSON ব্যাকআপ ডাউনলোড সম্পন্ন!' : 'JSON Backup downloaded!'
              )
            }
            className={`${rowClass} hover:bg-slate-50 dark:hover:bg-slate-800/60`}
          >
            <div className="flex items-center gap-3">
              <DatabaseBackup className="w-5 h-5 text-[#174D3C] dark:text-[#80F5F3]" />
              <div>
                <p className="text-sm font-bold">
                  {lang === 'bn' ? 'ম্যানুয়াল ব্যাকআপ ও ডাউনলোড' : 'Manual Backup & Download'}
                </p>
                {settings.lastBackupAt && (
                  <p className="text-[11px] text-slate-500">
                    {lang === 'bn' ? 'সর্বশেষ:' : 'Last:'}{' '}
                    {new Date(settings.lastBackupAt).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
            <Download className="w-4 h-4 text-[#174D3C] dark:text-[#80F5F3]" />
          </button>

          <button
            type="button"
            onClick={async () => {
              await triggerManualBackup();
              showToast(
                lang === 'bn'
                  ? 'অনলাইন/লোকাল স্ন্যাপশট সংরক্ষিত হয়েছে!'
                  : 'Backup snapshot saved!',
                'success'
              );
            }}
            className={`${rowClass} hover:bg-slate-50 dark:hover:bg-slate-800/60`}
          >
            <div className="flex items-center gap-3">
              <CloudUpload className="w-5 h-5 text-[#E81760]" />
              <span className="text-sm font-bold">
                {lang === 'bn' ? 'অনলাইন / অটো স্ন্যাপশট ব্যাকআপ' : 'Online / Snapshot Backup'}
              </span>
            </div>
            <span className="text-xs font-bold text-[#174D3C] dark:text-[#80F5F3]">
              {lang === 'bn' ? 'ব্যাকআপ নিন' : 'Backup Now'}
            </span>
          </button>

          <button
            type="button"
            onClick={handleGoogleDriveOrShareBackup}
            className={`${rowClass} hover:bg-slate-50 dark:hover:bg-slate-800/60`}
          >
            <div className="flex items-center gap-3">
              <HardDriveUpload className="w-5 h-5 text-sky-600" />
              <span className="text-sm font-bold">
                {lang === 'bn' ? 'Google Drive ব্যাকআপ' : 'Google Drive Backup'}
              </span>
            </div>
            <span className="text-xs font-bold text-sky-600">
              {lang === 'bn' ? 'শেয়ার / সেভ' : 'Export'}
            </span>
          </button>
        </div>
      </div>

      {/* 4. Data Restore */}
      <div>
        <h3 className={sectionTitleClass}>{lang === 'bn' ? 'ডাটা পুনরুদ্ধার' : 'Data Restore'}</h3>
        <div className={cardClass}>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className={`${rowClass} hover:bg-slate-50 dark:hover:bg-slate-800/60`}
          >
            <div className="flex items-center gap-3">
              <FileJson className="w-5 h-5 text-[#E81760]" />
              <span className="text-sm font-bold">
                {lang === 'bn' ? 'JSON ব্যাকআপ ইম্পোর্ট করুন' : 'Import JSON Backup'}
              </span>
            </div>
            <span className="text-xs font-extrabold text-[#E81760]">
              {lang === 'bn' ? 'ফাইল নির্বাচন' : 'Select File'}
            </span>
          </button>

          <button
            type="button"
            onClick={handleRestoreSnapshot}
            className={`${rowClass} hover:bg-slate-50 dark:hover:bg-slate-800/60`}
          >
            <div className="flex items-center gap-3">
              <DatabaseBackup className="w-5 h-5 text-[#174D3C] dark:text-[#80F5F3]" />
              <span className="text-sm font-bold">
                {lang === 'bn' ? 'আগের হিসাব পুনরুদ্ধার (স্ন্যাপশট)' : 'Restore Previous Snapshot'}
              </span>
            </div>
            <span className="text-xs font-bold text-[#174D3C] dark:text-[#80F5F3]">
              {lang === 'bn' ? 'রিস্টোর' : 'Restore'}
            </span>
          </button>
        </div>
      </div>

      {/* 5. Other Settings */}
      <div>
        <h3 className={sectionTitleClass}>{lang === 'bn' ? 'অন্যান্য সেটিংস' : 'Other Settings'}</h3>
        <div className={cardClass}>
          {/* Dark Mode */}
          <div className={rowClass}>
            <div className="flex items-center gap-3">
              {settings.darkMode ? (
                <Moon className="w-5 h-5 text-[#80F5F3]" />
              ) : (
                <Sun className="w-5 h-5 text-amber-500" />
              )}
              <span className="text-sm font-bold">
                {lang === 'bn' ? 'ডার্ক মোড / লাইট মোড' : 'Dark Mode / Light Mode'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => updateSettings({ darkMode: !settings.darkMode })}
              className={`w-12 h-7 rounded-full p-1 transition-colors ${
                settings.darkMode ? 'bg-[#E81760]' : 'bg-slate-300'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  settings.darkMode ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Notifications */}
          <div className={rowClass}>
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-[#E81760]" />
              <span className="text-sm font-bold">
                {lang === 'bn' ? 'নোটিফিকেশন সেটিংস' : 'Notification Settings'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => updateSettings({ notificationsEnabled: !settings.notificationsEnabled })}
              className={`w-12 h-7 rounded-full p-1 transition-colors ${
                settings.notificationsEnabled ? 'bg-[#174D3C]' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  settings.notificationsEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Default Payment Method */}
          <div className={rowClass}>
            <div className="flex items-center gap-3">
              <Smartphone className="w-5 h-5 text-[#174D3C] dark:text-[#80F5F3]" />
              <span className="text-sm font-bold">
                {lang === 'bn' ? 'ডিফল্ট পেমেন্ট মাধ্যম' : 'Default Payment Method'}
              </span>
            </div>
            <select
              value={settings.defaultPaymentMethod}
              onChange={(e) =>
                updateSettings({ defaultPaymentMethod: e.target.value as PaymentMethod })
              }
              className="px-2.5 py-1.5 rounded-xl bg-[#F0F3FF] dark:bg-slate-800 border border-[#174D3C]/25 text-xs font-bold"
            >
              {PAYMENT_METHODS.map((pm) => (
                <option key={pm} value={pm}>
                  {getPaymentLabel(pm, lang)}
                </option>
              ))}
            </select>
          </div>

          {/* Date Format */}
          <div className={rowClass}>
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-sky-600" />
              <span className="text-sm font-bold">
                {lang === 'bn' ? 'তারিখের ফরম্যাট' : 'Date Format'}
              </span>
            </div>
            <select
              value={settings.dateFormat}
              onChange={(e) =>
                updateSettings({ dateFormat: e.target.value as DateFormatOption })
              }
              className="px-2.5 py-1.5 rounded-xl bg-[#F0F3FF] dark:bg-slate-800 border border-[#174D3C]/25 text-xs font-bold"
            >
              <option value="DD/MM/YYYY">DD/MM/YYYY</option>
              <option value="MM/DD/YYYY">MM/DD/YYYY</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD</option>
            </select>
          </div>

          {/* Time Format */}
          <div className={rowClass}>
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-emerald-600" />
              <span className="text-sm font-bold">
                {lang === 'bn' ? 'সময়ের ফরম্যাট' : 'Time Format'}
              </span>
            </div>
            <div className="flex rounded-xl bg-[#F0F3FF] dark:bg-slate-800 p-1">
              {(['12h', '24h'] as TimeFormatOption[]).map((tf) => (
                <button
                  key={tf}
                  type="button"
                  onClick={() => updateSettings({ timeFormat: tf })}
                  className={`px-3 py-1 rounded-lg text-xs font-extrabold ${
                    settings.timeFormat === tf
                      ? 'bg-[#174D3C] text-white'
                      : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {tf.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* App Info, Privacy, Terms, About */}
          <button
            type="button"
            onClick={() => setInfoModal('info')}
            className={`${rowClass} hover:bg-slate-50 dark:hover:bg-slate-800/60`}
          >
            <div className="flex items-center gap-3">
              <Info className="w-5 h-5 text-[#174D3C] dark:text-[#80F5F3]" />
              <span className="text-sm font-bold">
                {lang === 'bn' ? 'অ্যাপ তথ্য (App Info)' : 'App Information'}
              </span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setInfoModal('privacy')}
            className={`${rowClass} hover:bg-slate-50 dark:hover:bg-slate-800/60`}
          >
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <span className="text-sm font-bold">
                {lang === 'bn' ? 'গোপনীয়তা নীতি (Privacy Policy)' : 'Privacy Policy'}
              </span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setInfoModal('terms')}
            className={`${rowClass} hover:bg-slate-50 dark:hover:bg-slate-800/60`}
          >
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-slate-600 dark:text-slate-300" />
              <span className="text-sm font-bold">
                {lang === 'bn' ? 'শর্তাবলী (Terms & Conditions)' : 'Terms & Conditions'}
              </span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setInfoModal('about')}
            className={`${rowClass} hover:bg-slate-50 dark:hover:bg-slate-800/60`}
          >
            <div className="flex items-center gap-3">
              <Wallet className="w-5 h-5 text-[#E81760]" />
              <span className="text-sm font-bold">
                {lang === 'bn' ? 'অ্যাপ সম্পর্কে (About App)' : 'About App'}
              </span>
            </div>
          </button>

          <button
            type="button"
            onClick={handleShareApp}
            className={`${rowClass} hover:bg-slate-50 dark:hover:bg-slate-800/60`}
          >
            <div className="flex items-center gap-3">
              <Share2 className="w-5 h-5 text-sky-600" />
              <span className="text-sm font-bold">
                {lang === 'bn' ? 'অ্যাপ শেয়ার করুন' : 'Share App'}
              </span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setInfoModal('rate')}
            className={`${rowClass} hover:bg-slate-50 dark:hover:bg-slate-800/60`}
          >
            <div className="flex items-center gap-3">
              <Star className="w-5 h-5 text-amber-500" />
              <span className="text-sm font-bold">
                {lang === 'bn' ? 'অ্যাপ রেটিং দিন' : 'Rate App'}
              </span>
            </div>
          </button>

          {/* Exact Help Line Link */}
          <a
            href="https://zunaidhosse.github.io/My-contact/"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full px-4 py-4 flex items-center justify-between gap-3 bg-[#80F5F3]/35 dark:bg-teal-950/60 hover:bg-[#80F5F3]/55 transition"
          >
            <div className="flex items-center gap-3">
              <HelpCircle className="w-5 h-5 text-[#E81760]" />
              <div>
                <p className="text-sm font-extrabold text-[#174D3C] dark:text-[#80F5F3]">
                  {lang === 'bn' ? 'হেল্প লাইন (Help Line)' : 'Help Line'}
                </p>
                <p className="text-[11px] text-slate-600 dark:text-slate-300">
                  {lang === 'bn' ? 'সরাসরি যোগাযোগ ও সহায়তা' : 'Direct contact & support'}
                </p>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-[#E81760]" />
          </a>
        </div>
      </div>

      {/* PIN Setup Modal */}
      {showPinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <form
            onSubmit={handleSavePin}
            className="w-full max-w-xs rounded-3xl bg-white dark:bg-slate-900 border-2 border-[#174D3C] p-5 space-y-3 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold">
                {lang === 'bn' ? '৪-সংখ্যার পিন সেট করুন' : 'Set 4-Digit PIN'}
              </h3>
              <button type="button" onClick={() => setShowPinModal(false)} className="p-1">
                <X className="w-4 h-4" />
              </button>
            </div>
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="••••"
              className="w-full text-center tracking-[0.6em] py-3 rounded-xl bg-[#F0F3FF] dark:bg-slate-800 border-2 border-[#174D3C]/30 text-2xl font-extrabold font-mono-num"
            />
            <div className="flex justify-between gap-2 pt-1">
              {settings.pinCode && (
                <button
                  type="button"
                  onClick={async () => {
                    await updateSettings({ pinCode: '', appLockEnabled: false });
                    setShowPinModal(false);
                    showToast(lang === 'bn' ? 'পিন মুছে ফেলা হয়েছে' : 'PIN removed', 'info');
                  }}
                  className="px-3 py-2 rounded-xl bg-[#F7C8CC] text-[#9F1239] text-xs font-bold"
                >
                  {lang === 'bn' ? 'পিন মুছুন' : 'Remove'}
                </button>
              )}
              <button
                type="submit"
                className="ml-auto px-5 py-2 rounded-xl bg-[#E81760] text-white text-xs font-extrabold"
              >
                {lang === 'bn' ? 'সংরক্ষণ' : 'Save PIN'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Premium Modal */}
      {showPremiumModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 border-2 border-[#174D3C] p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Crown className="w-6 h-6 text-[#E81760]" />
                <h3 className="text-base font-extrabold">MyHisab Pro</h3>
              </div>
              <button type="button" onClick={() => setShowPremiumModal(false)} className="p-1">
                <X className="w-4 h-4" />
              </button>
            </div>
            <ul className="space-y-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <li>✓ {lang === 'bn' ? 'আনলিমিটেড PDF ও প্রিন্ট রিপোর্ট' : 'Unlimited PDF & Print Reports'}</li>
              <li>✓ {lang === 'bn' ? 'অফলাইন PWA + অটো স্ন্যাপশট ব্যাকআপ' : 'Offline PWA + Snapshot Backups'}</li>
              <li>✓ {lang === 'bn' ? 'পিন লক ও অ্যাডভান্সড অ্যানালিটিক্স' : 'PIN Protection & Full Analytics'}</li>
            </ul>
            <button
              type="button"
              onClick={async () => {
                await updateSettings({ isPremium: !settings.isPremium });
                setShowPremiumModal(false);
                showToast(
                  !settings.isPremium
                    ? lang === 'bn'
                      ? 'MyHisab Pro সক্রিয় হয়েছে!'
                      : 'MyHisab Pro activated!'
                    : lang === 'bn'
                    ? 'স্ট্যান্ডার্ড মোডে ফিরে এসেছে'
                    : 'Switched to standard mode',
                  'success'
                );
              }}
              className="w-full py-2.5 rounded-xl bg-[#E81760] text-white text-xs font-extrabold"
            >
              {settings.isPremium
                ? lang === 'bn'
                  ? 'প্রিমিয়াম সক্রিয় আছে'
                  : 'Pro Active (Tap to Toggle)'
                : lang === 'bn'
                ? 'প্রিমিয়াম সক্রিয় করুন (ফ্রি)'
                : 'Activate Pro (Free)'}
            </button>
          </div>
        </div>
      )}

      {/* Info / Privacy / Terms / About / Rate / iOS Modal */}
      {infoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 border-2 border-[#174D3C] p-5 space-y-3 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold">
                {infoModal === 'info' && (lang === 'bn' ? 'অ্যাপ তথ্য' : 'App Information')}
                {infoModal === 'privacy' && (lang === 'bn' ? 'গোপনীয়তা নীতি' : 'Privacy Policy')}
                {infoModal === 'terms' && (lang === 'bn' ? 'শর্তাবলী' : 'Terms & Conditions')}
                {infoModal === 'about' && (lang === 'bn' ? 'অ্যাপ সম্পর্কে' : 'About MyHisab')}
                {infoModal === 'rate' && (lang === 'bn' ? 'অ্যাপ রেটিং দিন' : 'Rate MyHisab')}
                {infoModal === 'ios' && (lang === 'bn' ? 'iPhone / iPad ইনস্টলেশন' : 'iOS Installation')}
              </h3>
              <button type="button" onClick={() => setInfoModal(null)} className="p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            {infoModal === 'info' && (
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {lang === 'bn'
                  ? 'MyHisab একটি সম্পূর্ণ অফলাইন-সমর্থিত দৈনিক আয়-ব্যয়, সঞ্চয়, লোন, বাকি এবং বাজেট ব্যবস্থাপনা অ্যাপ। সব তথ্য আপনার ডিভাইসের IndexedDB-তে নিরাপদে সংরক্ষিত থাকে।'
                  : 'MyHisab is an offline-ready daily income, expense, savings, loan, due, and budget management PWA backed by local IndexedDB storage.'}
              </p>
            )}

            {infoModal === 'privacy' && (
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {lang === 'bn'
                  ? 'আপনার কোনো আর্থিক তথ্য বাইরের কোনো সার্ভারে পাঠানো হয় না। সকল আয়, ব্যয়, লোন, বাকি ও নোট শুধুমাত্র আপনার নিজের ব্রাউজার/ডিভাইসের IndexedDB-তে সংরক্ষিত থাকে।'
                  : 'Your financial data stays strictly on your device in IndexedDB. We do not collect, transmit, or sell personal financial records.'}
              </p>
            )}

            {infoModal === 'terms' && (
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {lang === 'bn'
                  ? 'নিয়মিত আপনার ডাটা JSON ব্যাকআপ ডাউনলোড করে নিরাপদে সংরক্ষণ করার পরামর্শ দেওয়া হচ্ছে, যাতে ডিভাইস পরিবর্তন করলে সহজেই রিস্টোর করতে পারেন।'
                  : 'Users are encouraged to download periodic JSON backups before clearing browser storage or switching devices.'}
              </p>
            )}

            {infoModal === 'about' && (
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {lang === 'bn'
                  ? 'MyHisab তৈরি করা হয়েছে ব্যক্তিগত এবং ছোট ব্যবসার দৈনন্দিন হিসাব সহজ, নির্ভুল এবং রঙিন করার জন্য। সাহায্যের জন্য হেল্প লাইন অপশন ব্যবহার করুন।'
                  : 'MyHisab is crafted for personal and small-business daily bookkeeping with accurate multi-wallet balances, analytics, and offline PWA support.'}
              </p>
            )}

            {infoModal === 'ios' && (
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {lang === 'bn'
                  ? 'Safari ব্রাউজারে Share আইকনে ট্যাপ করে "Add to Home Screen" নির্বাচন করুন।'
                  : 'Tap the Share button in Safari and select "Add to Home Screen".'}
              </p>
            )}

            {infoModal === 'rate' && (
              <div className="space-y-3">
                <div className="flex items-center justify-center gap-2 py-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="p-1"
                    >
                      <Star
                        className={`w-7 h-7 ${
                          star <= rating
                            ? 'fill-amber-400 text-amber-500'
                            : 'text-slate-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <textarea
                  rows={2}
                  value={rateComment}
                  onChange={(e) => setRateComment(e.target.value)}
                  placeholder={lang === 'bn' ? 'আপনার মতামত লিখুন...' : 'Write feedback...'}
                  className="w-full px-3 py-2 rounded-xl bg-[#F0F3FF] dark:bg-slate-800 border border-[#174D3C]/25 text-xs"
                />
                <button
                  type="button"
                  onClick={() => {
                    setInfoModal(null);
                    setRateComment('');
                    showToast(
                      lang === 'bn'
                        ? `${rating}★ রেটিং দেওয়ার জন্য ধন্যবাদ!`
                        : `Thank you for rating ${rating}★!`,
                      'success'
                    );
                  }}
                  className="w-full py-2.5 rounded-xl bg-[#E81760] text-white text-xs font-extrabold"
                >
                  {lang === 'bn' ? 'জমা দিন' : 'Submit Rating'}
                </button>
              </div>
            )}

            {infoModal !== 'rate' && (
              <button
                type="button"
                onClick={() => setInfoModal(null)}
                className="w-full py-2.5 rounded-xl bg-[#174D3C] text-white text-xs font-extrabold"
              >
                {lang === 'bn' ? 'বন্ধ করুন' : 'Close'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
