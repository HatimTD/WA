/**
 * Image Recognition / OCR Module
 *
 * Provides image analysis and text extraction capabilities using OpenAI Vision API.
 * Used for extracting data from case study images, data sheets, and technical documents.
 *
 * @module image-recognition
 * @author WA Development Team
 * @version 1.0.0
 * @since 2025-12-10
 */

import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Types of content that can be extracted from images
 */
export type ImageContentType =
  | 'text'
  | 'data_sheet'
  | 'case_study'
  | 'technical_specs'
  | 'general';

/**
 * Extracted data structure from image analysis
 */
export interface ImageAnalysisResult {
  /** Whether the analysis was successful */
  success: boolean;
  /** Type of content detected */
  contentType: ImageContentType;
  /** Extracted text from the image */
  extractedText: string;
  /** Structured data extracted (if applicable) */
  structuredData?: {
    customerName?: string;
    industry?: string;
    componentWorkpiece?: string;
    waSolution?: string;
    waProduct?: string;
    location?: string;
    problemDescription?: string;
    technicalAdvantages?: string;
    [key: string]: string | undefined;
  };
  /** Confidence score (0-1) */
  confidence: number;
  /** Any warnings or notes about the extraction */
  notes?: string;
  /** Error message if analysis failed */
  error?: string;
}

/**
 * Options for image analysis
 */
export interface ImageAnalysisOptions {
  /** Expected content type (helps with extraction accuracy) */
  contentType?: ImageContentType;
  /** Language of the text in the image */
  language?: string;
  /** Whether to extract structured data */
  extractStructured?: boolean;
  /** Maximum tokens for the response */
  maxTokens?: number;
}

/**
 * Analyze an image and extract text/data using OpenAI Vision API
 *
 * @param imageUrl - URL of the image to analyze (can be base64 data URL)
 * @param options - Analysis options
 * @returns Promise resolving to the analysis result
 *
 * @example
 * const result = await waAnalyzeImage(imageUrl, {
 *   contentType: 'case_study',
 *   extractStructured: true
 * });
 */
