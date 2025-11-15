import { db, type OfflineCaseStudy, type OfflineSavedCase, type OfflineComment, type PendingChange } from './schema';

/**
 * Store cases from API response to IndexedDB
 */
export async function storeCases(cases: any[]): Promise<void> {
  const offlineCases: OfflineCaseStudy[] = cases.map((c) => ({
    id: c.id,
    type: c.type,
    status: c.status,
    contributorId: c.contributorId,
    contributorName: c.contributor?.name,
    contributorEmail: c.contributor?.email,
    approverId: c.approverId,
    approverName: c.approver?.name,
    submittedAt: c.submittedAt,
    approvedAt: c.approvedAt,
    rejectionReason: c.rejectionReason,
    rejectedAt: c.rejectedAt,
    rejectedBy: c.rejectedBy,
    customerName: c.customerName,
    industry: c.industry,
    componentWorkpiece: c.componentWorkpiece,
    workType: c.workType,
    wearType: c.wearType || [],
    problemDescription: c.problemDescription,
    previousSolution: c.previousSolution,
    previousServiceLife: c.previousServiceLife,
    competitorName: c.competitorName,
    baseMetal: c.baseMetal,
    generalDimensions: c.generalDimensions,
    waSolution: c.waSolution,
    waProduct: c.waProduct,
    technicalAdvantages: c.technicalAdvantages,
    expectedServiceLife: c.expectedServiceLife,
    solutionValueRevenue: c.solutionValueRevenue,
    annualPotentialRevenue: c.annualPotentialRevenue,
    customerSavingsAmount: c.customerSavingsAmount,
    location: c.location,
    country: c.country,
    images: c.images || [],
    supportingDocs: c.supportingDocs || [],
    originalLanguage: c.originalLanguage || 'en',
    translationAvailable: c.translationAvailable || false,
    translatedText: c.translatedText,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
    _syncStatus: 'synced',
    _lastSyncedAt: new Date().toISOString(),
  }));

  await db.caseStudies.bulkPut(offlineCases);
}

/**
 * Search cases offline with full-text search
 */
export async function searchCasesOffline(query: string): Promise<OfflineCaseStudy[]> {
  const lowerQuery = query.toLowerCase();

  const allCases = await db.caseStudies.toArray();

  return allCases.filter((c) =>
    c.customerName.toLowerCase().includes(lowerQuery) ||
    c.industry.toLowerCase().includes(lowerQuery) ||
    c.componentWorkpiece.toLowerCase().includes(lowerQuery) ||
    c.waProduct.toLowerCase().includes(lowerQuery) ||
    c.problemDescription.toLowerCase().includes(lowerQuery) ||
    c.waSolution.toLowerCase().includes(lowerQuery) ||
    c.location.toLowerCase().includes(lowerQuery) ||
    (c.country && c.country.toLowerCase().includes(lowerQuery))
  );
}

/**
 * Filter cases by criteria
 */
export async function filterCasesOffline(filters: {
  status?: string[];
  type?: string[];
  industry?: string[];
  location?: string[];
}): Promise<OfflineCaseStudy[]> {
  let query = db.caseStudies.toCollection();

  const allCases = await query.toArray();

  return allCases.filter((c) => {
    if (filters.status && filters.status.length > 0 && !filters.status.includes(c.status)) {
      return false;
    }
    if (filters.type && filters.type.length > 0 && !filters.type.includes(c.type)) {
      return false;
    }
    if (filters.industry && filters.industry.length > 0 && !filters.industry.includes(c.industry)) {
      return false;
    }
    if (filters.location && filters.location.length > 0 && !filters.location.includes(c.location)) {
      return false;
    }
    return true;
  });
}

/**
 * Get case by ID from IndexedDB
 */
export async function getCaseOffline(id: string): Promise<OfflineCaseStudy | undefined> {
  return await db.caseStudies.get(id);
}

/**
 * Store saved cases
 */
export async function storeSavedCases(savedCases: any[]): Promise<void> {
  const offlineSavedCases: OfflineSavedCase[] = savedCases.map((sc) => ({
    id: sc.id,
    userId: sc.userId,
    caseStudyId: sc.caseStudyId,
    createdAt: sc.createdAt,
    _syncStatus: 'synced',
    _lastSyncedAt: new Date().toISOString(),
  }));

  await db.savedCases.bulkPut(offlineSavedCases);
}

/**
 * Get saved cases for user
 */
export async function getSavedCasesOffline(userId: string): Promise<OfflineSavedCase[]> {
  return await db.savedCases.where('userId').equals(userId).toArray();
}

/**
 * Save a case offline (add to pending changes)
 */
export async function saveCaseOffline(userId: string, caseStudyId: string): Promise<void> {
  const savedCase: OfflineSavedCase = {
    id: `temp_${Date.now()}`,
    userId,
    caseStudyId,
    createdAt: new Date().toISOString(),
    _syncStatus: 'pending',
  };

  await db.savedCases.add(savedCase);
  await addPendingChange('saved_case', 'create', savedCase);
}

/**
 * Unsave a case offline (add to pending changes)
 */
