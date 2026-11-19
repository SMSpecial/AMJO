import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  BatteryCharging,
  Calculator,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Eye,
  FileCheck2,
  Gavel,
  Heart,
  Lock,
  MapPin,
  RotateCw,
  ShieldCheck,
  Sparkles,
  Volume2,
  Wrench,
  ZoomIn,
} from 'lucide-react';
import {
  AdminSettings,
  CurrencyCode,
  Language,
  ProxyBidConfig,
  SaleStatus,
  UserSecurityState,
  Vehicle,
} from '../types/auction';
import {
  DAMAGE_LABELS,
  FUEL_LABELS,
  LOCATION_LABELS,
  STATUS_LABELS,
  TRANSLATIONS,
} from '../i18n/translations';
import {
  convertFromUsd,
  convertToUsd,
  CURRENCIES,
  formatMoney,
  getDynamicBidIncrementUsd,
} from '../utils/currency';
import { sanitizeInput, sanitizeNumericInput } from '../utils/security';
import { VehicleImage } from './VehicleImage';
import { CountdownTimer } from './CountdownTimer';

interface VehicleDossierRoomProps {
  vehicle: Vehicle;
  lang: Language;
  currency: CurrencyCode;
  adminSettings: AdminSettings;
  nowMs: number;
  isWatchlisted: boolean;
  toggleWatchlist: (id: string) => void;
  proxyConfig?: ProxyBidConfig;
  onPlaceBid: (vehicleId: string, amountUsd: number, isAuto?: boolean) => void;
  onSetProxy: (vehicleId: string, maxBidUsd: number) => void;
  onCancelProxy: (vehicleId: string) => void;
  onBuyItNow: (vehicleId: string) => void;
  onSubmitOffer: (vehicleId: string, amountUsd: number, note: string) => void;
  onSimulateRivalBid: (vehicleId: string) => void;
  onBack: () => void;
  security: UserSecurityState;
  csrfToken: string;
}

type GalleryTab = 'exterior' | 'interior' | 'engine' | 'undercarriage' | 'damage';
type CustomsPreset = 'zarqa_fz' | 'amman_ev' | 'amman_hybrid' | 'amman_petrol' | 'gcc_export';

