import { AppSettings, Transaction } from '../types';

const TRANSACTIONS_KEY = 'finance_system_transactions_v2';
const SETTINGS_KEY = 'finance_system_settings_v2';

export const DEFAULT_SETTINGS: AppSettings = {
  currency: 'ج.م',
  isBalanceVisible: true, // Always visible balance summary
  language: 'ar',
};

// Initial realistic default data for instant demonstration
const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx-1001',
    name: 'مؤسسة الشروق للتجارة',
    amount: 12500,
    type: 'IN',
    details: 'دفعة سداد فاتورة توريد البضائع لشهر أغسطس',
    date: new Date(Date.now() - 86400000 * 1).toISOString().split('T')[0],
    category: 'انستاباي',
    createdAt: Date.now() - 86400000 * 1,
  },
  {
    id: 'tx-1002',
    name: 'شركة الكهرباء والطاقة',
    amount: 1850,
    type: 'OUT',
    details: 'فاتورة الكهرباء الخاصة بالفرع الرئيسي',
    date: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0],
    category: 'كاش',
    createdAt: Date.now() - 86400000 * 2,
  },
  {
    id: 'tx-1003',
    name: 'مهندس أحمد علي',
    amount: 4500,
    type: 'IN',
    details: 'مقابل خدمات الاستشارات البرمجية والدعم الفني',
    date: new Date(Date.now() - 86400000 * 3).toISOString().split('T')[0],
    category: 'محفظة',
    createdAt: Date.now() - 86400000 * 3,
  },
  {
    id: 'tx-1004',
    name: 'معرض الأثاث العصري',
    amount: 3200,
    type: 'OUT',
    details: 'شراء كراسي ومكاتب إضافية لقاعة الاجتماعات',
    date: new Date(Date.now() - 86400000 * 5).toISOString().split('T')[0],
    category: 'انستاباي',
    createdAt: Date.now() - 86400000 * 5,
  },
  {
    id: 'tx-1005',
    name: 'العميل محمود حسن',
    amount: 8000,
    type: 'IN',
    details: 'عربون حجز استشارة وتسليم تصاميم',
    date: new Date(Date.now() - 86400000 * 7).toISOString().split('T')[0],
    category: 'كاش',
    createdAt: Date.now() - 86400000 * 7,
  }
];

export function getStoredTransactions(): Transaction[] {
  try {
    const raw = localStorage.getItem(TRANSACTIONS_KEY);
    if (!raw) {
      localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(INITIAL_TRANSACTIONS));
      return INITIAL_TRANSACTIONS;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to parse stored transactions:', err);
    return INITIAL_TRANSACTIONS;
  }
}

export function saveTransactions(transactions: Transaction[]): void {
  try {
    localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(transactions));
  } catch (err) {
    console.error('Failed to save transactions:', err);
  }
}

export function getStoredSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(DEFAULT_SETTINGS));
      return DEFAULT_SETTINGS;
    }
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch (err) {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (err) {
    console.error('Failed to save settings:', err);
  }
}

// Format numbers nicely in English digits
export function formatCurrency(amount: number, currency = 'ج.م'): string {
  const formatted = new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(amount);
  return `${formatted} ${currency}`;
}
