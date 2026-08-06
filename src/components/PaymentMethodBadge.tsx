import React from 'react';
import { Banknote, Smartphone, Zap, Wallet } from 'lucide-react';

interface PaymentMethodBadgeProps {
  method?: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const PaymentMethodBadge: React.FC<PaymentMethodBadgeProps> = ({
  method = 'كاش',
  size = 'sm',
  showLabel = true,
}) => {
  const normMethod = (method || '').trim().toLowerCase();

  // Determine type: 'instapay' | 'wallet' | 'cash' | 'other'
  const isInstaPay = normMethod.includes('انستاباي') || normMethod.includes('انستا') || normMethod.includes('instapay') || normMethod.includes('insta');
  const isWallet = normMethod.includes('محفظة') || normMethod.includes('فودافون') || normMethod.includes('اتصالات') || normMethod.includes('اورنج') || normMethod.includes('وي') || normMethod.includes('wallet') || normMethod.includes('vodafone');
  const isCash = normMethod.includes('كاش') || normMethod.includes('نقدي') || normMethod.includes('cash') || !method;

  // Sizes styling with uniform width & compact height
  const sizeClasses = {
    sm: {
      badge: 'h-4.5 px-1.5 text-[9px] sm:text-[10px] gap-1 min-w-[54px]',
      icon: 'w-2.5 h-2.5 sm:w-3 sm:h-3',
    },
    md: {
      badge: 'h-6 px-2 text-xs gap-1.5 min-w-[68px]',
      icon: 'w-3.5 h-3.5',
    },
    lg: {
      badge: 'h-7 px-3 text-sm gap-2 min-w-[80px]',
      icon: 'w-4 h-4',
    },
  }[size];

  const baseBadge = `inline-flex items-center justify-center font-bold rounded-md border shadow-2xs whitespace-nowrap ${sizeClasses.badge}`;

  if (isInstaPay) {
    return (
      <span
        className={`${baseBadge} bg-purple-950/80 text-purple-300 border-purple-500/40`}
        title="انستاباي - InstaPay"
      >
        <Zap className={`${sizeClasses.icon} text-purple-300 fill-purple-400 shrink-0`} />
        {showLabel && <span>انستاباي</span>}
      </span>
    );
  }

  if (isWallet) {
    return (
      <span
        className={`${baseBadge} bg-rose-950/80 text-rose-300 border-rose-500/40`}
        title="محفظة إلكترونية"
      >
        <Smartphone className={`${sizeClasses.icon} text-rose-300 shrink-0`} />
        {showLabel && <span>محفظة</span>}
      </span>
    );
  }

  if (isCash) {
    return (
      <span
        className={`${baseBadge} bg-emerald-950/80 text-emerald-300 border-emerald-500/40`}
        title="دفع كاش نقدي"
      >
        <Banknote className={`${sizeClasses.icon} text-emerald-300 shrink-0`} />
        {showLabel && <span>كاش</span>}
      </span>
    );
  }

  // Fallback for custom methods
  return (
    <span
      className={`${baseBadge} bg-zinc-800 text-zinc-300 border-zinc-700`}
    >
      <Wallet className={`${sizeClasses.icon} text-zinc-400 shrink-0`} />
      {showLabel && <span>{method}</span>}
    </span>
  );
};
