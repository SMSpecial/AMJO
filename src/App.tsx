import { useCallback, useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, ShieldCheck, X } from 'lucide-react';
import {
  AdminSettings,
  AppRoute,
  BidEntry,
  CurrencyCode,
  InvoiceRecord,
  KycApplicant,
  Language,
  OfferEntry,
  ProxyBidConfig,
  ThemeMode,
  UserRole,
  UserSecurityState,
  Vehicle,
} from './types/auction';
import { INITIAL_INVOICES, INITIAL_KYC_APPLICANTS, INITIAL_VEHICLES } from './data/vehicles';
import { TRANSLATIONS } from './i18n/translations';
import { formatMoney, getDynamicBidIncrementUsd } from './utils/currency';
import {
  bidRateLimiter,
  financialRateLimiter,
  generateCsrfToken,
  safeStorageGet,
  safeStorageSet,
  validateCsrfToken,
} from './utils/security';
import { NavbarAndControls } from './components/NavbarAndControls';
import { AuctionCatalog } from './components/AuctionCatalog';
import { VehicleDossierRoom } from './components/VehicleDossierRoom';
import { BuyerDashboard } from './components/BuyerDashboard';
import { SellerPortal } from './components/SellerPortal';
import { AdminCommandCenter } from './components/AdminCommandCenter';
import { ComplianceModal, KycModal, TwoFaModal } from './components/SecurityComplianceModals';

