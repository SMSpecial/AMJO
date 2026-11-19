import React, { useMemo, useState } from 'react';
import {
  ArrowDownUp,
  ChevronRight,
  Filter,
  Heart,
  MapPin,
  RotateCcw,
  Search,
  ShieldCheck,
} from 'lucide-react';
import {
  AppRoute,
  AuctionCategory,
  CurrencyCode,
  DamageType,
  DriveType,
  FuelType,
  Language,
  LocationHub,
  SaleStatus,
  TransmissionType,
  Vehicle,
} from '../types/auction';
import {
  CATEGORY_LABELS,
  DAMAGE_LABELS,
  FUEL_LABELS,
  LOCATION_LABELS,
  STATUS_LABELS,
  TRANSLATIONS,
} from '../i18n/translations';
import { formatMoney } from '../utils/currency';
import { sanitizeInput } from '../utils/security';
import { VehicleImage } from './VehicleImage';
import { CountdownTimer } from './CountdownTimer';

interface AuctionCatalogProps {
  vehicles: Vehicle[];
  lang: Language;
  currency: CurrencyCode;
  currencyOverrides?: Partial<Record<CurrencyCode, number>>;
  nowMs: number;
  watchlistIds: string[];
  toggleWatchlist: (id: string) => void;
  navigate: (route: AppRoute) => void;
}

type SortKey = 'ending_soon' | 'price_asc' | 'price_desc' | 'most_bids' | 'lowest_mileage';

