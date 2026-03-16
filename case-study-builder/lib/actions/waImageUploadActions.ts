'use server';

import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary - prefer CLOUDINARY_URL if available
if (process.env.CLOUDINARY_URL) {
  cloudinary.config({
    cloudinary_url: process.env.CLOUDINARY_URL,
    secure: true,
  });
} else {
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
      return {
        success: false,
        error: 'Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.',
      };
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return {
        success: false,
        error: 'File size exceeds 10MB limit.',
      };
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Cloudinary
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
              reject(error);
            } else {
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
    await cloudinary.uploader.destroy(publicId);
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
    const files = formData.getAll('files') as File[];

    if (files.length === 0) {
      return [
        {
          success: false,
          error: 'No files provided',
        },
      ];
    }

    // Limit to 10 images
    if (files.length > 10) {
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