function parseHashRoute(): AppRoute {
  const hash = window.location.hash.replace(/^#\/?/, '');
  if (hash.startsWith('lot/')) {
    const lotId = hash.slice(4);
    if (lotId) return { view: 'lot', lotId };
  }
  if (hash === 'buyer') return { view: 'buyer' };
  if (hash === 'seller') return { view: 'seller' };
  if (hash === 'admin') return { view: 'admin' };
  return { view: 'catalog' };
}

function routeToHash(route: AppRoute): string {
  if (route.view === 'lot') return `#/lot/${route.lotId}`;
  if (route.view === 'buyer') return '#/buyer';
  if (route.view === 'seller') return '#/seller';
  if (route.view === 'admin') return '#/admin';
  return '#/auctions';
}

interface ToastMessage {
  id: number;
  type: 'success' | 'warning' | 'error';
  text: string;
}

export default function App() {
  const [lang, setLang] = useState<Language>(() => safeStorageGet('amjo_lang', 'en'));
  const [theme, setTheme] = useState<ThemeMode>(() => safeStorageGet('amjo_theme', 'dark'));
  const [currency, setCurrency] = useState<CurrencyCode>(() => safeStorageGet('amjo_currency', 'JOD'));
  const [role, setRole] = useState<UserRole>('buyer');
  const [route, setRoute] = useState<AppRoute>(() => parseHashRoute());

  const [vehicles, setVehicles] = useState<Vehicle[]>(INITIAL_VEHICLES);
  const [watchlistIds, setWatchlistIds] = useState<string[]>(['lot-8801', 'lot-8803']);
  const [proxyBids, setProxyBids] = useState<Record<string, ProxyBidConfig>>({});
  const [invoices, setInvoices] = useState<InvoiceRecord[]>(INITIAL_INVOICES);
  const [offers, setOffers] = useState<OfferEntry[]>([]);
  const [kycApplicants, setKycApplicants] = useState<KycApplicant[]>(INITIAL_KYC_APPLICANTS);

  const [security, setSecurity] = useState<UserSecurityState>({
    kycVerified: false,
    kycFullName: 'Zaid Al-Khatib',
    kycDocumentNumber: 'JO-98810472',
    twoFactorEnabled: true,
    walletBalanceUsd: 15000, // Unlocks $150,000 bidding power initially
    biddingPowerMultiplier: 10,
  });

  const [adminSettings, setAdminSettings] = useState<AdminSettings>({
    buyerFeePercent: 4.5,
    escrowInsurancePercent: 1.2,
    antiSnipingWindowSec: 30,
    antiSnipingExtendSec: 120,
    customRatesOverride: {},
  });

  const [csrfToken] = useState<string>(() => generateCsrfToken());
  const [nowMs, setNowMs] = useState<number>(() => Date.now());
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const [kycModalOpen, setKycModalOpen] = useState(false);
  const [twoFaModalOpen, setTwoFaModalOpen] = useState(false);
  const [complianceModalOpen, setComplianceModalOpen] = useState(false);

  const t = TRANSLATIONS[lang];

  const showToast = useCallback((type: ToastMessage['type'], text: string) => {
    setToast({ id: Date.now(), type, text });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 4500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  // Sync HTML dir, lang, and dark mode class
  useEffect(() => {
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
    safeStorageSet('amjo_lang', lang);
  }, [lang]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    safeStorageSet('amjo_theme', theme);
  }, [theme]);

  useEffect(() => {
    safeStorageSet('amjo_currency', currency);
  }, [currency]);

  // Global 1-second live auction clock
  useEffect(() => {
    const interval = window.setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => window.clearInterval(interval);
  }, []);

  // Sync Hash Routing for GitHub Pages static compatibility
  useEffect(() => {
    const onHashChange = () => setRoute(parseHashRoute());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const navigate = useCallback((nextRoute: AppRoute) => {
    setRoute(nextRoute);
    const targetHash = routeToHash(nextRoute);
    if (window.location.hash !== targetHash) {
      window.location.hash = targetHash;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleSwitchRole = (nextRole: UserRole) => {
    setRole(nextRole);
    if (nextRole === 'buyer') navigate({ view: 'buyer' });
    else if (nextRole === 'seller') navigate({ view: 'seller' });
    else navigate({ view: 'admin' });
  };

  const toggleWatchlist = (id: string) => {
    setWatchlistIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // Core Bid Engine with Rate Limit, CSRF, KYC Check, Anti-Sniping, and Proxy Auto-Bid
  const handlePlaceBid = (vehicleId: string, amountUsd: number, isAuto = false) => {
    if (!isAuto) {
      if (!validateCsrfToken(csrfToken, csrfToken)) return;
      const rateCheck = bidRateLimiter.attempt('place_bid');
      if (!rateCheck.allowed) {
        showToast('warning', t.rateLimitAlert);
        return;
      }
    }

    const target = vehicles.find((v) => v.id === vehicleId);
    if (!target) return;

    if (amountUsd > 25000 && !security.kycVerified) {
      showToast('warning', t.kycRequiredAlert);
      setKycModalOpen(true);
      return;
    }

    const biddingPowerUsd = security.walletBalanceUsd * security.biddingPowerMultiplier;
    if (amountUsd > biddingPowerUsd) {
      showToast('error', t.insufficientPowerAlert);
      return;
    }

    const now = Date.now();
    const minInc = getDynamicBidIncrementUsd(target.currentBidUsd);
    const minAllowed = target.bidHistory.length > 0 ? target.currentBidUsd + minInc : target.startingBidUsd;
    const finalAmount = Math.max(amountUsd, minAllowed);

    const remainingSec = (target.endTimeMs - now) / 1000;
    const triggerAntiSnipe = remainingSec > 0 && remainingSec <= adminSettings.antiSnipingWindowSec;

    const newBid: BidEntry = {
      id: `bid-${now}-${Math.floor(Math.random() * 1000)}`,
      bidderAlias: 'Bidder_JO***',
      countryCode: 'JO',
      amountUsd: finalAmount,
      timestamp: now,
      isAutoBid: isAuto,
      isCurrentUser: true,
    };

    setVehicles((prev) =>
      prev.map((v) => {
        if (v.id !== vehicleId) return v;
        return {
          ...v,
          currentBidUsd: finalAmount,
          endTimeMs: triggerAntiSnipe
            ? v.endTimeMs + adminSettings.antiSnipingExtendSec * 1000
            : v.endTimeMs,
          antiSnipingExtensions: triggerAntiSnipe
            ? v.antiSnipingExtensions + 1
            : v.antiSnipingExtensions,
          bidHistory: [newBid, ...v.bidHistory],
        };
      })
    );

    if (triggerAntiSnipe) {
      showToast('warning', t.antiSnipingTriggered);
    } else if (!isAuto) {
      showToast('success', t.bidSuccessToast);
    }
  };

  const handleSetProxy = (vehicleId: string, maxBidUsd: number) => {
    if (maxBidUsd > 25000 && !security.kycVerified) {
      showToast('warning', t.kycRequiredAlert);
      setKycModalOpen(true);
      return;
    }
    setProxyBids((prev) => ({
      ...prev,
      [vehicleId]: { vehicleId, maxBidUsd, active: true },
    }));
    const target = vehicles.find((v) => v.id === vehicleId);
    if (target && !target.bidHistory[0]?.isCurrentUser) {
      const nextStep =
        target.bidHistory.length > 0
          ? target.currentBidUsd + getDynamicBidIncrementUsd(target.currentBidUsd)
          : target.startingBidUsd;
      if (maxBidUsd >= nextStep) {
        handlePlaceBid(vehicleId, nextStep, true);
      }
    }
    showToast(
      'success',
      `${t.proxyActiveBanner} ${formatMoney(maxBidUsd, currency, lang, adminSettings.customRatesOverride)}`
    );
  };

  const handleCancelProxy = (vehicleId: string) => {
    setProxyBids((prev) => {
      const copy = { ...prev };
      delete copy[vehicleId];
      return copy;
    });
  };

  const handleSimulateRivalBid = (vehicleId: string) => {
    const target = vehicles.find((v) => v.id === vehicleId);
    if (!target) return;
    const now = Date.now();
    const aliases = [
      { alias: 'Bidder_AE***', cc: 'AE' },
      { alias: 'Bidder_DE***', cc: 'DE' },
      { alias: 'Bidder_US***', cc: 'US' },
      { alias: 'Bidder_SA***', cc: 'SA' },
      { alias: 'Bidder_GB***', cc: 'GB' },
    ];
    const picked = aliases[Math.floor(Math.random() * aliases.length)];
    const inc = getDynamicBidIncrementUsd(target.currentBidUsd);
    const rivalAmount = target.bidHistory.length > 0 ? target.currentBidUsd + inc : target.startingBidUsd;

    const remainingSec = (target.endTimeMs - now) / 1000;
    const triggerAntiSnipe = remainingSec > 0 && remainingSec <= adminSettings.antiSnipingWindowSec;

    const rivalEntry: BidEntry = {
      id: `rival-${now}`,
      bidderAlias: picked.alias,
      countryCode: picked.cc,
      amountUsd: rivalAmount,
      timestamp: now,
    };

    const userProxy = proxyBids[vehicleId];
    const proxyNextAmount = rivalAmount + getDynamicBidIncrementUsd(rivalAmount);
    const proxyCanCounter = Boolean(userProxy?.active && userProxy.maxBidUsd >= proxyNextAmount);

    setVehicles((prev) =>
      prev.map((v) => {
        if (v.id !== vehicleId) return v;
        const updatedHistory = [rivalEntry, ...v.bidHistory];
        let finalPrice = rivalAmount;
        let finalEnd = triggerAntiSnipe
          ? v.endTimeMs + adminSettings.antiSnipingExtendSec * 1000
          : v.endTimeMs;
        let extCount = triggerAntiSnipe ? v.antiSnipingExtensions + 1 : v.antiSnipingExtensions;

        if (proxyCanCounter) {
          const autoEntry: BidEntry = {
            id: `auto-${now + 1}`,
            bidderAlias: 'Bidder_JO***',
            countryCode: 'JO',
            amountUsd: proxyNextAmount,
            timestamp: now + 150,
            isAutoBid: true,
            isCurrentUser: true,
          };
          updatedHistory.unshift(autoEntry);
          finalPrice = proxyNextAmount;
        }

        return {
          ...v,
          currentBidUsd: finalPrice,
          endTimeMs: finalEnd,
          antiSnipingExtensions: extCount,
          bidHistory: updatedHistory,
        };
      })
    );

    if (proxyCanCounter) {
      showToast(
        'success',
        `Proxy Auto-Bid countered ${picked.alias} at ${formatMoney(
          proxyNextAmount,
          currency,
          lang,
          adminSettings.customRatesOverride
        )}`
      );
    } else if (triggerAntiSnipe) {
      showToast('warning', t.antiSnipingTriggered);
    }
  };

  const handleBuyItNow = (vehicleId: string) => {
    const target = vehicles.find((v) => v.id === vehicleId);
    if (!target || !target.buyItNowUsd) return;

    if (target.buyItNowUsd > 25000 && !security.kycVerified) {
      showToast('warning', t.kycRequiredAlert);
      setKycModalOpen(true);
      return;
    }

    const buyPrice = target.buyItNowUsd;
    const fee = (buyPrice * adminSettings.buyerFeePercent) / 100;
    const newInvoice: InvoiceRecord = {
      id: `INV-2026-${Math.floor(5000 + Math.random() * 4000)}`,
      vehicleId: target.id,
      vehicleTitle: `${target.year} ${target.make} ${target.model}`,
      lotNumber: target.lotNumber,
      winningBidUsd: buyPrice,
      buyerFeeUsd: fee,
      shippingUsd: target.shippingOriginFeeUsd,
      totalUsd: buyPrice + fee + target.shippingOriginFeeUsd,
      status: 'escrow_pending',
      issuedAt: new Date().toISOString().slice(0, 10),
      logisticsStage: 'port_dispatch',
    };

    setVehicles((prev) =>
      prev.map((v) =>
        v.id === vehicleId
          ? {
              ...v,
              saleStatus: 'ended',
              currentBidUsd: buyPrice,
              bidHistory: [
                {
                  id: `bin-${Date.now()}`,
                  bidderAlias: 'Bidder_JO***',
                  countryCode: 'JO',
                  amountUsd: buyPrice,
                  timestamp: Date.now(),
                  isCurrentUser: true,
                },
                ...v.bidHistory,
              ],
            }
          : v
      )
    );
    setInvoices((prev) => [newInvoice, ...prev]);
    showToast('success', `Buy It Now confirmed! Invoice ${newInvoice.id} created in Buyer Desk.`);
    navigate({ view: 'buyer' });
  };

  const handleSubmitOffer = (vehicleId: string, amountUsd: number, note: string) => {
    setOffers((prev) => [
      {
        id: `offer-${Date.now()}`,
        vehicleId,
        amountUsd,
        note,
        status: 'pending',
        timestamp: Date.now(),
      },
      ...prev,
    ]);
  };

  const handleAddFunds = (amountUsd: number) => {
    const rateCheck = financialRateLimiter.attempt('add_funds');
    if (!rateCheck.allowed) {
      showToast('warning', t.rateLimitAlert);
      return;
    }
    setSecurity((prev) => ({
      ...prev,
      walletBalanceUsd: prev.walletBalanceUsd + amountUsd,
    }));
    showToast(
      'success',
      `Added ${formatMoney(amountUsd, currency, lang, adminSettings.customRatesOverride)} to Escrow Deposit Wallet.`
    );
  };

  const handlePayInvoice = (invoiceId: string) => {
    setInvoices((prev) =>
      prev.map((inv) =>
        inv.id === invoiceId ? { ...inv, status: 'paid', logisticsStage: 'maritime_transit' } : inv
      )
    );
    showToast('success', `Invoice ${invoiceId} settled into Escrow. Maritime transit initiated.`);
  };

  const handleCompleteKyc = (fullName: string, docNumber: string, depositBoostUsd: number) => {
    setSecurity((prev) => ({
      ...prev,
      kycVerified: true,
      kycFullName: fullName,
      kycDocumentNumber: docNumber,
      walletBalanceUsd: prev.walletBalanceUsd + depositBoostUsd,
    }));
    showToast('success', 'KYC Identity verified and Escrow Bidding Power updated.');
  };

  const handleSubmitVehicle = (newVehicle: Vehicle) => {
    setVehicles((prev) => [newVehicle, ...prev]);
  };

  const handleApproveVehicle = (vehicleId: string) => {
    setVehicles((prev) =>
      prev.map((v) => (v.id === vehicleId ? { ...v, approvalStatus: 'approved' } : v))
    );
    showToast('success', 'Vehicle approved and published to live AMJO catalog.');
  };

  const handleRejectVehicle = (vehicleId: string) => {
    setVehicles((prev) =>
      prev.map((v) => (v.id === vehicleId ? { ...v, approvalStatus: 'rejected' } : v))
    );
  };

  const handleModerateBid = (vehicleId: string, bidId: string, action: 'flag' | 'void') => {
    setVehicles((prev) =>
      prev.map((v) => {
        if (v.id !== vehicleId) return v;
        if (action === 'flag') {
          return {
            ...v,
            bidHistory: v.bidHistory.map((b) => (b.id === bidId ? { ...b, flagged: !b.flagged } : b)),
          };
        }
        const remaining = v.bidHistory.filter((b) => b.id !== bidId);
        return {
          ...v,
          bidHistory: remaining,
          currentBidUsd: remaining[0]?.amountUsd ?? v.startingBidUsd,
        };
      })
    );
  };

  const handleUpdateKycStatus = (applicantId: string, status: KycApplicant['status']) => {
    setKycApplicants((prev) =>
      prev.map((k) => (k.id === applicantId ? { ...k, status } : k))
    );
  };

  const activeLot =
    route.view === 'lot'
      ? vehicles.find((v) => v.id === route.lotId) ?? vehicles[0]
      : null;

  return (
    <div className="min-h-screen flex flex-col bg-[#F6F6F4] dark:bg-[#09090B] text-zinc-900 dark:text-zinc-100">
      <NavbarAndControls
        lang={lang}
        setLang={setLang}
        theme={theme}
        setTheme={setTheme}
        currency={currency}
        setCurrency={setCurrency}
        role={role}
        onSwitchRole={handleSwitchRole}
        route={route}
        navigate={navigate}
        security={security}
        watchlistCount={watchlistIds.length}
        openKycModal={() => setKycModalOpen(true)}
        openTwoFaModal={() => setTwoFaModalOpen(true)}
        openComplianceModal={() => setComplianceModalOpen(true)}
        currencyOverrides={adminSettings.customRatesOverride}
      />

      {/* Toast Notification Banner */}
      {toast && (
        <div className="fixed bottom-5 end-5 z-50 max-w-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-[#141418] shadow-xl p-4 flex items-start gap-3 text-xs">
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle
              className={`w-4 h-4 shrink-0 mt-0.5 ${
                toast.type === 'warning' ? 'text-amber-500' : 'text-rose-500'
              }`}
            />
          )}
          <p className="flex-1 text-zinc-800 dark:text-zinc-100 leading-relaxed">{toast.text}</p>
          <button
            type="button"
            onClick={() => setToast(null)}
            aria-label="Dismiss"
            className="text-zinc-400 hover:text-zinc-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {route.view === 'catalog' && (
          <AuctionCatalog
            vehicles={vehicles}
            lang={lang}
            currency={currency}
            currencyOverrides={adminSettings.customRatesOverride}
            nowMs={nowMs}
            watchlistIds={watchlistIds}
            toggleWatchlist={toggleWatchlist}
            navigate={navigate}
          />
        )}

        {route.view === 'lot' && activeLot && (
          <VehicleDossierRoom
            vehicle={activeLot}
            lang={lang}
            currency={currency}
            adminSettings={adminSettings}
            nowMs={nowMs}
            isWatchlisted={watchlistIds.includes(activeLot.id)}
            toggleWatchlist={toggleWatchlist}
            proxyConfig={proxyBids[activeLot.id]}
            onPlaceBid={(id, amt) => handlePlaceBid(id, amt, false)}
            onSetProxy={handleSetProxy}
            onCancelProxy={handleCancelProxy}
            onBuyItNow={handleBuyItNow}
            onSubmitOffer={handleSubmitOffer}
            onSimulateRivalBid={handleSimulateRivalBid}
            onBack={() => navigate({ view: 'catalog' })}
            security={security}
            csrfToken={csrfToken}
          />
        )}

        {route.view === 'buyer' && (
          <BuyerDashboard
            vehicles={vehicles}
            watchlistIds={watchlistIds}
            toggleWatchlist={toggleWatchlist}
            invoices={invoices}
            offers={offers}
            onPayInvoice={handlePayInvoice}
            onAddFunds={handleAddFunds}
            security={security}
            lang={lang}
            currency={currency}
            adminSettings={adminSettings}
            nowMs={nowMs}
            navigate={navigate}
            csrfToken={csrfToken}
          />
        )}

        {route.view === 'seller' && (
          <SellerPortal
            vehicles={vehicles}
            lang={lang}
            currency={currency}
            adminSettings={adminSettings}
            onSubmitVehicle={handleSubmitVehicle}
            csrfToken={csrfToken}
          />
        )}

        {route.view === 'admin' && (
          <AdminCommandCenter
            vehicles={vehicles}
            kycApplicants={kycApplicants}
            adminSettings={adminSettings}
            setAdminSettings={setAdminSettings}
            onApproveVehicle={handleApproveVehicle}
            onRejectVehicle={handleRejectVehicle}
            onModerateBid={handleModerateBid}
            onUpdateKycStatus={handleUpdateKycStatus}
            lang={lang}
            currency={currency}
          />
        )}
      </main>

      {/* Clean Institutional Footer */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800/80 bg-white dark:bg-[#0C0C10]">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500 dark:text-zinc-400">
          <div className="flex flex-wrap items-center gap-2 text-center sm:text-start">
            <span className="font-display font-bold text-zinc-900 dark:text-white">{t.brandName}</span>
            <span aria-hidden="true">·</span>
            <span>{t.footerRights}</span>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#C9A227]" />
              <span>{t.footerCompliance}</span>
            </span>
            <button
              type="button"
              onClick={() => setComplianceModalOpen(true)}
              className="font-medium text-zinc-700 dark:text-zinc-300 hover:text-[#9A7414] dark:hover:text-[#D4AF37]"
            >
              {t.navTrust}
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <KycModal
        open={kycModalOpen}
        onClose={() => setKycModalOpen(false)}
        security={security}
        onCompleteKyc={handleCompleteKyc}
        lang={lang}
        csrfToken={csrfToken}
      />
      <TwoFaModal
        open={twoFaModalOpen}
        onClose={() => setTwoFaModalOpen(false)}
        enabled={security.twoFactorEnabled}
        onToggle2Fa={(enable) =>
          setSecurity((prev) => ({ ...prev, twoFactorEnabled: enable }))
        }
        lang={lang}
      />
      <ComplianceModal
        open={complianceModalOpen}
        onClose={() => setComplianceModalOpen(false)}
        lang={lang}
      />
    </div>
  );
}
