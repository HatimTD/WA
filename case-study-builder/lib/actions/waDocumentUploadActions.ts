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

    // Validate file type - allow common document formats and images
    const validTypes = [
      'application/pdf',
      'application/msword', // .doc
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
      'application/vnd.ms-excel', // .xls
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-powerpoint', // .ppt
      'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx
      'text/plain', // .txt
      'image/png', // .png
      'image/jpeg', // .jpg, .jpeg
      'image/webp', // .webp
    ];

    // Check if it's an image type (for different Cloudinary handling)
    const isImage = file.type.startsWith('image/');

    if (!validTypes.includes(file.type)) {
      console.error('[DocumentUpload] Invalid file type:', file.type);
      return {
        success: false,
        error: 'Invalid file type. Only PDF, Word, Excel, PowerPoint, TXT, and image files are allowed.',
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

    // Determine resource type: 'image' for images, 'raw' for documents
    // Images are easier to deliver/access from Cloudinary
    const resourceType = isImage ? 'image' : 'raw';
    const folder = isImage ? 'case-studies/wps-images' : 'case-studies/documents';

    // Upload to Cloudinary
    // For raw files, keep the extension in the public_id so download has correct extension
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const publicId = `doc_${Date.now()}_${sanitizedName}`;

    console.log(`[DocumentUpload] Uploading to Cloudinary as ${resourceType}, publicId: ${publicId}`);
    const result = await new Promise<any>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder,
            resource_type: resourceType, // 'image' or 'raw'
            type: 'upload', // Public upload
            public_id: publicId,
            overwrite: true,
            invalidate: true,
            // Don't use any preset - upload directly
            upload_preset: undefined,
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

    // Log the result for debugging
    console.log('[DocumentUpload] Upload result:', {
      public_id: result.public_id,
      resource_type: result.resource_type,
      secure_url: result.secure_url,
      url: result.url,
    });

    // Use the secure_url directly - if access is denied, user needs to check Cloudinary settings
    const finalUrl = result.secure_url;

    return {
      success: true,
      url: finalUrl,
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
 * Generate a signed URL for accessing a document
 * This bypasses any public access restrictions by creating an authenticated URL
 * @param publicId - Public ID of the document (or full URL to extract from)
 * @param resourceType - Resource type ('raw' for documents, 'image' for images)
 * @returns Signed URL with expiration
 */
export async function waGetSignedDocumentUrl(
  publicIdOrUrl: string,
  resourceType: 'raw' | 'image' = 'raw'
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    console.log('[DocumentUpload] Generating signed URL for:', publicIdOrUrl);

    // Extract public_id from URL if a full URL is provided
    let publicId = publicIdOrUrl;
    if (publicIdOrUrl.includes('cloudinary.com')) {
      // Extract public_id from URL like:
      // https://res.cloudinary.com/dfzsxsnlr/raw/upload/v1234/case-studies/documents/doc_123_file.pdf
      const match = publicIdOrUrl.match(/\/(?:raw|image)\/upload\/(?:v\d+\/)?(.+)$/);
      if (match) {
        publicId = match[1];
        // Remove file extension for raw files if it's duplicated in the path
        // But keep it if it's part of the actual public_id
      }
    }

    console.log('[DocumentUpload] Extracted publicId:', publicId);

    // Generate a signed URL that expires in 1 hour
    const expiresAt = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now

    // Use cloudinary.url with sign_url option for authenticated access
    const signedUrl = cloudinary.url(publicId, {
      resource_type: resourceType,
      type: 'upload',
      sign_url: true,
      secure: true,
      // Add expiration timestamp
      transformation: [
        { flags: 'attachment' }
      ],
    });

    // If the above doesn't work, try private_download_url for raw files
    if (resourceType === 'raw') {
      try {
        const privateUrl = cloudinary.utils.private_download_url(publicId, 'pdf', {
          resource_type: 'raw',
          expires_at: expiresAt,
        });
        console.log('[DocumentUpload] Private download URL:', privateUrl);
        return {
          success: true,
          url: privateUrl,
        };
      } catch (privateError) {
        console.log('[DocumentUpload] private_download_url failed, using signed URL');
      }
    }

    console.log('[DocumentUpload] Signed URL:', signedUrl);

    return {
      success: true,
      url: signedUrl,
    };
  } catch (error) {
    console.error('[DocumentUpload] Error generating signed URL:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate signed URL',
    };
  }
}

/**
 * Fetch document content server-side and return as base64
 * This bypasses CORS and access restrictions by fetching on the server
 * @param url - Cloudinary URL of the document
 * @returns Base64 encoded document data
 */
export async function waFetchDocumentContent(url: string): Promise<{
  success: boolean;
  data?: string;
  contentType?: string;
  error?: string;
}> {
  try {
    console.log('[DocumentUpload] Fetching document content from:', url);

    // Extract public_id and reconstruct with API credentials
    let fetchUrl = url;

    // If it's a Cloudinary URL, we can try to fetch it directly with authentication
    if (url.includes('cloudinary.com')) {
      // Extract components from the URL
      const match = url.match(/cloudinary\.com\/([^/]+)\/(raw|image)\/upload\/(?:v\d+\/)?(.+)$/);
      if (match) {
        const [, cloudName, resourceType, publicId] = match;

        // Use the Admin API to get the resource
        try {
          const resource = await cloudinary.api.resource(publicId, {
            resource_type: resourceType as 'raw' | 'image',
          });
          console.log('[DocumentUpload] Resource info:', resource.secure_url);
          fetchUrl = resource.secure_url;
        } catch (apiError) {
          console.log('[DocumentUpload] Admin API failed, trying direct fetch');
        }
      }
    }

    // Fetch the document
    const response = await fetch(fetchUrl, {
      headers: {
        'Accept': '*/*',
      },
    });

    if (!response.ok) {
      console.error('[DocumentUpload] Fetch failed:', response.status, response.statusText);

      // If direct fetch fails, try generating a new signed URL
      const signedResult = await waGetSignedDocumentUrl(url);
      if (signedResult.success && signedResult.url) {
        const signedResponse = await fetch(signedResult.url);
        if (signedResponse.ok) {
          const buffer = await signedResponse.arrayBuffer();
          const base64 = Buffer.from(buffer).toString('base64');
          const contentType = signedResponse.headers.get('content-type') || 'application/octet-stream';
          return {
            success: true,
            data: base64,
            contentType,
          };
        }
      }

      return {
        success: false,
        error: `Failed to fetch document: ${response.status} ${response.statusText}`,
      };
    }

    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    const contentType = response.headers.get('content-type') || 'application/octet-stream';

    console.log('[DocumentUpload] Document fetched successfully, size:', buffer.byteLength);

    return {
      success: true,
      data: base64,
      contentType,
    };
  } catch (error) {
    console.error('[DocumentUpload] Error fetching document:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch document',
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
