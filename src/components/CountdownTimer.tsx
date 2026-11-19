import React from 'react';
import { Clock } from 'lucide-react';
import { Language, SaleStatus } from '../types/auction';
import { TRANSLATIONS } from '../i18n/translations';

interface CountdownTimerProps {
  endTimeMs: number;
  nowMs: number;
  saleStatus: SaleStatus;
  lang: Language;
  compact?: boolean;
  antiSnipingExtensions?: number;
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({
  endTimeMs,
  nowMs,
  saleStatus,
  lang,
  compact = false,
  antiSnipingExtensions = 0,
}) => {
  const t = TRANSLATIONS[lang];

  if (saleStatus === 'ended' || endTimeMs <= nowMs) {
    return (
      <span className="inline-flex items-center gap-1.5 font-mono text-xs tabular-nums text-zinc-500 dark:text-zinc-400">
        <Clock className="w-3.5 h-3.5" />
        <span>{t.auctionClosed}</span>
      </span>
    );
  }

  const diffSec = Math.max(0, Math.floor((endTimeMs - nowMs) / 1000));
  const days = Math.floor(diffSec / 86400);
  const hours = Math.floor((diffSec % 86400) / 3600);
  const mins = Math.floor((diffSec % 3600) / 60);
  const secs = diffSec % 60;

  const pad = (n: number) => String(n).padStart(2, '0');
  const isUrgent = saleStatus === 'live' && diffSec <= 120;
  const isSnipingZone = saleStatus === 'live' && diffSec <= 30;

  const formatted =
    days > 0
      ? `${days}d ${pad(hours)}:${pad(mins)}:${pad(secs)}`
      : `${pad(hours)}:${pad(mins)}:${pad(secs)}`;

  return (
    <div className={`inline-flex items-center gap-2 font-mono tabular-nums ${compact ? 'text-xs' : 'text-sm'}`}>
      <Clock
        className={`w-3.5 h-3.5 shrink-0 ${
          isSnipingZone
            ? 'text-rose-500'
            : isUrgent
            ? 'text-amber-500'
            : 'text-[#C9A227]'
        }`}
      />
      <span
        dir="ltr"
        className={`font-semibold ${
          isSnipingZone
            ? 'text-rose-600 dark:text-rose-400'
            : isUrgent
            ? 'text-amber-600 dark:text-amber-400'
            : 'text-zinc-900 dark:text-zinc-100'
        }`}
      >
        {formatted}
      </span>
      {!compact && antiSnipingExtensions > 0 && (
        <span className="text-[11px] font-sans text-amber-600 dark:text-amber-400">
          (+{antiSnipingExtensions * 2}m)
        </span>
      )}
    </div>
  );
};
