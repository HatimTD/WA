'use server';

import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary - prefer CLOUDINARY_URL if available
if (process.env.CLOUDINARY_URL) {
  // CLOUDINARY_URL format: cloudinary://api_key:api_secret@cloud_name
  console.log('[Cloudinary] Using CLOUDINARY_URL for configuration');
  cloudinary.config({
    cloudinary_url: process.env.CLOUDINARY_URL,
    secure: true,
  });
} else {
  console.log('[Cloudinary] Using individual env variables for configuration');
  cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

export interface UploadResult {
  success: boolean;
  url?: string;
  publicId?: string;
  error?: string;
}

/**
 * Upload an image to Cloudinary
 * @param formData - FormData containing the image file
 * @returns UploadResult with URL or error
 */
export async function waUploadImage(formData: FormData): Promise<UploadResult> {
  try {
    console.log('[ImageUpload] Starting image upload');
    console.log('[ImageUpload] Cloudinary config:', {
      cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY ? 'SET' : 'NOT SET',
      api_secret: process.env.CLOUDINARY_API_SECRET ? 'SET' : 'NOT SET',
    });

    const file = formData.get('file') as File;

    if (!file) {
      console.error('[ImageUpload] No file provided');
      return {
        success: false,
        error: 'No file provided',
      };
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      console.error('[ImageUpload] Invalid file type:', file.type);
      return {
        success: false,
        error: 'Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.',
      };
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      console.error('[ImageUpload] File too large:', file.size);
      return {
        success: false,
        error: 'File size exceeds 10MB limit.',
      };
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Cloudinary
    console.log('[ImageUpload] Uploading to Cloudinary...');
    const result = await new Promise<any>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder: 'case-studies',
            resource_type: 'image',
            transformation: [
              { width: 1200, crop: 'limit' }, // Limit max width
              { quality: 'auto' }, // Optimize quality
              { fetch_format: 'auto' }, // Auto format selection
            ],
          },
          (error, result) => {
            if (error) {
              console.error('[ImageUpload] Cloudinary upload error:', JSON.stringify(error, null, 2));
              reject(error);
            } else {
              console.log('[ImageUpload] Upload successful:', result?.public_id);
              resolve(result);
            }
          }
        )
        .end(buffer);
    });

    return {
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
    };
  } catch (error) {
    console.error('[ImageUpload] Error uploading image:', error);
    const errorMessage = error instanceof Error ? error.message :
      (typeof error === 'object' && error !== null && 'message' in error) ?
        String((error as any).message) :
        JSON.stringify(error);
    console.error('[ImageUpload] Detailed error:', errorMessage);
    return {
      success: false,
      error: `Upload failed: ${errorMessage}`,
    };
  }
}

/**
 * Delete an image from Cloudinary
 * @param publicId - Public ID of the image to delete
 * @returns Success status
 */
export async function waDeleteImage(publicId: string): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('[ImageUpload] Deleting image:', publicId);

    await cloudinary.uploader.destroy(publicId);

    console.log('[ImageUpload] Image deleted successfully');
    return { success: true };
  } catch (error) {
    console.error('[ImageUpload] Error deleting image:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete image',
    };
  }
}

/**
 * Upload multiple images to Cloudinary
 * @param formData - FormData containing multiple image files
 * @returns Array of UploadResults
 */
export async function waUploadMultipleImages(formData: FormData): Promise<UploadResult[]> {
  try {
    console.log('[ImageUpload] Starting multiple image upload');

    const files = formData.getAll('files') as File[];

    if (files.length === 0) {
      console.error('[ImageUpload] No files provided');
      return [
        {
          success: false,
          error: 'No files provided',
        },
      ];
    }

    // Limit to 10 images
    if (files.length > 10) {
      console.error('[ImageUpload] Too many files:', files.length);
      return [
        {
          success: false,
          error: 'Maximum 10 images allowed per upload.',
        },
      ];
    }

    // Upload all images
    const uploadPromises = files.map(async (file) => {
      const fileFormData = new FormData();
      fileFormData.append('file', file);
      return waUploadImage(fileFormData);
    });

    const results = await Promise.all(uploadPromises);
    console.log('[ImageUpload] Multiple upload completed:', results.length, 'images');

    return results;
  } catch (error) {
    console.error('[ImageUpload] Error uploading multiple images:', error);
    return [
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to upload images',
      },
    ];
  }
}
