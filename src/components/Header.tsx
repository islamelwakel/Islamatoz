import React from 'react';
import { FileSpreadsheet, Plus, Upload, Wallet, UserCheck, Search } from 'lucide-react';

interface HeaderProps {
  onOpenAddModal: () => void;
  onOpenImportModal: () => void;
  onExportExcel: () => void;
  onToggleSearch: () => void;
  isSearchOpen: boolean;
  hasActiveFilters: boolean;
  transactionCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenAddModal,
  onOpenImportModal,
  onExportExcel,
  onToggleSearch,
  isSearchOpen,
  hasActiveFilters,
  transactionCount,
}) => {
  return (
    <header className="bg-zinc-950/90 backdrop-blur-md text-zinc-100 border-b border-zinc-800/80 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          
          {/* Logo & App Info */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-950/60 border border-emerald-800/40 flex items-center justify-center text-emerald-400 shadow-inner">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold tracking-tight text-emerald-500">
                    نظام الإدارة المالية
                  </h1>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-900/30 text-emerald-400 border border-emerald-800/50">
                    <UserCheck className="w-3 h-3" />
                    دخول تلقائي
                  </span>
                </div>
                <p className="text-xs text-zinc-500 mt-0.5">
                  إدارة الوارد والصادر وقواعد بيانات إكسيل (Excel)
                </p>
              </div>
            </div>

            {/* Mobile quick action buttons */}
            <div className="flex md:hidden items-center gap-2">
              <button
                onClick={onToggleSearch}
                className={`p-2.5 rounded-xl border transition-colors ${
                  isSearchOpen ? 'bg-emerald-950 text-emerald-400 border-emerald-800' : 'bg-zinc-900 text-zinc-300 border-zinc-800'
                }`}
                title="البحث"
              >
                <Search className="w-5 h-5" />
              </button>
              <button
                onClick={onOpenAddModal}
                className="flex items-center justify-center p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition-colors shadow-sm"
                title="إضافة حركة"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Header Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            
            {/* Search Icon & Toggle Button in Header */}
            <button
              onClick={onToggleSearch}
              className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium border transition-all shadow-sm cursor-pointer ${
                isSearchOpen
                  ? 'bg-emerald-950/90 border-emerald-600 text-emerald-400 shadow-emerald-950/30'
                  : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border-zinc-800 hover:border-zinc-700'
              }`}
              title="انقر لفتح وإغلاق لوحة البحث والفلاتر"
            >
              <Search className="w-4 h-4 text-emerald-400" />
              <span>البحث والفلاتر</span>
              {hasActiveFilters && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse mr-0.5" />
              )}
            </button>

            {/* Download/Export Excel */}
            <button
              onClick={onExportExcel}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 hover:border-zinc-700 transition-all shadow-sm group cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
              <span>تصدير Excel</span>
            </button>

            {/* Import Excel */}
            <button
              onClick={onOpenImportModal}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 hover:border-zinc-700 transition-all shadow-sm group cursor-pointer"
            >
              <Upload className="w-4 h-4 text-teal-400 group-hover:scale-110 transition-transform" />
              <span>استيراد بيانات</span>
            </button>

            {/* Primary Add Transaction Button */}
            <button
              onClick={onOpenAddModal}
              className="hidden md:inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-950/40 transition-all cursor-pointer group"
              title="إضافة عملية جديدة (N)"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة عملية جديدة</span>
              <kbd className="hidden lg:inline-block text-[10px] font-mono font-bold bg-emerald-800/90 text-emerald-100 px-1.5 py-0.5 rounded border border-emerald-400/40 mr-1 shadow-xs">
                N
              </kbd>
            </button>

          </div>
        </div>
      </div>
    </header>
  );
};

