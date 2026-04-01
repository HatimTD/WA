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
 * Handles restricted raw file delivery by using Cloudinary's private download API
 * Requires authentication — only logged-in users can download documents
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

    // Extract public_id from URL for Cloudinary API access
    let publicId: string | null = null;
    let resourceType: 'raw' | 'image' = 'raw';

    if (url.includes('cloudinary.com')) {
      const match = url.match(/cloudinary\.com\/[^/]+\/(raw|image)\/upload\/(?:v\d+\/)?(.+)$/);
      if (match) {
        resourceType = match[1] as 'raw' | 'image';
        publicId = match[2];
      }
    }

    // Approach 1: Try direct fetch (works when raw delivery is not restricted)
    try {
      const directResponse = await fetch(url, {
        headers: { 'Accept': '*/*' },
      });

      if (directResponse.ok) {
        const buffer = await directResponse.arrayBuffer();
        const contentType = directResponse.headers.get('content-type') || 'application/octet-stream';

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
    } catch {
      // Direct fetch failed — fall through to private download
    }

    // Approach 2: Private download URL — bypasses CDN delivery restrictions
    // Uses Cloudinary API endpoint (not CDN) with API key + signature authentication
    if (publicId) {
      try {
        const ext = publicId.split('.').pop() || 'pdf';

        const privateUrl = cloudinary.utils.private_download_url(publicId, ext, {
          resource_type: resourceType,
          type: 'upload',
          expires_at: Math.floor(Date.now() / 1000) + 300,
          attachment: true,
        });

        const privateResponse = await fetch(privateUrl);
        if (privateResponse.ok) {
          const buffer = await privateResponse.arrayBuffer();
          const contentType = privateResponse.headers.get('content-type') || 'application/octet-stream';
          const downloadFilename = filename.includes('.') ? filename : `${filename}.${ext}`;

          return new NextResponse(buffer, {
            status: 200,
            headers: {
              'Content-Type': contentType,
              'Content-Disposition': `attachment; filename="${downloadFilename}"`,
              'Content-Length': buffer.byteLength.toString(),
            },
          });
        }
      } catch {
        // Private download failed
      }
    }

    // All approaches failed
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