export async function waAnalyzeImage(
  imageUrl: string,
  options: ImageAnalysisOptions = {}
): Promise<ImageAnalysisResult> {
  const {
    contentType = 'general',
    language = 'English',
    extractStructured = true,
    maxTokens = 2000,
  } = options;

  try {
    // Build the prompt based on content type
    const prompt = buildAnalysisPrompt(contentType, language, extractStructured);

    // Call OpenAI Vision API
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: maxTokens,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
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

    // Parse the response
    const content = response.choices[0]?.message?.content || '';
    return parseAnalysisResponse(content, contentType);
  } catch (error) {
    console.error('[Image Recognition] Analysis failed:', error);
    return {
      success: false,
      contentType,
      extractedText: '',
      confidence: 0,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Extract text from an image (simple OCR)
 *
 * @param imageUrl - URL of the image
 * @param language - Expected language of the text
 * @returns Promise resolving to extracted text
 */
export async function waExtractTextFromImage(
  imageUrl: string,
  language: string = 'English'
): Promise<{ success: boolean; text: string; error?: string }> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 4000,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Extract all visible text from this image. The text is in ${language}.
              Preserve the original formatting and structure as much as possible.
              If there are tables, format them clearly.
              If there are bullet points, preserve them.
              Only output the extracted text, nothing else.`,
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

    const text = response.choices[0]?.message?.content || '';
    return { success: true, text };
  } catch (error) {
    console.error('[Image Recognition] Text extraction failed:', error);
    return {
      success: false,
      text: '',
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Analyze a technical data sheet image
 *
 * @param imageUrl - URL of the data sheet image
 * @returns Promise resolving to structured data sheet information
 */
export async function waAnalyzeDataSheet(imageUrl: string): Promise<{
  success: boolean;
  productName?: string;
  specifications?: Record<string, string>;
  composition?: Record<string, string>;
  applications?: string[];
  rawText?: string;
  error?: string;
}> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 3000,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Analyze this technical data sheet image and extract:
              1. Product Name
              2. Technical Specifications (as key-value pairs)
              3. Chemical Composition (if present)
              4. Applications/Use Cases

              Format your response as JSON:
              {
                "productName": "string",
                "specifications": {"key": "value"},
                "composition": {"element": "percentage"},
                "applications": ["string"],
                "rawText": "full extracted text"
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

    // Try to parse as JSON
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const data = JSON.parse(jsonMatch[0]);
        return { success: true, ...data };
      }
    } catch {
      // JSON parsing failed, return raw text
    }

    return { success: true, rawText: content };
  } catch (error) {
    console.error('[Image Recognition] Data sheet analysis failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Build the analysis prompt based on content type
 */
function buildAnalysisPrompt(
  contentType: ImageContentType,
  language: string,
  extractStructured: boolean
): string {
  const basePrompt = `Analyze this image and extract all relevant information. The content is in ${language}.`;

  switch (contentType) {
    case 'case_study':
      return `${basePrompt}

This appears to be a case study document. Please extract:
1. Customer Name
2. Industry/Sector
3. Component/Workpiece being processed
4. Problem Description
5. WA Solution applied
6. WA Product used
7. Location/Region
8. Technical Advantages
9. Results/Benefits

${extractStructured ? 'Format your response as JSON with these fields.' : 'Provide a detailed text summary.'}

Also include a confidence score (0-1) for your extraction accuracy.`;

    case 'data_sheet':
      return `${basePrompt}

This appears to be a technical data sheet. Please extract:
1. Product Name
2. Technical Specifications
3. Chemical Composition (if visible)
4. Mechanical Properties (if visible)
5. Applications
6. Any warnings or special notes

${extractStructured ? 'Format your response as JSON.' : 'Provide a detailed text summary.'}`;

    case 'technical_specs':
      return `${basePrompt}

This appears to be technical specifications. Please extract:
1. All specification values with their units
2. Model/Part numbers
3. Operating parameters
4. Performance data

Format as a structured list or table.`;

    case 'text':
      return `${basePrompt}

Extract all visible text from this image, preserving the original structure and formatting.`;

    default:
      return `${basePrompt}

Identify what type of document this is and extract all relevant information.
Include a summary of the main content.`;
  }
}

/**
 * Parse the API response into a structured result
 */
function parseAnalysisResponse(
  content: string,
  contentType: ImageContentType
): ImageAnalysisResult {
  // Try to parse as JSON first
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const data = JSON.parse(jsonMatch[0]);
      return {
        success: true,
        contentType,
        extractedText: data.rawText || content,
        structuredData: {
          customerName: data.customerName || data.customer_name,
          industry: data.industry || data.sector,
          componentWorkpiece: data.componentWorkpiece || data.component || data.workpiece,
          waSolution: data.waSolution || data.solution || data.wa_solution,
          waProduct: data.waProduct || data.product || data.wa_product,
          location: data.location || data.region,
          problemDescription: data.problemDescription || data.problem || data.problem_description,
          technicalAdvantages: data.technicalAdvantages || data.advantages || data.benefits,
        },
        confidence: data.confidence || 0.8,
        notes: data.notes,
      };
    }
  } catch {
    // JSON parsing failed, use text response
  }

  // Return as plain text result
  return {
    success: true,
    contentType,
    extractedText: content,
    confidence: 0.7,
    notes: 'Response was not in structured format',
  };
}

/**
 * Validate that an image URL is accessible and valid
 *
 * @param imageUrl - URL to validate
 * @returns Whether the URL is valid
 */
export function waIsValidImageUrl(imageUrl: string): boolean {
  // Check for data URL (base64)
  if (imageUrl.startsWith('data:image/')) {
    return true;
  }

  // Check for HTTP(S) URL
  try {
    const url = new URL(imageUrl);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Convert a File to a base64 data URL
 *
 * @param file - File to convert
 * @returns Promise resolving to base64 data URL
 */
export async function waFileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
