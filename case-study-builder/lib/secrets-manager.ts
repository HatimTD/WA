/**
 * Secrets Manager
 *
 * Provides secure secrets management including:
 * - Secret validation and health checks
 * - Secret rotation tracking
 * - Audit logging for secret access
 * - Integration with external secret managers (Vercel, AWS, etc.)
 *
 * Complies with WA Policy Section 6.2 - Secrets Management.
 *
 * @module secrets-manager
 * @author WA Security Team
 * @version 1.0.0
 * @since 2025-12-11
 */

import { createHash } from 'crypto';

/**
 * Secret configuration
 */
interface SecretConfig {
  /** Name of the environment variable */
  name: string;
  /** Whether the secret is required */
  required: boolean;
  /** Description of the secret */
  description: string;
  /** Category of the secret */
  category: 'database' | 'auth' | 'api' | 'email' | 'storage' | 'monitoring' | 'other';
  /** Recommended rotation period in days */
  rotationDays?: number;
  /** Validation pattern (regex) */
  validationPattern?: RegExp;
  /** Minimum length */
  minLength?: number;
}

/**
 * Secret health status
 */
interface SecretHealth {
  name: string;
  category: string;
  status: 'healthy' | 'warning' | 'error' | 'missing';
  message: string;
  lastRotated?: Date;
  daysSinceRotation?: number;
  needsRotation: boolean;
}

/**
 * Configuration for all required secrets
 */
const SECRET_CONFIGS: SecretConfig[] = [
  // Database
  {
    name: 'POSTGRES_URL',
    required: true,
    description: 'PostgreSQL database connection string',
    category: 'database',
    rotationDays: 90,
    validationPattern: /^postgres(ql)?:\/\/.+/,
  },

  // Authentication
  {
    name: 'AUTH_SECRET',
    required: true,
    description: 'NextAuth.js secret for session encryption',
    category: 'auth',
    rotationDays: 90,
    minLength: 32,
  },
  {
    name: 'AUTH_GOOGLE_ID',
    required: false,
    description: 'Google OAuth Client ID',
    category: 'auth',
    rotationDays: 365,
  },
  {
    name: 'AUTH_GOOGLE_SECRET',
    required: false,
    description: 'Google OAuth Client Secret',
    category: 'auth',
    rotationDays: 365,
    minLength: 20,
  },
  {
    name: 'AUTH_AZURE_AD_CLIENT_ID',
    required: false,
    description: 'Azure AD Client ID',
    category: 'auth',
  },
  {
    name: 'AUTH_AZURE_AD_CLIENT_SECRET',
    required: false,
    description: 'Azure AD Client Secret',
    category: 'auth',
    rotationDays: 365,
  },

  // API Keys
  {
    name: 'OPENAI_API_KEY',
    required: false,
    description: 'OpenAI API key for AI features',
    category: 'api',
    validationPattern: /^sk-/,
    minLength: 40,
  },

  // Email
  {
    name: 'RESEND_API_KEY',
    required: false,
    description: 'Resend API key for email sending',
    category: 'email',
    validationPattern: /^re_/,
  },

  // Storage
  {
    name: 'CLOUDINARY_URL',
    required: false,
    description: 'Cloudinary connection URL for image storage',
    category: 'storage',
    validationPattern: /^cloudinary:\/\/.+/,
  },
  {
    name: 'NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME',
    required: false,
    description: 'Cloudinary cloud name (public)',
    category: 'storage',
  },

  // Monitoring
  {
    name: 'SENTRY_DSN',
    required: false,
    description: 'Sentry DSN for error tracking',
    category: 'monitoring',
    validationPattern: /^https:\/\/.*@.*\.ingest\.sentry\.io\/.+/,
  },
  {
    name: 'LOGTAIL_SOURCE_TOKEN',
    required: false,
    description: 'Logtail token for log aggregation',
    category: 'monitoring',
  },

  // GDPR
  {
    name: 'GDPR_ANONYMIZATION_SALT',
    required: false,
    description: 'Salt for GDPR data anonymization',
    category: 'other',
    minLength: 16,
  },

  // Break-Glass Admin
  {
    name: 'BREAK_GLASS_SECRET',
    required: false,
    description: 'Secret for break-glass admin access',
    category: 'auth',
    minLength: 32,
  },

  // NetSuite Integration
  {
    name: 'NETSUITE_ACCOUNT_ID',
    required: false,
    description: 'NetSuite account ID',
    category: 'api',
  },
  {
    name: 'NETSUITE_CONSUMER_KEY',
    required: false,
    description: 'NetSuite OAuth consumer key',
    category: 'api',
    rotationDays: 365,
  },
  {
    name: 'NETSUITE_CONSUMER_SECRET',
    required: false,
    description: 'NetSuite OAuth consumer secret',
    category: 'api',
    rotationDays: 365,
    minLength: 20,
  },
  {
    name: 'NETSUITE_TOKEN_ID',
    required: false,
    description: 'NetSuite OAuth token ID',
    category: 'api',
    rotationDays: 365,
  },
  {
    name: 'NETSUITE_TOKEN_SECRET',
    required: false,
    description: 'NetSuite OAuth token secret',
    category: 'api',
    rotationDays: 365,
    minLength: 20,
  },
];

