import { CurrencyCode, Language } from '../types/auction';

export interface CurrencyMeta {
  code: CurrencyCode;
  symbolEn: string;
  symbolAr: string;
  rateFromUsd: number;
  decimals: number;
  nameEn: string;
  nameAr: string;
}

export const CURRENCIES: Record<CurrencyCode, CurrencyMeta> = {
  JOD: {
    code: 'JOD',
    symbolEn: 'JOD',
    symbolAr: 'د.أ',
    rateFromUsd: 0.709,
    decimals: 0,
    nameEn: 'Jordanian Dinar',
    nameAr: 'دينار أردني',
  },
  USD: {
    code: 'USD',
    symbolEn: '$',
    symbolAr: '$',
    rateFromUsd: 1,
    decimals: 0,
    nameEn: 'US Dollar',
    nameAr: 'دولار أمريكي',
  },
  EUR: {
    code: 'EUR',
    symbolEn: '€',
    symbolAr: '€',
    rateFromUsd: 0.92,
    decimals: 0,
    nameEn: 'Euro',
    nameAr: 'يورو',
  },
  SAR: {
    code: 'SAR',
    symbolEn: 'SAR',
    symbolAr: 'ر.س',
    rateFromUsd: 3.75,
    decimals: 0,
    nameEn: 'Saudi Riyal',
    nameAr: 'ريال سعودي',
  },
  AED: {
    code: 'AED',
    symbolEn: 'AED',
    symbolAr: 'د.إ',
    rateFromUsd: 3.6725,
    decimals: 0,
    nameEn: 'UAE Dirham',
    nameAr: 'درهم إماراتي',
  },
  KWD: {
    code: 'KWD',
    symbolEn: 'KWD',
    symbolAr: 'د.ك',
    rateFromUsd: 0.307,
    decimals: 0,
    nameEn: 'Kuwaiti Dinar',
    nameAr: 'دينار كويتي',
  },
  GBP: {
    code: 'GBP',
    symbolEn: '£',
    symbolAr: '£',
    rateFromUsd: 0.785,
    decimals: 0,
    nameEn: 'British Pound',
    nameAr: 'جنيه إسترليني',
  },
  JPY: {
    code: 'JPY',
    symbolEn: '¥',
    symbolAr: '¥',
    rateFromUsd: 152.4,
    decimals: 0,
    nameEn: 'Japanese Yen',
    nameAr: 'ين ياباني',
  },
};

export const CURRENCY_ORDER: CurrencyCode[] = [
  'JOD',
  'USD',
  'EUR',
  'SAR',
  'AED',
  'KWD',
  'GBP',
  'JPY',
];

export function getEffectiveRate(
  code: CurrencyCode,
  overrides?: Partial<Record<CurrencyCode, number>>
): number {
  const custom = overrides?.[code];
  if (custom && Number.isFinite(custom) && custom > 0) {
    return custom;
  }
  return CURRENCIES[code].rateFromUsd;
}

export function convertFromUsd(
  amountUsd: number,
  target: CurrencyCode,
  overrides?: Partial<Record<CurrencyCode, number>>
): number {
  return amountUsd * getEffectiveRate(target, overrides);
}

export function convertToUsd(
  amountLocal: number,
  source: CurrencyCode,
  overrides?: Partial<Record<CurrencyCode, number>>
): number {
  const rate = getEffectiveRate(source, overrides);
  return rate > 0 ? amountLocal / rate : amountLocal;
}

export function formatMoney(
  amountUsd: number,
  currency: CurrencyCode,
  lang: Language,
  overrides?: Partial<Record<CurrencyCode, number>>,
  showExactDecimals = false
): string {
  const meta = CURRENCIES[currency];
  const converted = convertFromUsd(amountUsd, currency, overrides);
  const decimals = showExactDecimals && (currency === 'JOD' || currency === 'KWD') ? 2 : meta.decimals;

  const formattedNum = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(Math.round(converted * Math.pow(10, decimals)) / Math.pow(10, decimals));

  const symbol = lang === 'ar' ? meta.symbolAr : meta.symbolEn;
  if (symbol === '$' || symbol === '€' || symbol === '£' || symbol === '¥') {
    return `${symbol}${formattedNum}`;
  }
  return lang === 'ar' ? `${formattedNum} ${symbol}` : `${symbol} ${formattedNum}`;
}

export function getDynamicBidIncrementUsd(currentBidUsd: number): number {
  if (currentBidUsd < 15000) return 250;
  if (currentBidUsd < 40000) return 500;
  if (currentBidUsd < 100000) return 1000;
  return 2500;
}
