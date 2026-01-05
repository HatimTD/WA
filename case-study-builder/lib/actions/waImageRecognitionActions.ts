'use server';

/**
 * Image Recognition Server Actions
 *
 * Provides server actions for analyzing images using GPT-4o Vision API.
 * Implements BRD 5.3.4 - Image Recognition for Search.
 *
 * @module image-recognition-actions
 * @author WA Development Team
 * @version 1.0.0
 * @since 2025-12-13
 */

import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Result of image analysis for tag generation
 */
export interface ImageTagsResult {
  success: boolean;
  tags?: string[];
  description?: string;
  detectedObjects?: string[];
  extractedText?: string;
  confidence?: number;
  error?: string;
}

/**
 * Result of analyzing multiple images
 */
export interface MultiImageAnalysisResult {
  success: boolean;
  combinedTags?: string[];
  imageResults?: ImageTagsResult[];
  error?: string;
}

/**
 * Analyze an image and generate searchable tags using GPT-4o Vision
 *
 * @param imageUrl - URL of the image to analyze (Cloudinary URL or base64)
 * @returns Promise resolving to tags and metadata
 */
export async function waAnalyzeImageForTags(imageUrl: string): Promise<ImageTagsResult> {
  try {
    console.log('[Image Recognition] Analyzing image for tags:', imageUrl.substring(0, 50) + '...');

    if (!process.env.OPENAI_API_KEY) {
      console.warn('[Image Recognition] OpenAI API key not configured');
      return {
        success: false,
        error: 'OpenAI API key not configured',
      };
    }

    // Validate URL
    if (!imageUrl || (!imageUrl.startsWith('http') && !imageUrl.startsWith('data:image'))) {
      return {
        success: false,
        error: 'Invalid image URL',
      };
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 1500,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Analyze this image from an industrial welding/manufacturing context and provide:

1. **Tags**: Generate 5-15 relevant searchable tags for this image. Include:
   - Industry type (e.g., mining, cement, steel, power generation)
   - Component/workpiece type (e.g., crusher hammer, conveyor roller, pipe)
   - Wear type visible (e.g., abrasion, impact, corrosion, erosion)
   - Material type if visible (e.g., steel, cast iron, hardfacing)
   - Process shown (e.g., welding, hardfacing, repair, build-up)
   - Condition (e.g., worn, repaired, new, damaged)

2. **Description**: A brief 1-2 sentence description of what the image shows.

3. **Detected Objects**: List specific objects/components visible in the image.

4. **Extracted Text**: Any visible text, part numbers, labels, or markings.

Format your response as JSON:
{
  "tags": ["tag1", "tag2", ...],
  "description": "Brief description",
  "detectedObjects": ["object1", "object2", ...],
  "extractedText": "any visible text or null",
  "confidence": 0.0-1.0
}`,
            },
            {
              type: 'image_url',
              image_url: {
                url: imageUrl,
                detail: 'high',
              },
            },
          ],
        },
      ],
    });

    const content = response.choices[0]?.message?.content || '';
    console.log('[Image Recognition] Raw response:', content.substring(0, 200) + '...');

    // Parse JSON response
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const data = JSON.parse(jsonMatch[0]);
        console.log('[Image Recognition] Successfully extracted tags:', data.tags?.length || 0);

        return {
          success: true,
          tags: data.tags || [],
          description: data.description || '',
          detectedObjects: data.detectedObjects || [],
          extractedText: data.extractedText || '',
          confidence: data.confidence || 0.8,
        };
      }
    } catch (parseError) {
      console.error('[Image Recognition] JSON parse error:', parseError);
    }

    // Fallback: extract tags from text response
    const fallbackTags = extractTagsFromText(content);
    return {
      success: true,
      tags: fallbackTags,
      description: content.substring(0, 200),
      confidence: 0.6,
    };
  } catch (error) {
    console.error('[Image Recognition] Error analyzing image:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to analyze image',
    };
  }
}

/**
 * Analyze multiple images and combine their tags
 *
 * @param imageUrls - Array of image URLs to analyze
 * @returns Promise resolving to combined tags
 */
export async function waAnalyzeMultipleImagesForTags(
  imageUrls: string[]
): Promise<MultiImageAnalysisResult> {
  try {
    console.log('[Image Recognition] Analyzing multiple images:', imageUrls.length);

    if (!imageUrls || imageUrls.length === 0) {
      return {
        success: false,
        error: 'No images provided',
      };
    }

    // Limit to 5 images to avoid excessive API costs
    const imagesToAnalyze = imageUrls.slice(0, 5);

    // Analyze each image
    const results = await Promise.all(
      imagesToAnalyze.map((url) => waAnalyzeImageForTags(url))
    );

    // Combine and deduplicate tags
    const allTags = new Set<string>();
    results.forEach((result) => {
      if (result.success && result.tags) {
        result.tags.forEach((tag) => allTags.add(tag.toLowerCase()));
      }
    });

    const combinedTags = Array.from(allTags);
    console.log('[Image Recognition] Combined tags:', combinedTags.length);

    return {
      success: true,
      combinedTags,
      imageResults: results,
    };
  } catch (error) {
    console.error('[Image Recognition] Error analyzing multiple images:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to analyze images',
    };
  }
}

/**
 * Generate AI tags for a case study based on uploaded images
 * This is called after image upload to suggest tags
 *
 * @param imageUrls - Array of uploaded image URLs
 * @param existingTags - Existing tags to merge with
 * @returns Promise resolving to suggested tags
 */
export async function waGenerateImageBasedTags(
  imageUrls: string[],
  existingTags: string[] = []
): Promise<{ success: boolean; suggestedTags?: string[]; error?: string }> {
  try {
    if (!imageUrls || imageUrls.length === 0) {
      return { success: true, suggestedTags: existingTags };
    }

    const result = await waAnalyzeMultipleImagesForTags(imageUrls);

    if (!result.success || !result.combinedTags) {
      return { success: true, suggestedTags: existingTags };
    }

    // Merge with existing tags, removing duplicates
    const existingLower = new Set(existingTags.map((t) => t.toLowerCase()));
    const newTags = result.combinedTags.filter((t) => !existingLower.has(t.toLowerCase()));

    const mergedTags = [...existingTags, ...newTags.slice(0, 10)]; // Limit new tags to 10

    return {
      success: true,
      suggestedTags: mergedTags,
    };
  } catch (error) {
    console.error('[Image Recognition] Error generating image-based tags:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate tags',
    };
  }
}

/**
 * Extract OCR text from an image
 *
 * @param imageUrl - URL of the image
 * @returns Promise resolving to extracted text
 */
export async function waExtractTextFromImage(
  imageUrl: string
): Promise<{ success: boolean; text?: string; error?: string }> {
  try {
    console.log('[Image Recognition] Extracting text from image');

    if (!process.env.OPENAI_API_KEY) {
      return { success: false, error: 'OpenAI API key not configured' };
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Extract ALL visible text from this image. Include:
- Part numbers
- Labels
- Specifications
- Brand names
- Any other text visible

Preserve the original formatting. If no text is visible, respond with "No text detected."`,
            },
            {
              type: 'image_url',
              image_url: {
                url: imageUrl,
                detail: 'high',
              },
            },
          ],
        },
      ],
    });

    const text = response.choices[0]?.message?.content?.trim() || '';

    return {
      success: true,
      text: text === 'No text detected.' ? '' : text,
    };
  } catch (error) {
    console.error('[Image Recognition] Error extracting text:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to extract text',
    };
  }
}

/**
 * Fallback function to extract tags from text response
 */
function extractTagsFromText(text: string): string[] {
  // Common industrial terms to look for
  const industrialTerms = [
    'welding', 'hardfacing', 'mining', 'cement', 'steel', 'metal',
    'abrasion', 'impact', 'corrosion', 'erosion', 'wear',
    'crusher', 'conveyor', 'roller', 'hammer', 'liner', 'bucket',
    'repair', 'build-up', 'overlay', 'cladding',
    'worn', 'damaged', 'new', 'refurbished',
  ];

  const foundTerms: string[] = [];
  const lowerText = text.toLowerCase();

  industrialTerms.forEach((term) => {
    if (lowerText.includes(term)) {
      foundTerms.push(term);
    }
  });

  return foundTerms;
}
