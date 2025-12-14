/**
 * Quality Score Calculator
 *
 * BRD Requirement: Quality Score (separate from Completion %)
 *
 * Quality Score measures the QUALITY and DEPTH of content:
 * - Completion % = presence of data
 * - Quality Score = richness/usefulness of data
 *
 * Scoring Criteria:
 * - Problem description depth (word count, detail)
 * - Solution detail and technical advantages
 * - Visual documentation (multiple photos, before/after)
 * - Cost savings quantification
 * - Competitor comparison
 * - Supporting documentation
 * - Tags for searchability
 *
 * @module lib/utils/quality-score
 * @author WA Development Team
 * @version 1.0.0
 * @since 2025-12-14
 */

import type { CaseStudy, WeldingProcedure, CostCalculator } from '@prisma/client';

export type CaseStudyWithRelations = CaseStudy & {
  wps?: WeldingProcedure | null;
  costCalculator?: CostCalculator | null;
};

export type QualityScoreResult = {
  totalScore: number; // 0-100
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  breakdown: {
    problemDescription: number;     // 0-20 points
    solutionDetail: number;         // 0-20 points
    visualDocumentation: number;    // 0-20 points
    costAnalysis: number;           // 0-20 points
    searchability: number;          // 0-10 points
    technicalDepth: number;         // 0-10 points
  };
  recommendations: string[];
  strengths: string[];
};

/**
 * Calculate word count for a text field
 */
function getWordCount(text: string | null | undefined): number {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(w => w.length > 0).length;
}

/**
 * Score problem description quality (0-20 points)
 */
function scoreProblemDescription(caseStudy: CaseStudyWithRelations): number {
  let score = 0;
  const problemWords = getWordCount(caseStudy.problemDescription);

  // Word count scoring
  if (problemWords >= 100) score += 10;
  else if (problemWords >= 50) score += 7;
  else if (problemWords >= 25) score += 4;
  else if (problemWords > 0) score += 2;

  // Previous solution mentioned
  if (caseStudy.previousSolution && getWordCount(caseStudy.previousSolution) >= 10) {
    score += 4;
  }

  // Previous service life mentioned
  if (caseStudy.previousServiceLife) {
    score += 3;
  }

  // Competitor mentioned
  if (caseStudy.competitorName) {
    score += 3;
  }

  return Math.min(score, 20);
}

/**
 * Score solution detail quality (0-20 points)
 */
function scoreSolutionDetail(caseStudy: CaseStudyWithRelations): number {
  let score = 0;

  // WA Solution description
  const solutionWords = getWordCount(caseStudy.waSolution);
  if (solutionWords >= 50) score += 6;
  else if (solutionWords >= 25) score += 4;
  else if (solutionWords > 0) score += 2;

  // WA Product specified
  if (caseStudy.waProduct) score += 4;

  // Technical advantages described
  const techAdvWords = getWordCount(caseStudy.technicalAdvantages);
  if (techAdvWords >= 30) score += 6;
  else if (techAdvWords >= 15) score += 4;
  else if (techAdvWords > 0) score += 2;

  // Expected service life improvement
  if (caseStudy.expectedServiceLife) score += 4;

  return Math.min(score, 20);
}

/**
 * Score visual documentation (0-20 points)
 */
function scoreVisualDocumentation(caseStudy: CaseStudyWithRelations): number {
  let score = 0;
  const imageCount = caseStudy.images?.length || 0;
  const docCount = caseStudy.supportingDocs?.length || 0;

  // Image scoring (more is better)
  if (imageCount >= 5) score += 12;
  else if (imageCount >= 3) score += 9;
  else if (imageCount >= 2) score += 6;
  else if (imageCount >= 1) score += 3;

  // Supporting documentation
  if (docCount >= 3) score += 8;
  else if (docCount >= 2) score += 6;
  else if (docCount >= 1) score += 4;

  return Math.min(score, 20);
}

/**
 * Score cost analysis depth (0-20 points)
 */
function scoreCostAnalysis(caseStudy: CaseStudyWithRelations): number {
  let score = 0;
  const cost = caseStudy.costCalculator;

  // Revenue figures provided
  if (caseStudy.solutionValueRevenue) score += 4;
  if (caseStudy.annualPotentialRevenue) score += 4;
  if (caseStudy.customerSavingsAmount) score += 4;

  // Cost calculator filled
  if (cost) {
    if (cost.annualSavings && cost.annualSavings > 0) score += 4;
    if (cost.savingsPercentage && cost.savingsPercentage > 0) score += 4;
  }

  return Math.min(score, 20);
}

/**
 * Score searchability/discoverability (0-10 points)
 */
function scoreSearchability(caseStudy: CaseStudyWithRelations): number {
  let score = 0;
  const tagCount = caseStudy.tags?.length || 0;

  // Tags for search
  if (tagCount >= 10) score += 5;
  else if (tagCount >= 5) score += 3;
  else if (tagCount >= 3) score += 2;
  else if (tagCount >= 1) score += 1;

  // Location and country specified
  if (caseStudy.location) score += 2;
  if (caseStudy.country) score += 1;

  // Industry and component clearly defined
  if (caseStudy.industry) score += 1;
  if (caseStudy.componentWorkpiece) score += 1;

  return Math.min(score, 10);
}

/**
 * Score technical depth (0-10 points)
 */
