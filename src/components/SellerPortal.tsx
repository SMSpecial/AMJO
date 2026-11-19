import React, { useState } from 'react';
import { CheckCircle2, ImagePlus, Sparkles, Upload } from 'lucide-react';
import {
  AdminSettings,
  AuctionCategory,
  CurrencyCode,
  FuelType,
  Language,
  LocationHub,
  Vehicle,
} from '../types/auction';
import { CATEGORY_LABELS, LOCATION_LABELS, TRANSLATIONS } from '../i18n/translations';
import { convertToUsd, formatMoney } from '../utils/currency';
import { sanitizeInput, sanitizeNumericInput } from '../utils/security';
import { VehicleImage } from './VehicleImage';

interface SellerPortalProps {
  vehicles: Vehicle[];
  lang: Language;
  currency: CurrencyCode;
  adminSettings: AdminSettings;
  onSubmitVehicle: (newVehicle: Vehicle) => void;
  csrfToken: string;
}

const VIN_PRESETS = [
  {
    vin: 'WBA73AW05PFN48219',
    make: 'BMW',
    model: 'M5 CS',
    trim: 'Frozen Brands Hatch',
    year: 2023,
    fuelType: 'Petrol' as FuelType,
    engineSpec: '4.4L Twin-Turbo V8',
    horsepower: 627,
    category: 'luxury' as Exclude<AuctionCategory, 'all'>,
    imageUrl: './src/assets/images/car_bmw_m4_comp_1795086415605.jpg',
  },
  {
    vin: 'JTJBM7FX2R5320184',
    make: 'Lexus',
    model: 'LX 600',
    trim: 'VIP Executive 4WD',
    year: 2024,
    fuelType: 'Petrol' as FuelType,
    engineSpec: '3.5L V6 Twin-Turbo',
    horsepower: 409,
    category: 'clean_title' as Exclude<AuctionCategory, 'all'>,
    imageUrl: './src/assets/images/car_land_cruiser_300_1795086416153.jpg',
  },
];

