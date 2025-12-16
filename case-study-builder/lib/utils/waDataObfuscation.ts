/**
 * Customer Data Obfuscation Utility
 *
 * Implements BRD 6.2 - Privacy & Data Security
 *
 * User Access Levels:
 * - Privileged Users (Full Visibility):
 *   - Creator of the ICA (Case Study)
 *   - Approvers/Managers in workflow
 *   - System Administrators
 *
 * - Restricted Users (Obfuscated View):
 *   - All other viewers see: "Customer: Confidential - [Industry] Sector"
 *
 * @module lib/utils/data-obfuscation
 * @author WA Development Team
 * @version 1.0.0
 * @since 2025-12-13
 */

import type { CaseStudy, User, Role } from '@prisma/client';

// Type for case study with optional user relations
export type CaseStudyWithUser = CaseStudy & {
  contributor?: User | null;
  approver?: User | null;
};

// Type for the current user context
export type UserContext = {
  id: string;
  role: Role;
  email?: string;
};

// Obfuscation result type
export type ObfuscatedCaseStudy<T extends CaseStudyWithUser> = T & {
  _obfuscated: boolean;
  _originalCustomerName?: string; // Only set for privileged users if needed
};

/**
 * Check if user has privileged access to view full customer data
 *
 * Privileged users:
 * - Creator of the ICA
 * - Approvers/Managers in the workflow
 * - System Administrators
 */
export function waHasPrivilegedAccess(
  caseStudy: CaseStudyWithUser,
  currentUserId: string,
  currentUserRole: Role
): boolean {
  // System Administrators always have access
  if (currentUserRole === 'ADMIN') return true;

  // Approvers/Managers have access (can see all cases for approval workflow)
  if (currentUserRole === 'APPROVER') return true;

  // Creator has access to their own case studies
  if (caseStudy.contributorId === currentUserId) return true;

  // Assigned approver of this specific case has access
  if (caseStudy.approverId && caseStudy.approverId === currentUserId) return true;

  // All other users are restricted
  return false;
}

/**
 * Obfuscate customer name for restricted users
 * Returns: "Confidential - [Industry Sector]"
 */
export function waObfuscateCustomerName(
  caseStudy: CaseStudyWithUser,
  isPrivileged: boolean
): string {
  if (isPrivileged) {
    return caseStudy.customerName;
  }

  // Use industry sector for context without revealing customer identity
  const industry = caseStudy.industry || 'Industrial';
  return `Confidential - ${industry} Sector`;
}

/**
 * Obfuscate location for restricted users
 * Only show country/region, not specific plant/city
 */
export function waObfuscateLocation(
  caseStudy: CaseStudyWithUser,
  isPrivileged: boolean
): string {
  if (isPrivileged) {
    return caseStudy.location;
  }

  // Only show country for restricted users
  const country = caseStudy.country || 'Global';
  return `${country} Region`;
}

/**
 * Obfuscate specific contact information
 */
export function waObfuscateContactInfo(
  value: string | null | undefined,
  isPrivileged: boolean
): string | null {
  if (isPrivileged) {
    return value || null;
  }
  return null; // Completely hide contact info for restricted users
}

/**
 * Apply all obfuscation rules to a single case study
 *
 * @param caseStudy - The case study to obfuscate
 * @param currentUserId - The ID of the current user
 * @param currentUserRole - The role of the current user
 * @returns Obfuscated case study
 */
export function waObfuscateCaseStudy<T extends CaseStudyWithUser>(
  caseStudy: T,
  currentUserId: string,
  currentUserRole: Role
): ObfuscatedCaseStudy<T> {
  const isPrivileged = waHasPrivilegedAccess(caseStudy, currentUserId, currentUserRole);

  // Return original data for privileged users
  if (isPrivileged) {
    return {
      ...caseStudy,
      _obfuscated: false,
    };
  }

  // Apply obfuscation for restricted users
  return {
    ...caseStudy,
    customerName: waObfuscateCustomerName(caseStudy, false),
    location: waObfuscateLocation(caseStudy, false),
    // Null out any PII fields
    netsuiteCustomerId: null,
    _obfuscated: true,
  };
}