/**
 * Tracks when secrets were last rotated
 * In production, this should be stored in a database or secret manager
 */
const secretRotationDates = new Map<string, Date>();

/**
 * Generates a fingerprint of a secret value (for comparison without exposing)
 *
 * @param value - The secret value
 * @returns SHA-256 hash of the first 8 characters
 */
function generateSecretFingerprint(value: string): string {
  return createHash('sha256')
    .update(value.substring(0, 8))
    .digest('hex')
    .substring(0, 16);
}

/**
 * Validates a single secret
 *
 * @param config - The secret configuration
 * @returns Health status for the secret
 */
function validateSecret(config: SecretConfig): SecretHealth {
  const value = process.env[config.name];

  // Check if secret exists
  if (!value) {
    if (config.required) {
      return {
        name: config.name,
        category: config.category,
        status: 'error',
        message: `Required secret ${config.name} is missing`,
        needsRotation: false,
      };
    }
    return {
      name: config.name,
      category: config.category,
      status: 'missing',
      message: `Optional secret ${config.name} is not configured`,
      needsRotation: false,
    };
  }

  // Validate minimum length
  if (config.minLength && value.length < config.minLength) {
    return {
      name: config.name,
      category: config.category,
      status: 'warning',
      message: `Secret ${config.name} is shorter than recommended (${value.length} < ${config.minLength})`,
      needsRotation: false,
    };
  }

  // Validate pattern
  if (config.validationPattern && !config.validationPattern.test(value)) {
    return {
      name: config.name,
      category: config.category,
      status: 'warning',
      message: `Secret ${config.name} does not match expected format`,
      needsRotation: false,
    };
  }

  // Check rotation status
  const lastRotated = secretRotationDates.get(config.name);
  let daysSinceRotation: number | undefined;
  let needsRotation = false;

  if (config.rotationDays) {
    if (lastRotated) {
      daysSinceRotation = Math.floor(
        (Date.now() - lastRotated.getTime()) / (1000 * 60 * 60 * 24)
      );
      needsRotation = daysSinceRotation > config.rotationDays;
    } else {
      // If we don't know when it was rotated, assume it needs rotation
      needsRotation = true;
    }
  }

  if (needsRotation) {
    return {
      name: config.name,
      category: config.category,
      status: 'warning',
      message: `Secret ${config.name} should be rotated (${daysSinceRotation || 'unknown'} days since last rotation)`,
      lastRotated,
      daysSinceRotation,
      needsRotation: true,
    };
  }

  return {
    name: config.name,
    category: config.category,
    status: 'healthy',
    message: 'Secret is properly configured',
    lastRotated,
    daysSinceRotation,
    needsRotation: false,
  };
}

/**
 * Validates all secrets and returns health status
 *
 * @returns Health status for all secrets
 */
export function validateAllSecrets(): {
  healthy: number;
  warnings: number;
  errors: number;
  missing: number;
  secrets: SecretHealth[];
} {
  const results = SECRET_CONFIGS.map(validateSecret);

  return {
    healthy: results.filter((r) => r.status === 'healthy').length,
    warnings: results.filter((r) => r.status === 'warning').length,
    errors: results.filter((r) => r.status === 'error').length,
    missing: results.filter((r) => r.status === 'missing').length,
    secrets: results,
  };
}

/**
 * Gets the health status of secrets by category
 *
 * @returns Secrets grouped by category
 */
export function getSecretsByCategory(): Record<string, SecretHealth[]> {
  const results = SECRET_CONFIGS.map(validateSecret);
  const byCategory: Record<string, SecretHealth[]> = {};

  for (const result of results) {
    if (!byCategory[result.category]) {
      byCategory[result.category] = [];
    }
    byCategory[result.category].push(result);
  }

  return byCategory;
}

/**
 * Marks a secret as rotated
 *
 * @param secretName - Name of the secret that was rotated
 */
export function markSecretRotated(secretName: string): void {
  secretRotationDates.set(secretName, new Date());
  console.log(`[Secrets Manager] Secret ${secretName} marked as rotated`);
}

/**
 * Gets secrets that need rotation
 *
 * @returns List of secrets needing rotation
 */