export const AuctionCatalog: React.FC<AuctionCatalogProps> = ({
  vehicles,
  lang,
  currency,
  currencyOverrides,
  nowMs,
  watchlistIds,
  toggleWatchlist,
  navigate,
}) => {
  const t = TRANSLATIONS[lang];

  const [category, setCategory] = useState<AuctionCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMake, setSelectedMake] = useState<string>('all');
  const [selectedModel, setSelectedModel] = useState<string>('all');
  const [yearMin, setYearMin] = useState<number>(1960);
  const [yearMax, setYearMax] = useState<number>(2026);
  const [maxPriceUsd, setMaxPriceUsd] = useState<number>(300000);
  const [maxMileageKm, setMaxMileageKm] = useState<number>(150000);
  const [fuelFilter, setFuelFilter] = useState<FuelType | 'all'>('all');
  const [transmissionFilter, setTransmissionFilter] = useState<TransmissionType | 'all'>('all');
  const [driveFilter, setDriveFilter] = useState<DriveType | 'all'>('all');
  const [damageFilter, setDamageFilter] = useState<DamageType | 'all'>('all');
  const [locationFilter, setLocationFilter] = useState<LocationHub | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<SaleStatus | 'all'>('all');
  const [sortBy, setSortBy] = useState<SortKey>('ending_soon');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const approvedVehicles = useMemo(
    () => vehicles.filter((v) => v.approvalStatus === 'approved'),
    [vehicles]
  );

  const uniqueMakes = useMemo(
    () => Array.from(new Set(approvedVehicles.map((v) => v.make))).sort(),
    [approvedVehicles]
  );

  const uniqueModels = useMemo(() => {
    const base =
      selectedMake === 'all'
        ? approvedVehicles
        : approvedVehicles.filter((v) => v.make === selectedMake);
    return Array.from(new Set(base.map((v) => v.model))).sort();
  }, [approvedVehicles, selectedMake]);

  const uniqueLocations = useMemo(
    () => Array.from(new Set(approvedVehicles.map((v) => v.location))),
    [approvedVehicles]
  );

  const resetAllFilters = () => {
    setCategory('all');
    setSearchQuery('');
    setSelectedMake('all');
    setSelectedModel('all');
    setYearMin(1960);
    setYearMax(2026);
    setMaxPriceUsd(300000);
    setMaxMileageKm(150000);
    setFuelFilter('all');
    setTransmissionFilter('all');
    setDriveFilter('all');
    setDamageFilter('all');
    setLocationFilter('all');
    setStatusFilter('all');
    setSortBy('ending_soon');
  };

  const filteredVehicles = useMemo(() => {
    const cleanQuery = sanitizeInput(searchQuery).toLowerCase();

    const matched = approvedVehicles.filter((v) => {
      if (category !== 'all' && v.category !== category) return false;
      if (selectedMake !== 'all' && v.make !== selectedMake) return false;
      if (selectedModel !== 'all' && v.model !== selectedModel) return false;
      if (v.year < yearMin || v.year > yearMax) return false;
      if (v.currentBidUsd > maxPriceUsd) return false;
      if (v.mileageKm > maxMileageKm) return false;
      if (fuelFilter !== 'all' && v.fuelType !== fuelFilter) return false;
      if (transmissionFilter !== 'all' && v.transmission !== transmissionFilter) return false;
      if (driveFilter !== 'all' && v.driveType !== driveFilter) return false;
      if (damageFilter !== 'all' && v.damageType !== damageFilter) return false;
      if (locationFilter !== 'all' && v.location !== locationFilter) return false;

      const computedStatus: SaleStatus =
        v.saleStatus === 'ended' || (v.saleStatus === 'live' && v.endTimeMs <= nowMs)
          ? 'ended'
          : v.saleStatus;
      if (statusFilter !== 'all' && computedStatus !== statusFilter) return false;

      if (cleanQuery) {
        const haystack = `${v.year} ${v.make} ${v.model} ${v.trim} ${v.vin} ${v.lotNumber} ${v.location}`.toLowerCase();
        if (!haystack.includes(cleanQuery)) return false;
      }
      return true;
    });

    return [...matched].sort((a, b) => {
      if (sortBy === 'price_asc') return a.currentBidUsd - b.currentBidUsd;
      if (sortBy === 'price_desc') return b.currentBidUsd - a.currentBidUsd;
      if (sortBy === 'most_bids') return b.bidHistory.length - a.bidHistory.length;
      if (sortBy === 'lowest_mileage') return a.mileageKm - b.mileageKm;
      // ending_soon: prioritize live lots ending earliest, then upcoming, then ended
      const aEnded = a.saleStatus === 'ended' || a.endTimeMs <= nowMs ? 2 : a.saleStatus === 'upcoming' ? 1 : 0;
      const bEnded = b.saleStatus === 'ended' || b.endTimeMs <= nowMs ? 2 : b.saleStatus === 'upcoming' ? 1 : 0;
      if (aEnded !== bEnded) return aEnded - bEnded;
      return a.endTimeMs - b.endTimeMs;
    });
  }, [
    approvedVehicles,
    category,
    searchQuery,
    selectedMake,
    selectedModel,
    yearMin,
    yearMax,
    maxPriceUsd,
    maxMileageKm,
    fuelFilter,
    transmissionFilter,
    driveFilter,
    damageFilter,
    locationFilter,
    statusFilter,
    sortBy,
    nowMs,
  ]);

  const liveCount = approvedVehicles.filter(
    (v) => v.saleStatus === 'live' && v.endTimeMs > nowMs
  ).length;
  const totalGmvUsd = approvedVehicles.reduce((acc, v) => acc + v.currentBidUsd, 0) + 14800000;

  const scrollToInventory = () => {
    document.getElementById('amjo-inventory')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="space-y-10">
      {/* Architectural Storefront Hero */}
      <section className="relative overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-950">
        <div className="grid lg:grid-cols-12 items-stretch">
          <div className="lg:col-span-6 p-6 sm:p-10 lg:p-12 flex flex-col justify-between bg-[#0C0C10] text-zinc-100">
            <div className="space-y-5">
              <p className="text-xs font-medium tracking-wide text-[#D4AF37]">
                {t.heroKicker}
              </p>
              <h1 className="font-display text-3xl sm:text-4xl lg:text-[44px] font-bold leading-[1.12] tracking-tight text-white text-balance">
                {t.heroTitle}
              </h1>
              <p className="text-sm sm:text-base text-zinc-300 leading-relaxed max-w-xl">
                {t.heroSubtitle}
              </p>
            </div>

            <div className="pt-8 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={scrollToInventory}
                className="px-6 py-3 rounded-lg bg-[#C9A227] text-zinc-950 font-semibold text-sm hover:bg-[#D4AF37] transition-colors inline-flex items-center gap-2 whitespace-nowrap shrink-0"
              >
                <span>{t.heroPrimaryBtn}</span>
                <ChevronRight className={`w-4 h-4 ${lang === 'ar' ? 'rotate-180' : ''}`} />
              </button>
              <button
                type="button"
                onClick={() => navigate({ view: 'seller' })}
                className="px-6 py-3 rounded-lg border border-zinc-700 text-zinc-100 font-medium text-sm hover:border-[#C9A227] hover:text-[#D4AF37] transition-colors whitespace-nowrap shrink-0"
              >
                {t.heroSecondaryBtn}
              </button>
            </div>
          </div>

          <div className="lg:col-span-6 relative min-h-[260px] lg:min-h-[380px]">
            <VehicleImage
              src="./src/assets/images/hero_amjo_showroom_1795086416183.jpg"
              alt="AMJO Amman Global Auto Auction Hall"
              className="w-full h-full object-cover lg:h-full"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent flex items-end p-6">
              <div className="flex items-center gap-3 text-xs text-zinc-200">
                <ShieldCheck className="w-4 h-4 text-[#D4AF37] shrink-0" />
                <span>{t.escrowBadgeText}</span>
                <span aria-hidden="true">·</span>
                <span>{t.certifiedBadgeText}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4-Column KPI Strip Below Hero */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121216]">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">{t.kpiActiveLots}</p>
          <p className="mt-1.5 font-mono text-2xl font-bold tabular-nums text-zinc-950 dark:text-white">
            {liveCount} / {approvedVehicles.length}
          </p>
        </div>
        <div className="p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121216]">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">{t.kpiTotalVolume}</p>
          <p className="mt-1.5 font-mono text-2xl font-bold tabular-nums text-[#9A7414] dark:text-[#D4AF37]">
            {formatMoney(totalGmvUsd, currency, lang, currencyOverrides)}
          </p>
        </div>
        <div className="p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121216]">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">{t.kpiInspectionStd}</p>
          <p className="mt-1.5 font-mono text-2xl font-bold tabular-nums text-zinc-950 dark:text-white">
            150 pts
          </p>
        </div>
        <div className="p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121216]">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">{t.kpiGlobalHubs}</p>
          <p className="mt-1.5 font-mono text-2xl font-bold tabular-nums text-zinc-950 dark:text-white">
            8 Hubs
          </p>
        </div>
      </section>

      {/* Inventory & Interactive Catalog Section */}
      <section id="amjo-inventory" className="space-y-6">
        {/* Category Segmented Tabs + Sort Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {(Object.keys(CATEGORY_LABELS) as AuctionCategory[]).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`px-3.5 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                  category === cat
                    ? 'bg-zinc-950 text-white dark:bg-[#C9A227] dark:text-zinc-950 font-semibold'
                    : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800'
                }`}
              >
                {CATEGORY_LABELS[cat][lang]}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setMobileFiltersOpen((v) => !v)}
              className="lg:hidden inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121216] text-xs font-medium"
            >
              <Filter className="w-3.5 h-3.5" />
              <span>{t.filtersTitle}</span>
            </button>

            <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121216] text-xs">
              <ArrowDownUp className="w-3.5 h-3.5 text-zinc-500" />
              <select
                aria-label={t.sortByLabel}
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortKey)}
                className="bg-transparent font-medium text-zinc-900 dark:text-zinc-100 focus:outline-none cursor-pointer"
              >
                <option value="ending_soon" className="bg-white dark:bg-zinc-900">{t.sortEndingSoon}</option>
                <option value="price_asc" className="bg-white dark:bg-zinc-900">{t.sortPriceAsc}</option>
                <option value="price_desc" className="bg-white dark:bg-zinc-900">{t.sortPriceDesc}</option>
                <option value="most_bids" className="bg-white dark:bg-zinc-900">{t.sortMostBids}</option>
                <option value="lowest_mileage" className="bg-white dark:bg-zinc-900">{t.sortLowestMileage}</option>
              </select>
            </label>
          </div>
        </div>

        {/* Main Grid: Filter Sidebar + 3-Column Vehicle Cards */}
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          {/* Deep Multi-Faceted Filter Sidebar */}
          <aside
            className={`${
              mobileFiltersOpen ? 'block' : 'hidden'
            } lg:block lg:col-span-3 p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121216] space-y-5`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
              <h2 className="font-display text-sm font-semibold text-zinc-950 dark:text-white">
                {t.filtersTitle}
              </h2>
              <button
                type="button"
                onClick={resetAllFilters}
                className="inline-flex items-center gap-1 text-xs font-medium text-[#9A7414] dark:text-[#D4AF37] hover:underline"
              >
                <RotateCcw className="w-3 h-3" />
                <span>{t.resetFilters}</span>
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-zinc-400 absolute top-1/2 -translate-y-1/2 start-3 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.searchPlaceholder}
                className="w-full ps-9 pe-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/70 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-[#C9A227]"
              />
            </div>

            {/* Make & Model */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                  {t.makeLabel}
                </label>
                <select
                  value={selectedMake}
                  onChange={(e) => {
                    setSelectedMake(e.target.value);
                    setSelectedModel('all');
                  }}
                  className="w-full px-2.5 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
                >
                  <option value="all">{t.allOption}</option>
                  {uniqueMakes.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                  {t.modelLabel}
                </label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full px-2.5 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
                >
                  <option value="all">{t.allOption}</option>
                  {uniqueModels.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Year Range */}
            <div>
              <div className="flex items-center justify-between text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">
                <span>{t.yearRangeLabel}</span>
                <span className="font-mono tabular-nums text-zinc-900 dark:text-zinc-200">
                  {yearMin} – {yearMax}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  min={1960}
                  max={2026}
                  value={yearMin}
                  onChange={(e) => setYearMin(Number(e.target.value) || 1960)}
                  aria-label="Min Year"
                  className="w-full px-2.5 py-1.5 text-xs font-mono rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900"
                />
                <input
                  type="number"
                  min={1960}
                  max={2026}
                  value={yearMax}
                  onChange={(e) => setYearMax(Number(e.target.value) || 2026)}
                  aria-label="Max Year"
                  className="w-full px-2.5 py-1.5 text-xs font-mono rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900"
                />
              </div>
            </div>

            {/* Price Ceiling Slider */}
            <div>
              <div className="flex items-center justify-between text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">
                <span>{t.priceRangeLabel}</span>
                <span className="font-mono tabular-nums text-[#9A7414] dark:text-[#D4AF37]">
                  {formatMoney(maxPriceUsd, currency, lang, currencyOverrides)}
                </span>
              </div>
              <input
                type="range"
                min={20000}
                max={300000}
                step={5000}
                value={maxPriceUsd}
                onChange={(e) => setMaxPriceUsd(Number(e.target.value))}
                className="w-full accent-[#C9A227]"
              />
            </div>

            {/* Mileage Ceiling Slider */}
            <div>
              <div className="flex items-center justify-between text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">
                <span>{t.mileageMaxLabel}</span>
                <span className="font-mono tabular-nums text-zinc-900 dark:text-zinc-200">
                  {maxMileageKm.toLocaleString()} km
                </span>
              </div>
              <input
                type="range"
                min={5000}
                max={150000}
                step={5000}
                value={maxMileageKm}
                onChange={(e) => setMaxMileageKm(Number(e.target.value))}
                className="w-full accent-[#C9A227]"
              />
            </div>

            {/* Fuel & Transmission */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                  {t.fuelTypeLabel}
                </label>
                <select
                  value={fuelFilter}
                  onChange={(e) => setFuelFilter(e.target.value as FuelType | 'all')}
                  className="w-full px-2 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900"
                >
                  <option value="all">{t.allOption}</option>
                  {(Object.keys(FUEL_LABELS) as FuelType[]).map((f) => (
                    <option key={f} value={f}>
                      {FUEL_LABELS[f][lang]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                  {t.driveTypeLabel}
                </label>
                <select
                  value={driveFilter}
                  onChange={(e) => setDriveFilter(e.target.value as DriveType | 'all')}
                  className="w-full px-2 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900"
                >
                  <option value="all">{t.allOption}</option>
                  {(['AWD', '4WD', 'RWD', 'FWD'] as DriveType[]).map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Transmission */}
            <div>
              <label className="block text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                {t.transmissionLabel}
              </label>
              <select
                value={transmissionFilter}
                onChange={(e) => setTransmissionFilter(e.target.value as TransmissionType | 'all')}
                className="w-full px-2.5 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900"
              >
                <option value="all">{t.allOption}</option>
                {(['Automatic', 'PDK Dual-Clutch', 'Manual', 'Single-Speed EV'] as TransmissionType[]).map(
                  (tr) => (
                    <option key={tr} value={tr}>
                      {tr}
                    </option>
                  )
                )}
              </select>
            </div>

            {/* Damage Type */}
            <div>
              <label className="block text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                {t.damageTypeLabel}
              </label>
              <select
                value={damageFilter}
                onChange={(e) => setDamageFilter(e.target.value as DamageType | 'all')}
                className="w-full px-2.5 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900"
              >
                <option value="all">{t.allOption}</option>
                {(Object.keys(DAMAGE_LABELS) as DamageType[]).map((dmg) => (
                  <option key={dmg} value={dmg}>
                    {DAMAGE_LABELS[dmg][lang]}
                  </option>
                ))}
              </select>
            </div>

            {/* Location Hub */}
            <div>
              <label className="block text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                {t.locationHubLabel}
              </label>
              <select
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value as LocationHub | 'all')}
                className="w-full px-2.5 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900"
              >
                <option value="all">{t.allOption}</option>
                {uniqueLocations.map((loc) => (
                  <option key={loc} value={loc}>
                    {LOCATION_LABELS[loc]?.[lang] ?? loc}
                  </option>
                ))}
              </select>
            </div>

            {/* Sale Status */}
            <div>
              <label className="block text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                {t.saleStatusLabel}
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {(['all', 'live', 'upcoming', 'ended'] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatusFilter(st)}
                    className={`px-2.5 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                      statusFilter === st
                        ? 'border-[#C9A227] bg-[#C9A227]/15 text-[#9A7414] dark:text-[#D4AF37]'
                        : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'
                    }`}
                  >
                    {st === 'all' ? t.allOption : STATUS_LABELS[st][lang]}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* 3-Column Vehicle Grid */}
          <div className="lg:col-span-9">
            {filteredVehicles.length === 0 ? (
              <div className="p-12 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121216] text-center space-y-3">
                <p className="font-display text-lg font-semibold text-zinc-950 dark:text-white">
                  {t.noResultsTitle}
                </p>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-md mx-auto">
                  {t.noResultsDesc}
                </p>
                <button
                  type="button"
                  onClick={resetAllFilters}
                  className="mt-2 px-4 py-2 rounded-lg bg-[#C9A227] text-zinc-950 text-xs font-semibold"
                >
                  {t.resetFilters}
                </button>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredVehicles.map((vehicle) => {
                  const isWatchlisted = watchlistIds.includes(vehicle.id);
                  const computedStatus: SaleStatus =
                    vehicle.saleStatus === 'ended' ||
                    (vehicle.saleStatus === 'live' && vehicle.endTimeMs <= nowMs)
                      ? 'ended'
                      : vehicle.saleStatus;
                  const reserveMet = vehicle.currentBidUsd >= vehicle.reservePriceUsd;

                  return (
                    <article
                      key={vehicle.id}
                      className="group rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121216] overflow-hidden flex flex-col transition-transform duration-200 hover:-translate-y-0.5"
                    >
                      {/* Clean 4:3 Image Lead */}
                      <div
                        onClick={() => navigate({ view: 'lot', lotId: vehicle.id })}
                        className="relative aspect-[4/3] bg-zinc-900 overflow-hidden cursor-pointer"
                      >
                        <VehicleImage
                          src={vehicle.imageUrl}
                          alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                        />
                        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/80 via-black/35 to-transparent pointer-events-none" />

                        <div className="absolute top-3 inset-x-3 flex items-center justify-between">
                          <span className="px-2 py-1 rounded bg-black/70 backdrop-blur-xs font-mono text-[11px] font-medium text-zinc-100">
                            {vehicle.lotNumber}
                          </span>
                          <button
                            type="button"
                            aria-label="Toggle Watchlist"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleWatchlist(vehicle.id);
                            }}
                            className="p-2 rounded-lg bg-black/65 backdrop-blur-xs text-white hover:text-[#D4AF37] transition-colors"
                          >
                            <Heart
                              className={`w-4 h-4 ${
                                isWatchlisted ? 'fill-[#D4AF37] text-[#D4AF37]' : ''
                              }`}
                            />
                          </button>
                        </div>

                        <div className="absolute bottom-2.5 inset-x-3 flex items-center justify-between text-[11px] text-zinc-200">
                          <span className="inline-flex items-center gap-1 truncate">
                            <MapPin className="w-3 h-3 text-[#D4AF37] shrink-0" />
                            <span className="truncate">
                              {LOCATION_LABELS[vehicle.location]?.[lang] ?? vehicle.location}
                            </span>
                          </span>
                          <span className="font-mono font-semibold shrink-0">
                            {vehicle.inspectionScore}/150
                          </span>
                        </div>
                      </div>

                      {/* Card Body — Unboxed Typographic Metadata & Tabular Pricing */}
                      <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                            <span>{STATUS_LABELS[computedStatus][lang]}</span>
                            <span aria-hidden="true">·</span>
                            <span className="font-mono tabular-nums">
                              {vehicle.mileageKm.toLocaleString()} km
                            </span>
                            <span aria-hidden="true">·</span>
                            <span>{FUEL_LABELS[vehicle.fuelType][lang]}</span>
                          </div>

                          <h3
                            onClick={() => navigate({ view: 'lot', lotId: vehicle.id })}
                            className="font-display text-base font-semibold text-zinc-950 dark:text-white cursor-pointer hover:text-[#9A7414] dark:hover:text-[#D4AF37] transition-colors truncate"
                          >
                            {vehicle.year} {vehicle.make} {vehicle.model}
                          </h3>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                            {vehicle.trim} · {DAMAGE_LABELS[vehicle.damageType][lang]}
                          </p>
                        </div>

                        <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800/80 space-y-3">
                          <div className="flex items-end justify-between gap-2">
                            <div>
                              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                                {vehicle.bidHistory.length > 0 ? t.currentBid : t.startingBid}
                              </p>
                              <p className="font-mono text-lg font-bold tabular-nums text-zinc-950 dark:text-white">
                                {formatMoney(vehicle.currentBidUsd, currency, lang, currencyOverrides)}
                              </p>
                            </div>
                            <div className="text-end">
                              <p
                                className={`text-[11px] font-medium ${
                                  reserveMet
                                    ? 'text-emerald-600 dark:text-emerald-400'
                                    : 'text-amber-600 dark:text-amber-400'
                                }`}
                              >
                                {reserveMet ? t.reserveMet : t.reserveNotMet}
                              </p>
                              <p className="text-[11px] font-mono tabular-nums text-zinc-500 dark:text-zinc-400">
                                {vehicle.bidHistory.length} {t.bidsCount}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between gap-2 pt-1">
                            <CountdownTimer
                              endTimeMs={vehicle.endTimeMs}
                              nowMs={nowMs}
                              saleStatus={computedStatus}
                              lang={lang}
                              compact
                            />
                            <button
                              type="button"
                              onClick={() => navigate({ view: 'lot', lotId: vehicle.id })}
                              className="px-3.5 py-2 rounded-lg bg-zinc-950 dark:bg-zinc-100 text-white dark:text-zinc-950 text-xs font-semibold hover:bg-[#C9A227] hover:text-zinc-950 dark:hover:bg-[#C9A227] transition-colors whitespace-nowrap shrink-0"
                            >
                              {t.inspectAndBid}
                            </button>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};