/**
 * Obfuscate an array of case studies
 *
 * @param caseStudies - Array of case studies to obfuscate
 * @param currentUserId - The ID of the current user
 * @param currentUserRole - The role of the current user
 * @returns Array of obfuscated case studies
 */
export function waObfuscateCaseStudies<T extends CaseStudyWithUser>(
  caseStudies: T[],
  currentUserId: string,
  currentUserRole: Role
): ObfuscatedCaseStudy<T>[] {
  return caseStudies.map((cs) => waObfuscateCaseStudy(cs, currentUserId, currentUserRole));
}

/**
 * Check if a case study should show obfuscated data in exports (PDF, etc.)
 * This is separate from view permissions - used for external sharing
 */
export function waShouldObfuscateForExport(
  caseStudy: CaseStudyWithUser,
  exportingUserId: string,
  exportingUserRole: Role,
  forceObfuscate?: boolean
): boolean {
  // If explicitly forced, always obfuscate
  if (forceObfuscate) return true;

  // Otherwise, follow the same rules as view access
  return !waHasPrivilegedAccess(caseStudy, exportingUserId, exportingUserRole);
}

/**
 * Get obfuscation summary for a case study
 * Useful for UI indicators
 */
export function waGetObfuscationInfo(
  caseStudy: CaseStudyWithUser,
  currentUserId: string,
  currentUserRole: Role
): {
  isObfuscated: boolean;
  reason: string;
  accessLevel: 'full' | 'restricted';
} {
  const isPrivileged = waHasPrivilegedAccess(caseStudy, currentUserId, currentUserRole);

  if (isPrivileged) {
    let reason = 'Full access: ';
    if (currentUserRole === 'ADMIN') {
      reason += 'System Administrator';
    } else if (currentUserRole === 'APPROVER') {
      reason += 'Approver/Manager role';
    } else if (caseStudy.contributorId === currentUserId) {
      reason += 'You created this case study';
    } else if (caseStudy.approverId === currentUserId) {
      reason += 'Assigned approver';
    }

    return {
      isObfuscated: false,
      reason,
      accessLevel: 'full',
    };
  }

  return {
    isObfuscated: true,
    reason: 'Customer details hidden for data privacy',
    accessLevel: 'restricted',
  };
}

/**
 * Create a shareable version of a case study with optional obfuscation
 * Used for public sharing or cross-team collaboration
 */
export function waCreateShareableCaseStudy<T extends CaseStudyWithUser>(
  caseStudy: T,
  options: {
    obfuscateCustomer?: boolean;
    obfuscateLocation?: boolean;
    removeImages?: boolean;
    removeCostData?: boolean;
  } = {}
): Partial<T> {
  const result = { ...caseStudy };

  if (options.obfuscateCustomer) {
    (result as CaseStudyWithUser).customerName = waObfuscateCustomerName(caseStudy, false);
    result.netsuiteCustomerId = null;
  }

  if (options.obfuscateLocation) {
    (result as CaseStudyWithUser).location = waObfuscateLocation(caseStudy, false);
  }

  if (options.removeImages) {
    result.images = [];
  }

  // Remove sensitive internal fields
  delete (result as Record<string, unknown>).contributor;
  delete (result as Record<string, unknown>).approver;

  return result;
}

/**
 * Validate that obfuscation is properly applied
 * Useful for testing and compliance verification
 */
export function waValidateObfuscation(
  original: CaseStudyWithUser,
  obfuscated: ObfuscatedCaseStudy<CaseStudyWithUser>
): {
  isValid: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  if (!obfuscated._obfuscated) {
    // Should be a privileged user view, no validation needed
    return { isValid: true, issues: [] };
  }

  // Check that customer name is properly obfuscated
  if (obfuscated.customerName === original.customerName) {
    issues.push('Customer name was not obfuscated');
  }

  // Check that location is properly obfuscated
  if (obfuscated.location === original.location) {
    issues.push('Location was not obfuscated');
  }

  // Check that NetSuite ID is removed
  if (obfuscated.netsuiteCustomerId !== null && original.netsuiteCustomerId !== null) {
    issues.push('NetSuite customer ID was not removed');
  }

  return {
    isValid: issues.length === 0,
    issues,
  };
}
