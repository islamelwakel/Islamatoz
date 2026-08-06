export type TransactionType = 'IN' | 'OUT';

export interface Transaction {
  id: string;
  name: string;          // الاسم
  amount: number;        // المبلغ
  type: TransactionType; // نوع الحركة: وارد (IN) / صادر (OUT)
  details: string;       // التفاصيل (أسفل الاسم والمبلغ)
  date: string;          // التاريخ YYYY-MM-DD
  category?: string;     // طريقة الدفع (كاش / انستاباي / محفظة)
  createdAt: number;     // وقت الإنشاء
}

export interface FilterOptions {
  searchName: string;   // بحث بالاسم أو التفاصيل
  startDate: string;    // من تاريخ
  endDate: string;      // إلى تاريخ
  type: 'ALL' | 'IN' | 'OUT'; // نوع الحركة
  category: string;     // طريقة الدفع
}

export interface FinancialStats {
  totalIn: number;      // إجمالي الوارد
  totalOut: number;     // إجمالي الصادر
  netBalance: number;   // المبلغ الكلي / الصافي
  transactionCount: number;
}

export type Language = 'ar' | 'en';

export interface AppSettings {
  currency: string;
  isBalanceVisible: boolean; // إخفاء المبلغ الكلي افتراضياً إلا بعد الضغط على العين
  language: Language;
}