export function getSecretsNeedingRotation(): SecretHealth[] {
  return SECRET_CONFIGS.map(validateSecret).filter((r) => r.needsRotation);
}

/**
 * Checks if all required secrets are present
 *
 * @returns True if all required secrets are present
 */
export function hasRequiredSecrets(): boolean {
  return SECRET_CONFIGS.filter((c) => c.required).every(
    (c) => process.env[c.name]
  );
}

/**
 * Gets a sanitized view of environment configuration
 * Never exposes actual secret values
 *
 * @returns Sanitized configuration
 */
export function getSanitizedConfig(): Record<
  string,
  {
    configured: boolean;
    fingerprint?: string;
    category: string;
  }
> {
  const config: Record<
    string,
    { configured: boolean; fingerprint?: string; category: string }
  > = {};

  for (const secret of SECRET_CONFIGS) {
    const value = process.env[secret.name];
    config[secret.name] = {
      configured: !!value,
      fingerprint: value ? generateSecretFingerprint(value) : undefined,
      category: secret.category,
    };
  }

  return config;
}

/**
 * Generates a secrets report for security audits
 *
 * @returns Security audit report
 */
export function generateSecurityReport(): {
  generatedAt: Date;
  summary: {
    total: number;
    required: number;
    optional: number;
    configured: number;
    healthy: number;
    warnings: number;
    errors: number;
  };
  byCategory: Record<
    string,
    { total: number; configured: number; healthy: number }
  >;
  recommendations: string[];
} {
  const validation = validateAllSecrets();
  const byCategory = getSecretsByCategory();

  const categorySummary: Record<
    string,
    { total: number; configured: number; healthy: number }
  > = {};

  for (const [category, secrets] of Object.entries(byCategory)) {
    categorySummary[category] = {
      total: secrets.length,
      configured: secrets.filter((s) => s.status !== 'missing').length,
      healthy: secrets.filter((s) => s.status === 'healthy').length,
    };
  }

  const recommendations: string[] = [];

  // Check for errors
  if (validation.errors > 0) {
    recommendations.push(
      'CRITICAL: Configure all required secrets before deployment'
    );
  }

  // Check for rotation
  const needsRotation = getSecretsNeedingRotation();
  if (needsRotation.length > 0) {
    recommendations.push(
      `Rotate the following secrets: ${needsRotation.map((s) => s.name).join(', ')}`
    );
  }

  // Check for weak secrets
  const weakSecrets = validation.secrets.filter(
    (s) =>
      s.status === 'warning' && s.message.includes('shorter than recommended')
  );
  if (weakSecrets.length > 0) {
    recommendations.push(
      `Strengthen the following secrets (increase length): ${weakSecrets.map((s) => s.name).join(', ')}`
    );
  }

  // Check for missing optional but recommended secrets
  const missingRecommended = ['GDPR_ANONYMIZATION_SALT', 'SENTRY_DSN'];
  const actuallyMissing = missingRecommended.filter(
    (name) => !process.env[name]
  );
  if (actuallyMissing.length > 0) {
    recommendations.push(
      `Consider configuring: ${actuallyMissing.join(', ')} for better security`
    );
  }

  return {
    generatedAt: new Date(),
    summary: {
      total: SECRET_CONFIGS.length,
      required: SECRET_CONFIGS.filter((c) => c.required).length,
      optional: SECRET_CONFIGS.filter((c) => !c.required).length,
      configured:
        validation.healthy + validation.warnings + validation.errors,
      healthy: validation.healthy,
      warnings: validation.warnings,
      errors: validation.errors,
    },
    byCategory: categorySummary,
    recommendations,
  };
}

/**
 * Runtime validation - call during app startup
 *
 * @throws Error if required secrets are missing
 */
export function validateSecretsOnStartup(): void {
  // Skip validation during build or if explicitly disabled
  if (
    process.env.SKIP_ENV_VALIDATION === 'true' ||
    process.env.NODE_ENV === 'test'
  ) {
    console.log('[Secrets Manager] Validation skipped');
    return;
  }

  const validation = validateAllSecrets();

  // Log summary
  console.log('[Secrets Manager] Validation complete:', {
    healthy: validation.healthy,
    warnings: validation.warnings,
    errors: validation.errors,
    missing: validation.missing,
  });

  // Log warnings
  for (const secret of validation.secrets) {
    if (secret.status === 'warning') {
      console.warn(`[Secrets Manager] WARNING: ${secret.message}`);
    }
  }

  // Throw on errors (missing required secrets)
  if (validation.errors > 0) {
    const errorSecrets = validation.secrets
      .filter((s) => s.status === 'error')
      .map((s) => s.name);
    throw new Error(
      `[Secrets Manager] Missing required secrets: ${errorSecrets.join(', ')}`
    );
  }
}
