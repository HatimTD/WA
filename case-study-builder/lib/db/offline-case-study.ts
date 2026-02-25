import { db, OfflineCaseStudy, PendingChange } from './schema';
import { generateOfflineId, getOfflineImages, deleteOfflineImagesForCase, offlineImageToFile } from './offline-images';

export type OfflineCaseStudyInput = {
  type: 'APPLICATION' | 'TECH' | 'STAR';
  status: 'DRAFT' | 'SUBMITTED';
  customerName: string;
  industry: string;
  location: string;
  country?: string;
  componentWorkpiece: string;
  workType: 'WORKSHOP' | 'ON_SITE' | 'BOTH';
  wearType: string[];
  baseMetal?: string;
  generalDimensions?: string;
  oem?: string;
  problemDescription: string;
  previousSolution?: string;
  previousServiceLife?: string;
  competitorName?: string;
  waSolution: string;
  waProduct: string;
  technicalAdvantages?: string;
  expectedServiceLife?: string;
  solutionValueRevenue?: string;
  annualPotentialRevenue?: string;
  customerSavingsAmount?: string;
  images: string[];
  supportingDocs: string[];
  tags?: string[];
  wps?: any;
};

/**
 * Save a case study offline when device is offline
 */
export async function saveOfflineCaseStudy(
  data: OfflineCaseStudyInput,
  userId: string,
  userName?: string,
  userEmail?: string
): Promise<{ success: boolean; offlineId?: string; error?: string }> {
  try {
    const offlineId = generateOfflineId();
    const now = new Date().toISOString();

    const offlineCaseStudy: OfflineCaseStudy = {
      id: offlineId,
      type: data.type,
      status: data.status,
      contributorId: userId,
      contributorName: userName,
      contributorEmail: userEmail,
      customerName: data.customerName,
      industry: data.industry,
      componentWorkpiece: data.componentWorkpiece,
      workType: data.workType,
      wearType: data.wearType,
      problemDescription: data.problemDescription,
      previousSolution: data.previousSolution,
      previousServiceLife: data.previousServiceLife,
      competitorName: data.competitorName,
      baseMetal: data.baseMetal,
      generalDimensions: data.generalDimensions,
      waSolution: data.waSolution,
      waProduct: data.waProduct,
      technicalAdvantages: data.technicalAdvantages,
      expectedServiceLife: data.expectedServiceLife,
      solutionValueRevenue: data.solutionValueRevenue ? parseFloat(data.solutionValueRevenue) : undefined,
      annualPotentialRevenue: data.annualPotentialRevenue ? parseFloat(data.annualPotentialRevenue) : undefined,
      customerSavingsAmount: data.customerSavingsAmount ? parseFloat(data.customerSavingsAmount) : undefined,
      location: data.location,
      country: data.country,
      images: [], // Will be populated from offlineImages after sync
      supportingDocs: [],
      originalLanguage: 'en',
      translationAvailable: false,
      createdAt: now,
      updatedAt: now,
      _syncStatus: 'pending',
    };

    // Store the case study
    await db.caseStudies.add(offlineCaseStudy);

    // Add to pending changes queue for sync
    const pendingChange: PendingChange = {
      id: generateOfflineId(),
      entity: 'case',
      operation: 'create',
      data: {
        offlineId,
        ...data,
        wps: data.wps, // Include WPS data if present
      },
      createdAt: now,
      retryCount: 0,
    };
    await db.pendingChanges.add(pendingChange);

    return { success: true, offlineId };
  } catch (error) {
    console.error('[OfflineCaseStudy] Failed to save offline:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to save offline',
    };
  }
}

/**
 * Get all offline case studies for a user
 */
export async function getOfflineCaseStudies(userId?: string): Promise<OfflineCaseStudy[]> {
  if (userId) {
    return db.caseStudies
      .where('contributorId')
      .equals(userId)
      .toArray();
  }
  return db.caseStudies.toArray();
}

/**
 * Get pending (unsynced) case studies
 */
export async function getPendingCaseStudies(): Promise<OfflineCaseStudy[]> {
  return db.caseStudies
    .where('_syncStatus')
    .equals('pending')
    .toArray();
}

/**
 * Get a single offline case study
 */
export async function getOfflineCaseStudy(offlineId: string): Promise<OfflineCaseStudy | undefined> {
  return db.caseStudies.get(offlineId);
}

