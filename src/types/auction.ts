export type Language = 'en' | 'ar';

export type ThemeMode = 'dark' | 'light';

export type UserRole = 'buyer' | 'seller' | 'admin';

export type CurrencyCode =
  | 'JOD'
  | 'USD'
  | 'EUR'
  | 'SAR'
  | 'AED'
  | 'KWD'
  | 'GBP'
  | 'JPY';

export type AuctionCategory =
  | 'all'
  | 'clean_title'
  | 'salvage'
  | 'classic'
  | 'ev_hybrid'
  | 'luxury'
  | 'heavy';

export type FuelType = 'Petrol' | 'Hybrid' | 'Electric' | 'Diesel';
export type TransmissionType = 'Automatic' | 'PDK Dual-Clutch' | 'Manual' | 'Single-Speed EV';
export type DriveType = 'AWD' | '4WD' | 'RWD' | 'FWD';
export type DamageType = 'None' | 'Minor Cosmetic' | 'Front End' | 'Rear Quarter' | 'Hail / Weather';
export type LocationHub =
  | 'Zarqa Free Zone, Jordan'
  | 'Amman, Jordan'
  | 'Dubai, UAE'
  | 'Stuttgart, Germany'
  | 'Munich, Germany'
  | 'Houston, USA'
  | 'Seoul, South Korea'
  | 'London, UK';

export type SaleStatus = 'live' | 'upcoming' | 'ended';

export interface BidEntry {
  id: string;
  bidderAlias: string;
  countryCode: string;
  amountUsd: number;
  timestamp: number;
  isAutoBid?: boolean;
  isCurrentUser?: boolean;
  flagged?: boolean;
}

export interface OfferEntry {
  id: string;
  vehicleId: string;
  amountUsd: number;
  note: string;
  status: 'pending' | 'countered' | 'accepted';
  timestamp: number;
}

export interface PaintReading {
  panelKey: string;
  microns: number;
  status: 'factory' | 'repainted' | 'replaced';
}

export interface InspectionSubsystem {
  key: 'engine' | 'transmission' | 'battery' | 'chassis' | 'electronics' | 'interior';
  score: number;
  maxPoints: number;
  passedPoints: number;
  notesEn: string;
  notesAr: string;
  checks: Array<{
    labelEn: string;
    labelAr: string;
    status: 'pass' | 'attention' | 'service';
    reading?: string;
  }>;
}

export interface VinHistoryReport {
  titleStatus: 'Clean Title' | 'Salvage Certificate' | 'Collector Heritage Title';
  odometerVerified: boolean;
  accidentsReported: number;
  serviceRecordsCount: number;
  openRecalls: number;
  previousOwners: number;
  manufacturedCountry: string;
  plantCode: string;
  lastInspectionDate: string;
}

export interface Vehicle {
  id: string;
  lotNumber: string;
  vin: string;
  make: string;
  model: string;
  trim: string;
  year: number;
  category: Exclude<AuctionCategory, 'all'>;
  imageUrl: string;
  exteriorColorEn: string;
  exteriorColorAr: string;
  interiorColorEn: string;
  interiorColorAr: string;
  mileageKm: number;
  fuelType: FuelType;
  transmission: TransmissionType;
  driveType: DriveType;
  engineSpec: string;
  horsepower: number;
  hybridBatterySoh?: number;
  damageType: DamageType;
  damageNoteEn: string;
  damageNoteAr: string;
  location: LocationHub;
  saleStatus: SaleStatus;
  currentBidUsd: number;
  startingBidUsd: number;
  reservePriceUsd: number;
  buyItNowUsd?: number;
  endTimeMs: number;
  antiSnipingExtensions: number;
  bidHistory: BidEntry[];
  vinReport: VinHistoryReport;
  inspectionScore: number;
  inspectionSubsystems: InspectionSubsystem[];
  paintReadings: PaintReading[];
  highlightsEn: string[];
  highlightsAr: string[];
  sellerName: string;
  sellerVerified: boolean;
  shippingOriginFeeUsd: number;
  approvalStatus: 'approved' | 'pending' | 'rejected';
}

export interface ProxyBidConfig {
  vehicleId: string;
  maxBidUsd: number;
  active: boolean;
}

export interface InvoiceRecord {
  id: string;
  vehicleId: string;
  vehicleTitle: string;
  lotNumber: string;
  winningBidUsd: number;
  buyerFeeUsd: number;
  shippingUsd: number;
  totalUsd: number;
  status: 'paid' | 'escrow_pending' | 'awaiting_wire';
  issuedAt: string;
  logisticsStage: 'port_dispatch' | 'maritime_transit' | 'aqaba_customs' | 'zarqa_clearance' | 'delivered';
}

export interface KycApplicant {
  id: string;
  name: string;
  country: string;
  idType: string;
  depositUsd: number;
  status: 'verified' | 'pending' | 'flagged';
  submittedAt: string;
}

export interface UserSecurityState {
  kycVerified: boolean;
  kycFullName: string;
  kycDocumentNumber: string;
  twoFactorEnabled: boolean;
  walletBalanceUsd: number;
  biddingPowerMultiplier: number;
}

export interface AdminSettings {
  buyerFeePercent: number;
  escrowInsurancePercent: number;
  antiSnipingWindowSec: number;
  antiSnipingExtendSec: number;
  customRatesOverride: Partial<Record<CurrencyCode, number>>;
}

export type AppRoute =
  | { view: 'catalog' }
  | { view: 'lot'; lotId: string }
  | { view: 'buyer' }
  | { view: 'seller' }
  | { view: 'admin' };
