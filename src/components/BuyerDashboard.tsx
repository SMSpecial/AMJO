import React, { useState } from 'react';
import {
  CheckCircle2,
  CreditCard,
  Gavel,
  Heart,
  PackageCheck,
  Receipt,
  Truck,
  Wallet,
} from 'lucide-react';
import {
  AdminSettings,
  AppRoute,
  CurrencyCode,
  InvoiceRecord,
  Language,
  OfferEntry,
  UserSecurityState,
  Vehicle,
} from '../types/auction';
import { TRANSLATIONS } from '../i18n/translations';
import { convertToUsd, formatMoney } from '../utils/currency';
import { sanitizeNumericInput } from '../utils/security';
import { VehicleImage } from './VehicleImage';
import { CountdownTimer } from './CountdownTimer';

interface BuyerDashboardProps {
  vehicles: Vehicle[];
  watchlistIds: string[];
  toggleWatchlist: (id: string) => void;
  invoices: InvoiceRecord[];
  offers: OfferEntry[];
  onPayInvoice: (invoiceId: string) => void;
  onAddFunds: (amountUsd: number) => void;
  security: UserSecurityState;
  lang: Language;
  currency: CurrencyCode;
  adminSettings: AdminSettings;
  nowMs: number;
  navigate: (route: AppRoute) => void;
  csrfToken: string;
}

type BuyerTab = 'bids' | 'watchlist' | 'won' | 'wallet';

