import Dexie, { type EntityTable } from 'dexie';

// Types matching Prisma schema for offline storage
export interface OfflineCaseStudy {
  id: string;
  type: 'APPLICATION' | 'TECH' | 'STAR';
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'PUBLISHED';

  // Contributors & Approval
  contributorId: string;
  contributorName?: string;
  contributorEmail?: string;
  approverId?: string;
  approverName?: string;
  submittedAt?: string;
  approvedAt?: string;

  // Rejection Tracking
  rejectionReason?: string;
  rejectedAt?: string;
  rejectedBy?: string;

  // Core Fields
  customerName: string;
  industry: string;
  componentWorkpiece: string;
  workType: 'WORKSHOP' | 'ON_SITE' | 'BOTH';
  wearType: string[];
  problemDescription: string;
  previousSolution?: string;
  previousServiceLife?: string;
  competitorName?: string;
  baseMetal?: string;
  generalDimensions?: string;

  // WA Solution
  waSolution: string;
  waProduct: string;
  technicalAdvantages?: string;
  expectedServiceLife?: string;
  solutionValueRevenue?: number;
  annualPotentialRevenue?: number;
  customerSavingsAmount?: number;

  // Location
  location: string;
  country?: string;

  // Media (URLs)
  images: string[];
  supportingDocs: string[];

  // Translation
  originalLanguage: string;
  translationAvailable: boolean;
  translatedText?: string;

  // Metadata
  createdAt: string;
  updatedAt: string;

  // Sync status
  _syncStatus?: 'synced' | 'pending' | 'error';
  _lastSyncedAt?: string;
}

export interface OfflineSavedCase {
  id: string;
  userId: string;
  caseStudyId: string;
  createdAt: string;

  // Sync status
  _syncStatus?: 'synced' | 'pending' | 'error';
  _lastSyncedAt?: string;
}

export interface OfflineUser {
  id: string;
  name?: string;
  email: string;
  image?: string;
  role: 'CONTRIBUTOR' | 'APPROVER' | 'ADMIN' | 'VIEWER' | 'IT_DEPARTMENT' | 'MARKETING';
  region?: string;
  totalPoints: number;
  badges: string[];

  createdAt: string;
  updatedAt: string;
}

export interface OfflineComment {
  id: string;
  content: string;
  caseStudyId: string;
  userId: string;
  userName?: string;
  userImage?: string;
  likes: number;

  createdAt: string;
  updatedAt: string;

  // Sync status
  _syncStatus?: 'synced' | 'pending' | 'error';
  _lastSyncedAt?: string;
}

export interface OfflineWeldingProcedure {
  id: string;
  caseStudyId: string;

  // Base Metal
  baseMetalType?: string;
  baseMetalGrade?: string;
  baseMetalThickness?: string;
  surfacePreparation?: string;

  // WA Product
  waProductName: string;
  waProductDiameter?: string;
  shieldingGas?: string;
  shieldingFlowRate?: string;
  flux?: string;
  standardDesignation?: string;

  // Welding Parameters
  weldingProcess: string;
  currentType?: string;
  currentModeSynergy?: string;
  wireFeedSpeed?: string;
  intensity?: string;
  voltage?: string;
  heatInput?: string;
  weldingPosition?: string;
  torchAngle?: string;
  stickOut?: string;
  travelSpeed?: string;

  // Oscillation
  oscillationWidth?: string;
  oscillationSpeed?: string;
  oscillationStepOver?: string;
  oscillationTempo?: string;

  // Temperature
  preheatTemperature?: string;
  interpassTemperature?: string;
  postheatTemperature?: string;
  pwhtDetails?: string;

  // Results
  layerNumbers?: number;
  hardness?: string;
  defectsObserved?: string;
  additionalNotes?: string;

  createdAt: string;
  updatedAt: string;
}

export interface OfflineAnalytics {
  id: string;
  type: 'overview' | 'leaderboard' | 'bhag';
  data: any; // JSON data
  cachedAt: string;
  expiresAt: string;
}

