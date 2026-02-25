'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { revalidatePath } from 'next/cache';
import {
  parseCSV,
  parseExcelData,
  convertToCreateInput,
  generateCSVTemplate,
  type BulkImportRow,
  type ParseResult,
  type ValidationError,
} from '@/lib/utils/waBulkImportParser';

export interface BulkImportResult {
  success: boolean;
  totalRows: number;
  successfulRows: number;
  failedRows: number;
  errors: ValidationError[];
  createdIds: string[];
  message: string;
}

/**
 * Parse and validate CSV content without creating case studies
 * Used for preview before final import
 */
export async function waValidateBulkImport(
  content: string,
  fileType: 'csv' | 'excel' = 'csv'
): Promise<ParseResult> {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      success: false,
      rows: [],
      errors: [{ rowNumber: 0, field: 'auth', message: 'Unauthorized' }],
      totalRows: 0,
      validRows: 0,
    };
  }

  // Check user role - only ADMIN and APPROVER can bulk import
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  if (!user || !['ADMIN', 'APPROVER'].includes(user.role)) {
    return {
      success: false,
      rows: [],
      errors: [{ rowNumber: 0, field: 'auth', message: 'Only Admins and Approvers can perform bulk imports' }],
      totalRows: 0,
      validRows: 0,
    };
  }

  try {
    if (fileType === 'csv') {
      return parseCSV(content);
    } else {
      // For Excel, content should be JSON stringified array
      const data = JSON.parse(content);
      return parseExcelData(data);
    }
  } catch (error: any) {
    return {
      success: false,
      rows: [],
      errors: [{ rowNumber: 0, field: 'file', message: `Failed to parse file: ${error.message}` }],
      totalRows: 0,
      validRows: 0,
    };
  }
}

/**
 * Perform bulk import of case studies from validated data
 */
export async function waBulkImportCaseStudies(
  rows: BulkImportRow[],
  options: {
    status?: 'DRAFT' | 'SUBMITTED';
    skipDuplicates?: boolean;
  } = {}
): Promise<BulkImportResult> {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      success: false,
      totalRows: 0,
      successfulRows: 0,
      failedRows: 0,
      errors: [{ rowNumber: 0, field: 'auth', message: 'Unauthorized' }],
      createdIds: [],
      message: 'Unauthorized',
    };
  }

  // Check user role
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  if (!user || !['ADMIN', 'APPROVER'].includes(user.role)) {
    return {
      success: false,
      totalRows: 0,
      successfulRows: 0,
      failedRows: 0,
      errors: [{ rowNumber: 0, field: 'auth', message: 'Only Admins and Approvers can perform bulk imports' }],
      createdIds: [],
      message: 'Insufficient permissions',
    };
  }

  const errors: ValidationError[] = [];
  const createdIds: string[] = [];
  const status = options.status || 'DRAFT';

  try {
    // Process each row in a transaction
    for (const row of rows) {
      try {
        const input = convertToCreateInput(row);

        // Check for duplicates if enabled
        if (options.skipDuplicates) {
          const existing = await prisma.waCaseStudy.findFirst({
            where: {
              customerName: input.customerName,
              componentWorkpiece: input.componentWorkpiece,
              problemDescription: input.problemDescription,
            },
          });

          if (existing) {
            errors.push({
              rowNumber: row.rowNumber,
              field: 'duplicate',
              message: `Duplicate case study found - same customer, component, and problem description`,
            });
            continue;
          }
        }

        // Convert string numbers to Decimal
        const solutionValue = input.solutionValueRevenue
          ? parseFloat(input.solutionValueRevenue)
          : null;
        const annualPotential = input.annualPotentialRevenue
          ? parseFloat(input.annualPotentialRevenue)
          : null;
        const customerSavings = input.customerSavingsAmount
          ? parseFloat(input.customerSavingsAmount)
          : null;

        const caseStudy = await prisma.waCaseStudy.create({
          data: {
            type: input.type,
            status: status,
            contributorId: session.user.id,
            customerName: input.customerName,
            industry: input.industry,
            location: input.location,
            country: input.country || null,
            componentWorkpiece: input.componentWorkpiece,
            workType: input.workType,
            wearType: input.wearType as any,
            baseMetal: input.baseMetal || null,
            generalDimensions: input.generalDimensions || null,
            oem: input.oem || null,
            problemDescription: input.problemDescription,
            previousSolution: input.previousSolution || null,
            previousServiceLife: input.previousServiceLife || null,
            competitorName: input.competitorName || null,
            waSolution: input.waSolution,
            waProduct: input.waProduct,
            technicalAdvantages: input.technicalAdvantages || null,
            expectedServiceLife: input.expectedServiceLife || null,
            solutionValueRevenue: solutionValue,
            annualPotentialRevenue: annualPotential,
            customerSavingsAmount: customerSavings,
            images: [],
            supportingDocs: [],
            tags: input.tags || [],
            submittedAt: status === 'SUBMITTED' ? new Date() : null,
          },
        });

        createdIds.push(caseStudy.id);
      } catch (error: any) {
        // Check for unique constraint violation
        if (error.code === 'P2002') {
          errors.push({
            rowNumber: row.rowNumber,
            field: 'unique',
            message: 'A case study with this combination already exists',
          });
        } else {
          errors.push({
            rowNumber: row.rowNumber,
            field: 'database',
            message: `Failed to create: ${error.message}`,
          });
        }
      }
    }

    // Revalidate paths
    revalidatePath('/dashboard');
    revalidatePath('/dashboard/my-cases');
    revalidatePath('/dashboard/library');

    // Log the bulk import
    logger.audit('BULK_IMPORT', session.user.id, 'bulk-import', {
      totalRows: rows.length,
      successfulRows: createdIds.length,
      failedRows: errors.length,
      status,
    });

    const successMessage = createdIds.length > 0
      ? `Successfully imported ${createdIds.length} case ${createdIds.length === 1 ? 'study' : 'studies'}`
      : 'No case studies were imported';

    const errorMessage = errors.length > 0
      ? ` (${errors.length} ${errors.length === 1 ? 'row' : 'rows'} failed)`
      : '';

    return {
      success: createdIds.length > 0,
      totalRows: rows.length,
      successfulRows: createdIds.length,
      failedRows: errors.length,
      errors,
      createdIds,
      message: successMessage + errorMessage,
    };
  } catch (error: any) {
    logger.error('Bulk import failed', {
      userId: session.user.id,
      error: error.message,
    });

    return {
      success: false,
      totalRows: rows.length,
      successfulRows: 0,
      failedRows: rows.length,
      errors: [{ rowNumber: 0, field: 'system', message: `Import failed: ${error.message}` }],
      createdIds: [],
      message: 'Bulk import failed due to system error',
    };
  }
}

/**
 * Get CSV template for download
 */
export async function waGetBulkImportTemplate(): Promise<{ success: boolean; template?: string; message?: string }> {
  const session = await auth();

  if (!session?.user?.id) {
    return { success: false, message: 'Unauthorized' };
  }

  return {
    success: true,
    template: generateCSVTemplate(),
  };
}

/**
 * Get bulk import history for the current user
 */
export async function waGetBulkImportHistory(): Promise<{
  success: boolean;
  imports?: Array<{
    id: string;
    createdAt: Date;
    totalRows: number;
    successfulRows: number;
    status: string;
  }>;
  message?: string;
}> {
  const session = await auth();

  if (!session?.user?.id) {
    return { success: false, message: 'Unauthorized' };
  }

  // For now, return empty array - could add import history table later
  return {
    success: true,
    imports: [],
  };
}