export const SellerPortal: React.FC<SellerPortalProps> = ({
  vehicles,
  lang,
  currency,
  adminSettings,
  onSubmitVehicle,
  csrfToken,
}) => {
  const t = TRANSLATIONS[lang];
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const [vin, setVin] = useState('WBA73AW05PFN48219');
  const [make, setMake] = useState('BMW');
  const [model, setModel] = useState('M5 CS');
  const [trim, setTrim] = useState('Frozen Brands Hatch');
  const [year, setYear] = useState(2023);
  const [mileageKm, setMileageKm] = useState(9800);
  const [fuelType, setFuelType] = useState<FuelType>('Petrol');
  const [category, setCategory] = useState<Exclude<AuctionCategory, 'all'>>('luxury');
  const [location, setLocation] = useState<LocationHub>('Zarqa Free Zone, Jordan');
  const [previewImage, setPreviewImage] = useState('./src/assets/images/car_bmw_m4_comp_1795086415605.jpg');
  const [damageNote, setDamageNote] = useState('Clean Title · Full dealership service records.');
  const [startingLocal, setStartingLocal] = useState('52000');
  const [reserveLocal, setReserveLocal] = useState('64000');
  const [buyNowLocal, setBuyNowLocal] = useState('75000');
  const [submittedBanner, setSubmittedBanner] = useState(false);

  const handleVinAutofill = (presetIndex = 0) => {
    const preset = VIN_PRESETS[presetIndex] ?? VIN_PRESETS[0];
    setVin(preset.vin);
    setMake(preset.make);
    setModel(preset.model);
    setTrim(preset.trim);
    setYear(preset.year);
    setFuelType(preset.fuelType);
    setCategory(preset.category);
    setPreviewImage(preset.imageUrl);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setPreviewImage(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handlePublish = (e: React.FormEvent) => {
    e.preventDefault();
    const startUsd = Math.max(
      1000,
      Math.round(convertToUsd(sanitizeNumericInput(startingLocal), currency, adminSettings.customRatesOverride))
    );
    const reserveUsd = Math.max(
      startUsd,
      Math.round(convertToUsd(sanitizeNumericInput(reserveLocal), currency, adminSettings.customRatesOverride))
    );
    const buyNowUsd = Math.round(
      convertToUsd(sanitizeNumericInput(buyNowLocal), currency, adminSettings.customRatesOverride)
    );

    const lotNum = `AMJO-${Math.floor(8900 + Math.random() * 900)}`;
    const newVehicle: Vehicle = {
      id: `lot-${Date.now()}`,
      lotNumber: lotNum,
      vin: sanitizeInput(vin).toUpperCase() || 'WBA73AW05PFN48219',
      make: sanitizeInput(make) || 'BMW',
      model: sanitizeInput(model) || 'M5 CS',
      trim: sanitizeInput(trim) || 'Executive',
      year: Number(year) || 2023,
      category,
      imageUrl: previewImage,
      exteriorColorEn: 'Metallic Obsidian',
      exteriorColorAr: 'أسود معدني',
      interiorColorEn: 'Full Merino Leather',
      interiorColorAr: 'جلد ميرينو كامل',
      mileageKm: Number(mileageKm) || 12000,
      fuelType,
      transmission: fuelType === 'Electric' ? 'Single-Speed EV' : 'Automatic',
      driveType: 'AWD',
      engineSpec: fuelType === 'Electric' ? '800V Dual Motor' : 'Twin-Turbo V8',
      horsepower: 520,
      damageType: category === 'salvage' ? 'Minor Cosmetic' : 'None',
      damageNoteEn: sanitizeInput(damageNote) || 'Seller submitted clean inspection dossier.',
      damageNoteAr: sanitizeInput(damageNote) || 'ملف فحص مقدم من البائع.',
      location,
      saleStatus: 'live',
      currentBidUsd: startUsd,
      startingBidUsd: startUsd,
      reservePriceUsd: reserveUsd,
      buyItNowUsd: buyNowUsd > reserveUsd ? buyNowUsd : undefined,
      endTimeMs: Date.now() + 24 * 3600 * 1000,
      antiSnipingExtensions: 0,
      bidHistory: [],
      vinReport: {
        titleStatus: category === 'salvage' ? 'Salvage Certificate' : 'Clean Title',
        odometerVerified: true,
        accidentsReported: category === 'salvage' ? 1 : 0,
        serviceRecordsCount: 3,
        openRecalls: 0,
        previousOwners: 1,
        manufacturedCountry: 'Germany / Global',
        plantCode: 'Z',
        lastInspectionDate: '2026-11-19',
      },
      inspectionScore: 146,
      inspectionSubsystems: vehicles[0].inspectionSubsystems,
      paintReadings: vehicles[0].paintReadings,
      highlightsEn: ['Consigned via Dealer Portal', 'Escrow Protected'],
      highlightsAr: ['مضاف عبر بوابة المعارض', 'محمي بنظام الضمان'],
      sellerName: 'Amman Partner Showroom',
      sellerVerified: true,
      shippingOriginFeeUsd: 500,
      approvalStatus: 'pending',
    };

    onSubmitVehicle(newVehicle);
    setSubmittedBanner(true);
    setStep(1);
    window.setTimeout(() => setSubmittedBanner(false), 5000);
  };

  const sellerInventory = vehicles.filter(
    (v) => v.sellerName === 'Amman Partner Showroom' || v.approvalStatus === 'pending'
  );

  return (
    <div className="space-y-8">
      <div className="pb-4 border-b border-zinc-200 dark:border-zinc-800">
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-zinc-950 dark:text-white">
          {t.sellerPortalTitle}
        </h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
          Submit vehicles into AMJO’s global auction queue. Admin Command Center can approve pending lots instantaneously.
        </p>
      </div>

      {submittedBanner && (
        <div className="p-4 rounded-xl border border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>
            Vehicle submitted to AMJO Approval Queue! Switch to Admin mode to approve and publish it live.
          </span>
        </div>
      )}

      <div className="grid lg:grid-cols-12 gap-8 items-start">
        {/* Multi-Step Wizard */}
        <form
          onSubmit={handlePublish}
          className="lg:col-span-7 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121216] space-y-6"
        >
          <input type="hidden" name="_csrf" value={csrfToken} />

          {/* Step Selector */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 1 as const, label: t.sellerStep1 },
              { id: 2 as const, label: t.sellerStep2 },
              { id: 3 as const, label: t.sellerStep3 },
            ].map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setStep(s.id)}
                className={`p-2.5 rounded-lg text-xs font-semibold text-start border transition-colors ${
                  step === s.id
                    ? 'border-[#C9A227] bg-[#C9A227]/15 text-[#9A7414] dark:text-[#D4AF37]'
                    : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {step === 1 && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                  17-Character VIN
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleVinAutofill(0)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#9A7414] dark:text-[#D4AF37] hover:underline"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{t.vinAutofillBtn} (BMW M5)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleVinAutofill(1)}
                    className="text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:underline"
                  >
                    (Lexus LX 600)
                  </button>
                </div>
              </div>

              <input
                type="text"
                value={vin}
                onChange={(e) => setVin(e.target.value)}
                required
                className="w-full px-3 py-2.5 text-xs font-mono rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900"
              />

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] text-zinc-500 mb-1">{t.makeLabel}</label>
                  <input
                    type="text"
                    value={make}
                    onChange={(e) => setMake(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-zinc-500 mb-1">{t.modelLabel}</label>
                  <input
                    type="text"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-zinc-500 mb-1">Trim</label>
                  <input
                    type="text"
                    value={trim}
                    onChange={(e) => setTrim(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-zinc-500 mb-1">Year</label>
                  <input
                    type="number"
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-zinc-500 mb-1">Mileage (km)</label>
                  <input
                    type="number"
                    value={mileageKm}
                    onChange={(e) => setMileageKm(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-zinc-500 mb-1">{t.fuelTypeLabel}</label>
                  <select
                    value={fuelType}
                    onChange={(e) => setFuelType(e.target.value as FuelType)}
                    className="w-full px-2.5 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900"
                  >
                    <option value="Petrol">Petrol</option>
                    <option value="Hybrid">Hybrid</option>
                    <option value="Electric">Electric</option>
                    <option value="Diesel">Diesel</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-5 py-2 rounded-lg bg-zinc-950 dark:bg-zinc-100 text-white dark:text-zinc-950 text-xs font-semibold"
                >
                  Next: Media & Inspection
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <label className="block border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl p-6 text-center cursor-pointer hover:border-[#C9A227] transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="sr-only"
                />
                <Upload className="w-7 h-7 mx-auto mb-2 text-[#C9A227]" />
                <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  {t.dropzoneLabel}
                </p>
              </label>

              <div className="flex items-center gap-4">
                <VehicleImage
                  src={previewImage}
                  alt="Preview"
                  className="w-32 h-24 rounded-lg object-cover border border-zinc-200 dark:border-zinc-800"
                />
                <div className="flex-1 space-y-2">
                  <label className="block text-[11px] text-zinc-500">
                    Inspection & Condition Summary
                  </label>
                  <textarea
                    rows={3}
                    value={damageNote}
                    onChange={(e) => setDamageNote(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900"
                  />
                </div>
              </div>

              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs font-medium"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="px-5 py-2 rounded-lg bg-zinc-950 dark:bg-zinc-100 text-white dark:text-zinc-950 text-xs font-semibold"
                >
                  Next: Pricing & Hub
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-zinc-500 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as Exclude<AuctionCategory, 'all'>)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900"
                  >
                    {(Object.keys(CATEGORY_LABELS) as AuctionCategory[])
                      .filter((k) => k !== 'all')
                      .map((k) => (
                        <option key={k} value={k}>
                          {CATEGORY_LABELS[k][lang]}
                        </option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] text-zinc-500 mb-1">{t.locationHubLabel}</label>
                  <select
                    value={location}
                    onChange={(e) => setLocation(e.target.value as LocationHub)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900"
                  >
                    {(Object.keys(LOCATION_LABELS) as LocationHub[]).map((loc) => (
                      <option key={loc} value={loc}>
                        {LOCATION_LABELS[loc][lang]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] text-zinc-500 mb-1">
                    {t.startingBid} ({currency})
                  </label>
                  <input
                    type="number"
                    value={startingLocal}
                    onChange={(e) => setStartingLocal(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-zinc-500 mb-1">
                    Reserve Price ({currency})
                  </label>
                  <input
                    type="number"
                    value={reserveLocal}
                    onChange={(e) => setReserveLocal(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-zinc-500 mb-1">
                    {t.buyItNow} ({currency})
                  </label>
                  <input
                    type="number"
                    value={buyNowLocal}
                    onChange={(e) => setBuyNowLocal(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900"
                  />
                </div>
              </div>

              <div className="flex justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs font-medium"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-lg bg-[#C9A227] text-zinc-950 text-xs font-semibold hover:bg-[#D4AF37]"
                >
                  {t.submitListingBtn}
                </button>
              </div>
            </div>
          )}
        </form>

        {/* Consigned Inventory Status Tracker */}
        <div className="lg:col-span-5 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121216] space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-zinc-200 dark:border-zinc-800">
            <ImagePlus className="w-4 h-4 text-[#C9A227]" />
            <h2 className="font-display text-base font-semibold text-zinc-950 dark:text-white">
              {t.sellerListingsTitle}
            </h2>
          </div>

          {sellerInventory.length === 0 ? (
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              No pending dealer submissions yet. Use the wizard to consign a vehicle into the live queue.
            </p>
          ) : (
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {sellerInventory.map((v) => (
                <div key={v.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-mono text-[11px] text-zinc-500">{v.lotNumber}</p>
                    <p className="text-sm font-semibold truncate text-zinc-950 dark:text-white">
                      {v.year} {v.make} {v.model}
                    </p>
                    <p className="font-mono text-xs text-[#9A7414] dark:text-[#D4AF37]">
                      {formatMoney(v.currentBidUsd, currency, lang, adminSettings.customRatesOverride)}
                    </p>
                  </div>
                  <span
                    className={`text-xs font-semibold shrink-0 ${
                      v.approvalStatus === 'approved'
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : v.approvalStatus === 'pending'
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {v.approvalStatus.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