export const VehicleDossierRoom: React.FC<VehicleDossierRoomProps> = ({
  vehicle,
  lang,
  currency,
  adminSettings,
  nowMs,
  isWatchlisted,
  toggleWatchlist,
  proxyConfig,
  onPlaceBid,
  onSetProxy,
  onCancelProxy,
  onBuyItNow,
  onSubmitOffer,
  onSimulateRivalBid,
  onBack,
  csrfToken,
}) => {
  const t = TRANSLATIONS[lang];

  const [galleryTab, setGalleryTab] = useState<GalleryTab>('exterior');
  const [mode360, setMode360] = useState(false);
  const [angleDeg, setAngleDeg] = useState(35);
  const [zoomActive, setZoomActive] = useState(false);
  const [zoomOrigin, setZoomOrigin] = useState({ x: 50, y: 50 });
  const [audioPlaying, setAudioPlaying] = useState(false);

  const minIncrementUsd = getDynamicBidIncrementUsd(vehicle.currentBidUsd);
  const minNextBidUsd =
    vehicle.bidHistory.length > 0 ? vehicle.currentBidUsd + minIncrementUsd : vehicle.startingBidUsd;

  const [customBidLocal, setCustomBidLocal] = useState<string>('');
  const [proxyMaxLocal, setProxyMaxLocal] = useState<string>('');
  const [offerLocal, setOfferLocal] = useState<string>('');
  const [offerNote, setOfferNote] = useState<string>('');
  const [offerSuccess, setOfferSuccess] = useState(false);

  const [expandedSubsystem, setExpandedSubsystem] = useState<string>('engine');
  const [customsPreset, setCustomsPreset] = useState<CustomsPreset>(
    vehicle.fuelType === 'Electric'
      ? 'amman_ev'
      : vehicle.fuelType === 'Hybrid'
      ? 'amman_hybrid'
      : 'zarqa_fz'
  );
  const [calcBidUsd, setCalcBidUsd] = useState<number>(vehicle.currentBidUsd);

  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    setCalcBidUsd(vehicle.currentBidUsd);
  }, [vehicle.currentBidUsd]);

  useEffect(() => {
    const suggestedLocal = Math.ceil(
      convertFromUsd(minNextBidUsd, currency, adminSettings.customRatesOverride)
    );
    setCustomBidLocal(String(suggestedLocal));
  }, [minNextBidUsd, currency, adminSettings.customRatesOverride]);

  const computedStatus: SaleStatus =
    vehicle.saleStatus === 'ended' || (vehicle.saleStatus === 'live' && vehicle.endTimeMs <= nowMs)
      ? 'ended'
      : vehicle.saleStatus;

  const isBiddable = computedStatus === 'live';
  const reserveMet = vehicle.currentBidUsd >= vehicle.reservePriceUsd;

  const playColdStartAudio = () => {
    if (audioPlaying) return;
    setAudioPlaying(true);
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        const ctx = audioCtxRef.current ?? new AudioCtx();
        audioCtxRef.current = ctx;
        const osc = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = vehicle.fuelType === 'Electric' ? 'sine' : 'sawtooth';
        osc2.type = 'triangle';
        const baseFreq = vehicle.fuelType === 'Electric' ? 180 : 58;
        osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(baseFreq * 2.2, ctx.currentTime + 0.65);
        osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.1, ctx.currentTime + 1.8);
        osc2.frequency.setValueAtTime(baseFreq * 1.5, ctx.currentTime);
        gain.gain.setValueAtTime(0.01, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.2);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2.0);
        osc.connect(gain);
        osc2.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc2.start();
        osc.stop(ctx.currentTime + 2.0);
        osc2.stop(ctx.currentTime + 2.0);
      }
    } catch {
      // Fallback visual playback only if audio blocked
    }
    window.setTimeout(() => setAudioPlaying(false), 2100);
  };

  const handleMouseMoveZoom = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!zoomActive) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomOrigin({ x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) });
  };

  const handleCustomBidSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numericLocal = sanitizeNumericInput(customBidLocal);
    const usdVal = Math.round(
      convertToUsd(numericLocal, currency, adminSettings.customRatesOverride)
    );
    onPlaceBid(vehicle.id, Math.max(usdVal, minNextBidUsd));
  };

  const handleProxySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numericLocal = sanitizeNumericInput(proxyMaxLocal);
    const usdVal = Math.round(
      convertToUsd(numericLocal, currency, adminSettings.customRatesOverride)
    );
    if (usdVal >= minNextBidUsd) {
      onSetProxy(vehicle.id, usdVal);
      setProxyMaxLocal('');
    }
  };

  const handleOfferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numericLocal = sanitizeNumericInput(offerLocal);
    const usdVal = Math.round(
      convertToUsd(numericLocal, currency, adminSettings.customRatesOverride)
    );
    if (usdVal > 0) {
      onSubmitOffer(vehicle.id, usdVal, sanitizeInput(offerNote));
      setOfferLocal('');
      setOfferNote('');
      setOfferSuccess(true);
      window.setTimeout(() => setOfferSuccess(false), 3500);
    }
  };

  // Landed Cost Breakdown Calculation
  const landedBreakdown = useMemo(() => {
    const buyerFeeUsd = (calcBidUsd * adminSettings.buyerFeePercent) / 100;
    const shippingUsd =
      customsPreset === 'gcc_export'
        ? vehicle.shippingOriginFeeUsd + 650
        : vehicle.shippingOriginFeeUsd + 350;
    const insuranceUsd = (calcBidUsd * adminSettings.escrowInsurancePercent) / 100;

    let customsRate = 0;
    let clearanceFixed = 420;
    if (customsPreset === 'zarqa_fz') {
      customsRate = 0;
      clearanceFixed = 380;
    } else if (customsPreset === 'amman_ev') {
      customsRate = calcBidUsd > 40000 ? 0.15 : 0.10;
      clearanceFixed = 650;
    } else if (customsPreset === 'amman_hybrid') {
      customsRate = 0.28;
      clearanceFixed = 780;
    } else if (customsPreset === 'amman_petrol') {
      customsRate = vehicle.category === 'classic' ? 0.12 : 0.55;
      clearanceFixed = 900;
    } else if (customsPreset === 'gcc_export') {
      customsRate = 0.05;
      clearanceFixed = 520;
    }

    const customsUsd = calcBidUsd * customsRate + clearanceFixed;
    const totalUsd = calcBidUsd + buyerFeeUsd + shippingUsd + insuranceUsd + customsUsd;

    return {
      buyerFeeUsd,
      shippingUsd,
      insuranceUsd,
      customsUsd,
      totalUsd,
    };
  }, [calcBidUsd, customsPreset, adminSettings, vehicle]);

  const galleryTabs: Array<{ id: GalleryTab; label: string }> = [
    { id: 'exterior', label: t.galleryExterior },
    { id: 'interior', label: t.galleryInterior },
    { id: 'engine', label: t.galleryEngine },
    { id: 'undercarriage', label: t.galleryUndercarriage },
    { id: 'damage', label: t.galleryDamage },
  ];

  const paintPanelNames: Record<string, { en: string; ar: string }> = {
    hood: { en: 'Hood', ar: 'غطاء المحرك' },
    roof: { en: 'Roof', ar: 'السقف' },
    frontLeftFender: { en: 'Front Left Fender', ar: 'الرفرف الأمامي الأيسر' },
    frontRightFender: { en: 'Front Right Fender', ar: 'الرفرف الأمامي الأيمن' },
    leftDoors: { en: 'Left Doors', ar: 'الأبواب اليسرى' },
    rightDoors: { en: 'Right Doors', ar: 'الأبواب اليمنى' },
    rearLeftQuarter: { en: 'Rear Left Quarter', ar: 'الرفرف الخلفي الأيسر' },
    rearRightQuarter: { en: 'Rear Right Quarter', ar: 'الرفرف الخلفي الأيمن' },
    trunk: { en: 'Trunk / Tailgate', ar: 'الصندوق الخلفي' },
  };

  return (
    <div className="space-y-8">
      {/* Top Breadcrumb & Lot Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
        <div className="space-y-1">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 dark:text-zinc-400 hover:text-[#9A7414] dark:hover:text-[#D4AF37] transition-colors"
          >
            <ArrowLeft className={`w-3.5 h-3.5 ${lang === 'ar' ? 'rotate-180' : ''}`} />
            <span>{t.backToCatalog}</span>
          </button>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-zinc-950 dark:text-white">
            {vehicle.year} {vehicle.make} {vehicle.model}{' '}
            <span className="font-normal text-zinc-500 dark:text-zinc-400 text-xl">
              {vehicle.trim}
            </span>
          </h1>
          <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
            <span className="font-mono font-semibold text-zinc-900 dark:text-zinc-200">
              {vehicle.lotNumber}
            </span>
            <span aria-hidden="true">·</span>
            <span className="font-mono">VIN: {vehicle.vin}</span>
            <span aria-hidden="true">·</span>
            <span className="inline-flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-[#C9A227]" />
              {LOCATION_LABELS[vehicle.location]?.[lang] ?? vehicle.location}
            </span>
            <span aria-hidden="true">·</span>
            <span>{STATUS_LABELS[computedStatus][lang]}</span>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => toggleWatchlist(vehicle.id)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border text-xs font-semibold transition-colors ${
              isWatchlisted
                ? 'border-[#C9A227] bg-[#C9A227]/15 text-[#9A7414] dark:text-[#D4AF37]'
                : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121216] text-zinc-700 dark:text-zinc-200'
            }`}
          >
            <Heart className={`w-4 h-4 ${isWatchlisted ? 'fill-[#D4AF37] text-[#D4AF37]' : ''}`} />
            <span>{t.buyerTabWatchlist}</span>
          </button>
        </div>
      </div>

      {/* Main Split: Left Media + Technical Dossier | Right Sticky Bidding Console */}
      <div className="grid lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN (8 cols) */}
        <div className="lg:col-span-8 space-y-8">
          {/* Interactive Media Gallery */}
          <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121216] overflow-hidden">
            {/* Gallery Toolbar */}
            <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-1 overflow-x-auto">
                {galleryTabs.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setGalleryTab(tab.id)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                      galleryTab === tab.id
                        ? 'bg-zinc-950 text-white dark:bg-[#C9A227] dark:text-zinc-950 font-semibold'
                        : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setMode360((v) => !v)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                    mode360
                      ? 'border-[#C9A227] bg-[#C9A227]/15 text-[#9A7414] dark:text-[#D4AF37]'
                      : 'border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300'
                  }`}
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>{t.mode360}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setZoomActive((v) => !v)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                    zoomActive
                      ? 'border-[#C9A227] bg-[#C9A227]/15 text-[#9A7414] dark:text-[#D4AF37]'
                      : 'border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300'
                  }`}
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                  <span>{t.zoomView}</span>
                </button>
                <button
                  type="button"
                  onClick={playColdStartAudio}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                    audioPlaying
                      ? 'border-emerald-500 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                      : 'border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300'
                  }`}
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>{audioPlaying ? t.engineAudioPlaying : t.engineAudioBtn}</span>
                </button>
              </div>
            </div>

            {/* Viewport Frame */}
            <div
              onMouseMove={handleMouseMoveZoom}
              className={`relative aspect-[16/10] bg-zinc-950 overflow-hidden ${
                zoomActive ? 'cursor-zoom-out' : 'cursor-default'
              }`}
            >
              <div
                className="w-full h-full transition-transform duration-200"
                style={{
                  transform: zoomActive
                    ? 'scale(2)'
                    : mode360
                    ? `perspective(1000px) rotateY(${(angleDeg - 35) * 0.25}deg) scale(${
                        1 + Math.sin((angleDeg * Math.PI) / 180) * 0.04
                      })`
                    : 'none',
                  transformOrigin: zoomActive ? `${zoomOrigin.x}% ${zoomOrigin.y}%` : 'center',
                }}
              >
                <VehicleImage
                  src={vehicle.imageUrl}
                  alt={`${vehicle.year} ${vehicle.make} ${vehicle.model} ${galleryTab}`}
                  className={`w-full h-full object-cover ${
                    galleryTab === 'undercarriage'
                      ? 'grayscale contrast-125 brightness-75'
                      : galleryTab === 'engine'
                      ? 'contrast-110 saturate-90'
                      : galleryTab === 'interior'
                      ? 'brightness-95 scale-105'
                      : ''
                  }`}
                />
              </div>

              {/* Technical Telemetry Overlay for non-exterior inspection tabs */}
              {galleryTab !== 'exterior' && (
                <div className="absolute inset-0 bg-black/55 backdrop-blur-[2px] flex flex-col justify-between p-5 text-zinc-100">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono uppercase tracking-wider text-[#D4AF37]">
                      {galleryTabs.find((g) => g.id === galleryTab)?.label} · {vehicle.lotNumber}
                    </span>
                    <span className="font-mono">
                      {vehicle.engineSpec} · {vehicle.horsepower} HP
                    </span>
                  </div>

                  {galleryTab === 'engine' && (
                    <div className="grid sm:grid-cols-3 gap-3 max-w-2xl">
                      <div className="p-3 rounded-lg bg-black/70 border border-zinc-700/80">
                        <p className="text-[11px] text-zinc-400">Powertrain</p>
                        <p className="font-mono text-sm font-semibold text-white">{vehicle.engineSpec}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-black/70 border border-zinc-700/80">
                        <p className="text-[11px] text-zinc-400">Transmission</p>
                        <p className="font-mono text-sm font-semibold text-white">{vehicle.transmission}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-black/70 border border-zinc-700/80">
                        <p className="text-[11px] text-zinc-400">ECU Diagnostics</p>
                        <p className="font-mono text-sm font-semibold text-emerald-400">0 Fault Codes</p>
                      </div>
                    </div>
                  )}

                  {galleryTab === 'interior' && (
                    <div className="grid sm:grid-cols-3 gap-3 max-w-2xl">
                      <div className="p-3 rounded-lg bg-black/70 border border-zinc-700/80">
                        <p className="text-[11px] text-zinc-400">Cabin Trim</p>
                        <p className="text-sm font-semibold text-white">
                          {lang === 'ar' ? vehicle.interiorColorAr : vehicle.interiorColorEn}
                        </p>
                      </div>
                      <div className="p-3 rounded-lg bg-black/70 border border-zinc-700/80">
                        <p className="text-[11px] text-zinc-400">Airbag & SRS</p>
                        <p className="font-mono text-sm font-semibold text-emerald-400">Verified Intact</p>
                      </div>
                      <div className="p-3 rounded-lg bg-black/70 border border-zinc-700/80">
                        <p className="text-[11px] text-zinc-400">HVAC Vent Temp</p>
                        <p className="font-mono text-sm font-semibold text-white">4.8°C Optimal</p>
                      </div>
                    </div>
                  )}

                  {galleryTab === 'undercarriage' && (
                    <div className="grid sm:grid-cols-3 gap-3 max-w-2xl">
                      <div className="p-3 rounded-lg bg-black/70 border border-zinc-700/80">
                        <p className="text-[11px] text-zinc-400">Laser Frame Symmetry</p>
                        <p className="font-mono text-sm font-semibold text-emerald-400">±0.4mm Factory</p>
                      </div>
                      <div className="p-3 rounded-lg bg-black/70 border border-zinc-700/80">
                        <p className="text-[11px] text-zinc-400">Corrosion Index</p>
                        <p className="font-mono text-sm font-semibold text-white">0% Surface Rust</p>
                      </div>
                      <div className="p-3 rounded-lg bg-black/70 border border-zinc-700/80">
                        <p className="text-[11px] text-zinc-400">Drivetrain</p>
                        <p className="font-mono text-sm font-semibold text-white">{vehicle.driveType}</p>
                      </div>
                    </div>
                  )}

                  {galleryTab === 'damage' && (
                    <div className="p-4 rounded-lg bg-black/80 border border-zinc-700/80 max-w-xl space-y-1">
                      <p className="text-xs font-semibold text-[#D4AF37]">
                        {DAMAGE_LABELS[vehicle.damageType][lang]}
                      </p>
                      <p className="text-sm text-zinc-200">
                        {lang === 'ar' ? vehicle.damageNoteAr : vehicle.damageNoteEn}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* 360 Turntable Scrubber */}
              {mode360 && (
                <div className="absolute bottom-3 inset-x-4 p-3 rounded-lg bg-black/75 backdrop-blur-xs border border-zinc-700/70 flex items-center gap-4 text-xs text-zinc-200">
                  <span className="font-medium whitespace-nowrap">
                    {t.turntableAngle}: <span className="font-mono text-[#D4AF37]">{angleDeg}°</span>
                  </span>
                  <input
                    type="range"
                    min={0}
                    max={360}
                    value={angleDeg}
                    onChange={(e) => setAngleDeg(Number(e.target.value))}
                    className="w-full accent-[#C9A227]"
                  />
                </div>
              )}
            </div>

            {/* Key Specs Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x rtl:sm:divide-x-reverse divide-zinc-200 dark:divide-zinc-800 bg-zinc-50/60 dark:bg-[#101014]">
              <div className="p-4">
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Odometer</p>
                <p className="font-mono text-sm font-semibold text-zinc-950 dark:text-white">
                  {vehicle.mileageKm.toLocaleString()} km
                </p>
              </div>
              <div className="p-4">
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">{t.fuelTypeLabel}</p>
                <p className="text-sm font-semibold text-zinc-950 dark:text-white">
                  {FUEL_LABELS[vehicle.fuelType][lang]}
                </p>
              </div>
              <div className="p-4">
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">{t.transmissionLabel}</p>
                <p className="text-sm font-semibold text-zinc-950 dark:text-white truncate">
                  {vehicle.transmission}
                </p>
              </div>
              <div className="p-4">
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Exterior</p>
                <p className="text-sm font-semibold text-zinc-950 dark:text-white truncate">
                  {lang === 'ar' ? vehicle.exteriorColorAr : vehicle.exteriorColorEn}
                </p>
              </div>
            </div>
          </section>

          {/* Verified VIN Decoder & History Dossier */}
          <section className="p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121216] space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-[#C9A227]" />
                <h2 className="font-display text-lg font-semibold text-zinc-950 dark:text-white">
                  {t.vinReportTitle}
                </h2>
              </div>
              <span className="font-mono text-xs text-zinc-500 dark:text-zinc-400">
                VIN: {vehicle.vin}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">{t.titleStatusLabel}</p>
                <p className="mt-1 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                  {vehicle.vinReport.titleStatus}
                </p>
              </div>
              <div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">{t.odometerLabel}</p>
                <p className="mt-1 text-sm font-semibold text-zinc-950 dark:text-white">
                  {vehicle.vinReport.odometerVerified ? t.odometerVerified : 'Inconsistent'}
                </p>
              </div>
              <div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">{t.accidentsLabel}</p>
                <p className="mt-1 font-mono text-sm font-semibold text-zinc-950 dark:text-white">
                  {vehicle.vinReport.accidentsReported}
                </p>
              </div>
              <div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">{t.serviceRecordsLabel}</p>
                <p className="mt-1 font-mono text-sm font-semibold text-zinc-950 dark:text-white">
                  {vehicle.vinReport.serviceRecordsCount}
                </p>
              </div>
              <div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">{t.openRecallsLabel}</p>
                <p className="mt-1 font-mono text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                  {vehicle.vinReport.openRecalls}
                </p>
              </div>
              <div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">{t.ownersLabel}</p>
                <p className="mt-1 font-mono text-sm font-semibold text-zinc-950 dark:text-white">
                  {vehicle.vinReport.previousOwners}
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-zinc-500 dark:text-zinc-400">{t.originPlantLabel}</p>
                <p className="mt-1 text-sm font-semibold text-zinc-950 dark:text-white">
                  {vehicle.vinReport.manufacturedCountry} ({vehicle.vinReport.plantCode})
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex flex-wrap gap-x-6 gap-y-2 text-xs text-zinc-600 dark:text-zinc-300">
              {(lang === 'ar' ? vehicle.highlightsAr : vehicle.highlightsEn).map((hl, idx) => (
                <span key={idx} className="inline-flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#C9A227]" />
                  <span>{hl}</span>
                </span>
              ))}
            </div>
          </section>

          {/* 150-Point Digital Inspection Report + Paint Micrometer Map */}
          <section className="p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121216] space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <Wrench className="w-5 h-5 text-[#C9A227]" />
                <h2 className="font-display text-lg font-semibold text-zinc-950 dark:text-white">
                  {t.inspectionTitle}
                </h2>
              </div>
              <div className="flex items-center gap-4 text-xs">
                {vehicle.hybridBatterySoh !== undefined && (
                  <span className="inline-flex items-center gap-1.5 font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                    <BatteryCharging className="w-4 h-4" />
                    {t.hybridSohLabel}: {vehicle.hybridBatterySoh}%
                  </span>
                )}
                <span className="font-mono font-bold text-sm text-[#9A7414] dark:text-[#D4AF37]">
                  {t.passedScoreLabel}: {vehicle.inspectionScore} / 150
                </span>
              </div>
            </div>

            {/* Expandable 6 Subsystems */}
            <div className="divide-y divide-zinc-200 dark:divide-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-lg">
              {vehicle.inspectionSubsystems.map((sub) => {
                const isOpen = expandedSubsystem === sub.key;
                return (
                  <div key={sub.key}>
                    <button
                      type="button"
                      onClick={() => setExpandedSubsystem(isOpen ? '' : sub.key)}
                      className="w-full px-4 py-3 flex items-center justify-between text-start hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold capitalize text-zinc-950 dark:text-white">
                          {sub.key}
                        </span>
                        <span className="text-xs text-zinc-500 dark:text-zinc-400 hidden sm:inline">
                          {lang === 'ar' ? sub.notesAr : sub.notesEn}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="font-mono text-xs font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                          {sub.passedPoints}/{sub.maxPoints}
                        </span>
                        {isOpen ? (
                          <ChevronUp className="w-4 h-4 text-zinc-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-zinc-400" />
                        )}
                      </div>
                    </button>
                    {isOpen && (
                      <div className="px-4 pb-4 pt-1 bg-zinc-50/70 dark:bg-zinc-900/30 space-y-2">
                        <p className="text-xs text-zinc-600 dark:text-zinc-300 sm:hidden">
                          {lang === 'ar' ? sub.notesAr : sub.notesEn}
                        </p>
                        <div className="grid sm:grid-cols-3 gap-2.5">
                          {sub.checks.map((chk, idx) => (
                            <div
                              key={idx}
                              className="p-2.5 rounded border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121216] flex items-center justify-between gap-2 text-xs"
                            >
                              <span className="text-zinc-700 dark:text-zinc-300">
                                {lang === 'ar' ? chk.labelAr : chk.labelEn}
                              </span>
                              <span
                                className={`font-mono font-semibold shrink-0 ${
                                  chk.status === 'pass'
                                    ? 'text-emerald-600 dark:text-emerald-400'
                                    : 'text-amber-600 dark:text-amber-400'
                                }`}
                              >
                                {chk.reading}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Paint Thickness Micrometer Grid */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-zinc-950 dark:text-white">
                  {t.paintMapTitle}
                </h3>
                <div className="flex flex-wrap items-center gap-3 text-[11px] text-zinc-500 dark:text-zinc-400">
                  <span className="text-emerald-600 dark:text-emerald-400">● {t.paintFactory}</span>
                  <span className="text-amber-600 dark:text-amber-400">● {t.paintRepainted}</span>
                  <span className="text-rose-600 dark:text-rose-400">● {t.paintReplaced}</span>
                </div>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5">
                {vehicle.paintReadings.map((p) => (
                  <div
                    key={p.panelKey}
                    className="p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50"
                  >
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                      {paintPanelNames[p.panelKey]?.[lang] ?? p.panelKey}
                    </p>
                    <p
                      className={`mt-0.5 font-mono text-xs font-bold tabular-nums ${
                        p.status === 'factory'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : p.status === 'repainted'
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {p.microns} µm
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Total Landed Cost & Jordan Customs Estimator */}
          <section className="p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121216] space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-zinc-200 dark:border-zinc-800">
              <Calculator className="w-5 h-5 text-[#C9A227]" />
              <h2 className="font-display text-lg font-semibold text-zinc-950 dark:text-white">
                {t.landedCalcTitle}
              </h2>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">
                  {t.destinationPresetLabel}
                </label>
                <select
                  value={customsPreset}
                  onChange={(e) => setCustomsPreset(e.target.value as CustomsPreset)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
                >
                  <option value="zarqa_fz">{t.presetZarqaFreeZone}</option>
                  <option value="amman_ev">{t.presetAmmanEv}</option>
                  <option value="amman_hybrid">{t.presetAmmanHybrid}</option>
                  <option value="amman_petrol">{t.presetAmmanPetrol}</option>
                  <option value="gcc_export">{t.presetGccExport}</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">
                  {t.calcBidPrice} (USD Base: ${calcBidUsd.toLocaleString()})
                </label>
                <input
                  type="range"
                  min={Math.max(5000, Math.floor(vehicle.startingBidUsd * 0.8))}
                  max={Math.max(100000, Math.ceil(vehicle.currentBidUsd * 1.6))}
                  step={500}
                  value={calcBidUsd}
                  onChange={(e) => setCalcBidUsd(Number(e.target.value))}
                  className="w-full mt-2 accent-[#C9A227]"
                />
              </div>
            </div>

            <div className="divide-y divide-zinc-100 dark:divide-zinc-800/80 text-sm">
              <div className="py-2.5 flex justify-between">
                <span className="text-zinc-600 dark:text-zinc-400">{t.calcBidPrice}</span>
                <span className="font-mono tabular-nums font-medium">
                  {formatMoney(calcBidUsd, currency, lang, adminSettings.customRatesOverride)}
                </span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-zinc-600 dark:text-zinc-400">
                  {t.calcBuyerFee} ({adminSettings.buyerFeePercent}%)
                </span>
                <span className="font-mono tabular-nums font-medium">
                  {formatMoney(landedBreakdown.buyerFeeUsd, currency, lang, adminSettings.customRatesOverride)}
                </span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-zinc-600 dark:text-zinc-400">{t.calcShipping}</span>
                <span className="font-mono tabular-nums font-medium">
                  {formatMoney(landedBreakdown.shippingUsd, currency, lang, adminSettings.customRatesOverride)}
                </span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-zinc-600 dark:text-zinc-400">{t.calcInsurance}</span>
                <span className="font-mono tabular-nums font-medium">
                  {formatMoney(landedBreakdown.insuranceUsd, currency, lang, adminSettings.customRatesOverride)}
                </span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-zinc-600 dark:text-zinc-400">{t.calcCustoms}</span>
                <span className="font-mono tabular-nums font-medium">
                  {formatMoney(landedBreakdown.customsUsd, currency, lang, adminSettings.customRatesOverride)}
                </span>
              </div>
              <div className="pt-3 flex justify-between items-baseline">
                <span className="font-semibold text-zinc-950 dark:text-white">{t.calcTotalLanded}</span>
                <span className="font-mono text-xl font-bold tabular-nums text-[#9A7414] dark:text-[#D4AF37]">
                  {formatMoney(landedBreakdown.totalUsd, currency, lang, adminSettings.customRatesOverride)}
                </span>
              </div>
            </div>
          </section>
        </div>

        {/* RIGHT COLUMN (4 cols): Sticky Live Bidding Console */}
        <aside className="lg:col-span-4 lg:sticky lg:top-20 space-y-5">
          <div className="p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121216] space-y-5">
            {/* Timer & Anti-Sniping Notice */}
            <div className="flex items-center justify-between gap-2 pb-4 border-b border-zinc-200 dark:border-zinc-800">
              <div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">{t.timeRemaining}</p>
                <CountdownTimer
                  endTimeMs={vehicle.endTimeMs}
                  nowMs={nowMs}
                  saleStatus={computedStatus}
                  lang={lang}
                  antiSnipingExtensions={vehicle.antiSnipingExtensions}
                />
              </div>
              <span
                className={`text-xs font-semibold ${
                  reserveMet
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-amber-600 dark:text-amber-400'
                }`}
              >
                {reserveMet ? t.reserveMet : t.reserveNotMet}
              </span>
            </div>

            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#C9A227] shrink-0" />
              <span>{t.antiSnipingBadge}</span>
            </p>

            {/* Current Bid Display */}
            <div className="p-4 rounded-lg bg-zinc-50 dark:bg-zinc-900/70 border border-zinc-200 dark:border-zinc-800 space-y-1">
              <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                <span>{vehicle.bidHistory.length > 0 ? t.currentBid : t.startingBid}</span>
                <span className="font-mono tabular-nums">
                  {vehicle.bidHistory.length} {t.bidsCount}
                </span>
              </div>
              <p className="font-mono text-3xl font-bold tabular-nums text-zinc-950 dark:text-white">
                {formatMoney(vehicle.currentBidUsd, currency, lang, adminSettings.customRatesOverride)}
              </p>
              <p className="text-[11px] font-mono tabular-nums text-zinc-500 dark:text-zinc-400">
                {t.bidIncrementStep}:{' '}
                {formatMoney(minIncrementUsd, currency, lang, adminSettings.customRatesOverride)}
              </p>
            </div>

            {/* Active Proxy Banner */}
            {proxyConfig?.active && (
              <div className="p-3 rounded-lg border border-emerald-500/40 bg-emerald-500/10 flex items-center justify-between gap-2 text-xs">
                <span className="text-emerald-700 dark:text-emerald-300 font-medium">
                  {t.proxyActiveBanner}{' '}
                  <strong className="font-mono">
                    {formatMoney(proxyConfig.maxBidUsd, currency, lang, adminSettings.customRatesOverride)}
                  </strong>
                </span>
                <button
                  type="button"
                  onClick={() => onCancelProxy(vehicle.id)}
                  className="text-rose-600 dark:text-rose-400 font-semibold hover:underline shrink-0"
                >
                  {t.cancelProxyBtn}
                </button>
              </div>
            )}

            {/* Quick Bid + Custom Bid Form */}
            {isBiddable ? (
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => onPlaceBid(vehicle.id, minNextBidUsd)}
                  className="w-full py-3 px-4 rounded-lg bg-[#C9A227] hover:bg-[#D4AF37] text-zinc-950 font-semibold text-sm flex items-center justify-center gap-2 transition-colors"
                >
                  <Gavel className="w-4 h-4" />
                  <span>
                    {t.quickBidBtn}:{' '}
                    {formatMoney(minNextBidUsd, currency, lang, adminSettings.customRatesOverride)}
                  </span>
                </button>

                <form onSubmit={handleCustomBidSubmit} className="flex gap-2">
                  <input type="hidden" name="_csrf" value={csrfToken} />
                  <div className="relative flex-1">
                    <input
                      type="number"
                      min={1}
                      value={customBidLocal}
                      onChange={(e) => setCustomBidLocal(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-zinc-950 dark:text-white"
                    />
                    <span className="absolute top-1/2 -translate-y-1/2 end-2.5 text-[11px] font-mono text-zinc-400 pointer-events-none">
                      {CURRENCIES[currency].code}
                    </span>
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-zinc-950 dark:bg-zinc-100 text-white dark:text-zinc-950 text-xs font-semibold hover:opacity-90 whitespace-nowrap shrink-0"
                  >
                    {t.placeBidBtn}
                  </button>
                </form>

                {/* Proxy Auto-Bid Form */}
                <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 space-y-2">
                  <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#C9A227]" />
                    <span>{t.proxyBidTitle}</span>
                  </p>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">{t.proxyBidDesc}</p>
                  <form onSubmit={handleProxySubmit} className="flex gap-2">
                    <input
                      type="number"
                      placeholder={String(
                        Math.ceil(
                          convertFromUsd(minNextBidUsd + minIncrementUsd * 3, currency, adminSettings.customRatesOverride)
                        )
                      )}
                      value={proxyMaxLocal}
                      onChange={(e) => setProxyMaxLocal(e.target.value)}
                      className="flex-1 px-3 py-2 text-xs font-mono rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900"
                    />
                    <button
                      type="submit"
                      className="px-3 py-2 rounded-lg border border-[#C9A227] text-[#9A7414] dark:text-[#D4AF37] text-xs font-semibold hover:bg-[#C9A227]/10 whitespace-nowrap shrink-0"
                    >
                      {t.setProxyBtn}
                    </button>
                  </form>
                </div>

                {/* Buy It Now */}
                {vehicle.buyItNowUsd && (
                  <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800">
                    <button
                      type="button"
                      onClick={() => onBuyItNow(vehicle.id)}
                      className="w-full py-2.5 px-4 rounded-lg border border-emerald-600/50 bg-emerald-600/10 text-emerald-700 dark:text-emerald-300 text-xs font-semibold hover:bg-emerald-600/20 transition-colors"
                    >
                      {t.buyNowInstantBtn}{' '}
                      <span className="font-mono">
                        {formatMoney(vehicle.buyItNowUsd, currency, lang, adminSettings.customRatesOverride)}
                      </span>
                    </button>
                  </div>
                )}

                {/* Make an Offer */}
                <form
                  onSubmit={handleOfferSubmit}
                  className="pt-3 border-t border-zinc-200 dark:border-zinc-800 space-y-2"
                >
                  <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                    {t.makeOfferTitle}
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder={t.offerPlaceholder}
                      value={offerLocal}
                      onChange={(e) => setOfferLocal(e.target.value)}
                      className="w-1/2 px-3 py-2 text-xs font-mono rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900"
                    />
                    <input
                      type="text"
                      placeholder={t.offerNotePlaceholder}
                      value={offerNote}
                      onChange={(e) => setOfferNote(e.target.value)}
                      className="w-1/2 px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 text-xs font-medium text-zinc-800 dark:text-zinc-200 hover:border-[#C9A227]"
                  >
                    {t.sendOfferBtn}
                  </button>
                  {offerSuccess && (
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400">
                      Offer transmitted to seller desk under escrow guard.
                    </p>
                  )}
                </form>
              </div>
            ) : (
              <div className="p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 text-xs text-zinc-600 dark:text-zinc-400 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                <span>{STATUS_LABELS[computedStatus][lang]}</span>
              </div>
            )}

            {/* Security Guard Notice */}
            <div className="pt-2 flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
              <span className="inline-flex items-center gap-1">
                <Lock className="w-3 h-3 text-emerald-500" />
                <span>{t.csrfProtectedLabel}</span>
              </span>
              <span className="inline-flex items-center gap-1">
                <Eye className="w-3 h-3" />
                <span>{vehicle.sellerName}</span>
              </span>
            </div>
          </div>

          {/* Live Global Bid Ledger */}
          <div className="p-5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121216] space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-display text-sm font-semibold text-zinc-950 dark:text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#C9A227]" />
                <span>{t.liveBidFeedTitle}</span>
              </h3>
              {isBiddable && (
                <button
                  type="button"
                  onClick={() => onSimulateRivalBid(vehicle.id)}
                  className="text-[11px] font-semibold text-[#9A7414] dark:text-[#D4AF37] hover:underline whitespace-nowrap"
                >
                  {t.simulateRivalBtn}
                </button>
              )}
            </div>

            {vehicle.bidHistory.length === 0 ? (
              <p className="text-xs text-zinc-500 dark:text-zinc-400 py-3">{t.noBidsYet}</p>
            ) : (
              <div className="divide-y divide-zinc-100 dark:divide-zinc-800/80 max-h-64 overflow-y-auto">
                {vehicle.bidHistory.map((b) => (
                  <div
                    key={b.id}
                    className={`py-2.5 flex items-center justify-between text-xs ${
                      b.flagged ? 'opacity-50 line-through' : ''
                    }`}
                  >
                    <div>
                      <p className="font-mono font-semibold text-zinc-900 dark:text-zinc-100">
                        {b.bidderAlias}{' '}
                        {b.isCurrentUser && (
                          <span className="text-[#9A7414] dark:text-[#D4AF37]">(You)</span>
                        )}
                        {b.isAutoBid && (
                          <span className="text-emerald-600 dark:text-emerald-400"> · Proxy</span>
                        )}
                      </p>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono">
                        {new Date(b.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </p>
                    </div>
                    <span className="font-mono font-bold tabular-nums text-zinc-950 dark:text-white">
                      {formatMoney(b.amountUsd, currency, lang, adminSettings.customRatesOverride)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
};
