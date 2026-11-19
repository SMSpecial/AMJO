import React, { useState } from 'react';
import { CheckCircle2, Lock, Scale, ShieldCheck, Smartphone, X } from 'lucide-react';
import { Language, UserSecurityState } from '../types/auction';
import { TRANSLATIONS } from '../i18n/translations';
import { sanitizeInput } from '../utils/security';

interface KycModalProps {
  open: boolean;
  onClose: () => void;
  security: UserSecurityState;
  onCompleteKyc: (fullName: string, docNumber: string, depositBoostUsd: number) => void;
  lang: Language;
  csrfToken: string;
}

export const KycModal: React.FC<KycModalProps> = ({
  open,
  onClose,
  security,
  onCompleteKyc,
  lang,
  csrfToken,
}) => {
  const t = TRANSLATIONS[lang];
  const [fullName, setFullName] = useState(security.kycFullName || 'Zaid Al-Khatib');
  const [docNumber, setDocNumber] = useState(security.kycDocumentNumber || 'JO-98810472');
  const [depositBoost, setDepositBoost] = useState(5000);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCompleteKyc(sanitizeInput(fullName), sanitizeInput(docNumber), depositBoost);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-lg rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121216] p-6 space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-[#C9A227]" />
            <h2 className="font-display text-lg font-bold text-zinc-950 dark:text-white">
              {t.kycModalTitle}
            </h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="p-1 text-zinc-400 hover:text-zinc-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">{t.kycModalDesc}</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="hidden" name="_csrf" value={csrfToken} />
          <div>
            <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
              Legal Full Name / Company Trade Name
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
              National ID / Passport / Commercial Registration #
            </label>
            <input
              type="text"
              required
              value={docNumber}
              onChange={(e) => setDocNumber(e.target.value)}
              className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
              Initial Escrow Verification Deposit (USD Equivalent)
            </label>
            <select
              value={depositBoost}
              onChange={(e) => setDepositBoost(Number(e.target.value))}
              className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900"
            >
              <option value={0}>Verify Identity Only ($0 added)</option>
              <option value={5000}>+$5,000 USD ($50,000 Bidding Power)</option>
              <option value={15000}>+$15,000 USD ($150,000 Bidding Power)</option>
              <option value={30000}>+$30,000 USD ($300,000 Bidding Power)</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-[#C9A227] text-zinc-950 text-xs font-semibold hover:bg-[#D4AF37]"
            >
              {security.kycVerified ? 'Update KYC & Deposit' : 'Complete KYC Verification'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface TwoFaModalProps {
  open: boolean;
  onClose: () => void;
  enabled: boolean;
  onToggle2Fa: (enable: boolean) => void;
  lang: Language;
}

export const TwoFaModal: React.FC<TwoFaModalProps> = ({
  open,
  onClose,
  enabled,
  onToggle2Fa,
  lang,
}) => {
  const t = TRANSLATIONS[lang];
  const [totpCode, setTotpCode] = useState('482910');

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121216] p-6 space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <Smartphone className="w-5 h-5 text-[#C9A227]" />
            <h2 className="font-display text-lg font-bold text-zinc-950 dark:text-white">
              {t.twoFaModalTitle}
            </h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="p-1 text-zinc-400 hover:text-zinc-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">{t.twoFaModalDesc}</p>

        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 flex items-center gap-4">
          {/* Deterministic Authenticator QR Matrix SVG */}
          <svg viewBox="0 0 64 64" className="w-16 h-16 shrink-0 bg-white p-1.5 rounded">
            <rect x="4" y="4" width="16" height="16" fill="#09090B" />
            <rect x="8" y="8" width="8" height="8" fill="#FFFFFF" />
            <rect x="10" y="10" width="4" height="4" fill="#09090B" />
            <rect x="44" y="4" width="16" height="16" fill="#09090B" />
            <rect x="48" y="8" width="8" height="8" fill="#FFFFFF" />
            <rect x="50" y="10" width="4" height="4" fill="#09090B" />
            <rect x="4" y="44" width="16" height="16" fill="#09090B" />
            <rect x="8" y="48" width="8" height="8" fill="#FFFFFF" />
            <rect x="10" y="50" width="4" height="4" fill="#09090B" />
            <rect x="26" y="10" width="12" height="6" fill="#09090B" />
            <rect x="26" y="24" width="14" height="14" fill="#09090B" />
            <rect x="44" y="28" width="14" height="12" fill="#09090B" />
            <rect x="28" y="44" width="16" height="12" fill="#09090B" />
          </svg>
          <div className="space-y-1 text-xs">
            <p className="font-semibold text-zinc-950 dark:text-white">AMJO TOTP Key</p>
            <p className="font-mono text-[11px] text-[#9A7414] dark:text-[#D4AF37]">
              JBSW Y3DP EHPK 3PXP
            </p>
            <p className="text-[11px] text-zinc-500">Status: {enabled ? 'Active' : 'Inactive'}</p>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
            6-Digit Authenticator Code
          </label>
          <input
            type="text"
            maxLength={6}
            value={totpCode}
            onChange={(e) => setTotpCode(e.target.value)}
            className="w-full px-3 py-2 text-sm font-mono tracking-widest rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900"
          />
        </div>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs font-medium"
          >
            Close
          </button>
          <button
            type="button"
            onClick={() => {
              onToggle2Fa(!enabled);
              onClose();
            }}
            className={`px-4 py-2 rounded-lg text-xs font-semibold ${
              enabled
                ? 'bg-rose-600 text-white'
                : 'bg-emerald-600 text-white'
            }`}
          >
            {enabled ? 'Disable 2FA' : 'Enable 2FA Protection'}
          </button>
        </div>
      </div>
    </div>
  );
};

interface ComplianceModalProps {
  open: boolean;
  onClose: () => void;
  lang: Language;
}

export const ComplianceModal: React.FC<ComplianceModalProps> = ({ open, onClose, lang }) => {
  const t = TRANSLATIONS[lang];
  const [section, setSection] = useState<'terms' | 'aml' | 'privacy' | 'escrow'>('escrow');

  if (!open) return null;

  const content = {
    escrow: {
      en: 'All vehicle settlements and refundable bidder security deposits on AMJO are held in segregated escrow accounts regulated under Jordan Free Zones & International Maritime Escrow standards. Seller payout is released strictly after VIN & Title transfer verification.',
      ar: 'تُحفظ جميع تسويات المركبات وتأمينات المزايدين المستردة في منصة أمجو ضمن حسابات ضمان مستقلة (Escrow) خاضعة لمعايير المناطق الحرة الأردنية. لا يُفرج عن مستحقات البائع إلا بعد مطابقة رقم الشاصي ونقل الملكية.',
    },
    terms: {
      en: 'Every bid placed in a live AMJO auction room constitutes a legally binding purchase commitment. Anti-sniping protection automatically extends lot closing by 120 seconds when a bid is submitted within the final 30 seconds.',
      ar: 'تُعد كل مزايدة مسجلة في قاعة مزاد أمجو المباشرة التزاماً قانونياً ملزماً بالشراء. يقوم نظام منع القنص بتمديد وقت الإغلاق 120 ثانية تلقائياً عند ورود مزايدة خلال آخر 30 ثانية.',
    },
    aml: {
      en: 'AMJO enforces strict Anti-Money Laundering (AML) and Know Your Customer (KYC) screening aligned with FATF guidelines. Cross-border wire transfers above $25,000 USD require verified beneficial ownership documentation.',
      ar: 'تطبق منصة أمجو ضوابط صارمة لمكافحة غسل الأموال (AML) واعرف عميلك (KYC) وفق توصيات FATF الدولية. تتطلب الحوالات العابرة للحدود فوق 25,000 دولار توثيق الهوية أو السجل التجاري.',
    },
    privacy: {
      en: 'Bidder identities in public auction ledgers are strictly anonymized (e.g., Bidder_JO***). Sensitive KYC documents and proxy bid ceilings are encrypted in transit and never disclosed to rival bidders or sellers.',
      ar: 'تُخفى هويات المزايدين في السجل العام باستخدام رموز مشفرة (مثل Bidder_JO***). وتبقى وثائق الهوية وسقوف المزايدة التلقائية سرية تماماً ولا تُكشف للمنافسين.',
    },
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-2xl rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121216] p-6 space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <Scale className="w-5 h-5 text-[#C9A227]" />
            <h2 className="font-display text-lg font-bold text-zinc-950 dark:text-white">
              {t.complianceModalTitle}
            </h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="p-1 text-zinc-400 hover:text-zinc-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {(
            [
              { id: 'escrow', label: 'Escrow Protection' },
              { id: 'terms', label: 'Terms of Auction' },
              { id: 'aml', label: 'AML Compliance' },
              { id: 'privacy', label: 'Privacy Policy' },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSection(item.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                section === item.id
                  ? 'bg-zinc-950 text-white dark:bg-[#C9A227] dark:text-zinc-950'
                  : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 text-sm text-zinc-700 dark:text-zinc-200 leading-relaxed">
          {content[section][lang]}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs text-zinc-500 dark:text-zinc-400">
          <span className="inline-flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-emerald-500" />
            <span>{t.escrowBadgeText}</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#C9A227]" />
            <span>{t.certifiedBadgeText}</span>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-zinc-950 dark:bg-zinc-100 text-white dark:text-zinc-950 font-semibold"
          >
            Acknowledge
          </button>
        </div>
      </div>
    </div>
  );
};