function scoreTechnicalDepth(caseStudy: CaseStudyWithRelations): number {
  let score = 0;
  const wps = caseStudy.wps;

  // WPS details filled
  if (wps) {
    if (wps.weldingProcess) score += 2;
    if (wps.waProductName) score += 1;
    if (wps.preheatTemperature || wps.interpassTemperature) score += 2;
    if (wps.hardness) score += 2;
    if (wps.shieldingGas || wps.flux) score += 1;
  }

  // Wear types specified
  if (caseStudy.wearType && caseStudy.wearType.length > 1) score += 2;
  else if (caseStudy.wearType && caseStudy.wearType.length === 1) score += 1;

  return Math.min(score, 10);
}

/**
 * Get grade from score
 */
function getGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

/**
 * Generate improvement recommendations
 */
function getRecommendations(
  breakdown: QualityScoreResult['breakdown'],
  caseStudy: CaseStudyWithRelations
): string[] {
  const recommendations: string[] = [];

  if (breakdown.problemDescription < 15) {
    if (getWordCount(caseStudy.problemDescription) < 50) {
      recommendations.push('Expand problem description with more detail (aim for 50+ words)');
    }
    if (!caseStudy.previousSolution) {
      recommendations.push('Add details about the previous/competitor solution');
    }
    if (!caseStudy.competitorName) {
      recommendations.push('Mention the competitor product if applicable');
    }
  }

  if (breakdown.solutionDetail < 15) {
    if (getWordCount(caseStudy.technicalAdvantages) < 30) {
      recommendations.push('Describe technical advantages in more detail');
    }
    if (!caseStudy.expectedServiceLife) {
      recommendations.push('Add expected service life improvement');
    }
  }

  if (breakdown.visualDocumentation < 12) {
    const imageCount = caseStudy.images?.length || 0;
    if (imageCount < 3) {
      recommendations.push('Add more photos (before/after, close-ups, overview)');
    }
    if (!caseStudy.supportingDocs?.length) {
      recommendations.push('Attach supporting documentation (drawings, specs)');
    }
  }

  if (breakdown.costAnalysis < 12) {
    if (!caseStudy.solutionValueRevenue) {
      recommendations.push('Add solution value/revenue figures');
    }
    if (!caseStudy.costCalculator) {
      recommendations.push('Complete the Cost Calculator for ROI analysis');
    }
  }

  if (breakdown.searchability < 6) {
    const tagCount = caseStudy.tags?.length || 0;
    if (tagCount < 5) {
      recommendations.push('Add more tags for better search discoverability');
    }
  }

  if (breakdown.technicalDepth < 6 && (caseStudy.type === 'TECH' || caseStudy.type === 'STAR')) {
    if (!caseStudy.wps) {
      recommendations.push('Add WPS details for technical depth');
    }
  }

  return recommendations.slice(0, 5); // Max 5 recommendations
}

/**
 * Identify strengths
 */
function getStrengths(
  breakdown: QualityScoreResult['breakdown'],
  caseStudy: CaseStudyWithRelations
): string[] {
  const strengths: string[] = [];

  if (breakdown.problemDescription >= 15) {
    strengths.push('Detailed problem description');
  }

  if (breakdown.solutionDetail >= 15) {
    strengths.push('Comprehensive solution details');
  }

  if (breakdown.visualDocumentation >= 15) {
    strengths.push('Excellent visual documentation');
  }

  if (breakdown.costAnalysis >= 15) {
    strengths.push('Strong cost/ROI analysis');
  }

  if (breakdown.searchability >= 8) {
    strengths.push('Highly discoverable (good tags)');
  }

  if (breakdown.technicalDepth >= 8) {
    strengths.push('Rich technical specifications');
  }

  if (caseStudy.competitorName) {
    strengths.push('Includes competitor comparison');
  }

  return strengths.slice(0, 5);
}

/**
 * Calculate full quality score
 */
export function calculateQualityScore(caseStudy: CaseStudyWithRelations): QualityScoreResult {
  const breakdown = {
    problemDescription: scoreProblemDescription(caseStudy),
    solutionDetail: scoreSolutionDetail(caseStudy),
    visualDocumentation: scoreVisualDocumentation(caseStudy),
    costAnalysis: scoreCostAnalysis(caseStudy),
    searchability: scoreSearchability(caseStudy),
    technicalDepth: scoreTechnicalDepth(caseStudy),
  };

  const totalScore = Object.values(breakdown).reduce((sum, val) => sum + val, 0);
  const grade = getGrade(totalScore);

  return {
    totalScore,
    grade,
    breakdown,
    recommendations: getRecommendations(breakdown, caseStudy),
    strengths: getStrengths(breakdown, caseStudy),
  };
}

/**
 * Get quality score color for UI
 */
export function getQualityScoreColor(grade: QualityScoreResult['grade']): string {
  const colors: Record<QualityScoreResult['grade'], string> = {
    'A': 'text-green-600 bg-green-100',
    'B': 'text-blue-600 bg-blue-100',
    'C': 'text-yellow-600 bg-yellow-100',
    'D': 'text-orange-600 bg-orange-100',
    'F': 'text-red-600 bg-red-100',
  };
  return colors[grade];
}

/**
 * Get quality score label
 */
export function getQualityScoreLabel(grade: QualityScoreResult['grade']): string {
  const labels: Record<QualityScoreResult['grade'], string> = {
    'A': 'Excellent',
    'B': 'Good',
    'C': 'Average',
    'D': 'Needs Work',
    'F': 'Incomplete',
  };
  return labels[grade];
}
