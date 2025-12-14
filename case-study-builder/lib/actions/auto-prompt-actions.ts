'use server';

/**
 * AI Auto-Prompting Server Actions
 *
 * Implements BRD 3.4B - Auto-Prompting
 * "Automatically prompt users for missing details based on selected Tier"
 *
 * Generates contextual prompts to guide users in completing case study fields.
 *
 * @module lib/actions/auto-prompt-actions
 * @author WA Development Team
 * @version 1.0.0
 * @since 2025-12-13
 */

import OpenAI from 'openai';

// Initialize OpenAI client (only if API key is available)
const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

// Type for missing field info
export type MissingField = {
  field: string;
  label: string;
  prompt: string;
  priority: 'required' | 'recommended';
  section: 'application' | 'wps' | 'cost';
};

// Type for case study context (partial data)
export type CaseStudyContext = {
  customerName?: string;
  industry?: string;
  componentWorkpiece?: string;
  location?: string;
  workType?: string;
  wearType?: string[];
  problemDescription?: string;
  waSolution?: string;
  waProduct?: string;
  baseMetal?: string;
  images?: string[];
};

// Type for target tier
export type TargetTier = 'APPLICATION' | 'TECH' | 'STAR';

// Field definitions with metadata
const FIELD_DEFINITIONS = {
  // Application tier fields
  customerName: {
    label: 'Customer Name',
    section: 'application' as const,
    priority: 'required' as const,
    defaultPrompt: 'Enter the name of the customer or company for this case study.',
  },
  industry: {
    label: 'Industry',
    section: 'application' as const,
    priority: 'required' as const,
    defaultPrompt: 'Select the industry sector (e.g., Mining, Cement, Steel).',
  },
  location: {
    label: 'Location',
    section: 'application' as const,
    priority: 'required' as const,
    defaultPrompt: 'Enter the location of the customer site or plant.',
  },
  componentWorkpiece: {
    label: 'Component/Workpiece',
    section: 'application' as const,
    priority: 'required' as const,
    defaultPrompt: 'What component or workpiece is being addressed?',
  },
  workType: {
    label: 'Work Type',
    section: 'application' as const,
    priority: 'required' as const,
    defaultPrompt: 'Is this workshop-based, on-site, or both?',
  },
  wearType: {
    label: 'Wear Type',
    section: 'application' as const,
    priority: 'required' as const,
    defaultPrompt: 'What type of wear is affecting the component?',
  },
  problemDescription: {
    label: 'Problem Description',
    section: 'application' as const,
    priority: 'required' as const,
    defaultPrompt: 'Describe the problem or challenge the customer was facing.',
  },
  waSolution: {
    label: 'WA Solution',
    section: 'application' as const,
    priority: 'required' as const,
    defaultPrompt: 'Describe the Welding Alloys solution that was implemented.',
  },
  waProduct: {
    label: 'WA Product',
    section: 'application' as const,
    priority: 'required' as const,
    defaultPrompt: 'Which Welding Alloys product(s) were used?',
  },
  baseMetal: {
    label: 'Base Metal',
    section: 'application' as const,
    priority: 'recommended' as const,
    defaultPrompt: 'What is the base metal of the component?',
  },
  images: {
    label: 'Photos',
    section: 'application' as const,
    priority: 'required' as const,
    defaultPrompt: 'Upload at least one photo of the before/after or application.',
  },

  // WPS tier fields
  baseMetalType: {
    label: 'Base Metal Type (WPS)',
    section: 'wps' as const,
    priority: 'required' as const,
    defaultPrompt: 'Specify the base metal type and grade for the WPS.',
  },
  weldingProcess: {
    label: 'Welding Process',
    section: 'wps' as const,
    priority: 'required' as const,
    defaultPrompt: 'What welding process was used (e.g., MIG, TIG, FCAW)?',
  },
  weldingPosition: {
    label: 'Welding Position',
    section: 'wps' as const,
    priority: 'required' as const,
    defaultPrompt: 'What welding position(s) were used?',
  },
  temperature: {
    label: 'Temperature Management',
    section: 'wps' as const,
    priority: 'required' as const,
    defaultPrompt: 'What were the preheat and/or interpass temperatures?',
  },

  // Cost tier fields
  materialCost: {
    label: 'Material Costs',
    section: 'cost' as const,
    priority: 'required' as const,
    defaultPrompt: 'Enter the material costs before and after the WA solution.',
  },
  laborCost: {
    label: 'Labor Costs',
    section: 'cost' as const,
    priority: 'required' as const,
    defaultPrompt: 'Enter the labor costs before and after the WA solution.',
  },
  downtimeCost: {
    label: 'Downtime Costs',
    section: 'cost' as const,
    priority: 'required' as const,
    defaultPrompt: 'What were the downtime costs before and after?',
  },
};

/**
 * Generate AI-powered contextual prompts for missing fields
 */
