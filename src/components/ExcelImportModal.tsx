import React, { useState } from 'react';
import { Upload, FileSpreadsheet, Download, X, Check, AlertTriangle, FileText } from 'lucide-react';
import { Transaction } from '../types';
import { parseExcelFile, downloadSampleTemplate } from '../utils/excel';

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (parsedTransactions: Omit<Transaction, 'id' | 'createdAt'>[], mode: 'append' | 'replace') => void;
}

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({
  isOpen,
  onClose,
  onImport,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [parsedRows, setParsedRows] = useState<Omit<Transaction, 'id' | 'createdAt'>[]>([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [importMode, setImportMode] = useState<'append' | 'replace'>('append');

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setLoading(true);
    setErrorMessage('');

    const result = await parseExcelFile(selectedFile);
    setLoading(false);

    if (result.success) {
      setParsedRows(result.data);
    } else {
      setErrorMessage(result.error || 'حدث خطأ أثناء معالجة ملف الإكسيل');
      setParsedRows([]);
    }
  };

  const handleConfirmImport = () => {
    if (parsedRows.length === 0) return;
    onImport(parsedRows, importMode);
    handleReset();
    onClose();
  };

  const handleReset = () => {
    setFile(null);
    setParsedRows([]);
    setErrorMessage('');
    setImportMode('append');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-zinc-900 rounded-2xl border border-zinc-800 shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-zinc-950 border-b border-zinc-800 text-zinc-100">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-teal-950 text-teal-400 border border-teal-800/50">
              <FileSpreadsheet className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-bold text-base text-zinc-100">استيراد قاعدة بيانات إكسيل (XLSX)</h3>
              <p className="text-xs text-zinc-400">رفع وقراءة ملفات الحسابات من أوفيس إكسيل</p>
            </div>
          </div>

          <button
            onClick={() => {
              handleReset();
              onClose();
            }}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 overflow-y-auto">
          
          {/* Download Template Banner */}
          <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-emerald-400 shrink-0" />
              <div className="text-xs">
                <p className="font-bold text-emerald-300">هل تحتاج نموذج إكسيل جاهز للتعبئة؟</p>
                <p className="text-emerald-400/80">يمكنك تحميل قالب إكسيل معتمد يحتوي على كافة الأعمدة المطلوبة.</p>
              </div>
            </div>

            <button
              onClick={downloadSampleTemplate}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-sm shrink-0 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>تحميل النموذج</span>
            </button>
          </div>

          {/* Upload Area */}
          {!file && (
            <div className="border-2 border-dashed border-zinc-700/80 rounded-2xl p-8 text-center bg-zinc-950/40 hover:bg-zinc-800/40 transition-colors relative cursor-pointer group">
              <input
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              />
              <div className="w-12 h-12 rounded-full bg-emerald-950 text-emerald-400 flex items-center justify-center mx-auto mb-3 border border-emerald-800/50 group-hover:scale-110 transition-transform">
                <Upload className="w-6 h-6" />
              </div>
              <p className="font-bold text-zinc-200 text-sm mb-1">
                انقر هنا لاختيار ملف إكسيل (.xlsx, .csv)
              </p>
              <p className="text-xs text-zinc-400">
                يدعم الأعمدة: (الاسم، المبلغ، نوع الحركة، التفاصيل، التاريخ، طريقة الدفع)
              </p>
            </div>
          )}

          {loading && (
            <div className="text-center py-8">
              <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm font-bold text-zinc-300">جاري قراءة واستخراج بيانات الإكسيل...</p>
            </div>
          )}

          {errorMessage && (
            <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-800/60 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-rose-300 text-sm">تعذر استيراد الملف</p>
                <p className="text-xs text-rose-400 mt-0.5">{errorMessage}</p>
                <button
                  onClick={handleReset}
                  className="mt-2 text-xs font-bold text-rose-300 underline"
                >
                  حاول اختيار ملف آخر
                </button>
              </div>
            </div>
          )}

          {/* Preview Parsed Rows */}
          {parsedRows.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-zinc-200">
                    معاينة البيانات المستخرجة من الإكسيل
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-400 text-xs font-bold border border-emerald-800/50">
                    {parsedRows.length} سجل جاهز
                  </span>
                </div>

                <button
                  onClick={handleReset}
                  className="text-xs font-semibold text-zinc-400 hover:text-zinc-200"
                >
                  تغيير الملف
                </button>
              </div>

              <div className="max-h-56 overflow-y-auto border border-zinc-800 rounded-xl">
                <table className="w-full text-right text-xs">
                  <thead className="bg-zinc-950 sticky top-0 font-bold text-zinc-400 border-b border-zinc-800">
                    <tr>
                      <th className="p-2.5">الاسم</th>
                      <th className="p-2.5">المبلغ</th>
                      <th className="p-2.5">النوع</th>
                      <th className="p-2.5">التفاصيل</th>
                      <th className="p-2.5">التاريخ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60 text-zinc-200">
                    {parsedRows.map((row, idx) => (
                      <tr key={idx} className="hover:bg-zinc-800/40">
                        <td className="p-2.5 font-bold text-zinc-100">{row.name}</td>
                        <td className="p-2.5 font-bold text-emerald-400">{row.amount}</td>
                        <td className="p-2.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${row.type === 'IN' ? 'bg-emerald-950 text-emerald-400 border-emerald-800/50' : 'bg-rose-950 text-rose-400 border-rose-800/50'}`}>
                            {row.type === 'IN' ? 'وارد' : 'صادر'}
                          </span>
                        </td>
                        <td className="p-2.5 text-zinc-400 max-w-xs truncate">{row.details || '-'}</td>
                        <td className="p-2.5 text-zinc-400">{row.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Import Mode Selection */}
              <div className="p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800 space-y-2">
                <p className="text-xs font-bold text-zinc-300">طريقة الحفظ في قاعدة البيانات:</p>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <label className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer font-semibold ${importMode === 'append' ? 'bg-emerald-950/80 border-emerald-600 text-emerald-300' : 'bg-zinc-800/60 border-zinc-700/60 text-zinc-400'}`}>
                    <input
                      type="radio"
                      name="importMode"
                      checked={importMode === 'append'}
                      onChange={() => setImportMode('append')}
                      className="accent-emerald-500"
                    />
                    <span>دمج وإضافة للبيانات الحالية</span>
                  </label>

                  <label className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer font-semibold ${importMode === 'replace' ? 'bg-rose-950/80 border-rose-600 text-rose-300' : 'bg-zinc-800/60 border-zinc-700/60 text-zinc-400'}`}>
                    <input
                      type="radio"
                      name="importMode"
                      checked={importMode === 'replace'}
                      onChange={() => setImportMode('replace')}
                      className="accent-rose-500"
                    />
                    <span>استبدال البيانات الحالية بالكامل</span>
                  </label>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-zinc-950 border-t border-zinc-800 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              handleReset();
              onClose();
            }}
            className="px-4 py-2 rounded-xl border border-zinc-700 text-zinc-300 hover:bg-zinc-800 font-bold text-xs transition-colors cursor-pointer"
          >
            إلغاء
          </button>

          <button
            type="button"
            disabled={parsedRows.length === 0}
            onClick={handleConfirmImport}
            className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 disabled:text-zinc-600 disabled:cursor-not-allowed text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>تأكيد الاستيراد وحفظ البيانات</span>
          </button>
        </div>

      </div>
    </div>
  );
};
