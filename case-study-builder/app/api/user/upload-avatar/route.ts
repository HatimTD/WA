import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { waUploadImage } from '@/lib/actions/waImageUploadActions';
import { validateUpload } from '@/lib/file-validation';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('avatar') as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate by real content (magic bytes) + extension - images only.
    const validation = await validateUpload(file, ['image']);
    if (!validation.ok) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    // Avatars additionally keep a tighter 5 MB cap.
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: 'Avatar exceeds the 5MB limit.' },
        { status: 400 }
      );
    }

    // Create FormData for the upload action
    const uploadFormData = new FormData();
    uploadFormData.append('file', file);

    // Upload to Cloudinary
    const uploadResult = await waUploadImage(uploadFormData);

    if (!uploadResult.success || !uploadResult.url) {
      return NextResponse.json(
        { success: false, error: uploadResult.error || 'Upload failed' },
        { status: 500 }
      );
    }

    // Update user's avatar in database
    await prisma.user.update({
      where: { id: session.user.id },
      data: { image: uploadResult.url },
    });

    return NextResponse.json({
      success: true,
      url: uploadResult.url,
    });
  } catch (error) {
    console.error('[Upload Avatar] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
