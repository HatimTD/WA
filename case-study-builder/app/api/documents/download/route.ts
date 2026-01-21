import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
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

/**
 * API route to proxy document downloads from Cloudinary
 * This bypasses any public access restrictions by fetching server-side
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');
    const filename = searchParams.get('filename') || 'document';

    if (!url) {
      return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 });
    }

    console.log('[DocumentProxy] Fetching document:', url);

    // Extract public_id from URL for Cloudinary API access
    let publicId: string | null = null;
    let resourceType: 'raw' | 'image' = 'raw';

    if (url.includes('cloudinary.com')) {
      const match = url.match(/cloudinary\.com\/[^/]+\/(raw|image)\/upload\/(?:v\d+\/)?(.+)$/);
      if (match) {
        resourceType = match[1] as 'raw' | 'image';
        publicId = match[2];
        console.log('[DocumentProxy] Extracted publicId:', publicId, 'resourceType:', resourceType);
      }
    }

    // Try multiple approaches to get the document

    // Approach 1: Try direct fetch first (might work for public files)
    try {
      const directResponse = await fetch(url, {
        headers: { 'Accept': '*/*' },
      });

      if (directResponse.ok) {
        console.log('[DocumentProxy] Direct fetch successful');
        const buffer = await directResponse.arrayBuffer();
        const contentType = directResponse.headers.get('content-type') || 'application/octet-stream';

        // Determine file extension from content type or filename
        let ext = '';
        if (contentType.includes('pdf')) ext = '.pdf';
        else if (contentType.includes('word') || contentType.includes('document')) ext = '.docx';
        else if (contentType.includes('excel') || contentType.includes('spreadsheet')) ext = '.xlsx';
        else if (contentType.includes('image/png')) ext = '.png';
        else if (contentType.includes('image/jpeg')) ext = '.jpg';

        const downloadFilename = filename.includes('.') ? filename : filename + ext;

        return new NextResponse(buffer, {
          status: 200,
          headers: {
            'Content-Type': contentType,
            'Content-Disposition': `attachment; filename="${downloadFilename}"`,
            'Content-Length': buffer.byteLength.toString(),
          },
        });
      }
      console.log('[DocumentProxy] Direct fetch failed:', directResponse.status);
    } catch (directError) {
      console.log('[DocumentProxy] Direct fetch error:', directError);
    }

    // Approach 2: Try with Cloudinary Admin API to get resource details
    if (publicId) {
      try {
        console.log('[DocumentProxy] Trying Admin API for:', publicId);
        const resource = await cloudinary.api.resource(publicId, {
          resource_type: resourceType,
        });

        console.log('[DocumentProxy] Got resource from Admin API:', resource.secure_url);

        // Fetch from the secure_url returned by Admin API
        const adminResponse = await fetch(resource.secure_url);
        if (adminResponse.ok) {
          const buffer = await adminResponse.arrayBuffer();
          const contentType = adminResponse.headers.get('content-type') || 'application/octet-stream';

          let ext = '';
          if (contentType.includes('pdf')) ext = '.pdf';
          else if (contentType.includes('word') || contentType.includes('document')) ext = '.docx';
          else if (contentType.includes('excel') || contentType.includes('spreadsheet')) ext = '.xlsx';

          const downloadFilename = filename.includes('.') ? filename : filename + ext;

          return new NextResponse(buffer, {
            status: 200,
            headers: {
              'Content-Type': contentType,
              'Content-Disposition': `attachment; filename="${downloadFilename}"`,
              'Content-Length': buffer.byteLength.toString(),
            },
          });
        }
      } catch (adminError) {
        console.log('[DocumentProxy] Admin API error:', adminError);
      }

      // Approach 3: Generate a signed URL
      try {
        console.log('[DocumentProxy] Generating signed URL');
        const expiresAt = Math.floor(Date.now() / 1000) + 3600;

        // For raw files, use private_download_url
        if (resourceType === 'raw') {
          // Extract format from filename or default to empty
          const format = publicId.split('.').pop() || '';

          const signedUrl = cloudinary.utils.private_download_url(publicId, format, {
            resource_type: 'raw',
            expires_at: expiresAt,
          });

          console.log('[DocumentProxy] Generated private download URL:', signedUrl);

          const signedResponse = await fetch(signedUrl);
          if (signedResponse.ok) {
            const buffer = await signedResponse.arrayBuffer();
            const contentType = signedResponse.headers.get('content-type') || 'application/octet-stream';

            let ext = '';
            if (contentType.includes('pdf')) ext = '.pdf';
            else if (format) ext = '.' + format;

            const downloadFilename = filename.includes('.') ? filename : filename + ext;

            return new NextResponse(buffer, {
              status: 200,
              headers: {
                'Content-Type': contentType,
                'Content-Disposition': `attachment; filename="${downloadFilename}"`,
                'Content-Length': buffer.byteLength.toString(),
              },
            });
          }
          console.log('[DocumentProxy] Signed URL fetch failed:', signedResponse.status);
        }

        // For images, use regular signed URL
        const signedUrl = cloudinary.url(publicId, {
          resource_type: resourceType,
          type: 'upload',
          sign_url: true,
          secure: true,
        });

        console.log('[DocumentProxy] Generated signed URL:', signedUrl);

        const signedResponse = await fetch(signedUrl);
        if (signedResponse.ok) {
          const buffer = await signedResponse.arrayBuffer();
          const contentType = signedResponse.headers.get('content-type') || 'application/octet-stream';

          const downloadFilename = filename.includes('.') ? filename : filename + '.pdf';

          return new NextResponse(buffer, {
            status: 200,
            headers: {
              'Content-Type': contentType,
              'Content-Disposition': `attachment; filename="${downloadFilename}"`,
              'Content-Length': buffer.byteLength.toString(),
            },
          });
        }
      } catch (signedError) {
        console.log('[DocumentProxy] Signed URL error:', signedError);
      }
    }

    // All approaches failed
    console.error('[DocumentProxy] All fetch approaches failed');
    return NextResponse.json(
      { error: 'Failed to fetch document. Please check Cloudinary settings.' },
      { status: 502 }
    );
  } catch (error) {
    console.error('[DocumentProxy] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
