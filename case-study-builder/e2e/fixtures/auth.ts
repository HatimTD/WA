import { Page } from '@playwright/test';

/**
 * Test user credentials for development environment
 */
export const TEST_USER = {
  email: 'admin@weldingalloys.com',
  password: 'TestPassword123',
  role: 'ADMIN' as const,
};

/**
 * Helper function to login as a test user
 * @param page - Playwright page object
 * @param email - User email (defaults to TEST_USER.email)
 * @param password - User password (defaults to TEST_USER.password)
 * @param role - User role (defaults to TEST_USER.role)
 */
export async function loginAsTestUser(
  page: Page,
  email: string = TEST_USER.email,
  password: string = TEST_USER.password,
  role: string = TEST_USER.role
): Promise<void> {
  // Navigate to login page
  await page.goto('/dev-login');

  // Fill in credentials
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);

  // Select role
  await page.getByLabel('Role').click();
  await page.getByRole('option', { name: new RegExp(role, 'i') }).click();

  // Submit login form
  await page.getByRole('button', { name: /Login/i }).click();

  // Wait for successful navigation to dashboard
  await page.waitForURL(/\/dashboard/, { timeout: 15000 });
}

/**
 * Helper function to logout
 * @param page - Playwright page object
 */
export async function logout(page: Page): Promise<void> {
  // Find and click the user menu/avatar
  const userMenuButton = page.getByRole('button', { name: /account|user|profile/i });

  if (await userMenuButton.isVisible({ timeout: 5000 })) {
    await userMenuButton.click();

    // Click logout button
    const logoutButton = page.getByRole('menuitem', { name: /logout|sign out/i });
    await logoutButton.click();

    // Wait for redirect to login page
    await page.waitForURL(/\/login|\/$/);
  }
}

/**
 * Helper function to create test case study data
 * @param overrides - Optional overrides for default case study data
 * @returns Case study test data object
 */
export function createTestCaseStudy(overrides?: Partial<TestCaseStudy>): TestCaseStudy {
  const timestamp = Date.now();

  return {
    title: `Test Case Study ${timestamp}`,
    client: `Test Client ${timestamp}`,
    description: `This is a test case study created by E2E tests at ${new Date().toISOString()}`,
    industry: 'Manufacturing',
    challenge: 'Test challenge description',
    solution: 'Test solution description',
    results: 'Test results description',
    ...overrides,
  };
}

/**
 * Helper function to fill case study form
 * @param page - Playwright page object
 * @param data - Case study data to fill
 */
export async function fillCaseStudyForm(
  page: Page,
  data: Partial<TestCaseStudy>
): Promise<void> {
  // Fill title
  if (data.title) {
    const titleInput = page.getByLabel(/title|name/i).first();
    await titleInput.fill(data.title);
  }

  // Fill client
  if (data.client) {
    const clientInput = page.getByLabel(/client|company/i).first();
    if (await clientInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await clientInput.fill(data.client);
    }
  }

  // Fill description
  if (data.description) {
    const descriptionInput = page.getByLabel(/description|details/i).first();
    if (await descriptionInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await descriptionInput.fill(data.description);
    }
  }

  // Fill industry
  if (data.industry) {
    const industryInput = page.getByLabel(/industry|sector/i).first();
    if (await industryInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await industryInput.fill(data.industry);
    }
  }

  // Fill challenge
  if (data.challenge) {
    const challengeInput = page.getByLabel(/challenge|problem/i).first();
    if (await challengeInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await challengeInput.fill(data.challenge);
    }
  }

  // Fill solution
  if (data.solution) {
    const solutionInput = page.getByLabel(/solution|approach/i).first();
    if (await solutionInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await solutionInput.fill(data.solution);
    }
  }

  // Fill results
  if (data.results) {
    const resultsInput = page.getByLabel(/results|outcomes/i).first();
    if (await resultsInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await resultsInput.fill(data.results);
    }
  }
}

/**
 * Helper function to wait for toast notification
 * @param page - Playwright page object
 * @param message - Expected message text (regex or string)
 * @param timeout - Timeout in milliseconds (default: 5000)
 */
export async function waitForToast(
  page: Page,
  message: string | RegExp,
  timeout: number = 5000
): Promise<void> {
  const messagePattern = typeof message === 'string' ? new RegExp(message, 'i') : message;
  await page.getByText(messagePattern).first().waitFor({ state: 'visible', timeout });
}

/**
 * Test case study data type
 */
export interface TestCaseStudy {
  title: string;
  client: string;
  description: string;
  industry?: string;
  challenge?: string;
  solution?: string;
  results?: string;
}

/**
 * Helper to check if user is authenticated
 * @param page - Playwright page object
 * @returns true if user is authenticated, false otherwise
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
  const url = page.url();
  return url.includes('/dashboard') && !url.includes('/login');
}

/**
 * Helper to clear browser storage (cookies, local storage, session storage)
 * @param page - Playwright page object
 */
export async function clearBrowserStorage(page: Page): Promise<void> {
  await page.context().clearCookies();
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
}
