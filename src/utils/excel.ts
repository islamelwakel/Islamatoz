import * as XLSX from 'xlsx';
import { Transaction, TransactionType } from '../types';

// Export transactions array to XLSX file
export function exportToExcel(transactions: Transaction[], filename = 'الحسابات_المالية.xlsx') {
  // Format data for Excel with clear Arabic & English headers
  const data = transactions.map((t, index) => ({
    'م': index + 1,
    'الاسم': t.name,
    'المبلغ': t.amount,
    'نوع الحركة': t.type === 'IN' ? 'وارد' : 'صادر',
    'التفاصيل': t.details || '',
    'التاريخ': t.date,
    'طريقة الدفع': t.category || 'كاش',
    'رقم المعاملة': t.id,
  }));

  // Create worksheet
  const worksheet = XLSX.utils.json_to_sheet(data);

  // Set column widths
  worksheet['!cols'] = [
    { wch: 5 },   // م
    { wch: 22 },  // الاسم
    { wch: 15 },  // المبلغ
    { wch: 15 },  // نوع الحركة
    { wch: 35 },  // التفاصيل
    { wch: 15 },  // التاريخ
    { wch: 15 },  // طريقة الدفع
    { wch: 20 },  // رقم المعاملة
  ];

  // Create workbook and append worksheet
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'الحركات المالية');

  // Trigger download
  XLSX.writeFile(workbook, filename);
}

// Download a ready-to-use sample template for the user
export function downloadSampleTemplate() {
  const sampleData = [
    {
      'الاسم': 'شركة الأمل للمقاولات',
      'المبلغ': 15000,
      'نوع الحركة': 'وارد',
      'التفاصيل': 'دفعة مقدمة لمشروع تشطيب المكاتب',
      'التاريخ': new Date().toISOString().split('T')[0],
      'طريقة الدفع': 'انستاباي'
    },
    {
      'الاسم': 'مكتب المستلزمات الحديثة',
      'المبلغ': 3200,
      'نوع الحركة': 'صادر',
      'التفاصيل': 'شراء أجهزة ومعدات ورقية وأدوات مكتبية',
      'التاريخ': new Date().toISOString().split('T')[0],
      'طريقة الدفع': 'كاش'
    },
    {
      'الاسم': 'أحمد محمود',
      'المبلغ': 5000,
      'نوع الحركة': 'وارد',
      'التفاصيل': 'سداد قسط خدمات استشارية',
      'التاريخ': new Date().toISOString().split('T')[0],
      'طريقة الدفع': 'محفظة'
    }
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleData);
  worksheet['!cols'] = [
    { wch: 22 },
    { wch: 15 },
    { wch: 15 },
    { wch: 35 },
    { wch: 15 },
    { wch: 15 }
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'نموذج الحسابات');
  XLSX.writeFile(workbook, 'قالب_استيراد_الحسابات.xlsx');
}

// Parse uploaded Excel file and return array of Transactions
export async function parseExcelFile(file: File): Promise<{ success: boolean; data: Omit<Transaction, 'id' | 'createdAt'>[]; error?: string }> {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const buffer = e.target?.result;
        if (!buffer) {
          resolve({ success: false, data: [], error: 'ملف غير صالح أو فارغ' });
          return;
        }

        const workbook = XLSX.read(buffer, { type: 'binary', cellDates: true });
        const firstSheetName = workbook.SheetNames[0];
        if (!firstSheetName) {
          resolve({ success: false, data: [], error: 'لم يتم العثور على أوراق عمل داخل ملف إكسيل' });
          return;
        }

        const worksheet = workbook.Sheets[firstSheetName];
        const rawJson: Record<string, any>[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (!rawJson || rawJson.length === 0) {
          resolve({ success: false, data: [], error: 'ملف الإكسيل فارغ ولا يحتوي على بيانات' });
          return;
        }

        const parsedTransactions: Omit<Transaction, 'id' | 'createdAt'>[] = [];

        for (let i = 0; i < rawJson.length; i++) {
          const row = rawJson[i];

          // Flexible field mapping for Arabic and English header columns
          const name = String(row['الاسم'] || row['Name'] || row['اسم'] || row['العميل'] || row['جهة'] || '').trim();
          const rawAmount = row['المبلغ'] || row['Amount'] || row['مبلغ'] || row['Value'] || 0;
          const rawType = String(row['نوع الحركة'] || row['النوع'] || row['Type'] || row['الحركة'] || 'وارد').trim().toLowerCase();
          const details = String(row['التفاصيل'] || row['Details'] || row['تفاصيل'] || row['ملاحظات'] || row['Notes'] || '').trim();
          const rawDate = row['التاريخ'] || row['Date'] || row['تاريخ'] || new Date().toISOString().split('T')[0];
          const category = String(row['طريقة الدفع'] || row['طريقة دفع'] || row['Payment Method'] || row['التصنيف'] || row['Category'] || row['تصنيف'] || 'كاش').trim();

          // Parse amount
          const amount = Math.abs(parseFloat(String(rawAmount).replace(/[^0-9.-]+/g, '')) || 0);

          // Skip completely empty rows
          if (!name && amount === 0) continue;

          // Determine transaction type
          let type: TransactionType = 'IN';
          if (
            rawType.includes('صادر') ||
            rawType.includes('مصروف') ||
            rawType.includes('خرج') ||
            rawType.includes('out') ||
            rawType.includes('expense') ||
            rawType.includes('debit') ||
            rawType.includes('دفع')
          ) {
            type = 'OUT';
          } else {
            type = 'IN';
          }

          // Format date
          let formattedDate = new Date().toISOString().split('T')[0];
          if (rawDate) {
            if (typeof rawDate === 'string' && rawDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
              formattedDate = rawDate;
            } else {
              const d = new Date(rawDate);
              if (!isNaN(d.getTime())) {
                formattedDate = d.toISOString().split('T')[0];
              }
            }
          }

          parsedTransactions.push({
            name: name || `معاملة ${i + 1}`,
            amount: amount,
            type: type,
            details: details,
            date: formattedDate,
            category: category || 'عام',
          });
        }

        if (parsedTransactions.length === 0) {
          resolve({
            success: false,
            data: [],
            error: 'تعذر التعرف على أعمدة الإكسيل. يرجى التأكد من استخدام الأسماء (الاسم، المبلغ، نوع الحركة، التفاصيل، التاريخ)'
          });
          return;
        }

        resolve({ success: true, data: parsedTransactions });
      } catch (err: any) {
        resolve({ success: false, data: [], error: err?.message || 'حدث خطأ أثناء قراءة ملف الإكسيل' });
      }
    };

    reader.onerror = () => {
      resolve({ success: false, data: [], error: 'فشلت عملية قراءة الملف' });
    };

    reader.readAsBinaryString(file);
  });
}
