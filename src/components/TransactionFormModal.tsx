import React, { useState, useEffect } from 'react';
import { X, Check, ArrowUpRight, ArrowDownLeft, FileText, Calendar, Wallet, DollarSign, User, Banknote, Smartphone, Zap } from 'lucide-react';
import { Transaction, TransactionType } from '../types';

interface TransactionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (transactionData: Omit<Transaction, 'id' | 'createdAt'>, editId?: string) => void;
  editingTransaction?: Transaction | null;
}

export const TransactionFormModal: React.FC<TransactionFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingTransaction,
}) => {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TransactionType>('IN');
  const [details, setDetails] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState('كاش');
  const [error, setError] = useState('');

  useEffect(() => {
    if (editingTransaction) {
      setName(editingTransaction.name || '');
      setAmount(editingTransaction.amount?.toString() || '');
      setType(editingTransaction.type || 'IN');
      setDetails(editingTransaction.details || '');
      setDate(editingTransaction.date || new Date().toISOString().split('T')[0]);
      setCategory(editingTransaction.category || 'كاش');
    } else {
      // Default reset
      setName('');
      setAmount('');
      setType('IN');
      setDetails('');
      setDate(new Date().toISOString().split('T')[0]);
      setCategory('كاش');
    }
    setError('');
  }, [editingTransaction, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError('يرجى إدخال اسم الجهة أو العميل');
      return;
    }

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setError('يرجى إدخال مبلغ مالي صحيح أكبر من الصفر');
      return;
    }

    onSave(
      {
        name: name.trim(),
        amount: numericAmount,
        type: type,
        details: details.trim(),
        date: date,
        category: category.trim() || 'كاش',
      },
      editingTransaction?.id
    );

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-zinc-900 rounded-2xl border border-zinc-800 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-zinc-950 border-b border-zinc-800 text-zinc-100">
          <div className="flex items-center gap-2.5">
            <span className={`p-2 rounded-xl border ${type === 'IN' ? 'bg-emerald-950 text-emerald-400 border-emerald-800/50' : 'bg-rose-950 text-rose-400 border-rose-800/50'}`}>
              {type === 'IN' ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
            </span>
            <h3 className="font-bold text-base text-zinc-100">
              {editingTransaction ? 'تعديل الحركة المالية' : 'إضافة حركة مالية جديدة'}
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          
          {error && (
            <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800/60 text-rose-300 text-xs font-semibold">
              {error}
            </div>
          )}

          {/* 1. Transaction Type Selector (وارد / صادر) */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">
              نوع الحركة المالية
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setType('IN')}
                className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl border font-bold text-sm transition-all cursor-pointer ${
                  type === 'IN'
                    ? 'bg-emerald-950/80 border-emerald-600 text-emerald-400 shadow-sm'
                    : 'bg-zinc-800/60 border-zinc-700/60 text-zinc-400 hover:bg-zinc-800'
                }`}
              >
                <ArrowDownLeft className={`w-4 h-4 ${type === 'IN' ? 'text-emerald-400' : 'text-zinc-500'}`} />
                <span>وارد (دخل / إيداع)</span>
              </button>

              <button
                type="button"
                onClick={() => setType('OUT')}
                className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl border font-bold text-sm transition-all cursor-pointer ${
                  type === 'OUT'
                    ? 'bg-rose-950/80 border-rose-600 text-rose-400 shadow-sm'
                    : 'bg-zinc-800/60 border-zinc-700/60 text-zinc-400 hover:bg-zinc-800'
                }`}
              >
                <ArrowUpRight className={`w-4 h-4 ${type === 'OUT' ? 'text-rose-400' : 'text-zinc-500'}`} />
                <span>صادر (مصروف / دفع)</span>
              </button>
            </div>
          </div>

          {/* 2. Name (الاسم) & Amount (المبلغ) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Name field */}
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                الاسم (الجهة / العميل / الشركاء) <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-zinc-500 absolute right-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="شركة الأمل / أحمد محمود"
                  className="w-full pr-10 pl-3 py-2.5 rounded-xl border border-zinc-700 bg-zinc-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm font-medium text-zinc-100 placeholder-zinc-500 outline-none transition-all"
                />
              </div>
            </div>

            {/* Money Amount field */}
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                المبلغ المالي <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <DollarSign className="w-4 h-4 text-zinc-500 absolute right-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="number"
                  step="any"
                  min="0"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full pr-10 pl-3 py-2.5 rounded-xl border border-zinc-700 bg-zinc-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm font-bold text-zinc-100 placeholder-zinc-500 outline-none transition-all tabular-nums"
                />
              </div>
            </div>

          </div>

          {/* 3. DETAILS FIELD UNDER NAME AND AMOUNT */}
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">
              التفاصيل (ملاحظات الحركة والبيانات)
            </label>
            <div className="relative">
              <FileText className="w-4 h-4 text-zinc-500 absolute right-3.5 top-3" />
              <textarea
                rows={3}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="أدخل تفاصيل وملاحظات الحركة هنا..."
                className="w-full pr-10 pl-3 py-2.5 rounded-xl border border-zinc-700 bg-zinc-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition-all resize-none"
              />
            </div>
          </div>

          {/* 4. Date & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Date */}
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                التاريخ
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-zinc-500 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full pr-10 pl-3 py-2.5 rounded-xl border border-zinc-700 bg-zinc-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm font-medium text-zinc-100 outline-none transition-all"
                />
              </div>
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-2">
                طريقة الدفع
              </label>
              <div className="grid grid-cols-3 gap-2">
                {/* Cash Button - Green */}
                <button
                  type="button"
                  onClick={() => setCategory('كاش')}
                  className={`flex items-center justify-center gap-1.5 h-8 py-1 px-2 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                    category === 'كاش'
                      ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500 shadow-xs'
                      : 'bg-zinc-800/80 text-zinc-400 border-zinc-700/80 hover:bg-zinc-800 hover:text-zinc-200'
                  }`}
                >
                  <Banknote className={`w-3.5 h-3.5 ${category === 'كاش' ? 'text-emerald-400' : 'text-zinc-400'}`} />
                  <span>كاش</span>
                </button>

                {/* InstaPay Button - Purple */}
                <button
                  type="button"
                  onClick={() => setCategory('انستاباي')}
                  className={`flex items-center justify-center gap-1.5 h-8 py-1 px-2 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                    category === 'انستاباي'
                      ? 'bg-purple-950/90 text-purple-300 border-purple-500 shadow-xs'
                      : 'bg-zinc-800/80 text-zinc-400 border-zinc-700/80 hover:bg-zinc-800 hover:text-zinc-200'
                  }`}
                >
                  <Zap className={`w-3.5 h-3.5 ${category === 'انستاباي' ? 'text-purple-400 fill-purple-400' : 'text-zinc-400'}`} />
                  <span>انستاباي</span>
                </button>

                {/* Wallet Button - Red */}
                <button
                  type="button"
                  onClick={() => setCategory('محفظة')}
                  className={`flex items-center justify-center gap-1.5 h-8 py-1 px-2 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                    category === 'محفظة'
                      ? 'bg-rose-950/90 text-rose-300 border-rose-500 shadow-xs'
                      : 'bg-zinc-800/80 text-zinc-400 border-zinc-700/80 hover:bg-zinc-800 hover:text-zinc-200'
                  }`}
                >
                  <Smartphone className={`w-3.5 h-3.5 ${category === 'محفظة' ? 'text-rose-400' : 'text-zinc-400'}`} />
                  <span>محفظة</span>
                </button>
              </div>
            </div>

          </div>

          {/* Modal Actions */}
          <div className="pt-4 border-t border-zinc-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-zinc-700 text-zinc-300 hover:bg-zinc-800 font-medium text-sm transition-colors cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{editingTransaction ? 'تحديث البيانات' : 'حفظ الحركة المالية'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
