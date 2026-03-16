import { db, OfflineImage } from './schema';

// Constants for image storage limits
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB per image
export const MAX_TOTAL_STORAGE = 50 * 1024 * 1024; // 50MB total for images
export const THUMBNAIL_MAX_WIDTH = 200;
export const THUMBNAIL_MAX_HEIGHT = 200;
export const THUMBNAIL_QUALITY = 0.7;

// Supported image types
export const SUPPORTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
];

// Supported document types
export const SUPPORTED_DOC_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

/**
 * Generate a unique ID for offline storage
 */
export function generateOfflineId(): string {
  return `offline_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Convert a File to base64 string
 */
export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data URL prefix to store just the base64 data
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Convert base64 back to Blob for display or upload
 */
export function base64ToBlob(base64: string, mimeType: string): Blob {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
}

/**
 * Create a thumbnail from an image file
 */
export async function createThumbnail(file: File): Promise<string | undefined> {
  if (!file.type.startsWith('image/')) {
    return undefined;
  }

  return new Promise((resolve) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    img.onload = () => {
      // Calculate thumbnail dimensions maintaining aspect ratio
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > THUMBNAIL_MAX_WIDTH) {
          height = Math.round((height * THUMBNAIL_MAX_WIDTH) / width);
          width = THUMBNAIL_MAX_WIDTH;
        }
      } else {
        if (height > THUMBNAIL_MAX_HEIGHT) {
          width = Math.round((width * THUMBNAIL_MAX_HEIGHT) / height);
          height = THUMBNAIL_MAX_HEIGHT;
        }
      }

      canvas.width = width;
      canvas.height = height;

      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        const thumbnailDataUrl = canvas.toDataURL('image/jpeg', THUMBNAIL_QUALITY);
        const base64 = thumbnailDataUrl.split(',')[1];
        resolve(base64);
      } else {
        resolve(undefined);
      }

      URL.revokeObjectURL(img.src);
    };

    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      resolve(undefined);
    };

    img.src = URL.createObjectURL(file);
  });
}

/**
 * Get current total storage used by offline images
 */
export async function getTotalStorageUsed(): Promise<number> {
  const images = await db.offlineImages.toArray();
  return images.reduce((total, img) => {
    // base64 is ~33% larger than binary, so estimate actual storage
    const dataSize = img.base64Data.length;
    const thumbnailSize = img.thumbnail?.length || 0;
    return total + dataSize + thumbnailSize;
  }, 0);
}

/**
 * Check if storage is available for a new image
 */
export async function canStoreImage(fileSize: number): Promise<{
  canStore: boolean;
  reason?: string;
  currentUsage: number;
  maxStorage: number;
}> {
  if (fileSize > MAX_IMAGE_SIZE) {
    return {
      canStore: false,
      reason: `Image size (${(fileSize / 1024 / 1024).toFixed(2)}MB) exceeds maximum allowed size (${MAX_IMAGE_SIZE / 1024 / 1024}MB)`,
      currentUsage: await getTotalStorageUsed(),
      maxStorage: MAX_TOTAL_STORAGE,
    };
  }

  const currentUsage = await getTotalStorageUsed();
  // Estimate base64 size (~33% larger)
  const estimatedBase64Size = Math.ceil(fileSize * 1.34);

  if (currentUsage + estimatedBase64Size > MAX_TOTAL_STORAGE) {
    return {
      canStore: false,
      reason: `Not enough storage space. Current usage: ${(currentUsage / 1024 / 1024).toFixed(2)}MB, Maximum: ${MAX_TOTAL_STORAGE / 1024 / 1024}MB`,
      currentUsage,
      maxStorage: MAX_TOTAL_STORAGE,
    };
  }

  return {
    canStore: true,
    currentUsage,
    maxStorage: MAX_TOTAL_STORAGE,
  };
}

/**
 * Store an image file offline
 */
export async function storeOfflineImage(
  file: File,
  caseStudyTempId: string,
  fieldName: 'images' | 'supportingDocs'
): Promise<{ success: boolean; imageId?: string; error?: string }> {
  try {
    // Check storage availability
    const storageCheck = await canStoreImage(file.size);
    if (!storageCheck.canStore) {
      return { success: false, error: storageCheck.reason };
    }

    // Validate file type
    const validTypes = fieldName === 'images' ? SUPPORTED_IMAGE_TYPES : SUPPORTED_DOC_TYPES;
    if (!validTypes.includes(file.type)) {
      return {
        success: false,
        error: `Unsupported file type: ${file.type}. Supported types: ${validTypes.join(', ')}`,
      };
    }

    // Convert to base64
    const base64Data = await fileToBase64(file);

    // Create thumbnail for images
    const thumbnail = await createThumbnail(file);

    // Generate ID and create record
    const id = generateOfflineId();
    const offlineImage: OfflineImage = {
      id,
      caseStudyTempId,
      fieldName,
      base64Data,
      mimeType: file.type,
      fileName: file.name,
      size: file.size,
      thumbnail,
      createdAt: new Date().toISOString(),
      _syncStatus: 'pending',
    };

    // Store in IndexedDB
    await db.offlineImages.add(offlineImage);

    return { success: true, imageId: id };
  } catch (error) {
    console.error('[OfflineImages] Failed to store image:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to store image offline',
    };
  }
}

/**
 * Get all offline images for a case study
 */
export async function getOfflineImages(
  caseStudyTempId: string,
  fieldName?: 'images' | 'supportingDocs'
): Promise<OfflineImage[]> {
  let query = db.offlineImages.where('caseStudyTempId').equals(caseStudyTempId);

  const images = await query.toArray();

  if (fieldName) {
    return images.filter(img => img.fieldName === fieldName);
  }

  return images;
}

/**
 * Get a single offline image by ID
 */
export async function getOfflineImage(imageId: string): Promise<OfflineImage | undefined> {
  return db.offlineImages.get(imageId);
}

/**
 * Delete an offline image
 */
export async function deleteOfflineImage(imageId: string): Promise<boolean> {
  try {
    await db.offlineImages.delete(imageId);
    return true;
  } catch (error) {
    console.error('[OfflineImages] Failed to delete image:', error);
    return false;
  }
}

/**
 * Delete all offline images for a case study
 */
export async function deleteOfflineImagesForCase(caseStudyTempId: string): Promise<number> {
  try {
    const images = await getOfflineImages(caseStudyTempId);
    await db.offlineImages.bulkDelete(images.map(img => img.id));
    return images.length;
  } catch (error) {
    console.error('[OfflineImages] Failed to delete images for case:', error);
    return 0;
  }
}

/**
 * Update sync status for an image
 */
export async function updateImageSyncStatus(
  imageId: string,
  status: OfflineImage['_syncStatus'],
  cloudinaryUrl?: string,
  error?: string
): Promise<boolean> {
  try {
    const updates: Partial<OfflineImage> = { _syncStatus: status };
    if (cloudinaryUrl) {
      updates._cloudinaryUrl = cloudinaryUrl;
    }
    if (error) {
      updates._uploadError = error;
    }
    await db.offlineImages.update(imageId, updates);
    return true;
  } catch (err) {
    console.error('[OfflineImages] Failed to update sync status:', err);
    return false;
  }
}

/**
 * Get all images pending sync
 */
export async function getPendingImages(): Promise<OfflineImage[]> {
  return db.offlineImages.where('_syncStatus').equals('pending').toArray();
}

/**
 * Get image as data URL for display
 */
export function getImageDataUrl(image: OfflineImage): string {
  return `data:${image.mimeType};base64,${image.base64Data}`;
}

/**
 * Get thumbnail as data URL for display
 */
export function getThumbnailDataUrl(image: OfflineImage): string | undefined {
  if (!image.thumbnail) return undefined;
  return `data:image/jpeg;base64,${image.thumbnail}`;
}

/**
 * Convert offline image to File for upload
 */
export function offlineImageToFile(image: OfflineImage): File {
  const blob = base64ToBlob(image.base64Data, image.mimeType);
  return new File([blob], image.fileName, { type: image.mimeType });
}

/**
 * Get storage statistics
 */
export async function getStorageStats(): Promise<{
  totalImages: number;
  totalSize: number;
  pendingSync: number;
  synced: number;
  errors: number;
  maxStorage: number;
  usagePercent: number;
}> {
  const images = await db.offlineImages.toArray();
  const totalSize = await getTotalStorageUsed();

  return {
    totalImages: images.length,
    totalSize,
    pendingSync: images.filter(img => img._syncStatus === 'pending').length,
    synced: images.filter(img => img._syncStatus === 'synced').length,
    errors: images.filter(img => img._syncStatus === 'error').length,
    maxStorage: MAX_TOTAL_STORAGE,
    usagePercent: (totalSize / MAX_TOTAL_STORAGE) * 100,
  };
}

/**
 * Clear all synced images to free up space
 */
export async function clearSyncedImages(): Promise<number> {
  const syncedImages = await db.offlineImages.where('_syncStatus').equals('synced').toArray();
  await db.offlineImages.bulkDelete(syncedImages.map(img => img.id));
  return syncedImages.length;
}
