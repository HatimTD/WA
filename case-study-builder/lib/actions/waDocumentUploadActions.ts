'use server';

import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary - prefer CLOUDINARY_URL if available
if (process.env.CLOUDINARY_URL) {
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

export interface DocumentUploadResult {
  success: boolean;
  url?: string;
  publicId?: string;
  fileName?: string;
  error?: string;
}

/**
 * Upload a document to Cloudinary
 * @param formData - FormData containing the document file
 * @returns DocumentUploadResult with URL or error
 */
export async function waUploadDocument(formData: FormData): Promise<DocumentUploadResult> {
  try {
    console.log('[DocumentUpload] Starting document upload');

    const file = formData.get('file') as File;

    if (!file) {
      console.error('[DocumentUpload] No file provided');
      return {
        success: false,
        error: 'No file provided',
      };
    }

    // Validate file type - allow common document formats
    const validTypes = [
      'application/pdf',
      'application/msword', // .doc
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
      'application/vnd.ms-excel', // .xls
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-powerpoint', // .ppt
      'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
      'text/plain', // .txt
    ];

    if (!validTypes.includes(file.type)) {
      console.error('[DocumentUpload] Invalid file type:', file.type);
      return {
        success: false,
        error: 'Invalid file type. Only PDF, Word, Excel, PowerPoint, and TXT files are allowed.',
      };
    }

    // Validate file size (max 20MB for documents)
    const maxSize = 20 * 1024 * 1024; // 20MB
    if (file.size > maxSize) {
      console.error('[DocumentUpload] File too large:', file.size);
      return {
        success: false,
        error: 'File size exceeds 20MB limit.',
      };
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Cloudinary as raw file
    console.log('[DocumentUpload] Uploading to Cloudinary...');
    const result = await new Promise<any>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder: 'case-studies/documents',
            resource_type: 'raw', // Important: use 'raw' for non-image files
            public_id: `doc_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`,
          },
          (error, result) => {
            if (error) {
              console.error('[DocumentUpload] Cloudinary upload error:', JSON.stringify(error, null, 2));
              reject(error);
            } else {
              console.log('[DocumentUpload] Upload successful:', result?.public_id);
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
      fileName: file.name,
    };
  } catch (error) {
    console.error('[DocumentUpload] Error uploading document:', error);
    const errorMessage = error instanceof Error ? error.message :
      (typeof error === 'object' && error !== null && 'message' in error) ?
        String((error as any).message) :
        JSON.stringify(error);
    console.error('[DocumentUpload] Detailed error:', errorMessage);
    return {
      success: false,
      error: `Upload failed: ${errorMessage}`,
    };
  }
}

/**
 * Delete a document from Cloudinary
 * @param publicId - Public ID of the document to delete
 * @returns Success status
 */
export async function waDeleteDocument(publicId: string): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('[DocumentUpload] Deleting document:', publicId);

    await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' });

    console.log('[DocumentUpload] Document deleted successfully');
    return { success: true };
  } catch (error) {
    console.error('[DocumentUpload] Error deleting document:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete document',
    };
  }
}

/**
 * Upload multiple documents to Cloudinary
 * @param formData - FormData containing multiple document files
 * @returns Array of DocumentUploadResults
 */
export async function waUploadMultipleDocuments(formData: FormData): Promise<DocumentUploadResult[]> {
  try {
    console.log('[DocumentUpload] Starting multiple document upload');

    const files = formData.getAll('files') as File[];

    if (files.length === 0) {
      console.error('[DocumentUpload] No files provided');
      return [
        {
          success: false,
          error: 'No files provided',
        },
      ];
    }

    // Limit to 5 documents
    if (files.length > 5) {
      console.error('[DocumentUpload] Too many files:', files.length);
      return [
        {
          success: false,
          error: 'Maximum 5 documents allowed per upload.',
        },
      ];
    }

    // Upload all documents
    const uploadPromises = files.map(async (file) => {
      const fileFormData = new FormData();
      fileFormData.append('file', file);
      return waUploadDocument(fileFormData);
    });

    const results = await Promise.all(uploadPromises);
    console.log('[DocumentUpload] Multiple upload completed:', results.length, 'documents');

    return results;
  } catch (error) {
    console.error('[DocumentUpload] Error uploading multiple documents:', error);
    return [
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to upload documents',
      },
    ];
  }
}
