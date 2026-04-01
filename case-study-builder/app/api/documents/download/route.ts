import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
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
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');
    const filename = searchParams.get('filename') || 'document';

    if (!url) {
      return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 });
    }

    // Validate URL is from Cloudinary domains only
    if (!url.includes('cloudinary.com') && !url.includes('res.cloudinary.com')) {
      return NextResponse.json({ error: 'Invalid URL: only Cloudinary domains are allowed' }, { status: 400 });
    }

    // Debug: check Cloudinary config
    const cloudConfig = cloudinary.config();
    console.log('[DocumentProxy] Cloudinary config:', {
      cloud_name: cloudConfig.cloud_name || '(missing)',
      api_key: cloudConfig.api_key ? 'set' : '(missing)',
      api_secret: cloudConfig.api_secret ? 'set' : '(missing)',
    });

    console.log('[DocumentProxy] v3 - Fetching document:', url);

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

    // Collect errors from each approach for debugging
    const debugErrors: string[] = [];

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
      debugErrors.push(`Direct fetch: ${directResponse.status} ${directResponse.statusText}`);
      console.log('[DocumentProxy] Direct fetch failed:', directResponse.status, directResponse.statusText);
    } catch (directError: any) {
      debugErrors.push(`Direct fetch error: ${directError?.message}`);
      console.log('[DocumentProxy] Direct fetch error:', directError?.message);
    }

    // Approach 2: Generate a signed CDN URL (bypasses Strict Transformations)
    if (publicId) {
      try {
        console.log('[DocumentProxy] Generating signed URL for:', publicId);
        const signedUrl = cloudinary.url(publicId, {
          resource_type: resourceType,
          type: 'upload',
          sign_url: true,
          secure: true,
        });
        console.log('[DocumentProxy] Signed URL:', signedUrl);

        const signedResponse = await fetch(signedUrl);
        if (signedResponse.ok) {
          console.log('[DocumentProxy] Signed URL fetch successful');
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
        debugErrors.push(`Signed URL: ${signedResponse.status} ${signedResponse.statusText}`);
        console.log('[DocumentProxy] Signed URL fetch failed:', signedResponse.status);
      } catch (signedError: any) {
        debugErrors.push(`Signed URL error: ${signedError?.message}`);
        console.log('[DocumentProxy] Signed URL error:', signedError?.message);
      }

      // Approach 3: Try Admin API to get resource, then fetch with auth header
      try {
        console.log('[DocumentProxy] Trying Admin API for:', publicId);
        const resource = await cloudinary.api.resource(publicId, { resource_type: resourceType });
        console.log('[DocumentProxy] Admin API returned secure_url:', resource.secure_url);

        // Generate a signed version of the secure_url
        const signedSecureUrl = cloudinary.url(publicId, {
          resource_type: resourceType,
          type: 'upload',
          sign_url: true,
          secure: true,
          version: resource.version,
        });

        const adminResponse = await fetch(signedSecureUrl);
        if (adminResponse.ok) {
          console.log('[DocumentProxy] Admin signed URL fetch successful');
          const buffer = await adminResponse.arrayBuffer();
          const contentType = adminResponse.headers.get('content-type') || 'application/octet-stream';
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
        debugErrors.push(`Admin API signed fetch: ${adminResponse.status}`);
      } catch (adminError: any) {
        debugErrors.push(`Admin API: ${adminError?.message}`);
        console.log('[DocumentProxy] Admin API error:', adminError?.message);
      }
    }

    // All approaches failed
    console.error('[DocumentProxy] All fetch approaches failed:', debugErrors);
    return NextResponse.json(
      {
        error: 'Failed to fetch document. Please check Cloudinary settings.',
        version: 'v3',
        debug: debugErrors,
        publicId,
        resourceType,
        cloudinaryConfig: {
          cloud_name: cloudConfig.cloud_name || '(missing)',
          api_key: cloudConfig.api_key ? 'configured' : '(missing)',
          api_secret: cloudConfig.api_secret ? 'configured' : '(missing)',
        },
      },
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