export interface PendingChange {
  id: string;
  entity: 'case' | 'comment' | 'saved_case';
  operation: 'create' | 'update' | 'delete';
  data: any;
  createdAt: string;
  retryCount: number;
  lastError?: string;
}

export interface SyncMetadata {
  id: string;
  entity: string;
  lastSyncedAt: string;
  syncStatus: 'idle' | 'syncing' | 'error';
  errorMessage?: string;
}

// Offline Image Storage (base64)
export interface OfflineImage {
  id: string;
  caseStudyTempId: string; // Links to offline case study before server ID exists
  fieldName: 'images' | 'supportingDocs'; // Which field this image belongs to
  base64Data: string; // Base64 encoded image data
  mimeType: string; // e.g., 'image/jpeg', 'image/png'
  fileName: string; // Original filename
  size: number; // File size in bytes
  thumbnail?: string; // Optional base64 thumbnail for preview
  createdAt: string;
  _syncStatus: 'pending' | 'uploading' | 'synced' | 'error';
  _cloudinaryUrl?: string; // Populated after upload
  _uploadError?: string; // Error message if upload failed
}

// Dexie Database Class
class OfflineDatabase extends Dexie {
  // Tables
  caseStudies!: EntityTable<OfflineCaseStudy, 'id'>;
  savedCases!: EntityTable<OfflineSavedCase, 'id'>;
  users!: EntityTable<OfflineUser, 'id'>;
  comments!: EntityTable<OfflineComment, 'id'>;
  weldingProcedures!: EntityTable<OfflineWeldingProcedure, 'id'>;
  analytics!: EntityTable<OfflineAnalytics, 'id'>;
  pendingChanges!: EntityTable<PendingChange, 'id'>;
  syncMetadata!: EntityTable<SyncMetadata, 'id'>;
  offlineImages!: EntityTable<OfflineImage, 'id'>;

  constructor() {
    super('CaseStudyBuilderDB');

    // Version 1 - Original schema
    this.version(1).stores({
      // Case Studies - Index by key search fields
      caseStudies: 'id, contributorId, status, type, industry, location, customerName, waProduct, componentWorkpiece, createdAt, updatedAt, _syncStatus',

      // Saved Cases
      savedCases: 'id, userId, caseStudyId, [userId+caseStudyId], _syncStatus',

      // Users
      users: 'id, email, role',

      // Comments
      comments: 'id, caseStudyId, userId, createdAt, _syncStatus',

      // Welding Procedures (Library)
      weldingProcedures: 'id, caseStudyId, waProductName, weldingProcess, baseMetalType',

      // Analytics Cache
      analytics: 'id, type, cachedAt, expiresAt',

      // Pending Changes (for sync queue)
      pendingChanges: 'id, entity, operation, createdAt',

      // Sync Metadata
      syncMetadata: 'id, entity, lastSyncedAt, syncStatus',
    });

    // Version 2 - Added offline images table for PWA photo storage
    this.version(2).stores({
      // Keep all existing tables unchanged
      caseStudies: 'id, contributorId, status, type, industry, location, customerName, waProduct, componentWorkpiece, createdAt, updatedAt, _syncStatus',
      savedCases: 'id, userId, caseStudyId, [userId+caseStudyId], _syncStatus',
      users: 'id, email, role',
      comments: 'id, caseStudyId, userId, createdAt, _syncStatus',
      weldingProcedures: 'id, caseStudyId, waProductName, weldingProcess, baseMetalType',
      analytics: 'id, type, cachedAt, expiresAt',
      pendingChanges: 'id, entity, operation, createdAt',
      syncMetadata: 'id, entity, lastSyncedAt, syncStatus',

      // NEW: Offline images for PWA - stores base64 photos until sync
      offlineImages: 'id, caseStudyTempId, fieldName, _syncStatus, createdAt',
    });
  }
}

// Create and export database instance
export const db = new OfflineDatabase();

// Export type for use in components
export type { OfflineDatabase };