/**
 * Update an offline case study
 */
export async function updateOfflineCaseStudy(
  offlineId: string,
  updates: Partial<OfflineCaseStudy>
): Promise<boolean> {
  try {
    await db.caseStudies.update(offlineId, {
      ...updates,
      updatedAt: new Date().toISOString(),
      _syncStatus: 'pending',
    });
    return true;
  } catch (error) {
    console.error('[OfflineCaseStudy] Failed to update:', error);
    return false;
  }
}

/**
 * Delete an offline case study and its images
 */
export async function deleteOfflineCaseStudy(offlineId: string): Promise<boolean> {
  try {
    // Delete associated images
    await deleteOfflineImagesForCase(offlineId);

    // Delete the case study
    await db.caseStudies.delete(offlineId);

    // Remove from pending changes
    const pendingChanges = await db.pendingChanges
      .filter(change => change.data?.offlineId === offlineId)
      .toArray();

    await db.pendingChanges.bulkDelete(pendingChanges.map(p => p.id));

    return true;
  } catch (error) {
    console.error('[OfflineCaseStudy] Failed to delete:', error);
    return false;
  }
}

/**
 * Mark a case study as synced with server ID
 */
export async function markCaseStudySynced(
  offlineId: string,
  serverId: string
): Promise<boolean> {
  try {
    await db.caseStudies.update(offlineId, {
      _syncStatus: 'synced',
      _lastSyncedAt: new Date().toISOString(),
    });

    // Remove from pending changes
    const pendingChanges = await db.pendingChanges
      .filter(change => change.data?.offlineId === offlineId)
      .toArray();

    await db.pendingChanges.bulkDelete(pendingChanges.map(p => p.id));

    return true;
  } catch (error) {
    console.error('[OfflineCaseStudy] Failed to mark synced:', error);
    return false;
  }
}

/**
 * Mark a case study sync as failed
 */
export async function markCaseStudySyncFailed(
  offlineId: string,
  error: string
): Promise<boolean> {
  try {
    await db.caseStudies.update(offlineId, {
      _syncStatus: 'error',
    });

    // Update retry count in pending changes
    const pendingChanges = await db.pendingChanges
      .filter(change => change.data?.offlineId === offlineId)
      .toArray();

    for (const change of pendingChanges) {
      await db.pendingChanges.update(change.id, {
        retryCount: change.retryCount + 1,
        lastError: error,
      });
    }

    return true;
  } catch (err) {
    console.error('[OfflineCaseStudy] Failed to mark sync failed:', err);
    return false;
  }
}

/**
 * Get count of pending items for sync indicator
 */
export async function getPendingCount(): Promise<{
  caseStudies: number;
  images: number;
  total: number;
}> {
  const pendingCases = await db.caseStudies
    .where('_syncStatus')
    .equals('pending')
    .count();

  const pendingImages = await db.offlineImages
    .where('_syncStatus')
    .equals('pending')
    .count();

  return {
    caseStudies: pendingCases,
    images: pendingImages,
    total: pendingCases + pendingImages,
  };
}

/**
 * Clear all synced data to free up space
 */
export async function clearSyncedData(): Promise<{
  caseStudies: number;
  images: number;
}> {
  // Get synced case studies
  const syncedCases = await db.caseStudies
    .where('_syncStatus')
    .equals('synced')
    .toArray();

  // Delete synced images
  const syncedImages = await db.offlineImages
    .where('_syncStatus')
    .equals('synced')
    .toArray();

  await db.caseStudies.bulkDelete(syncedCases.map(c => c.id));
  await db.offlineImages.bulkDelete(syncedImages.map(i => i.id));

  return {
    caseStudies: syncedCases.length,
    images: syncedImages.length,
  };
}

/**
 * Get offline storage statistics
 */
export async function getOfflineStats(): Promise<{
  totalCaseStudies: number;
  pendingSync: number;
  synced: number;
  errors: number;
}> {
  const all = await db.caseStudies.toArray();

  return {
    totalCaseStudies: all.length,
    pendingSync: all.filter(c => c._syncStatus === 'pending').length,
    synced: all.filter(c => c._syncStatus === 'synced').length,
    errors: all.filter(c => c._syncStatus === 'error').length,
  };
}
