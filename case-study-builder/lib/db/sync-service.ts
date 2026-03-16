import { db, OfflineCaseStudy, PendingChange } from './schema';
import {
  getOfflineImages,
  updateImageSyncStatus,
  offlineImageToFile,
  deleteOfflineImage,
} from './offline-images';
import { markCaseStudySynced, markCaseStudySyncFailed } from './offline-case-study';

export interface SyncProgress {
  stage: 'idle' | 'images' | 'cases' | 'complete' | 'error';
  currentItem: number;
  totalItems: number;
  currentItemName?: string;
  error?: string;
}

export type SyncProgressCallback = (progress: SyncProgress) => void;

/**
 * Sync all pending offline data to the server
 */
export async function syncOfflineData(
  onProgress?: SyncProgressCallback
): Promise<{
  success: boolean;
  syncedCases: number;
  syncedImages: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let syncedCases = 0;
  let syncedImages = 0;

  try {
    // Get all pending items
    const pendingChanges = await db.pendingChanges
      .where('retryCount')
      .below(3) // Only retry up to 3 times
      .toArray();

    const pendingImages = await db.offlineImages
      .where('_syncStatus')
      .equals('pending')
      .toArray();

    const totalItems = pendingChanges.length + pendingImages.length;

    if (totalItems === 0) {
      onProgress?.({
        stage: 'complete',
        currentItem: 0,
        totalItems: 0,
      });
      return { success: true, syncedCases: 0, syncedImages: 0, errors: [] };
    }

    // Step 1: Upload pending images first
    onProgress?.({
      stage: 'images',
      currentItem: 0,
      totalItems: pendingImages.length,
    });

    for (let i = 0; i < pendingImages.length; i++) {
      const image = pendingImages[i];
      onProgress?.({
        stage: 'images',
        currentItem: i + 1,
        totalItems: pendingImages.length,
        currentItemName: image.fileName,
      });

      try {
        // Convert to File and upload to Cloudinary
        const file = offlineImageToFile(image);
        const cloudinaryUrl = await uploadToCloudinary(file);

        if (cloudinaryUrl) {
          await updateImageSyncStatus(image.id, 'synced', cloudinaryUrl);
          syncedImages++;
        } else {
          await updateImageSyncStatus(image.id, 'error', undefined, 'Upload failed');
          errors.push(`Failed to upload image: ${image.fileName}`);
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        await updateImageSyncStatus(image.id, 'error', undefined, errorMsg);
        errors.push(`Image upload error (${image.fileName}): ${errorMsg}`);
      }
    }

    // Step 2: Sync pending case studies
    onProgress?.({
      stage: 'cases',
      currentItem: 0,
      totalItems: pendingChanges.length,
    });

    for (let i = 0; i < pendingChanges.length; i++) {
      const change = pendingChanges[i];
      onProgress?.({
        stage: 'cases',
        currentItem: i + 1,
        totalItems: pendingChanges.length,
        currentItemName: change.data?.customerName || 'Case Study',
      });

      try {
        if (change.entity === 'case' && change.operation === 'create') {
          const result = await syncCaseStudy(change);
          if (result.success) {
            syncedCases++;
          } else {
            errors.push(result.error || 'Failed to sync case study');
          }
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Case sync error: ${errorMsg}`);
        await markCaseStudySyncFailed(change.data?.offlineId, errorMsg);
      }
    }

    onProgress?.({
      stage: 'complete',
      currentItem: totalItems,
      totalItems,
    });

    return {
      success: errors.length === 0,
      syncedCases,
      syncedImages,
      errors,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Sync failed';
    onProgress?.({
      stage: 'error',
      currentItem: 0,
      totalItems: 0,
      error: errorMsg,
    });
    return {
      success: false,
      syncedCases,
      syncedImages,
      errors: [errorMsg],
    };
  }
}

/**
 * Upload a file to Cloudinary
 */
async function uploadToCloudinary(file: File): Promise<string | null> {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data.url || data.secure_url || null;
  } catch (error) {
    console.error('[SyncService] Cloudinary upload failed:', error);
    return null;
  }
}

/**
 * Sync a single case study to the server
 */
async function syncCaseStudy(
  change: PendingChange
): Promise<{ success: boolean; serverId?: string; error?: string }> {
  const { offlineId, wps, ...caseData } = change.data;

  // Get synced image URLs for this case
  const offlineImages = await getOfflineImages(offlineId);
  const syncedImages = offlineImages.filter(
    img => img._syncStatus === 'synced' && img._cloudinaryUrl
  );

  // Separate images by field
  const imageUrls = syncedImages
    .filter(img => img.fieldName === 'images')
    .map(img => img._cloudinaryUrl!);
  const docUrls = syncedImages
    .filter(img => img.fieldName === 'supportingDocs')
    .map(img => img._cloudinaryUrl!);

  // Prepare data for server
  const serverData = {
    ...caseData,
    images: imageUrls,
    supportingDocs: docUrls,
  };

  try {
    // Call the server action via API route
    const response = await fetch('/api/offline-sync/case-study', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ data: serverData, wps }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to sync case study');
    }

    const result = await response.json();

    if (result.success && result.id) {
      // Mark as synced
      await markCaseStudySynced(offlineId, result.id);

      // Clean up synced images
      for (const image of syncedImages) {
        await deleteOfflineImage(image.id);
      }

      return { success: true, serverId: result.id };
    }

    return { success: false, error: result.error || 'Unknown error' };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Sync failed';
    await markCaseStudySyncFailed(offlineId, errorMsg);
    return { success: false, error: errorMsg };
  }
}

/**
 * Check if there are pending items to sync
 */
export async function hasPendingSync(): Promise<boolean> {
  const pendingChanges = await db.pendingChanges.count();
  const pendingImages = await db.offlineImages
    .where('_syncStatus')
    .equals('pending')
    .count();

  return pendingChanges > 0 || pendingImages > 0;
}

/**
 * Get sync status summary
 */
export async function getSyncStatus(): Promise<{
  hasPending: boolean;
  pendingCases: number;
  pendingImages: number;
  failedCases: number;
  failedImages: number;
}> {
  const pendingChanges = await db.pendingChanges.count();
  const pendingImages = await db.offlineImages
    .where('_syncStatus')
    .equals('pending')
    .count();
  const failedCases = await db.caseStudies
    .where('_syncStatus')
    .equals('error')
    .count();
  const failedImages = await db.offlineImages
    .where('_syncStatus')
    .equals('error')
    .count();

  return {
    hasPending: pendingChanges > 0 || pendingImages > 0,
    pendingCases: pendingChanges,
    pendingImages,
    failedCases,
    failedImages,
  };
}

/**
 * Retry failed syncs
 */
export async function retryFailedSyncs(
  onProgress?: SyncProgressCallback
): Promise<{
  success: boolean;
  retriedCases: number;
  retriedImages: number;
  errors: string[];
}> {
  // Reset error status to pending for retry
  const failedCases = await db.caseStudies
    .where('_syncStatus')
    .equals('error')
    .toArray();

  const failedImages = await db.offlineImages
    .where('_syncStatus')
    .equals('error')
    .toArray();

  for (const caseStudy of failedCases) {
    await db.caseStudies.update(caseStudy.id, { _syncStatus: 'pending' });
  }

  for (const image of failedImages) {
    await db.offlineImages.update(image.id, { _syncStatus: 'pending' });
  }

  // Now run sync
  return syncOfflineData(onProgress) as any;
}