export const BuyerDashboard: React.FC<BuyerDashboardProps> = ({
  vehicles,
  watchlistIds,
  toggleWatchlist,
  invoices,
  offers,
  onPayInvoice,
  onAddFunds,
  security,
  lang,
  currency,
  adminSettings,
  nowMs,
  navigate,
  csrfToken,
}) => {
  const t = TRANSLATIONS[lang];
  const [activeTab, setActiveTab] = useState<BuyerTab>('bids');
  const [depositLocal, setDepositLocal] = useState<string>('2500');

  const activeBidVehicles = vehicles.filter((v) =>
    v.bidHistory.some((b) => b.isCurrentUser)
  );
  const watchlistedVehicles = vehicles.filter((v) => watchlistIds.includes(v.id));
  const biddingPowerUsd = security.walletBalanceUsd * security.biddingPowerMultiplier;

  const handleDepositSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = sanitizeNumericInput(depositLocal);
    const usd = Math.round(convertToUsd(num, currency, adminSettings.customRatesOverride));
    if (usd > 0) {
      onAddFunds(usd);
      setDepositLocal('');
    }
  };

  const logisticsSteps: Array<{ key: InvoiceRecord['logisticsStage']; en: string; ar: string }> = [
    { key: 'port_dispatch', en: 'Origin Dispatch', ar: 'التصدير من المنشأ' },
    { key: 'maritime_transit', en: 'Maritime Transit', ar: 'الشحن البحري' },
    { key: 'aqaba_customs', en: 'Aqaba Port Arrival', ar: 'ميناء العقبة' },
    { key: 'zarqa_clearance', en: 'Zarqa Free Zone', ar: 'منطقة حرة الزرقاء' },
    { key: 'delivered', en: 'Final Delivery', ar: 'تم التسليم' },
  ];

  return (
    <div className="space-y-8">
      {/* Header & Financial Summary */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-5 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-zinc-950 dark:text-white">
            {t.buyerDashTitle}
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            {security.kycVerified ? 'KYC Verified Account' : 'Standard Account (KYC Pending)'} ·{' '}
            {offers.length} Active Offers
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121216]">
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">{t.securityDepositLabel}</p>
            <p className="font-mono text-lg font-bold tabular-nums text-zinc-950 dark:text-white">
              {formatMoney(security.walletBalanceUsd, currency, lang, adminSettings.customRatesOverride)}
            </p>
          </div>
          <div className="px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121216]">
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">{t.biddingPowerLabel}</p>
            <p className="font-mono text-lg font-bold tabular-nums text-[#9A7414] dark:text-[#D4AF37]">
              {formatMoney(biddingPowerUsd, currency, lang, adminSettings.customRatesOverride)}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {(
          [
            { id: 'bids', label: `${t.buyerTabBids} (${activeBidVehicles.length})`, icon: Gavel },
            { id: 'watchlist', label: `${t.buyerTabWatchlist} (${watchlistedVehicles.length})`, icon: Heart },
            { id: 'won', label: `${t.buyerTabWon} (${invoices.length})`, icon: Receipt },
            { id: 'wallet', label: t.buyerTabWallet, icon: Wallet },
          ] as const
        ).map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
                activeTab === tab.id
                  ? 'bg-zinc-950 text-white dark:bg-[#C9A227] dark:text-zinc-950'
                  : 'bg-white dark:bg-[#121216] border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Active Bids */}
      {activeTab === 'bids' && (
        <div className="space-y-4">
          {activeBidVehicles.length === 0 ? (
            <div className="p-10 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121216] text-center space-y-3">
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                You have not placed any live bids in this session yet.
              </p>
              <button
                type="button"
                onClick={() => navigate({ view: 'catalog' })}
                className="px-4 py-2 rounded-lg bg-[#C9A227] text-zinc-950 text-xs font-semibold"
              >
                {t.heroPrimaryBtn}
              </button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {activeBidVehicles.map((v) => {
                const topBid = v.bidHistory[0];
                const isLeading = topBid?.isCurrentUser;
                return (
                  <div
                    key={v.id}
                    className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121216] flex gap-4 items-center"
                  >
                    <VehicleImage
                      src={v.imageUrl}
                      alt={v.model}
                      className="w-28 h-20 rounded-lg object-cover shrink-0"
                    />
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-[11px] text-zinc-500">{v.lotNumber}</span>
                        <span
                          className={`text-xs font-semibold ${
                            isLeading
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-amber-600 dark:text-amber-400'
                          }`}
                        >
                          {isLeading ? 'Leading Bid' : 'Outbid'}
                        </span>
                      </div>
                      <h3 className="font-display text-sm font-semibold truncate text-zinc-950 dark:text-white">
                        {v.year} {v.make} {v.model}
                      </h3>
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-sm font-bold tabular-nums">
                          {formatMoney(v.currentBidUsd, currency, lang, adminSettings.customRatesOverride)}
                        </span>
                        <CountdownTimer
                          endTimeMs={v.endTimeMs}
                          nowMs={nowMs}
                          saleStatus={v.saleStatus}
                          lang={lang}
                          compact
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => navigate({ view: 'lot', lotId: v.id })}
                      className="px-3 py-2 rounded-lg bg-zinc-950 dark:bg-zinc-100 text-white dark:text-zinc-950 text-xs font-semibold shrink-0"
                    >
                      {t.viewDossier}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Watchlist */}
      {activeTab === 'watchlist' && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {watchlistedVehicles.length === 0 ? (
            <div className="col-span-full p-10 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121216] text-center text-sm text-zinc-500">
              No vehicles in watchlist. Click the heart icon on any lot to track it here.
            </div>
          ) : (
            watchlistedVehicles.map((v) => (
              <div
                key={v.id}
                className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121216] space-y-3"
              >
                <div className="flex gap-3 items-center">
                  <VehicleImage
                    src={v.imageUrl}
                    alt={v.model}
                    className="w-24 h-16 rounded-lg object-cover shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-mono text-[11px] text-zinc-500">{v.lotNumber}</p>
                    <p className="font-display text-sm font-semibold truncate text-zinc-950 dark:text-white">
                      {v.year} {v.make} {v.model}
                    </p>
                    <p className="font-mono text-sm font-bold text-[#9A7414] dark:text-[#D4AF37]">
                      {formatMoney(v.currentBidUsd, currency, lang, adminSettings.customRatesOverride)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-800">
                  <button
                    type="button"
                    onClick={() => toggleWatchlist(v.id)}
                    className="text-xs text-rose-600 dark:text-rose-400 font-medium hover:underline"
                  >
                    Remove
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate({ view: 'lot', lotId: v.id })}
                    className="px-3 py-1.5 rounded-lg bg-[#C9A227] text-zinc-950 text-xs font-semibold"
                  >
                    {t.inspectAndBid}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 3: Won Vehicles, Invoices & Delivery Logistics Tracker */}
      {activeTab === 'won' && (
        <div className="space-y-6">
          {invoices.map((inv) => {
            const currentStageIdx = logisticsSteps.findIndex((s) => s.key === inv.logisticsStage);
            return (
              <div
                key={inv.id}
                className="p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121216] space-y-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
                  <div>
                    <p className="font-mono text-xs text-zinc-500 dark:text-zinc-400">
                      {inv.id} · {inv.lotNumber} · {inv.issuedAt}
                    </p>
                    <h3 className="font-display text-lg font-bold text-zinc-950 dark:text-white">
                      {inv.vehicleTitle}
                    </h3>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`text-xs font-semibold inline-flex items-center gap-1.5 ${
                        inv.status === 'paid'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-amber-600 dark:text-amber-400'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{inv.status === 'paid' ? 'Paid in Escrow' : 'Escrow Pending Wire'}</span>
                    </span>
                    {inv.status !== 'paid' && (
                      <button
                        type="button"
                        onClick={() => onPayInvoice(inv.id)}
                        className="px-4 py-2 rounded-lg bg-[#C9A227] text-zinc-950 text-xs font-semibold hover:bg-[#D4AF37]"
                      >
                        Settle Invoice Now
                      </button>
                    )}
                  </div>
                </div>

                {/* Invoice Math */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  <div>
                    <p className="text-zinc-500">{t.calcBidPrice}</p>
                    <p className="font-mono font-semibold text-sm mt-0.5 tabular-nums">
                      {formatMoney(inv.winningBidUsd, currency, lang, adminSettings.customRatesOverride)}
                    </p>
                  </div>
                  <div>
                    <p className="text-zinc-500">{t.calcBuyerFee}</p>
                    <p className="font-mono font-semibold text-sm mt-0.5 tabular-nums">
                      {formatMoney(inv.buyerFeeUsd, currency, lang, adminSettings.customRatesOverride)}
                    </p>
                  </div>
                  <div>
                    <p className="text-zinc-500">{t.calcShipping}</p>
                    <p className="font-mono font-semibold text-sm mt-0.5 tabular-nums">
                      {formatMoney(inv.shippingUsd, currency, lang, adminSettings.customRatesOverride)}
                    </p>
                  </div>
                  <div>
                    <p className="text-zinc-500">Total Payable</p>
                    <p className="font-mono font-bold text-base mt-0.5 tabular-nums text-[#9A7414] dark:text-[#D4AF37]">
                      {formatMoney(inv.totalUsd, currency, lang, adminSettings.customRatesOverride)}
                    </p>
                  </div>
                </div>

                {/* Delivery Logistics Tracker */}
                <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800/80 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                    <Truck className="w-4 h-4 text-[#C9A227]" />
                    <span>{t.logisticsTitle}</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {logisticsSteps.map((st, idx) => {
                      const done = idx <= currentStageIdx;
                      return (
                        <div
                          key={st.key}
                          className={`p-2.5 rounded-lg border text-xs ${
                            done
                              ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-semibold'
                              : 'border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-mono">0{idx + 1}</span>
                            {done && <PackageCheck className="w-3.5 h-3.5" />}
                          </div>
                          <p className="truncate">{lang === 'ar' ? st.ar : st.en}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab 4: Deposit Wallet */}
      {activeTab === 'wallet' && (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121216] space-y-4">
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-[#C9A227]" />
              <h2 className="font-display text-lg font-semibold text-zinc-950 dark:text-white">
                {t.addFundsTitle}
              </h2>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Every 1 unit deposited unlocks 10x verified bidding power across all global AMJO auction rooms. Deposits are held in segregated Jordan Central Bank-compliant escrow and remain 100% refundable.
            </p>
            <form onSubmit={handleDepositSubmit} className="space-y-3">
              <input type="hidden" name="_csrf" value={csrfToken} />
              <div className="flex gap-2">
                <input
                  type="number"
                  min={100}
                  value={depositLocal}
                  onChange={(e) => setDepositLocal(e.target.value)}
                  className="flex-1 px-3 py-2.5 text-sm font-mono rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900"
                />
                <span className="px-3 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 font-mono text-xs font-semibold flex items-center">
                  {currency}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {[1000, 5000, 10000].map((presetUsd) => (
                  <button
                    key={presetUsd}
                    type="button"
                    onClick={() => onAddFunds(presetUsd)}
                    className="px-3 py-1.5 rounded-md border border-zinc-200 dark:border-zinc-800 text-xs font-mono hover:border-[#C9A227]"
                  >
                    + {formatMoney(presetUsd, currency, lang, adminSettings.customRatesOverride)}
                  </button>
                ))}
              </div>
              <button
                type="submit"
                className="w-full py-2.5 rounded-lg bg-[#C9A227] text-zinc-950 text-xs font-semibold hover:bg-[#D4AF37]"
              >
                {t.addFundsBtn}
              </button>
            </form>
          </div>

          <div className="p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121216] space-y-4">
            <h3 className="font-display text-base font-semibold text-zinc-950 dark:text-white">
              Escrow & Bidding Power Rules
            </h3>
            <ul className="space-y-2.5 text-xs text-zinc-600 dark:text-zinc-300">
              <li className="flex justify-between py-2 border-b border-zinc-100 dark:border-zinc-800">
                <span>Current Escrow Deposit</span>
                <span className="font-mono font-bold tabular-nums">
                  {formatMoney(security.walletBalanceUsd, currency, lang, adminSettings.customRatesOverride)}
                </span>
              </li>
              <li className="flex justify-between py-2 border-b border-zinc-100 dark:border-zinc-800">
                <span>Authorized Leverage Tier</span>
                <span className="font-mono font-bold">10x Standard Institutional</span>
              </li>
              <li className="flex justify-between py-2">
                <span>Total Authorized Bidding Limit</span>
                <span className="font-mono font-bold text-[#9A7414] dark:text-[#D4AF37] tabular-nums">
                  {formatMoney(biddingPowerUsd, currency, lang, adminSettings.customRatesOverride)}
                </span>
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};
