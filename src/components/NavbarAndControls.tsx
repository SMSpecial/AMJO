import React, { useState } from 'react';
import {
  Globe,
  Menu,
  Moon,
  ShieldCheck,
  Sun,
  Wallet,
  X,
} from 'lucide-react';
import {
  AppRoute,
  CurrencyCode,
  Language,
  ThemeMode,
  UserRole,
  UserSecurityState,
} from '../types/auction';
import { CURRENCIES, CURRENCY_ORDER, formatMoney } from '../utils/currency';
import { TRANSLATIONS } from '../i18n/translations';

interface NavbarAndControlsProps {
  lang: Language;
  setLang: (lang: Language) => void;
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  currency: CurrencyCode;
  setCurrency: (c: CurrencyCode) => void;
  role: UserRole;
  onSwitchRole: (role: UserRole) => void;
  route: AppRoute;
  navigate: (route: AppRoute) => void;
  security: UserSecurityState;
  watchlistCount: number;
  openKycModal: () => void;
  openTwoFaModal: () => void;
  openComplianceModal: () => void;
  currencyOverrides?: Partial<Record<CurrencyCode, number>>;
}

export const NavbarAndControls: React.FC<NavbarAndControlsProps> = ({
  lang,
  setLang,
  theme,
  setTheme,
  currency,
  setCurrency,
  role,
  onSwitchRole,
  route,
  navigate,
  security,
  watchlistCount,
  openKycModal,
  openTwoFaModal,
  openComplianceModal,
  currencyOverrides,
}) => {
  const t = TRANSLATIONS[lang];
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems: Array<{ label: string; route: AppRoute; active: boolean }> = [
    { label: t.navAuctions, route: { view: 'catalog' }, active: route.view === 'catalog' || route.view === 'lot' },
    { label: t.navSell, route: { view: 'seller' }, active: route.view === 'seller' },
    { label: t.navBuyer, route: { view: 'buyer' }, active: route.view === 'buyer' },
    { label: t.navAdmin, route: { view: 'admin' }, active: route.view === 'admin' },
  ];

  const biddingPowerUsd = security.walletBalanceUsd * security.biddingPowerMultiplier;

  return (
    <>
      {/* Strictly 3-Zone Sticky Top Navigation Bar */}
      <header className="sticky top-0 z-40 h-14 border-b border-zinc-200 dark:border-zinc-800/80 bg-white/90 dark:bg-[#09090B]/90 backdrop-blur-md">
        <div className="max-w-[1440px] mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-8">
          {/* Zone 1: Single-line Brand Wordmark */}
          <button
            type="button"
            onClick={() => navigate({ view: 'catalog' })}
            className="font-display text-xl font-bold tracking-tight text-zinc-950 dark:text-white whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A227] rounded px-1"
          >
            {t.brandName}
          </button>

          {/* Zone 2: 5 concise single-line text links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            {navItems.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => navigate(item.route)}
                className={`whitespace-nowrap shrink-0 py-1 border-b-2 transition-colors ${
                  item.active
                    ? 'border-[#C9A227] text-zinc-950 dark:text-white'
                    : 'border-transparent text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100'
                }`}
              >
                {item.label}
              </button>
            ))}
            <button
              type="button"
              onClick={openComplianceModal}
              className="whitespace-nowrap shrink-0 py-1 border-b-2 border-transparent text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100 transition-colors"
            >
              {t.navTrust}
            </button>
          </nav>

          {/* Zone 3: 1 Primary Action + Mobile Menu Toggle */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={openKycModal}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#C9A227] text-zinc-950 hover:bg-[#D4AF37] transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A227]"
            >
              {t.navPrimaryCta}
            </button>
            <button
              type="button"
              aria-label="Menu"
              onClick={() => setMobileMenuOpen((v) => !v)}
              className="md:hidden p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-200"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#111115] px-4 py-3 space-y-2">
            {navItems.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => {
                  navigate(item.route);
                  setMobileMenuOpen(false);
                }}
                className={`block w-full text-start px-3 py-2 rounded-lg text-sm font-medium ${
                  item.active
                    ? 'bg-[#C9A227]/15 text-[#9A7414] dark:text-[#E5C158]'
                    : 'text-zinc-700 dark:text-zinc-300'
                }`}
              >
                {item.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                openComplianceModal();
                setMobileMenuOpen(false);
              }}
              className="block w-full text-start px-3 py-2 rounded-lg text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              {t.navTrust}
            </button>
          </div>
        )}
      </header>

      {/* Non-sticky Workspace Control Strip (Bilingual, Multi-Currency, Theme, Role Switcher, Bidding Power) */}
      <div className="border-b border-zinc-200 dark:border-zinc-800/80 bg-zinc-50 dark:bg-[#101014]">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Left group: Role Switcher */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-zinc-500 dark:text-zinc-400 font-medium whitespace-nowrap">
              {t.roleLabel}:
            </span>
            <div className="inline-flex items-center p-0.5 rounded-lg bg-zinc-200/80 dark:bg-zinc-900 border border-zinc-300/60 dark:border-zinc-800">
              {(['buyer', 'seller', 'admin'] as UserRole[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => onSwitchRole(r)}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors whitespace-nowrap shrink-0 ${
                    role === r
                      ? 'bg-white dark:bg-zinc-800 text-zinc-950 dark:text-white shadow-xs'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                  }`}
                >
                  {r === 'buyer' ? t.roleBuyer : r === 'seller' ? t.roleSeller : t.roleAdmin}
                </button>
              ))}
            </div>

            <span className="hidden sm:inline text-zinc-300 dark:text-zinc-700">|</span>

            <button
              type="button"
              onClick={() => navigate({ view: 'buyer' })}
              className="inline-flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300 hover:text-[#9A7414] dark:hover:text-[#D4AF37] transition-colors whitespace-nowrap"
            >
              <Wallet className="w-3.5 h-3.5 text-[#C9A227]" />
              <span>{t.biddingPowerLabel}:</span>
              <span className="font-mono font-semibold tabular-nums">
                {formatMoney(biddingPowerUsd, currency, lang, currencyOverrides)}
              </span>
              <span className="text-zinc-400">·</span>
              <span>
                {t.buyerTabWatchlist} ({watchlistCount})
              </span>
            </button>
          </div>

          {/* Right group: Security, Currency, Language, Theme */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={openTwoFaModal}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:border-[#C9A227]/60 transition-colors whitespace-nowrap shrink-0"
            >
              <ShieldCheck
                className={`w-3.5 h-3.5 ${
                  security.twoFactorEnabled ? 'text-emerald-500' : 'text-amber-500'
                }`}
              />
              <span>2FA: {security.twoFactorEnabled ? 'ON' : 'OFF'}</span>
              <span className="text-zinc-400">·</span>
              <span>KYC: {security.kycVerified ? 'OK' : 'REQ'}</span>
            </button>

            {/* Currency Switcher */}
            <label className="inline-flex items-center gap-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md px-2 py-1">
              <span className="text-zinc-500 dark:text-zinc-400 sr-only">{t.currencyLabel}</span>
              <select
                aria-label={t.currencyLabel}
                value={currency}
                onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                className="bg-transparent font-mono font-semibold text-zinc-900 dark:text-zinc-100 focus:outline-none cursor-pointer"
              >
                {CURRENCY_ORDER.map((code) => (
                  <option key={code} value={code} className="bg-white dark:bg-zinc-900">
                    {code} ({lang === 'ar' ? CURRENCIES[code].symbolAr : CURRENCIES[code].symbolEn})
                  </option>
                ))}
              </select>
            </label>

            {/* Bilingual AR / EN Toggle */}
            <button
              type="button"
              onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 font-semibold hover:border-[#C9A227] transition-colors whitespace-nowrap shrink-0"
            >
              <Globe className="w-3.5 h-3.5 text-[#C9A227]" />
              <span>{lang === 'en' ? 'العربية' : 'English'}</span>
            </button>

            {/* Light / Obsidian Dark Toggle */}
            <button
              type="button"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              aria-label={t.themeLabel}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-200 hover:border-[#C9A227] transition-colors whitespace-nowrap shrink-0"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>{t.lightMode}</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-zinc-700" />
                  <span>{t.darkMode}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