async function generateContextualPrompt(
  fieldLabel: string,
  context: CaseStudyContext
): Promise<string> {
  if (!openai) {
    // Return default prompt if OpenAI is not configured
    return FIELD_DEFINITIONS[fieldLabel.toLowerCase() as keyof typeof FIELD_DEFINITIONS]?.defaultPrompt ||
      `Please provide the ${fieldLabel}.`;
  }

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 100,
      messages: [
        {
          role: 'system',
          content: `You are a helpful assistant for Welding Alloys case studies. Generate a brief, specific prompt (1-2 sentences) to help the user fill out a missing field. Be encouraging and provide helpful context based on what they've already entered.`,
        },
        {
          role: 'user',
          content: `Field to fill: ${fieldLabel}
Current context:
- Industry: ${context.industry || 'not set'}
- Component: ${context.componentWorkpiece || 'not set'}
- Customer: ${context.customerName || 'not set'}
- Problem: ${context.problemDescription ? 'partially filled' : 'not set'}

Generate a helpful, specific prompt asking for the ${fieldLabel}.`,
        },
      ],
    });

    return (
      response.choices[0]?.message?.content ||
      FIELD_DEFINITIONS[fieldLabel.toLowerCase() as keyof typeof FIELD_DEFINITIONS]?.defaultPrompt ||
      `Please provide the ${fieldLabel}.`
    );
  } catch (error) {
    console.error('[AutoPrompt] Error generating prompt:', error);
    // Return default prompt on error
    return FIELD_DEFINITIONS[fieldLabel.toLowerCase() as keyof typeof FIELD_DEFINITIONS]?.defaultPrompt ||
      `Please provide the ${fieldLabel}.`;
  }
}

/**
 * Analyze case study and generate prompts for missing fields
 * Implements BRD 3.4B - Auto-Prompting
 *
 * @param caseStudy - Partial case study data
 * @param targetTier - The tier the user is targeting (APPLICATION, TECH, STAR)
 * @returns Array of missing fields with contextual prompts
 */
export async function generateAutoPrompts(
  caseStudy: CaseStudyContext,
  targetTier: TargetTier
): Promise<MissingField[]> {
  const missingFields: MissingField[] = [];

  // Application tier required fields (always checked)
  const applicationFields = [
    { key: 'customerName', def: FIELD_DEFINITIONS.customerName },
    { key: 'industry', def: FIELD_DEFINITIONS.industry },
    { key: 'location', def: FIELD_DEFINITIONS.location },
    { key: 'componentWorkpiece', def: FIELD_DEFINITIONS.componentWorkpiece },
    { key: 'workType', def: FIELD_DEFINITIONS.workType },
    { key: 'wearType', def: FIELD_DEFINITIONS.wearType },
    { key: 'problemDescription', def: FIELD_DEFINITIONS.problemDescription },
    { key: 'waSolution', def: FIELD_DEFINITIONS.waSolution },
    { key: 'waProduct', def: FIELD_DEFINITIONS.waProduct },
    { key: 'images', def: FIELD_DEFINITIONS.images },
  ];

  // Check application fields
  for (const { key, def } of applicationFields) {
    const value = caseStudy[key as keyof CaseStudyContext];
    const isEmpty =
      value === undefined ||
      value === null ||
      value === '' ||
      (Array.isArray(value) && value.length === 0);

    if (isEmpty) {
      const prompt = await generateContextualPrompt(def.label, caseStudy);
      missingFields.push({
        field: key,
        label: def.label,
        prompt,
        priority: def.priority,
        section: def.section,
      });
    }
  }

  // WPS tier fields (if targeting TECH or STAR)
  if (targetTier === 'TECH' || targetTier === 'STAR') {
    // Add WPS field checks if needed
    const wpsFields = [
      { key: 'baseMetalType', def: FIELD_DEFINITIONS.baseMetalType },
      { key: 'weldingProcess', def: FIELD_DEFINITIONS.weldingProcess },
      { key: 'weldingPosition', def: FIELD_DEFINITIONS.weldingPosition },
    ];

    for (const { key, def } of wpsFields) {
      missingFields.push({
        field: key,
        label: def.label,
        prompt: def.defaultPrompt,
        priority: def.priority,
        section: def.section,
      });
    }
  }

  // Cost tier fields (if targeting STAR)
  if (targetTier === 'STAR') {
    const costFields = [
      { key: 'materialCost', def: FIELD_DEFINITIONS.materialCost },
      { key: 'laborCost', def: FIELD_DEFINITIONS.laborCost },
      { key: 'downtimeCost', def: FIELD_DEFINITIONS.downtimeCost },
    ];

    for (const { key, def } of costFields) {
      missingFields.push({
        field: key,
        label: def.label,
        prompt: def.defaultPrompt,
        priority: def.priority,
        section: def.section,
      });
    }
  }

  return missingFields;
}

/**
 * Get the next most important field to fill
 * Returns a single field with the highest priority
 */
