import React, { useState, useEffect, useMemo } from 'react';
import {
  getStoredTransactions,
  saveTransactions,
  getStoredSettings,
  saveSettings,
} from './utils/storage';
import { exportToExcel } from './utils/excel';
import { Transaction, FilterOptions, FinancialStats, AppSettings } from './types';
import { Header } from './components/Header';
import { BalanceCard } from './components/BalanceCard';
import { Filters } from './components/Filters';
import { TransactionList } from './components/TransactionList';
import { TransactionFormModal } from './components/TransactionFormModal';
import { ExcelImportModal } from './components/ExcelImportModal';
import { ToastContainer } from './components/Toast';
import { ReceiptText, WalletCards, TrendingUp, TrendingDown, Layers, Search, Plus, Settings2, Archive, RotateCcw, Trash2, Download, CalendarDays, Pencil, X, Check, AlertTriangle } from 'lucide-react';



type PeriodTab = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: 'active' | 'archived';
  createdAt: number;
  updatedAt: number;
};

const PERIOD_TABS_STORAGE_KEY = 'finance_system_period_tabs_v1';

function generateStableId(): string {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
  } catch {}
  return `period-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function readPeriodTabs(transactions: Transaction[]): PeriodTab[] {
  try {
    const raw = localStorage.getItem(PERIOD_TABS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter((item): item is PeriodTab =>
          item && typeof item.id === 'string' && typeof item.name === 'string' &&
          typeof item.startDate === 'string' && typeof item.endDate === 'string' &&
          (item.status === 'active' || item.status === 'archived')
        );
      }
    }
  } catch (error) {
    console.error('Failed to read period tabs:', error);
  }

  const validDates = transactions.map((t) => t.date).filter(Boolean).sort();
  const today = new Date().toISOString().slice(0, 10);
  const startDate = validDates[0] || `${today.slice(0, 7)}-01`;
  const lastTransactionDate = validDates[validDates.length - 1] || today;
  const endDate = lastTransactionDate > today ? lastTransactionDate : today;
  const monthLabel = new Intl.DateTimeFormat('ar-EG', { month: 'long', year: 'numeric' }).format(new Date(`${today}T00:00:00`));

  const initialTab: PeriodTab = {
    id: generateStableId(),
    name: `حسابات ${monthLabel}`,
    startDate,
    endDate,
    status: 'active',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  try { localStorage.setItem(PERIOD_TABS_STORAGE_KEY, JSON.stringify([initialTab])); } catch {}
  return [initialTab];
}

function savePeriodTabsToStorage(tabs: PeriodTab[]): void {
  try { localStorage.setItem(PERIOD_TABS_STORAGE_KEY, JSON.stringify(tabs)); } catch (error) {
    console.error('Failed to save period tabs:', error);
  }
}

function dateRangesOverlap(a: Pick<PeriodTab, 'startDate' | 'endDate'>, b: Pick<PeriodTab, 'startDate' | 'endDate'>): boolean {
  return a.startDate <= b.endDate && b.startDate <= a.endDate;
}

function getPeriodTransactions(transactions: Transaction[], period: PeriodTab): Transaction[] {
  return transactions
    .filter((t) => t.date >= period.startDate && t.date <= period.endDate)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime() || b.createdAt - a.createdAt);
}

export default function App() {
  // Navigation tab state ('transactions' or 'summary')
  const [activeTab, setActiveTab] = useState<'transactions' | 'summary'>('transactions');
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);

  // State management
  const [transactions, setTransactions] = useState<Transaction[]>(getStoredTransactions);
  const [settings, setSettings] = useState<AppSettings>(getStoredSettings);

  // Independent period tabs (presentation/organization layer only)
  const [periodTabs, setPeriodTabs] = useState<PeriodTab[]>(() => readPeriodTabs(getStoredTransactions()));
  const [activePeriodId, setActivePeriodId] = useState<string>('');
  const [showArchivedPeriods, setShowArchivedPeriods] = useState(false);
  const [periodModalMode, setPeriodModalMode] = useState<'create' | 'edit' | null>(null);
  const [editingPeriod, setEditingPeriod] = useState<PeriodTab | null>(null);
  const [periodDraft, setPeriodDraft] = useState({ name: '', startDate: '', endDate: '' });
  const [isPeriodSaving, setIsPeriodSaving] = useState(false);

  // Filters State
  const [filters, setFilters] = useState<FilterOptions>({
    searchName: '',
    startDate: '',
    endDate: '',
    type: 'ALL',
    category: 'ALL',
  });

  const hasActiveFilters =
    filters.searchName !== '' ||
    filters.startDate !== '' ||
    filters.endDate !== '' ||
    filters.type !== 'ALL' ||
    filters.category !== 'ALL';

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  // Toast notifications
  const [toastMessage, setToastMessage] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  // Listen to storage changes across tabs/windows
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if ((e.key === 'finance_system_transactions_v2' || e.key === 'finance_system_transactions') && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) {
            setTransactions(parsed);
          }
        } catch (err) {
          console.error('Failed to parse storage sync event:', err);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);


  useEffect(() => {
    const handlePeriodStorageChange = (e: StorageEvent) => {
      if (e.key !== PERIOD_TABS_STORAGE_KEY || !e.newValue) return;
      try {
        const parsed = JSON.parse(e.newValue);
        if (Array.isArray(parsed)) {
          setPeriodTabs(parsed);
          if (!parsed.some((p: PeriodTab) => p.id === activePeriodId)) {
            setActivePeriodId(parsed.find((p: PeriodTab) => p.status === 'active')?.id || parsed[0]?.id || '');
          }
        }
      } catch (err) {
        console.error('Failed to parse period tabs storage sync event:', err);
      }
    };
    window.addEventListener('storage', handlePeriodStorageChange);
    return () => window.removeEventListener('storage', handlePeriodStorageChange);
  }, [activePeriodId]);

  useEffect(() => {
    savePeriodTabsToStorage(periodTabs);
    if (!periodTabs.some((p) => p.id === activePeriodId)) {
      setActivePeriodId(periodTabs.find((p) => p.status === 'active')?.id || periodTabs[0]?.id || '');
    }
  }, [periodTabs]);

  const activePeriod = useMemo(
    () => periodTabs.find((p) => p.id === activePeriodId) || periodTabs.find((p) => p.status === 'active') || periodTabs[0] || null,
    [periodTabs, activePeriodId]
  );

  const visiblePeriodTabs = useMemo(
    () => periodTabs.filter((p) => p.status === (showArchivedPeriods ? 'archived' : 'active')),
    [periodTabs, showArchivedPeriods]
  );

  useEffect(() => {
    if (!activePeriod) return;
    if (activePeriod.status === 'archived' && !showArchivedPeriods) {
      const nextActive = periodTabs.find((p) => p.status === 'active');
      if (nextActive) setActivePeriodId(nextActive.id);
    }
  }, [activePeriod, periodTabs, showArchivedPeriods]);

  // Keyboard shortcut ('N' key) to open Add Transaction modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcut if user is typing in input fields, textareas, or selects
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }

      if ((e.key === 'n' || e.key === 'N') && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        setEditingTransaction(null);
        setIsAddModalOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Save transactions when changed
  const updateTransactions = (newTransactions: Transaction[]) => {
    setTransactions(newTransactions);
    saveTransactions(newTransactions);
  };

  // Toggle Eye icon visibility for total balance ("خلي المبلغ الكلي مش ظاهر غير لما ادوس علي العين")
  const handleToggleVisibility = () => {
    const updatedSettings = {
      ...settings,
      isBalanceVisible: !settings.isBalanceVisible,
    };
    setSettings(updatedSettings);
    saveSettings(updatedSettings);
    
    if (updatedSettings.isBalanceVisible) {
      showToast('تم إظهار الرصيد والمبالغ المالية', 'info');
    } else {
      showToast('تم إخفاء الرصيد والمبالغ المالية', 'info');
    }
  };

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage({ message, type });
  };

  // Extract unique categories for filter dropdown
  const uniqueCategories = useMemo(() => {
    const cats = new Set<string>();
    transactions.forEach((t) => {
      if (t.category) cats.add(t.category);
    });
    return Array.from(cats);
  }, [transactions]);

  // Filter transactions according to active period + search/date filters
  const filteredTransactions = useMemo(() => {
    const periodScoped = activePeriod ? getPeriodTransactions(transactions, activePeriod) : transactions;
    return periodScoped.filter((t) => {
      if (filters.searchName.trim()) {
        const query = filters.searchName.toLowerCase().trim();
        const matchName = t.name.toLowerCase().includes(query);
        const matchDetails = (t.details || '').toLowerCase().includes(query);
        if (!matchName && !matchDetails) return false;
      }
      if (filters.startDate && t.date < filters.startDate) return false;
      if (filters.endDate && t.date > filters.endDate) return false;
      if (filters.type !== 'ALL' && t.type !== filters.type) return false;
      if (filters.category !== 'ALL' && t.category !== filters.category) return false;
      return true;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime() || b.createdAt - a.createdAt);
  }, [transactions, filters, activePeriod]);

  // Financial Stats calculation
  const stats: FinancialStats = useMemo(() => {
    let totalIn = 0;
    let totalOut = 0;

    // Calculate over filtered transactions or total
    filteredTransactions.forEach((t) => {
      if (t.type === 'IN') {
        totalIn += t.amount;
      } else {
        totalOut += t.amount;
      }
    });

    return {
      totalIn,
      totalOut,
      netBalance: totalIn - totalOut,
      transactionCount: filteredTransactions.length,
    };
  }, [filteredTransactions]);

  // Handle Add/Edit transaction
  const handleSaveTransaction = (
    data: Omit<Transaction, 'id' | 'createdAt'>,
    editId?: string
  ) => {
    if (editId) {
      // Update existing
      const updated = transactions.map((t) =>
        t.id === editId ? { ...t, ...data } : t
      );
      updateTransactions(updated);
      showToast('تم تحديث بيانات الحركة المالية بنجاح', 'success');
    } else {
      // Create new
      const newTransaction: Transaction = {
        ...data,
        id: `tx-${Date.now()}`,
        createdAt: Date.now(),
      };
      updateTransactions([newTransaction, ...transactions]);
      showToast('تم إضافة الحركة المالية بنجاح', 'success');
    }
  };

  // Handle Delete
  const handleDeleteTransaction = (id: string) => {
    const updated = transactions.filter((t) => t.id !== id);
    updateTransactions(updated);
    showToast('تم حذف الحركة المالية', 'info');
  };

  // Handle Bulk Delete
  const handleBulkDeleteTransactions = (ids: string[]) => {
    const updated = transactions.filter((t) => !ids.includes(t.id));
    updateTransactions(updated);
    showToast(`تم حذف ${ids.length} حركات مالية بنجاح`, 'info');
  };

  // Handle Excel Export
  const handleExportExcel = () => {
    if (filteredTransactions.length === 0) {
      showToast('لا توجد حركات مالية لتصديرها إلى إكسيل', 'error');
      return;
    }
    exportToExcel(filteredTransactions, `الحسابات_المالية_${new Date().toISOString().split('T')[0]}.xlsx`);
    showToast('تم تحميل ملف الإكسيل بنجاح', 'success');
  };

  // Handle Excel Import
  const handleImportExcel = (
    importedRows: Omit<Transaction, 'id' | 'createdAt'>[],
    mode: 'append' | 'replace'
  ) => {
    const newTransactions: Transaction[] = importedRows.map((row, index) => ({
      ...row,
      id: `tx-imp-${Date.now()}-${index}`,
      createdAt: Date.now() + index,
    }));

    if (mode === 'replace') {
      updateTransactions(newTransactions);
      showToast(`تم استبدال قاعدة البيانات بـ ${newTransactions.length} سجل إكسيل`, 'success');
    } else {
      updateTransactions([...newTransactions, ...transactions]);
      showToast(`تم إدراج ${newTransactions.length} حركة مالية من ملف الإكسيل`, 'success');
    }
  };

  // Period Tab management
  const openCreatePeriodModal = () => {
    const activeTabs = periodTabs.filter((p) => p.status === 'active');
    const maxEnd = activeTabs.map((p) => p.endDate).sort().at(-1) || new Date().toISOString().slice(0, 10);
    const nextDate = new Date(`${maxEnd}T00:00:00`);
    nextDate.setDate(nextDate.getDate() + 1);
    const nextISO = nextDate.toISOString().slice(0, 10);
    const monthLabel = new Intl.DateTimeFormat('ar-EG', { month: 'long', year: 'numeric' }).format(nextDate);
    setEditingPeriod(null);
    setPeriodDraft({ name: `حسابات ${monthLabel}`, startDate: nextISO, endDate: nextISO });
    setPeriodModalMode('create');
  };

  const openEditPeriodModal = (period: PeriodTab) => {
    setEditingPeriod(period);
    setPeriodDraft({ name: period.name, startDate: period.startDate, endDate: period.endDate });
    setPeriodModalMode('edit');
  };

  const closePeriodModal = () => {
    if (isPeriodSaving) return;
    setPeriodModalMode(null);
    setEditingPeriod(null);
  };

  const handleSavePeriod = () => {
    const name = periodDraft.name.trim();
    if (!name) {
      showToast('اكتب اسم الـTab أولًا', 'error');
      return;
    }
    if (!periodDraft.startDate || !periodDraft.endDate) {
      showToast('حدد تاريخ البداية والنهاية', 'error');
      return;
    }
    if (periodDraft.startDate > periodDraft.endDate) {
      showToast('تاريخ البداية لا يمكن أن يكون بعد تاريخ النهاية', 'error');
      return;
    }

    const candidate = { startDate: periodDraft.startDate, endDate: periodDraft.endDate };
    const conflict = periodTabs.find((p) => p.id !== editingPeriod?.id && dateRangesOverlap(candidate, p));
    if (conflict) {
      showToast(`الفترة تتداخل مع «${conflict.name}»`, 'error');
      return;
    }

    setIsPeriodSaving(true);
    window.setTimeout(() => {
      const now = Date.now();
      if (periodModalMode === 'edit' && editingPeriod) {
        const updated = periodTabs.map((p) => p.id === editingPeriod.id
          ? { ...p, name, startDate: periodDraft.startDate, endDate: periodDraft.endDate, updatedAt: now }
          : p
        );
        setPeriodTabs(updated);
        setActivePeriodId(editingPeriod.id);
        showToast('تم تحديث إعدادات الـTab بنجاح', 'success');
      } else {
        const newPeriod: PeriodTab = {
          id: generateStableId(),
          name,
          startDate: periodDraft.startDate,
          endDate: periodDraft.endDate,
          status: 'active',
          createdAt: now,
          updatedAt: now,
        };
        setPeriodTabs((prev) => [...prev, newPeriod]);
        setActivePeriodId(newPeriod.id);
        setShowArchivedPeriods(false);
        showToast('تم إنشاء الـTab بنجاح', 'success');
      }
      setIsPeriodSaving(false);
      setPeriodModalMode(null);
      setEditingPeriod(null);
    }, 0);
  };

  const handleArchiveOrRestorePeriod = (period: PeriodTab) => {
    const nextStatus: PeriodTab['status'] = period.status === 'active' ? 'archived' : 'active';
    if (period.status === 'active' && !window.confirm(`نقل «${period.name}» إلى الأرشيف؟`)) return;
    const now = Date.now();
    setPeriodTabs((prev) => prev.map((p) => p.id === period.id ? { ...p, status: nextStatus, updatedAt: now } : p));
    if (nextStatus === 'archived') {
      const nextActive = periodTabs.find((p) => p.id !== period.id && p.status === 'active');
      if (nextActive) setActivePeriodId(nextActive.id);
      setShowArchivedPeriods(false);
      showToast('تم نقل الـTab إلى الأرشيف', 'success');
    } else {
      setActivePeriodId(period.id);
      setShowArchivedPeriods(false);
      showToast('تم استعادة الـTab من الأرشيف', 'success');
    }
  };

  const handlePermanentDeletePeriod = (period: PeriodTab) => {
    const periodTx = getPeriodTransactions(transactions, period);
    const confirmed = window.confirm(
      `هل أنت متأكد من حذف «${period.name}» نهائيًا؟\n\nسيتم حذف ${periodTx.length} حركة داخل هذه الفترة ولا يمكن التراجع عن هذا الإجراء.`
    );
    if (!confirmed) return;

    updateTransactions(transactions.filter((t) => !(t.date >= period.startDate && t.date <= period.endDate)));
    const remaining = periodTabs.filter((p) => p.id !== period.id);
    setPeriodTabs(remaining);
    const fallback = remaining.find((p) => p.status === 'active') || remaining[0];
    setActivePeriodId(fallback?.id || '');
    showToast('تم حذف الـTab والبيانات المرتبطة به نهائيًا', 'info');
  };

  const handleExportPeriodExcel = (period: PeriodTab) => {
    const items = getPeriodTransactions(transactions, period);
    if (items.length === 0) {
      showToast('لا توجد حركات داخل هذا الـTab لتصديرها', 'error');
      return;
    }
    exportToExcel(items, `${period.name.replace(/[^\p{L}\p{N}\-_ ]/gu, '').trim() || 'الحسابات'}.xlsx`);
    showToast(`تم تصدير ${items.length} حركة من «${period.name}»`, 'success');
  };

  const handleExportAllPeriods = () => {
    if (periodTabs.length === 0) {
      showToast('لا توجد Tabs لتصديرها', 'error');
      return;
    }
    const allItems = periodTabs.flatMap((p) => getPeriodTransactions(transactions, p));
    const unique = Array.from(new Map(allItems.map((t) => [t.id, t])).values());
    if (unique.length === 0) {
      showToast('لا توجد حركات لتصديرها', 'error');
      return;
    }
    exportToExcel(unique, `كل_الفترات_${new Date().toISOString().slice(0, 10)}.xlsx`);
    showToast('تم تصدير جميع بيانات الفترات بنجاح', 'success');
  };

  // Reset filters
  const handleResetFilters = () => {
    setFilters({
      searchName: '',
      startDate: '',
      endDate: '',
      type: 'ALL',
      category: 'ALL',
    });
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-['Cairo',sans-serif] flex flex-col">
      
      {/* Toast Banner */}
      {toastMessage && (
        <ToastContainer
          message={toastMessage.message}
          type={toastMessage.type}
          onClose={() => setToastMessage(null)}
        />
      )}

      {/* Top Navigation & Actions */}
      <Header
        onOpenAddModal={() => {
          setEditingTransaction(null);
          setIsAddModalOpen(true);
        }}
        onOpenImportModal={() => setIsImportModalOpen(true)}
        onExportExcel={handleExportExcel}
        onToggleSearch={() => {
          setActiveTab('transactions');
          setIsSearchOpen((prev) => !prev);
        }}
        isSearchOpen={isSearchOpen}
        hasActiveFilters={hasActiveFilters}
        transactionCount={transactions.length}
      />

      {/* Main App Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        
        {/* PERIOD TABS */}
        <section className="mb-6">
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-emerald-500" />
                <div>
                  <h2 className="text-base font-black text-zinc-100">فترات الحسابات</h2>
                  <p className="text-[11px] text-zinc-500">كل Tab له اسم ومدة مستقلة</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button type="button" onClick={handleExportAllPeriods} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold bg-zinc-900 border border-zinc-800 text-zinc-200 hover:bg-zinc-800 transition-all">
                  <Download className="w-4 h-4" /> تصدير الكل
                </button>
                <button type="button" onClick={openCreatePeriodModal} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-500 transition-all shadow-sm">
                  <Plus className="w-4 h-4" /> Tab جديد
                </button>
              </div>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
              {visiblePeriodTabs.map((period) => {
                const count = getPeriodTransactions(transactions, period).length;
                const active = period.id === activePeriod?.id;
                return (
                  <button
                    key={period.id}
                    type="button"
                    onClick={() => setActivePeriodId(period.id)}
                    className={`min-w-[180px] text-right px-3.5 py-3 rounded-2xl border transition-all ${
                      active
                        ? 'bg-emerald-600 border-emerald-500 text-white shadow-md'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-black text-sm truncate">{period.name}</span>
                      <span className={`text-[10px] px-2 py-1 rounded-full shrink-0 ${active ? 'bg-white/15 text-white' : 'bg-zinc-800 text-zinc-400'}`}>{count}</span>
                    </div>
                    <div className={`mt-1.5 flex items-center gap-1 text-[10px] ${active ? 'text-emerald-50' : 'text-zinc-500'}`}>
                      <CalendarDays className="w-3 h-3" /> {period.startDate} → {period.endDate}
                    </div>
                  </button>
                );
              })}
              {visiblePeriodTabs.length === 0 && (
                <div className="w-full border border-dashed border-zinc-800 rounded-2xl p-5 text-center text-xs text-zinc-500">لا توجد Tabs في هذا القسم.</div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setShowArchivedPeriods(false)}
                className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border transition-all ${!showArchivedPeriods ? 'bg-zinc-100 text-zinc-900 border-zinc-100' : 'bg-zinc-900 text-zinc-400 border-zinc-800'}`}
              >
                <Layers className="w-3.5 h-3.5" /> النشطة ({periodTabs.filter((p) => p.status === 'active').length})
              </button>
              <button
                type="button"
                onClick={() => setShowArchivedPeriods(true)}
                className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border transition-all ${showArchivedPeriods ? 'bg-zinc-100 text-zinc-900 border-zinc-100' : 'bg-zinc-900 text-zinc-400 border-zinc-800'}`}
              >
                <Archive className="w-3.5 h-3.5" /> الأرشيف ({periodTabs.filter((p) => p.status === 'archived').length})
              </button>
            </div>

            {activePeriod && (
              <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    {activePeriod.status === 'archived' ? <Archive className="w-4 h-4 text-amber-400" /> : <Check className="w-4 h-4 text-emerald-400" />}
                    <span className="text-sm font-black text-zinc-100 truncate">{activePeriod.name}</span>
                    <span className="text-[10px] px-2 py-1 rounded-full bg-zinc-800 text-zinc-400">ID ثابت</span>
                  </div>
                  <div className="mt-1 text-[11px] text-zinc-500">{activePeriod.startDate} → {activePeriod.endDate}</div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button type="button" onClick={() => openEditPeriodModal(activePeriod)} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-zinc-800 text-zinc-200 hover:bg-zinc-700 transition-all"><Pencil className="w-3.5 h-3.5" /> تعديل</button>
                  <button type="button" onClick={() => handleExportPeriodExcel(activePeriod)} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-zinc-800 text-zinc-200 hover:bg-zinc-700 transition-all"><Download className="w-3.5 h-3.5" /> Excel</button>
                  {activePeriod.status === 'active' ? (
                    <button type="button" onClick={() => handleArchiveOrRestorePeriod(activePeriod)} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-amber-950/40 border border-amber-900/50 text-amber-300 hover:bg-amber-900/30 transition-all"><Archive className="w-3.5 h-3.5" /> أرشفة</button>
                  ) : (
                    <>
                      <button type="button" onClick={() => handleArchiveOrRestorePeriod(activePeriod)} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-emerald-950/50 border border-emerald-900/50 text-emerald-300 hover:bg-emerald-900/30 transition-all"><RotateCcw className="w-3.5 h-3.5" /> استعادة</button>
                      <button type="button" onClick={() => handlePermanentDeletePeriod(activePeriod)} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-rose-950/50 border border-rose-900/50 text-rose-300 hover:bg-rose-900/30 transition-all"><Trash2 className="w-3.5 h-3.5" /> حذف نهائي</button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* SUMMARY NAVIGATION */}
        <div className="flex items-center gap-2 mb-6 border-b border-zinc-800 pb-3">
          <button
            onClick={() => setActiveTab('transactions')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer ${activeTab === 'transactions' ? 'bg-emerald-600 text-white shadow-md' : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800'}`}
          >
            <ReceiptText className="w-4 h-4" />
            <span>سجل الحركات المالية</span>
            <span className="px-2 py-0.5 rounded-full bg-zinc-950/60 text-xs font-bold font-mono border border-zinc-700/50">{new Intl.NumberFormat('en-US').format(filteredTransactions.length)}</span>
          </button>
          <button
            onClick={() => setActiveTab('summary')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer ${activeTab === 'summary' ? 'bg-emerald-600 text-white shadow-md' : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800'}`}
          >
            <WalletCards className="w-4 h-4" />
            <span>ملخص الرصيد والمالية</span>
          </button>
        </div>

        {/* TAB 1: Transactions Log & Search */}
        {activeTab === 'transactions' && (
          <div>
            {/* Always Visible Quick Type Tabs (الكل / وارد / صادر) */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-1.5 p-1 bg-zinc-900 border border-zinc-800 rounded-xl shadow-sm">
                <button
                  type="button"
                  onClick={() => setFilters({ ...filters, type: 'ALL' })}
                  className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    filters.type === 'ALL'
                      ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700/80'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  الكل
                </button>
                <button
                  type="button"
                  onClick={() => setFilters({ ...filters, type: 'IN' })}
                  className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    filters.type === 'IN'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-emerald-400 hover:text-emerald-300'
                  }`}
                >
                  وارد (دخل)
                </button>
                <button
                  type="button"
                  onClick={() => setFilters({ ...filters, type: 'OUT' })}
                  className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    filters.type === 'OUT'
                      ? 'bg-rose-600 text-white shadow-sm'
                      : 'text-rose-400 hover:text-rose-300'
                  }`}
                >
                  صادر (مصروف)
                </button>
              </div>

              {/* Toggle Search & Advanced Filters Button */}
              <button
                type="button"
                onClick={() => setIsSearchOpen((prev) => !prev)}
                className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  isSearchOpen
                    ? 'bg-emerald-950/80 border-emerald-600 text-emerald-400'
                    : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border-zinc-800'
                }`}
              >
                <Search className="w-4 h-4 text-emerald-400" />
                <span>{isSearchOpen ? 'إغلاق أدوات البحث' : 'توسيع البحث والفلترة'}</span>
              </button>
            </div>

            {/* Search & Filters Component (Toggled via Header or Search Button) */}
            {isSearchOpen && (
              <Filters
                filters={filters}
                onFilterChange={setFilters}
                onResetFilters={handleResetFilters}
                categories={uniqueCategories}
              />
            )}

            {/* Transactions List / Table */}
            <TransactionList
              transactions={filteredTransactions}
              onEdit={(t) => {
                setEditingTransaction(t);
                setIsAddModalOpen(true);
              }}
              onDelete={handleDeleteTransaction}
              onBulkDelete={handleBulkDeleteTransactions}
              isBalanceVisible={settings.isBalanceVisible}
              currency={settings.currency}
            />
          </div>
        )}

        {/* TAB 2: Balance & Summary (المبلغ الكلي والوارد والصادر) */}
        {activeTab === 'summary' && (
          <div className="space-y-6">
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4 sm:p-6">
              <div className="flex items-center gap-2 mb-4">
                <WalletCards className="w-5 h-5 text-emerald-500" />
                <h2 className="text-base font-bold text-zinc-100">
                  كشف ملخص الرصيد والمبالغ المالية
                </h2>
              </div>
              
              {/* Balance Card Component (Total Balance, Total In, Total Out) */}
              <BalanceCard
                stats={stats}
                currency={settings.currency}
              />
            </div>
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="bg-zinc-950 border-t border-zinc-800/80 py-6 text-center text-xs text-zinc-500 mt-auto">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© {new Date().getFullYear()} نظام إدارة الحسابات المالية</p>
          <div className="flex items-center gap-4 text-zinc-400 font-medium">
            <span>دعم ملفات Excel (.xlsx)</span>
            <span>•</span>
            <span>قاعدة بيانات إكسيل محلية</span>
          </div>
        </div>
      </footer>

      {/* Period Tab Modal */}
      {periodModalMode && (
        <div className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
              <div>
                <h3 className="font-black text-zinc-100">{periodModalMode === 'create' ? 'إنشاء Tab جديد' : 'تعديل الـTab'}</h3>
                <p className="text-[11px] text-zinc-500 mt-1">الاسم والفترة منفصلان عن بيانات الحركات</p>
              </div>
              <button type="button" onClick={closePeriodModal} className="p-2 rounded-xl text-zinc-400 hover:bg-zinc-900 hover:text-white"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs font-bold text-zinc-400 block mb-2">اسم الـTab</label>
                <input value={periodDraft.name} onChange={(e) => setPeriodDraft((d) => ({ ...d, name: e.target.value }))} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-3 text-sm text-white outline-none focus:border-emerald-600" placeholder="مثال: دفعات سبتمبر" autoFocus />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-zinc-400 block mb-2">من تاريخ</label>
                  <input type="date" value={periodDraft.startDate} onChange={(e) => setPeriodDraft((d) => ({ ...d, startDate: e.target.value }))} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-3 text-sm text-white outline-none focus:border-emerald-600" />
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-400 block mb-2">إلى تاريخ</label>
                  <input type="date" value={periodDraft.endDate} onChange={(e) => setPeriodDraft((d) => ({ ...d, endDate: e.target.value }))} className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-3 text-sm text-white outline-none focus:border-emerald-600" />
                </div>
              </div>
              <div className="flex gap-2 rounded-2xl bg-emerald-950/30 border border-emerald-900/40 p-3 text-[11px] text-emerald-200">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>لن يتم تغيير أو نقل أي حركة. الـTab يعتمد فقط على تاريخ الحركة في العرض.</span>
              </div>
            </div>
            <div className="px-5 py-4 border-t border-zinc-800 flex gap-2">
              <button type="button" onClick={closePeriodModal} disabled={isPeriodSaving} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold bg-zinc-900 border border-zinc-800 text-zinc-300">إلغاء</button>
              <button type="button" onClick={handleSavePeriod} disabled={isPeriodSaving} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold bg-emerald-600 text-white disabled:opacity-60">{isPeriodSaving ? 'جاري الحفظ...' : (periodModalMode === 'create' ? 'إنشاء Tab' : 'حفظ التعديل')}</button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Transaction Modal */}
      <TransactionFormModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingTransaction(null);
        }}
        onSave={handleSaveTransaction}
        editingTransaction={editingTransaction}
      />

      {/* Excel Import Modal */}
      <ExcelImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleImportExcel}
      />

    </div>
  );
}
Add period tabs management

