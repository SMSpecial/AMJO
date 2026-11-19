import React, { useState } from 'react';
import { Check, Flag, ShieldAlert, Sliders, Trash2, Users } from 'lucide-react';
import {
  AdminSettings,
  CurrencyCode,
  KycApplicant,
  Language,
  Vehicle,
} from '../types/auction';
import { CURRENCIES, CURRENCY_ORDER, formatMoney } from '../utils/currency';
import { TRANSLATIONS } from '../i18n/translations';

interface AdminCommandCenterProps {
  vehicles: Vehicle[];
  kycApplicants: KycApplicant[];
  adminSettings: AdminSettings;
  setAdminSettings: React.Dispatch<React.SetStateAction<AdminSettings>>;
  onApproveVehicle: (vehicleId: string) => void;
  onRejectVehicle: (vehicleId: string) => void;
  onModerateBid: (vehicleId: string, bidId: string, action: 'flag' | 'void') => void;
  onUpdateKycStatus: (applicantId: string, status: KycApplicant['status']) => void;
  lang: Language;
  currency: CurrencyCode;
}

type AdminTab = 'queue' | 'moderation' | 'kyc' | 'rates';

export const AdminCommandCenter: React.FC<AdminCommandCenterProps> = ({
  vehicles,
  kycApplicants,
  adminSettings,
  setAdminSettings,
  onApproveVehicle,
  onRejectVehicle,
  onModerateBid,
  onUpdateKycStatus,
  lang,
  currency,
}) => {
  const t = TRANSLATIONS[lang];
  const [tab, setTab] = useState<AdminTab>('queue');

  const pendingQueue = vehicles.filter((v) => v.approvalStatus === 'pending');
  const activeLots = vehicles.filter((v) => v.approvalStatus === 'approved' && v.saleStatus !== 'ended');
  const totalGmvUsd = vehicles.reduce((sum, v) => sum + v.currentBidUsd, 0) + 14800000;
  const totalEscrowUsd = kycApplicants.reduce((sum, k) => sum + k.depositUsd, 0) + 420000;

  const recentBids = vehicles.flatMap((v) =>
    v.bidHistory.slice(0, 3).map((b) => ({
      vehicleId: v.id,
      lotNumber: v.lotNumber,
      title: `${v.year} ${v.make} ${v.model}`,
      bid: b,
    }))
  );

  return (
    <div className="space-y-8">
      <div className="pb-4 border-b border-zinc-200 dark:border-zinc-800">
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-zinc-950 dark:text-white">
          {t.adminTitle}
        </h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
          Real-time auction approval queue, bid integrity moderation, KYC compliance, and global exchange overrides.
        </p>
      </div>

      {/* Platform KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121216]">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">{t.adminGmv}</p>
          <p className="mt-1 font-mono text-xl font-bold tabular-nums text-[#9A7414] dark:text-[#D4AF37]">
            {formatMoney(totalGmvUsd, currency, lang, adminSettings.customRatesOverride)}
          </p>
        </div>
        <div className="p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121216]">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">{t.adminActiveAuctions}</p>
          <p className="mt-1 font-mono text-xl font-bold tabular-nums text-zinc-950 dark:text-white">
            {activeLots.length}
          </p>
        </div>
        <div className="p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121216]">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">{t.adminVerifiedUsers}</p>
          <p className="mt-1 font-mono text-xl font-bold tabular-nums text-zinc-950 dark:text-white">
            {kycApplicants.filter((k) => k.status === 'verified').length} / {kycApplicants.length}
          </p>
        </div>
        <div className="p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121216]">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">{t.adminEscrowHeld}</p>
          <p className="mt-1 font-mono text-xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
            {formatMoney(totalEscrowUsd, currency, lang, adminSettings.customRatesOverride)}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {(
          [
            { id: 'queue', label: `${t.adminTabQueue} (${pendingQueue.length})`, icon: Check },
            { id: 'moderation', label: t.adminTabModeration, icon: ShieldAlert },
            { id: 'kyc', label: t.adminTabKyc, icon: Users },
            { id: 'rates', label: t.adminTabRates, icon: Sliders },
          ] as const
        ).map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
                tab === item.id
                  ? 'bg-zinc-950 text-white dark:bg-[#C9A227] dark:text-zinc-950'
                  : 'bg-white dark:bg-[#121216] border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Auction Approval Queue */}
      {tab === 'queue' && (
        <div className="p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121216] space-y-4">
          {pendingQueue.length === 0 ? (
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              All submitted vehicles have been reviewed. Submit a vehicle via Seller Portal to test live approval.
            </p>
          ) : (
            <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {pendingQueue.map((v) => (
                <div key={v.id} className="py-4 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="font-mono text-xs text-zinc-500">
                      {v.lotNumber} · VIN: {v.vin}
                    </p>
                    <h3 className="font-display text-base font-semibold text-zinc-950 dark:text-white">
                      {v.year} {v.make} {v.model} {v.trim}
                    </h3>
                    <p className="text-xs text-zinc-500">
                      Reserve: {formatMoney(v.reservePriceUsd, currency, lang, adminSettings.customRatesOverride)} · {v.location}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onApproveVehicle(v.id)}
                      className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-500"
                    >
                      {t.approveBtn}
                    </button>
                    <button
                      type="button"
                      onClick={() => onRejectVehicle(v.id)}
                      className="px-4 py-2 rounded-lg border border-rose-500/50 text-rose-600 dark:text-rose-400 text-xs font-semibold"
                    >
                      {t.rejectBtn}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Live Bid Moderation */}
      {tab === 'moderation' && (
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121216] overflow-x-auto">
          <table className="w-full text-xs text-start">
            <thead className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400">
              <tr>
                <th className="py-3 px-4 text-start font-medium">Lot / Vehicle</th>
                <th className="py-3 px-4 text-start font-medium">Bidder Alias</th>
                <th className="py-3 px-4 text-end font-medium">Amount</th>
                <th className="py-3 px-4 text-end font-medium">Moderation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
              {recentBids.map(({ vehicleId, lotNumber, title, bid }) => (
                <tr key={bid.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/40">
                  <td className="py-3 px-4">
                    <span className="font-mono text-zinc-500">{lotNumber}</span> · {title}
                  </td>
                  <td className="py-3 px-4 font-mono font-semibold">
                    {bid.bidderAlias} {bid.flagged ? '(FLAGGED)' : ''}
                  </td>
                  <td className="py-3 px-4 text-end font-mono font-bold tabular-nums">
                    {formatMoney(bid.amountUsd, currency, lang, adminSettings.customRatesOverride)}
                  </td>
                  <td className="py-3 px-4 text-end">
                    <div className="inline-flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onModerateBid(vehicleId, bid.id, 'flag')}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-amber-500/40 text-amber-600 dark:text-amber-400"
                      >
                        <Flag className="w-3 h-3" />
                        <span>{t.flagBidBtn}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onModerateBid(vehicleId, bid.id, 'void')}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-rose-500/40 text-rose-600 dark:text-rose-400"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>{t.voidBidBtn}</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 3: KYC Verification Panel */}
      {tab === 'kyc' && (
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121216] overflow-x-auto">
          <table className="w-full text-xs text-start">
            <thead className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400">
              <tr>
                <th className="py-3 px-4 text-start font-medium">Applicant / Dealer</th>
                <th className="py-3 px-4 text-start font-medium">Country & Document</th>
                <th className="py-3 px-4 text-end font-medium">Escrow Deposit</th>
                <th className="py-3 px-4 text-end font-medium">Status</th>
                <th className="py-3 px-4 text-end font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
              {kycApplicants.map((app) => (
                <tr key={app.id}>
                  <td className="py-3 px-4 font-semibold text-zinc-950 dark:text-white">{app.name}</td>
                  <td className="py-3 px-4 text-zinc-600 dark:text-zinc-300">
                    {app.country} · {app.idType}
                  </td>
                  <td className="py-3 px-4 text-end font-mono font-semibold tabular-nums">
                    {formatMoney(app.depositUsd, currency, lang, adminSettings.customRatesOverride)}
                  </td>
                  <td className="py-3 px-4 text-end font-semibold uppercase">
                    <span
                      className={
                        app.status === 'verified'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : app.status === 'pending'
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-rose-600 dark:text-rose-400'
                      }
                    >
                      {app.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-end">
                    <button
                      type="button"
                      onClick={() => onUpdateKycStatus(app.id, 'verified')}
                      className="px-3 py-1 rounded bg-emerald-600 text-white font-semibold hover:bg-emerald-500"
                    >
                      {t.verifyKycBtn}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 4: Fee & Currency Rate Configuration */}
      {tab === 'rates' && (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121216] space-y-4">
            <h2 className="font-display text-base font-semibold text-zinc-950 dark:text-white">
              Commission & Anti-Sniping Parameters
            </h2>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-500 mb-1">AMJO Buyer Fee (%)</label>
                <input
                  type="number"
                  step="0.5"
                  min={1}
                  max={15}
                  value={adminSettings.buyerFeePercent}
                  onChange={(e) =>
                    setAdminSettings((prev) => ({
                      ...prev,
                      buyerFeePercent: Number(e.target.value) || 4.5,
                    }))
                  }
                  className="w-full px-3 py-2 font-mono rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900"
                />
              </div>
              <div>
                <label className="block text-zinc-500 mb-1">Marine Cargo Insurance (%)</label>
                <input
                  type="number"
                  step="0.1"
                  min={0.5}
                  max={5}
                  value={adminSettings.escrowInsurancePercent}
                  onChange={(e) =>
                    setAdminSettings((prev) => ({
                      ...prev,
                      escrowInsurancePercent: Number(e.target.value) || 1.2,
                    }))
                  }
                  className="w-full px-3 py-2 font-mono rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900"
                />
              </div>
            </div>
          </div>

          <div className="p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121216] space-y-4">
            <h2 className="font-display text-base font-semibold text-zinc-950 dark:text-white">
              Live FX Rates (per 1 USD Base)
            </h2>
            <div className="grid grid-cols-2 gap-3 text-xs">
              {CURRENCY_ORDER.filter((c) => c !== 'USD').map((code) => (
                <div key={code}>
                  <label className="block text-zinc-500 mb-1 font-mono">{code}</label>
                  <input
                    type="number"
                    step="0.001"
                    value={adminSettings.customRatesOverride[code] ?? CURRENCIES[code].rateFromUsd}
                    onChange={(e) => {
                      const val = Number.parseFloat(e.target.value);
                      if (Number.isFinite(val) && val > 0) {
                        setAdminSettings((prev) => ({
                          ...prev,
                          customRatesOverride: {
                            ...prev.customRatesOverride,
                            [code]: val,
                          },
                        }));
                      }
                    }}
                    className="w-full px-2.5 py-1.5 font-mono rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