export async function getNextFieldToFill(
  caseStudy: CaseStudyContext,
  targetTier: TargetTier
): Promise<MissingField | null> {
  const missingFields = await generateAutoPrompts(caseStudy, targetTier);

  if (missingFields.length === 0) {
    return null;
  }

  // Prioritize required fields over recommended
  const requiredFields = missingFields.filter((f) => f.priority === 'required');
  if (requiredFields.length > 0) {
    return requiredFields[0];
  }

  return missingFields[0];
}

/**
 * Get prompts grouped by section
 */
export async function getPromptsBySection(
  caseStudy: CaseStudyContext,
  targetTier: TargetTier
): Promise<Record<MissingField['section'], MissingField[]>> {
  const missingFields = await generateAutoPrompts(caseStudy, targetTier);

  return {
    application: missingFields.filter((f) => f.section === 'application'),
    wps: missingFields.filter((f) => f.section === 'wps'),
    cost: missingFields.filter((f) => f.section === 'cost'),
  };
}

/**
 * Result type for bullet-to-prose conversion
 */
export type BulletToProseResult = {
  success: boolean;
  prose?: string;
  error?: string;
};

/**
 * Convert bullet point notes to professional prose description
 * Implements BRD Bullet-to-Prose AI conversion feature
 *
 * @param bullets - Bullet point text (can be raw bullets or paragraphs)
 * @param fieldType - The type of field being converted (problem, solution, advantages)
 * @param context - Additional context about the case study
 * @returns Converted prose text
 */
export async function convertBulletsToProse(
  bullets: string,
  fieldType: 'problem' | 'solution' | 'advantages' | 'general',
  context?: {
    industry?: string;
    component?: string;
    product?: string;
  }
): Promise<BulletToProseResult> {
  if (!openai) {
    return {
      success: false,
      error: 'OpenAI API key not configured',
    };
  }

  if (!bullets || bullets.trim().length === 0) {
    return {
      success: false,
      error: 'No text provided to convert',
    };
  }

  try {
    const systemPrompts: Record<string, string> = {
      problem: `You are a technical writer for Welding Alloys case studies. Convert the bullet points into a professional problem description paragraph that:
- Clearly explains the customer's challenge
- Uses technical but accessible language
- Emphasizes the severity or impact of the issue
- Is 2-4 sentences long`,
      solution: `You are a technical writer for Welding Alloys case studies. Convert the bullet points into a professional solution description paragraph that:
- Explains how the Welding Alloys solution addressed the problem
- Highlights the application process if mentioned
- Uses active, confident language
- Is 2-4 sentences long`,
      advantages: `You are a technical writer for Welding Alloys case studies. Convert the bullet points into a professional technical advantages paragraph that:
- Lists key benefits clearly
- Uses technical terminology appropriately
- Quantifies improvements where possible
- Is 2-4 sentences long`,
      general: `You are a technical writer for Welding Alloys case studies. Convert the bullet points into a professional paragraph that:
- Is clear and concise
- Uses technical but accessible language
- Maintains a professional tone
- Is 2-4 sentences long`,
    };

    const contextStr = context
      ? `\nContext: Industry: ${context.industry || 'not specified'}, Component: ${context.component || 'not specified'}, Product: ${context.product || 'not specified'}`
      : '';

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 500,
      messages: [
        {
          role: 'system',
          content: systemPrompts[fieldType] || systemPrompts.general,
        },
        {
          role: 'user',
          content: `Convert these notes into professional prose:${contextStr}

${bullets}

Output only the converted prose, nothing else.`,
        },
      ],
    });

    const prose = response.choices[0]?.message?.content?.trim();

    if (!prose) {
      return {
        success: false,
        error: 'Failed to generate prose',
      };
    }

    console.log('[BulletToProse] Converted:', { original: bullets.substring(0, 50), prose: prose.substring(0, 50) });

    return {
      success: true,
      prose,
    };
  } catch (error) {
    console.error('[BulletToProse] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to convert bullets to prose',
    };
  }
}

/**
 * Enhance existing text to be more professional and detailed
 * Similar to bullet-to-prose but for enhancing existing prose
 */
export async function enhanceText(
  text: string,
  fieldType: 'problem' | 'solution' | 'advantages' | 'general'
): Promise<BulletToProseResult> {
  if (!openai) {
    return {
      success: false,
      error: 'OpenAI API key not configured',
    };
  }

  if (!text || text.trim().length === 0) {
    return {
      success: false,
      error: 'No text provided to enhance',
    };
  }

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 500,
      messages: [
        {
          role: 'system',
          content: `You are a technical editor for Welding Alloys case studies. Enhance the provided text to be more professional, detailed, and impactful. Keep the same meaning but improve clarity and professionalism. Output only the enhanced text.`,
        },
        {
          role: 'user',
          content: `Enhance this ${fieldType} description:\n\n${text}`,
        },
      ],
    });

    const enhanced = response.choices[0]?.message?.content?.trim();

    if (!enhanced) {
      return {
        success: false,
        error: 'Failed to enhance text',
      };
    }

    return {
      success: true,
      prose: enhanced,
    };
  } catch (error) {
    console.error('[EnhanceText] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to enhance text',
    };
  }
}
