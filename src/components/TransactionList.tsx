import React, { useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, Edit2, Trash2, Calendar, FileText, User, Tag, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { Transaction } from '../types';
import { formatCurrency } from '../utils/storage';
import { PaymentMethodBadge } from './PaymentMethodBadge';

interface TransactionListProps {
  transactions: Transaction[];
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: string) => void;
  onBulkDelete?: (ids: string[]) => void;
  isBalanceVisible: boolean;
  currency: string;
}

// Helper to format date as Day and Month only (without year)
const formatShortDate = (dateStr: string) => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const day = parseInt(parts[2], 10);
    const monthIndex = parseInt(parts[1], 10) - 1;
    const monthsArabic = [
      'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
      'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
    ];
    if (monthsArabic[monthIndex]) {
      return `${day} ${monthsArabic[monthIndex]}`;
    }
    return `${parts[2]}/${parts[1]}`;
  }
  return dateStr;
};

export const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  onEdit,
  onDelete,
  onBulkDelete,
  isBalanceVisible,
  currency,
}) => {
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [showDetails, setShowDetails] = useState<boolean>(false);

  const isAllSelected =
    transactions.length > 0 && selectedIds.length === transactions.length;

  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(transactions.map((t) => t.id));
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleExecuteBulkDelete = () => {
    if (onBulkDelete && selectedIds.length > 0) {
      onBulkDelete(selectedIds);
      setSelectedIds([]);
      setShowBulkDeleteConfirm(false);
    } else if (selectedIds.length > 0) {
      selectedIds.forEach((id) => onDelete(id));
      setSelectedIds([]);
      setShowBulkDeleteConfirm(false);
    }
  };

  if (transactions.length === 0) {
    return (
      <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-8 text-center my-6">
        <div className="w-16 h-16 rounded-full bg-zinc-800 text-zinc-500 flex items-center justify-center mx-auto mb-3">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-zinc-200 mb-1">
          لا توجد حركات مالية مطابقة للبحث
        </h3>
        <p className="text-sm text-zinc-400 max-w-md mx-auto">
          جرب تغيير معايير التصفية، أو البحث باسم آخر، أو إلغاء تحديد نطاق التواريخ لرؤية كافة المعاملات.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900 rounded-2xl border border-zinc-800 shadow-sm overflow-hidden mb-8">
      
      {/* Table Header Info & Bulk Action Bar */}
      <div className="px-6 py-4 bg-zinc-950/80 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="font-bold text-zinc-200 text-sm">
            سجل الحركات المالية
          </span>
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-zinc-800 text-emerald-400 border border-zinc-700/80 font-mono">
            {new Intl.NumberFormat('en-US').format(transactions.length)} معاملة
          </span>

          {/* Toggle Details Button */}
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium border border-zinc-700/60 transition-colors cursor-pointer mr-2"
            title={showDetails ? 'إخفاء التفاصيل من السجل' : 'إظهار التفاصيل في السجل'}
          >
            {showDetails ? (
              <>
                <EyeOff className="w-3.5 h-3.5 text-rose-400" />
                <span>إخفاء التفاصيل</span>
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5 text-emerald-400" />
                <span>إظهار التفاصيل</span>
              </>
            )}
          </button>
        </div>

        {/* Selected Items Controls / Bulk Delete */}
        {selectedIds.length > 0 && (
          <div className="flex items-center gap-2 bg-emerald-950/60 border border-emerald-800/60 px-3 py-1.5 rounded-xl">
            <span className="text-xs font-bold text-emerald-300">
              تم تحديد <span className="font-mono">{new Intl.NumberFormat('en-US').format(selectedIds.length)}</span> عناصر
            </span>

            {showBulkDeleteConfirm ? (
              <div className="flex items-center gap-1.5 mr-2">
                <button
                  onClick={handleExecuteBulkDelete}
                  className="px-2.5 py-1 rounded-lg bg-rose-600 text-white text-xs font-bold hover:bg-rose-500 transition-colors cursor-pointer"
                >
                  تأكيد حذف {new Intl.NumberFormat('en-US').format(selectedIds.length)}
                </button>
                <button
                  onClick={() => setShowBulkDeleteConfirm(false)}
                  className="px-2 py-1 rounded-lg bg-zinc-800 text-zinc-300 text-xs font-bold hover:bg-zinc-700 transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowBulkDeleteConfirm(true)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-600/90 hover:bg-rose-600 text-white text-xs font-bold transition-colors cursor-pointer mr-2"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>حذف المحدد</span>
              </button>
            )}

            <button
              onClick={() => setSelectedIds([])}
              className="text-xs text-zinc-400 hover:text-zinc-200 font-medium underline mr-1 cursor-pointer"
            >
              إلغاء التحديد
            </button>
          </div>
        )}
      </div>

      {/* Table View (Fits Screen Width) */}
      <div className="overflow-x-auto w-full">
        <table className="w-full text-right border-collapse text-xs sm:text-sm">
          <thead>
            <tr className="bg-zinc-950/40 text-zinc-400 text-[11px] sm:text-xs font-semibold border-b border-zinc-800">
              <th className="py-2.5 px-1 sm:px-2 w-8 sm:w-10 text-center font-mono">#</th>
              <th className="py-2.5 px-1 sm:px-2 w-20 sm:w-24 text-center">التاريخ</th>
              <th className="py-2.5 px-1.5 sm:px-3">الاسم (الجهة / العميل)</th>
              <th className="py-2.5 px-1.5 sm:px-3">المبلغ</th>
              {showDetails && <th className="py-2.5 px-1.5 sm:px-3">التفاصيل</th>}
              <th className="py-2.5 px-1 sm:px-3 text-center w-16 sm:w-20">الإجراءات</th>
              <th className="py-2.5 px-1 sm:px-2 w-8 sm:w-10 text-center">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={handleSelectAll}
                  className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded bg-zinc-800 border-zinc-700 text-emerald-600 focus:ring-emerald-500 focus:ring-offset-zinc-900 cursor-pointer accent-emerald-500"
                  title="تحديد الكل"
                />
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60 text-xs sm:text-sm">
            {transactions.map((t, index) => {
              const isIn = t.type === 'IN';
              const isSelected = selectedIds.includes(t.id);
              const formattedEnglishAmount = new Intl.NumberFormat('en-US', {
                minimumFractionDigits: 0,
                maximumFractionDigits: 2,
              }).format(t.amount);

              // Simple sequential numbering starting from 1 (#1, #2, #3...)
              const sequentialId = index + 1;

              return (
                <tr
                  key={t.id}
                  className={`transition-colors group ${
                    isSelected ? 'bg-emerald-950/30 hover:bg-emerald-950/40' : 'hover:bg-zinc-800/40'
                  }`}
                >
                  {/* 1. ID Column (#1, #2, #3) */}
                  <td className="py-2 px-1 sm:px-2 text-center whitespace-nowrap">
                    <span className="inline-block bg-zinc-800/90 text-zinc-300 font-mono text-[10px] sm:text-[11px] font-bold px-1 sm:px-1.5 py-0.5 rounded border border-zinc-700/60">
                      #{sequentialId}
                    </span>
                  </td>

                  {/* 2. Date Column */}
                  <td className="py-2 px-1 sm:px-2 text-[10px] sm:text-[11px] font-semibold text-zinc-300 whitespace-nowrap text-center">
                    <div className="inline-flex items-center gap-0.5 sm:gap-1 bg-zinc-800/60 px-1 sm:px-2 py-0.5 rounded-md border border-zinc-700/50">
                      <Calendar className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-emerald-400 shrink-0" />
                      <span>{formatShortDate(t.date)}</span>
                    </div>
                  </td>

                  {/* 3. Name */}
                  <td className="py-2 px-1.5 sm:px-3">
                    <div className="flex items-center gap-1 sm:gap-1.5 min-w-0">
                      <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-md flex items-center justify-center shrink-0 border ${isIn ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800/50' : 'bg-rose-950/80 text-rose-400 border-rose-800/50'}`}>
                        {isIn ? <ArrowDownLeft className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> : <ArrowUpRight className="w-2.5 h-2.5 sm:w-3 sm:h-3" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-[11px] sm:text-xs font-semibold text-zinc-100 block leading-snug truncate">{t.name}</span>
                        {t.category && (
                          <div className="mt-0.5">
                            <PaymentMethodBadge method={t.category} size="sm" />
                          </div>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* 4. Amount */}
                  <td className="py-2 px-1.5 sm:px-3 font-bold whitespace-nowrap tabular-nums">
                    <div className="flex items-center gap-1 sm:gap-1.5">
                      <span className={`font-extrabold font-mono text-xs sm:text-sm tracking-tight ${isIn ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {formattedEnglishAmount}
                        <span className="text-[9px] sm:text-[10px] font-normal mr-0.5 text-zinc-400">{currency}</span>
                      </span>
                      <span className={`text-[8px] sm:text-[9px] px-1 sm:px-1.5 py-0.2 rounded-full font-bold border ${isIn ? 'bg-emerald-950 text-emerald-400 border-emerald-800/50' : 'bg-rose-950 text-rose-400 border-rose-800/50'}`}>
                        {isIn ? 'وارد' : 'صادر'}
                      </span>
                    </div>
                  </td>

                  {/* 5. Details */}
                  {showDetails && (
                    <td className="py-2 px-1.5 sm:px-3 text-zinc-400 max-w-[140px] sm:max-w-[200px]">
                      {t.details ? (
                        <p className="text-[10px] sm:text-xs leading-relaxed text-zinc-300 line-clamp-2">
                          {t.details}
                        </p>
                      ) : (
                        <span className="text-zinc-600 text-xs italic">-</span>
                      )}
                    </td>
                  )}

                  {/* 6. Actions */}
                  <td className="py-2 px-1 sm:px-3 whitespace-nowrap text-center">
                    {deleteConfirmId === t.id ? (
                      <div className="flex items-center justify-center gap-0.5 sm:gap-1">
                        <button
                          onClick={() => {
                            onDelete(t.id);
                            setDeleteConfirmId(null);
                          }}
                          className="px-1.5 py-0.5 rounded bg-rose-600 text-white text-[10px] sm:text-xs font-bold hover:bg-rose-500 transition-colors cursor-pointer"
                        >
                          حذف
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(null)}
                          className="px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 text-[10px] sm:text-xs font-bold hover:bg-zinc-700 transition-colors cursor-pointer"
                        >
                          إلغاء
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-0.5 sm:gap-1">
                        <button
                          onClick={() => onEdit(t)}
                          className="p-1 rounded text-zinc-400 hover:text-emerald-400 hover:bg-zinc-800 transition-colors cursor-pointer"
                          title="تعديل الحركة"
                        >
                          <Edit2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(t.id)}
                          className="p-1 rounded text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 transition-colors cursor-pointer"
                          title="حذف الحركة"
                        >
                          <Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                        </button>
                      </div>
                    )}
                  </td>

                  {/* 7. Select Checkbox Column */}
                  <td className="py-2 px-1 sm:px-2 text-center whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleSelect(t.id)}
                      className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded bg-zinc-800 border-zinc-700 text-emerald-600 focus:ring-emerald-500 focus:ring-offset-zinc-900 cursor-pointer accent-emerald-500"
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

    </div>
  );
};