export async function unsaveCaseOffline(id: string): Promise<void> {
  const savedCase = await db.savedCases.get(id);
  if (savedCase) {
    await db.savedCases.delete(id);
    await addPendingChange('saved_case', 'delete', { id });
  }
}

/**
 * Store comments
 */
export async function storeComments(comments: any[]): Promise<void> {
  const offlineComments: OfflineComment[] = comments.map((c) => ({
    id: c.id,
    content: c.content,
    caseStudyId: c.caseStudyId,
    userId: c.userId,
    userName: c.user?.name,
    userImage: c.user?.image,
    likes: c.likes || 0,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
    _syncStatus: 'synced',
    _lastSyncedAt: new Date().toISOString(),
  }));

  await db.comments.bulkPut(offlineComments);
}

/**
 * Get comments for a case
 */
export async function getCommentsOffline(caseStudyId: string): Promise<OfflineComment[]> {
  return await db.comments
    .where('caseStudyId')
    .equals(caseStudyId)
    .sortBy('createdAt');
}

/**
 * Add comment offline (add to pending changes)
 */
export async function addCommentOffline(
  caseStudyId: string,
  userId: string,
  content: string
): Promise<void> {
  const comment: OfflineComment = {
    id: `temp_${Date.now()}`,
    content,
    caseStudyId,
    userId,
    likes: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    _syncStatus: 'pending',
  };

  await db.comments.add(comment);
  await addPendingChange('comment', 'create', comment);
}

/**
 * Store analytics data with expiry
 */
export async function storeAnalytics(
  type: 'overview' | 'leaderboard' | 'bhag',
  data: any,
  ttlMinutes: number = 60
): Promise<void> {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + ttlMinutes * 60 * 1000);

  await db.analytics.put({
    id: type,
    type,
    data,
    cachedAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
  });
}

/**
 * Get analytics data if not expired
 */
export async function getAnalyticsOffline(
  type: 'overview' | 'leaderboard' | 'bhag'
): Promise<any | null> {
  const analytics = await db.analytics.get(type);

  if (!analytics) return null;

  const now = new Date();
  const expiresAt = new Date(analytics.expiresAt);

  if (now > expiresAt) {
    // Expired, delete and return null
    await db.analytics.delete(type);
    return null;
  }

  return analytics.data;
}

/**
 * Add a pending change to sync queue
 */
export async function addPendingChange(
  entity: 'case' | 'comment' | 'saved_case',
  operation: 'create' | 'update' | 'delete',
  data: any
): Promise<void> {
  const change: PendingChange = {
    id: `${entity}_${operation}_${Date.now()}`,
    entity,
    operation,
    data,
    createdAt: new Date().toISOString(),
    retryCount: 0,
  };

  await db.pendingChanges.add(change);
}

/**
 * Get all pending changes
 */
export async function getPendingChanges(): Promise<PendingChange[]> {
  return await db.pendingChanges.orderBy('createdAt').toArray();
}

/**
 * Remove a pending change (after successful sync)
 */
export async function removePendingChange(id: string): Promise<void> {
  await db.pendingChanges.delete(id);
}

/**
 * Update pending change retry count
 */
export async function updatePendingChangeRetry(
  id: string,
  error: string
): Promise<void> {
  const change = await db.pendingChanges.get(id);
  if (change) {
    await db.pendingChanges.update(id, {
      retryCount: change.retryCount + 1,
      lastError: error,
    });
  }
}

/**
 * Clear all offline data
 */
export async function clearOfflineData(): Promise<void> {
  await db.caseStudies.clear();
  await db.savedCases.clear();
  await db.comments.clear();
  await db.weldingProcedures.clear();
  await db.analytics.clear();
}

/**
 * Clear expired cache
 */
export async function clearExpiredCache(): Promise<void> {
  const now = new Date();
  const allAnalytics = await db.analytics.toArray();

  for (const analytics of allAnalytics) {
    const expiresAt = new Date(analytics.expiresAt);
    if (now > expiresAt) {
      await db.analytics.delete(analytics.id);
    }
  }
}

/**
 * Get database storage size estimate
 */
export async function getStorageEstimate(): Promise<{
  usage: number;
  quota: number;
  percentage: number;
}> {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    const estimate = await navigator.storage.estimate();
    const usage = estimate.usage || 0;
    const quota = estimate.quota || 0;
    const percentage = quota > 0 ? (usage / quota) * 100 : 0;

    return { usage, quota, percentage };
  }

  return { usage: 0, quota: 0, percentage: 0 };
}

/**
 * Update sync metadata
 */
export async function updateSyncMetadata(
  entity: string,
  status: 'idle' | 'syncing' | 'error',
  errorMessage?: string
): Promise<void> {
  await db.syncMetadata.put({
    id: entity,
    entity,
    lastSyncedAt: new Date().toISOString(),
    syncStatus: status,
    errorMessage,
  });
}

/**
 * Get sync metadata for an entity
 */
export async function getSyncMetadata(entity: string) {
  return await db.syncMetadata.get(entity);
}
