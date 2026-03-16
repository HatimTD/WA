/**
 * Image Analysis API Endpoint
 *
 * Provides OCR and image analysis capabilities for case study documents.
 *
 * @route POST /api/ai/image-analysis
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import {
  waAnalyzeImage,
  waExtractTextFromImage,
  waAnalyzeDataSheet,
  waIsValidImageUrl,
  type ImageContentType,
} from '@/lib/image-recognition';

/**
 * POST /api/ai/image-analysis
 *
 * Analyze an image and extract text/data
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { imageUrl, contentType, language, action } = body as {
      imageUrl: string;
      contentType?: ImageContentType;
      language?: string;
      action?: 'analyze' | 'extract_text' | 'data_sheet';
    };

    // Validate image URL
    if (!imageUrl) {
      return NextResponse.json(
        { error: 'Image URL is required' },
        { status: 400 }
      );
    }

    if (!waIsValidImageUrl(imageUrl)) {
      return NextResponse.json(
        { error: 'Invalid image URL format' },
        { status: 400 }
      );
    }

    // Perform the requested action
    let result;

    switch (action) {
      case 'extract_text':
        result = await waExtractTextFromImage(imageUrl, language);
        break;

      case 'data_sheet':
        result = await waAnalyzeDataSheet(imageUrl);
        break;

      case 'analyze':
      default:
        result = await waAnalyzeImage(imageUrl, {
          contentType,
          language,
          extractStructured: true,
        });
        break;
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('[Image Analysis API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze image' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/ai/image-analysis
 *
 * Return API information
 */
export async function GET() {
  return NextResponse.json({
    name: 'Image Analysis API',
    version: '1.0.0',
    endpoints: {
      POST: {
        description: 'Analyze an image and extract text/data',
        body: {
          imageUrl: 'string (required) - URL or base64 data URL of the image',
          contentType:
            'string (optional) - text, data_sheet, case_study, technical_specs, general',
          language: 'string (optional) - Language of the text (default: English)',
          action:
            'string (optional) - analyze, extract_text, or data_sheet (default: analyze)',
        },
      },
    },
    supportedFormats: ['JPEG', 'PNG', 'GIF', 'WebP'],
    maxImageSize: '20MB',
  });
}
