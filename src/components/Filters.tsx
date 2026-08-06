import React, { useState, useEffect } from 'react';
import { Search, Calendar, Filter, X, RotateCcw, Check } from 'lucide-react';
import { FilterOptions } from '../types';

interface FiltersProps {
  filters: FilterOptions;
  onFilterChange: (newFilters: FilterOptions) => void;
  onResetFilters: () => void;
  categories: string[];
}

export const Filters: React.FC<FiltersProps> = ({
  filters,
  onFilterChange,
  onResetFilters,
  categories,
}) => {
  // Local state for draft filters until user clicks "بحث" (Search)
  const [draftFilters, setDraftFilters] = useState<FilterOptions>(filters);

  // Sync with prop changes
  useEffect(() => {
    setDraftFilters(filters);
  }, [filters]);

  const hasActiveFilters =
    filters.searchName !== '' ||
    filters.startDate !== '' ||
    filters.endDate !== '' ||
    filters.type !== 'ALL' ||
    filters.category !== 'ALL';

  const handleApplySearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    onFilterChange(draftFilters);
  };

  const handleReset = () => {
    onResetFilters();
    setDraftFilters({
      searchName: '',
      startDate: '',
      endDate: '',
      type: 'ALL',
      category: 'ALL',
    });
  };

  // Quick Date Range Presets
  const setTodayPreset = () => {
    const today = new Date().toISOString().split('T')[0];
    const updated = { ...draftFilters, startDate: today, endDate: today };
    setDraftFilters(updated);
  };

  const setThisWeekPreset = () => {
    const now = new Date();
    const firstDayOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    const today = new Date().toISOString().split('T')[0];
    const updated = {
      ...draftFilters,
      startDate: firstDayOfWeek.toISOString().split('T')[0],
      endDate: today,
    };
    setDraftFilters(updated);
  };

  const setThisMonthPreset = () => {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const today = new Date().toISOString().split('T')[0];
    const updated = { ...draftFilters, startDate: firstDayOfMonth, endDate: today };
    setDraftFilters(updated);
  };

  const handleTypeChange = (newType: 'ALL' | 'IN' | 'OUT') => {
    const updated = { ...draftFilters, type: newType };
    setDraftFilters(updated);
    onFilterChange(updated);
  };

  return (
    <form onSubmit={handleApplySearch} className="bg-zinc-900 rounded-2xl border border-zinc-800 p-4 sm:p-5 mb-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 border-b border-zinc-800/80 pb-3">
        {/* Type Filter Tabs (الكل / وارد / صادر) */}
        <div className="flex items-center gap-1.5 p-1 bg-zinc-950/80 border border-zinc-800 rounded-xl">
          <button
            type="button"
            onClick={() => handleTypeChange('ALL')}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              draftFilters.type === 'ALL'
                ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700/80'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            الكل
          </button>
          <button
            type="button"
            onClick={() => handleTypeChange('IN')}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              draftFilters.type === 'IN'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-emerald-400 hover:text-emerald-300'
            }`}
          >
            وارد (دخل)
          </button>
          <button
            type="button"
            onClick={() => handleTypeChange('OUT')}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              draftFilters.type === 'OUT'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-rose-400 hover:text-rose-300'
            }`}
          >
            صادر (مصروف)
          </button>
        </div>

        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-zinc-400" />
              <span>إلغاء الفلاتر</span>
            </button>
          )}

          {/* Search Action Button */}
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
          >
            <Search className="w-4 h-4" />
            <span>تنفيذ البحث</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-3 sm:gap-4">
        
        {/* Search Input Field with Icon Button */}
        <div className="lg:col-span-7">
          <label className="block text-xs font-medium text-zinc-400 mb-1.5 mr-0.5">
            البحث بالنص أو اسم الجهة / التفاصيل
          </label>
          <div className="relative flex items-center">
            <input
              type="text"
              value={draftFilters.searchName}
              onChange={(e) => setDraftFilters({ ...draftFilters, searchName: e.target.value })}
              placeholder="اكتب الاسم أو التفاصيل وانقر على أيكونة البحث..."
              className="w-full pr-10 pl-10 py-2.5 rounded-xl border border-zinc-700/80 bg-zinc-800/90 focus:bg-zinc-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm text-zinc-100 placeholder-zinc-500 transition-all outline-none"
            />
            
            {/* Clickable Search Icon */}
            <button
              type="submit"
              className="absolute right-2 p-1.5 text-zinc-400 hover:text-emerald-400 hover:bg-zinc-700/60 rounded-lg transition-colors cursor-pointer"
              title="انقر للبحث"
            >
              <Search className="w-4 h-4 text-emerald-500" />
            </button>

            {draftFilters.searchName && (
              <button
                type="button"
                onClick={() => {
                  const updated = { ...draftFilters, searchName: '' };
                  setDraftFilters(updated);
                  onFilterChange(updated);
                }}
                className="absolute left-3 text-zinc-500 hover:text-zinc-300 p-0.5 rounded-full"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Search by Date Range */}
        <div className="lg:col-span-5 grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5 mr-0.5">
              من تاريخ
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-zinc-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="date"
                value={draftFilters.startDate}
                onChange={(e) => setDraftFilters({ ...draftFilters, startDate: e.target.value })}
                className="w-full pr-9 pl-2 py-2.5 rounded-xl border border-zinc-700/80 bg-zinc-800/90 focus:bg-zinc-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-xs text-zinc-100 transition-all outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5 mr-0.5">
              إلى تاريخ
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-zinc-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="date"
                value={draftFilters.endDate}
                onChange={(e) => setDraftFilters({ ...draftFilters, endDate: e.target.value })}
                className="w-full pr-9 pl-2 py-2.5 rounded-xl border border-zinc-700/80 bg-zinc-800/90 focus:bg-zinc-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-xs text-zinc-100 transition-all outline-none"
              />
            </div>
          </div>
        </div>

      </div>

      {/* Date Quick Presets */}
      <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-zinc-800/80 text-xs">
        <span className="font-semibold text-zinc-500">فترات سريعة:</span>
        <button
          type="button"
          onClick={setTodayPreset}
          className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium transition-colors cursor-pointer"
        >
          اليوم
        </button>
        <button
          type="button"
          onClick={setThisWeekPreset}
          className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium transition-colors cursor-pointer"
        >
          هذا الأسبوع
        </button>
        <button
          type="button"
          onClick={setThisMonthPreset}
          className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium transition-colors cursor-pointer"
        >
          هذا الشهر
        </button>

        {/* Payment Method selector */}
        <div className="mr-auto flex items-center gap-2">
          <span className="font-semibold text-zinc-500">طريقة الدفع:</span>
          <select
            value={draftFilters.category}
            onChange={(e) => {
              const updated = { ...draftFilters, category: e.target.value };
              setDraftFilters(updated);
              onFilterChange(updated);
            }}
            className="bg-zinc-800 border border-zinc-700 rounded-lg px-2.5 py-1 text-xs text-zinc-200 font-medium outline-none focus:border-emerald-500 cursor-pointer"
          >
            <option value="ALL">جميع طرق الدفع</option>
            {Array.from(new Set(['كاش', 'انستاباي', 'محفظة', ...categories])).map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

    </form>
  );
};

