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
import { ReceiptText, WalletCards, TrendingUp, TrendingDown, Layers, Search } from 'lucide-react';

export default function App() {
  // Navigation tab state ('transactions' or 'summary')
  const [activeTab, setActiveTab] = useState<'transactions' | 'summary'>('transactions');
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);

  // State management
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [settings, setSettings] = useState<AppSettings>(getStoredSettings);

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

  // Load transactions on mount
  useEffect(() => {
    const loaded = getStoredTransactions();
    setTransactions(loaded);
  }, []);

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

  // Filter transactions according to search and date filters
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      // 1. Search by Name ("بحث بالاسم") or Details
      if (filters.searchName.trim()) {
        const query = filters.searchName.toLowerCase().trim();
        const matchName = t.name.toLowerCase().includes(query);
        const matchDetails = (t.details || '').toLowerCase().includes(query);
        if (!matchName && !matchDetails) return false;
      }

      // 2. Search by Date Range ("بحث بالتاريخ من تاريخ لتاريخ")
      if (filters.startDate) {
        if (t.date < filters.startDate) return false;
      }
      if (filters.endDate) {
        if (t.date > filters.endDate) return false;
      }

      // 3. Filter by Transaction Type (وارد / صادر)
      if (filters.type !== 'ALL' && t.type !== filters.type) {
        return false;
      }

      // 4. Filter by Category
      if (filters.category !== 'ALL' && t.category !== filters.category) {
        return false;
      }

      return true;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime() || b.createdAt - a.createdAt);
  }, [transactions, filters]);

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
        
        {/* TAB NAVIGATION BAR */}
        <div className="flex items-center gap-2 mb-6 border-b border-zinc-800 pb-3">
          <button
            onClick={() => setActiveTab('transactions')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer ${
              activeTab === 'transactions'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
            }`}
          >
            <ReceiptText className="w-4 h-4" />
            <span>سجل الحركات المالية</span>
            <span className="px-2 py-0.5 rounded-full bg-zinc-950/60 text-xs font-bold font-mono border border-zinc-700/50">
              {new Intl.NumberFormat('en-US').format(filteredTransactions.length)}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('summary')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer ${
              activeTab === 'summary'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
            }`}
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

