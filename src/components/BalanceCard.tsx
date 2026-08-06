import React from 'react';
import { TrendingUp, TrendingDown, WalletCards } from 'lucide-react';
import { FinancialStats } from '../types';
import { formatCurrency } from '../utils/storage';

interface BalanceCardProps {
  stats: FinancialStats;
  currency: string;
}

export const BalanceCard: React.FC<BalanceCardProps> = ({
  stats,
  currency,
}) => {
  const isPositive = stats.netBalance >= 0;
  const formattedCount = new Intl.NumberFormat('en-US').format(stats.transactionCount);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      
      {/* Main Card: Net Total Balance (المبلغ الكلي) */}
      <div className="col-span-1 md:col-span-2 bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex flex-col justify-between relative overflow-hidden shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-zinc-800 text-emerald-400 border border-zinc-700/60">
              <WalletCards className="w-5 h-5" />
            </span>
            <span className="text-sm font-medium text-zinc-400">
              المبلغ الكلي المتوفر (الرصيد الصافي)
            </span>
          </div>
        </div>

        <div className="my-2">
          <div className="flex items-baseline gap-2">
            <span className={`text-3xl sm:text-4xl font-extrabold font-mono tracking-tight tabular-nums ${isPositive ? 'text-white' : 'text-rose-400'}`}>
              {formatCurrency(stats.netBalance, currency)}
            </span>
          </div>
        </div>

        <div className="text-xs text-zinc-500 flex items-center justify-between border-t border-zinc-800/80 pt-3 mt-1">
          <span>عدد الحركات المسجلة:</span>
          <span className="font-bold font-mono text-zinc-300">{formattedCount} معاملة</span>
        </div>
      </div>

      {/* Total In (إجمالي الوارد) */}
      <div className="col-span-1 bg-emerald-900/20 border border-emerald-800/30 rounded-2xl p-5 flex flex-col justify-between hover:border-emerald-800/60 transition-colors">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-950 text-emerald-400 border border-emerald-800/50">
              <TrendingUp className="w-4 h-4" />
            </span>
            <span className="text-sm font-semibold text-emerald-400">
              إجمالي الوارد
            </span>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-900/40 text-emerald-300 border border-emerald-800/50">
            وارد
          </span>
        </div>

        <div className="my-2">
          <span className="text-2xl sm:text-3xl font-bold font-mono text-emerald-400 tabular-nums">
            {formatCurrency(stats.totalIn, currency)}
          </span>
        </div>

        <p className="text-xs text-emerald-500/80 mt-1">
          إجمالي الإيداعات والمقبوضات
        </p>
      </div>

      {/* Total Out (إجمالي الصادر) */}
      <div className="col-span-1 bg-rose-900/20 border border-rose-800/30 rounded-2xl p-5 flex flex-col justify-between hover:border-rose-800/60 transition-colors">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-rose-950 text-rose-400 border border-rose-800/50">
              <TrendingDown className="w-4 h-4" />
            </span>
            <span className="text-sm font-semibold text-rose-400">
              إجمالي الصادر
            </span>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-900/40 text-rose-300 border border-rose-800/50">
            صادر
          </span>
        </div>

        <div className="my-2">
          <span className="text-2xl sm:text-3xl font-bold font-mono text-rose-400 tabular-nums">
            {formatCurrency(stats.totalOut, currency)}
          </span>
        </div>

        <p className="text-xs text-rose-500/80 mt-1">
          إجمالي المصروفات والمدفوعات
        </p>
      </div>

    </div>
  );
};
