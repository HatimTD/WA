# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 16 (App Router) case study management system for Welding Alloys, built with TypeScript, Prisma ORM, PostgreSQL, and NextAuth v5. The application allows field engineers to submit case studies, technical leads to approve them, and admins to manage the system. It includes AI-powered features, offline support, NetSuite ERP integration, and comprehensive security features.

## Development Commands

### Core Development
```bash
npm run dev              # Start dev server on port 3010
npm run build            # Build for production (includes Prisma generation)
npm start                # Start production server on port 3010
npm run lint             # Run ESLint
```

### Database Management
```bash
npm run db:push          # Push schema changes to database
npm run db:studio        # Open Prisma Studio GUI
npm run db:seed          # Seed database with sample data
npm run db:seed-lists    # Seed master lists (industries, wear types, etc.)
npm run db:seed-test     # Seed test data for development
```

### Testing
```bash
# Unit Tests (Jest)
npm test                 # Run all unit tests with coverage
npm run test:watch       # Run tests in watch mode
npm run test:ci          # Run tests in CI mode (for CI/CD)

# E2E Tests (Playwright)
npm run test:e2e         # Run all E2E tests
npm run test:e2e:ui      # Run with Playwright UI
npm run test:e2e:headed  # Run in headed mode (visible browser)
npm run test:e2e:smoke   # Run smoke tests only
npm run test:e2e:security # Run security tests only
npm run test:e2e:a11y    # Run accessibility tests
npm run test:e2e:perf    # Run performance tests

# Run all tests
npm run test:all         # Run both unit and E2E tests
```

### Security & SBOM
```bash
npm run security:sbom    # Generate SBOM (both JSON and XML)
npm run security:audit   # Run npm security audit
```

### Running a Single Test
```bash
# Jest unit test
npx jest path/to/test.test.ts

# Single Playwright E2E test
npx playwright test path/to/test.spec.ts

# Specific test file with headed browser
npx playwright test e2e/auth.spec.ts --headed
```

## Architecture

### Tech Stack
- **Framework**: Next.js 16 (App Router with React 19)
- **Language**: TypeScript 5.6
- **Database**: PostgreSQL with Prisma ORM 6.19
- **Authentication**: NextAuth v5 (Google OAuth + Credentials for dev)
- **UI**: Radix UI + Tailwind CSS
- **AI**: OpenAI API (GPT-4) for suggestions and text generation
- **Offline**: Dexie.js (IndexedDB) + Serwist (Service Worker)
- **File Storage**: Cloudinary
- **Email**: Resend with React Email templates
- **Cache**: Upstash Redis for NetSuite data caching
- **Monitoring**: Sentry, Logtail, Vercel Analytics

### Directory Structure

```
case-study-builder/
├── app/                      # Next.js App Router
│   ├── api/                  # API routes
│   ├── dashboard/            # Main dashboard pages
│   │   ├── new/              # Create new case study
│   │   ├── my-cases/         # User's case studies
│   │   ├── library/          # Case study library/search
│   │   ├── approvals/        # Approval workflow
│   │   ├── admin/            # Admin panel
│   │   └── break-glass/      # Emergency admin access
│   ├── login/                # Login page
│   ├── dev-login/            # Dev credentials login
│   └── (public)/             # Public pages (landing)
├── components/               # React components
│   ├── case-study-form/      # Multi-step form (StepOne-Five, WPS, Cost Calculator)
│   ├── admin/                # Admin-specific components
│   └── ui/                   # Shadcn/ui base components
├── lib/                      # Business logic
│   ├── actions/              # Server Actions (wa*Actions.ts files)
│   ├── cache/                # Caching (Redis + IndexedDB)
│   ├── db/                   # Database utilities and Dexie schema
│   ├── hooks/                # React hooks
│   ├── integrations/         # NetSuite, Translation APIs
│   └── constants/            # Master lists, enums
├── prisma/                   # Prisma schema and seeds
│   ├── schema.prisma         # Database schema
│   └── seed*.ts              # Seed scripts
├── e2e/                      # Playwright E2E tests
├── __tests__/                # Jest unit tests
├── auth.ts                   # NextAuth configuration
└── middleware.ts             # Next.js middleware (auth, rate limiting)
```

### Key Architectural Patterns

#### 1. Server Actions Pattern
All data mutations use Next.js Server Actions located in `lib/actions/wa*Actions.ts`:
- Actions are prefixed with `wa` (e.g., `waCreateCaseStudy`, `waUpdateCaseStudy`)
- Always include `'use server'` directive at top of file
- Return `{ success: boolean, error?: string, data?: any }` format
- Handle errors gracefully and log to immutable audit log

#### 2. Multi-Step Form Workflow
Case study creation uses a wizard pattern (app/dashboard/new/page.tsx):
1. **Challenge Qualifier**: Determines if case counts toward BHAG goal
2. **StepOne**: Case type selection (APPLICATION/TECH/STAR)
3. **StepTwo**: Customer info with NetSuite integration
4. **StepThree**: Problem description
5. **StepFour**: WA solution details
6. **StepFive**: Media uploads, documentation
7. **StepWPS**: Welding Procedure Specification (optional)
8. **StepCostCalculator**: Cost savings calculator (optional)

Form data structure is defined in `CaseStudyFormData` type in app/dashboard/new/page.tsx.

#### 3. Database Models (Prisma)
All custom models use `Wa` prefix (PascalCase):
- `WaCaseStudy`: Main case study entity
- `WaWeldingProcedure`: WPS technical data
- `WaCostCalculation`: Cost calculator results
- `WaComment`: Comments on case studies
- `WaNotification`: User notifications
- `WaSavedCase`: Saved/bookmarked cases
- `WaBhagGoal`: BHAG (Big Hairy Audacious Goal) tracking

Standard NextAuth models (`User`, `Account`, `Session`) do NOT use the `Wa` prefix.

#### 4. Authentication Flow
- **Production**: Google OAuth (enforced via domain restriction in Google Console)
- **Development**: Credentials provider with `DEV_ADMIN_EMAIL` and `DEV_ADMIN_PASSWORD_HASH`
- **Middleware**: `middleware.ts` protects `/dashboard/*` routes
- **Roles**: CONTRIBUTOR, APPROVER, ADMIN (enum in Prisma schema)
- **Break-Glass**: Emergency admin access at `/dashboard/break-glass`

#### 5. Offline Support
- **Dexie.js** for IndexedDB storage (lib/db/schema.ts)
- **Serwist** for Service Worker and PWA (app/sw.ts)
- Sync strategy: Optimistic UI updates + background sync
- Read operations work offline using cached data

#### 6. Caching Strategy
- **Redis (Upstash)**: NetSuite data cache (1 hour TTL)
- **IndexedDB**: Offline case studies and master lists
- **Next.js Cache**: `unstable_cache` for server-side caching
- Cache invalidation via `revalidatePath` and `revalidateTag`

#### 7. NetSuite Integration
- Located in `lib/integrations/netsuite*.ts`
- OAuth 1.0a authentication (TBA - Token Based Authentication)
- Dual-source strategy: NetSuite + fallback to Prisma
- Customer search with autocomplete
- Industry and subsidiary data sync

#### 8. AI Features
- **Tag Suggestions**: `waAiSuggestionsActions.ts`
- **Auto Prompts**: Guided writing prompts (`waAutoPromptActions.ts`)
- **Text Enhancement**: Convert bullets to prose
- **Image Recognition**: Extract text from images (`lib/image-recognition.ts`)
- All AI features use OpenAI API (GPT-4)

## Naming Conventions (CRITICAL)

### waCamelCase Convention (MANDATORY)
All functions, methods, and utilities MUST use the `wa` prefix in camelCase:

**Correct**:
```typescript
function waCalculateSavings() { }
async function waFetchCaseStudies() { }
export async function waSuggestTags() { }
const waHandleSubmit = () => { }
```

**Incorrect**:
```typescript
function calculateSavings() { }  // Missing wa prefix
function waCalculate_savings() { } // Wrong case
```

### Exceptions (NO wa prefix)
1. **React Components**: PascalCase without prefix
   ```typescript
   export default function StepCostCalculator() { }
   ```
2. **Props/Types**: Standard naming
   ```typescript
   type Props = { formData: CaseStudyFormData }
   ```
3. **React Hooks**: Standard naming
   ```typescript
   const [isLoading, setIsLoading] = useState(false);
   ```

### File Naming
- **Server Actions**: `wa[ActionName]Actions.ts` (e.g., `waAiSuggestionsActions.ts`)
- **Components**: kebab-case (e.g., `step-cost-calculator.tsx`)
- **Utilities**: `wa[UtilityName].ts` (e.g., `waFormatters.ts`)

## Configuration Files

### Environment Variables
Copy `.env.example` to `.env.local` and configure:
- `POSTGRES_URL`: PostgreSQL connection string
- `NEXTAUTH_SECRET`: Generate with `openssl rand -base64 32`
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`: OAuth credentials
- `CLOUDINARY_URL`: Image storage
- `OPENAI_API_KEY`: AI features
- `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`: Cache
- `NETSUITE_*`: NetSuite integration credentials

### Port Configuration
The application runs on **port 3010** (not the default 3000). This is configured in:
- `package.json`: `--webpack -p 3010`
- `playwright.config.ts`: `baseURL: 'http://localhost:3010'`

## Testing Patterns

### E2E Test Helpers
Use the `waLoginAsAdmin()` helper for authenticated tests:
```typescript
import { waLoginAsAdmin } from './helpers';

test('should access admin panel', async ({ page }) => {
  await waLoginAsAdmin(page);
  await page.goto('/dashboard/admin');
  // test code...
});
```

### BRD Validation
E2E tests validate against Business Requirements Document (BRD):
- Tests reference BRD sections (e.g., "BRD 3.1: Challenge Qualifier")
- See `e2e/brd-validation.spec.ts` for examples

## Security Considerations

1. **Input Validation**: Always validate user input using Zod schemas
2. **SQL Injection**: Use Prisma parameterized queries (never raw SQL)
3. **XSS Prevention**: Next.js escapes by default; don't use `dangerouslySetInnerHTML`
4. **CSRF**: NextAuth handles CSRF tokens automatically
5. **Rate Limiting**: Middleware implements rate limiting via Upstash Redis
6. **Audit Logging**: All admin actions logged via `lib/immutable-audit-logger.ts`
7. **Data Retention**: GDPR compliance via `lib/data-retention.ts`

## Common Workflows

### Creating a New Server Action
1. Create file: `lib/actions/waMyNewActions.ts`
2. Add `'use server'` at top
3. Export functions with `wa` prefix
4. Return `{ success, error?, data? }` format
5. Add error handling and audit logging

### Adding a New Prisma Model
1. Add model to `prisma/schema.prisma` (use `Wa` prefix)
2. Run `npm run db:push` to update database
3. Update `lib/db/schema.ts` for offline support (if needed)
4. Create corresponding server actions in `lib/actions/`

### Adding a New Dashboard Page
1. Create route: `app/dashboard/my-page/page.tsx`
2. Add to navigation in `app/dashboard/layout.tsx`
3. Update middleware if auth is required
4. Create E2E test in `e2e/my-page.spec.ts`

## Troubleshooting

### Build Errors
- **"Prisma Client not generated"**: Run `npx prisma generate`
- **"Module not found: @/"**: Check `tsconfig.json` paths configuration
- **Webpack errors**: Ensure `--webpack` flag is in dev/build scripts

### Database Issues
- **Connection errors**: Verify `POSTGRES_URL` in `.env.local`
- **Migration conflicts**: Use `npm run db:push` for development
- **Seed failures**: Clear database and re-seed with `npm run db:seed`

### E2E Test Failures
- **Port conflicts**: Ensure port 3010 is free
- **Auth failures**: Check `DEV_ADMIN_EMAIL` and `DEV_ADMIN_PASSWORD_HASH` are set
- **Timeout errors**: Increase timeout in `playwright.config.ts`

### NetSuite Integration
- **401 Unauthorized**: Verify OAuth credentials in `.env.local`
- **Rate limiting**: Check Redis cache is configured
- **Data not syncing**: Review `lib/integrations/netsuite-sync.ts` logs

## Development Workflows

### Git Worktree Workflow (Parallel Development)

This project uses **git worktrees** for parallel development across multiple feature branches. See `WORKTREE_WORKFLOW.md` for full details.

**Quick Overview:**
```
WA/                                    # Git root
├── case-study-builder/                # Main working directory (main branch)
└── .worktrees/                        # Parallel development branches
    ├── security-fixes/
    ├── cost-calculator/
    ├── ai-enhancements/
    └── netsuite-integration/
```

**Common Commands:**
```bash
# List all worktrees
git worktree list

# Navigate to a worktree
cd .worktrees/feature-name/case-study-builder

# Check current branch
git branch --show-current

# Create new worktree
git worktree add .worktrees/new-feature -b feat/new-feature

# Remove completed worktree
git worktree remove .worktrees/feature-name
```

**Key Points:**
- Each worktree is an independent checkout of a different branch
- Run dev servers on different ports: `PORT=3001 npm run dev`
- Each worktree needs its own `.env.local` file
- Worktrees share the same database (use different schemas if needed)
- After merging to main, rebase other worktrees: `git fetch origin main && git rebase origin/main`

### CI/CD Pipeline (GitHub Actions)

The project has two GitHub workflows in `.github/workflows/`:

#### 1. CI/CD Pipeline (`ci.yml`)
Runs on: Push to `main` or `test/merge-all-features`, and on PRs to `main`

**Pipeline stages:**
1. **Test**: Lint, type check, unit tests, security audit, build
2. **SBOM**: Generate Software Bill of Materials (CycloneDX format)
3. **DAST**: OWASP ZAP security scan (PR only)
4. **Deploy**: Deploy to Vercel (main branch only)

**Artifacts generated:**
- SBOM reports (JSON + XML, 90-day retention)
- ZAP security report (30-day retention)

#### 2. Security Scanning (`security.yml`)
Runs on: Push/PR to `main`/`develop`, weekly schedule (Sunday midnight), manual trigger

**Scan types:**
1. **Dependency Scan**: npm audit for vulnerable dependencies
2. **SAST**: ESLint + TypeScript + CodeQL static analysis
3. **E2E Security Tests**: Playwright security test suite
4. **OWASP ZAP DAST**: Dynamic application security testing
5. **StackHawk DAST**: Optional (requires API key)

**Security report**: Aggregated summary posted as PR comment

### Case Study Workflow: Create, Edit, Draft, and Details Pages

**CRITICAL**: The case study workflow has **5 interconnected pages** that must stay in sync when adding/modifying fields:

```
┌─────────────────────────────────────────────────────────────────┐
│                    CaseStudyFormData Type                       │
│              (Single Source of Truth for Fields)                │
│                  app/dashboard/new/page.tsx                     │
└──────────────────────────┬──────────────────────────────────────┘
                           │
           ┌───────────────┼───────────────┬───────────────┐
           │               │               │               │
           ▼               ▼               ▼               ▼
    ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐
    │   CREATE   │  │    EDIT    │  │  DETAILS   │  │  LIBRARY   │
    │   /new     │  │/[id]/edit  │  │/cases/[id] │  │/library/   │
    └─────┬──────┘  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘
          │               │               │               │
          │               │               │               │
          └───────┬───────┴───────┬───────┴───────┬───────┘
                  │               │               │
                  ▼               ▼               ▼
          ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
          │ Shared Step  │ │   Database   │ │  NetSuite    │
          │ Components   │ │ WaCaseStudy  │ │ Integration  │
          │ (1-5, WPS,   │ │ WaWPS        │ │ (Customers)  │
          │  CostCalc)   │ │ WaCostCalc   │ │              │
          └──────────────┘ └──────────────┘ └──────────────┘
```

1. **Creation Page**: `/dashboard/new/page.tsx`
2. **Edit Page**: `/dashboard/cases/[id]/edit/page.tsx` + `components/edit-case-study-form.tsx`
3. **Draft Saving**: Shared between creation and edit (saves to `status: 'DRAFT'`)
4. **My Cases Detail**: `/dashboard/cases/[id]/page.tsx` (for CONTRIBUTOR/APPROVER/ADMIN)
5. **Library Detail**: `/dashboard/library/[id]/page.tsx` (public view, APPROVED cases only)

#### Single Source of Truth: `CaseStudyFormData` Type

**Location**: `app/dashboard/new/page.tsx` (lines 46-232)

This TypeScript interface defines ALL fields in the case study form. When adding a new field:

```typescript
export type CaseStudyFormData = {
  // Step 1: Case Type
  type: 'APPLICATION' | 'TECH' | 'STAR';

  // Step 2: Challenge Qualifier
  qualifierType?: 'NEW_CUSTOMER' | 'CROSS_SELL' | 'MAINTENANCE';
  isTarget: boolean;
  customerName: string;

  // Step 3: Basic Information
  industry: string;
  location: string;
  componentWorkpiece: string;
  workType: 'WORKSHOP' | 'ON_SITE' | 'BOTH';
  wearType: string[];

  // Step 4: Problem Description
  problemDescription: string;
  previousSolution: string;

  // Step 5: WA Solution
  waSolution: string;
  waProduct: string;
  technicalAdvantages: string;
  images: string[];
  supportingDocs: string[];

  // Optional: WPS (TECH & STAR only)
  wps?: { ... };

  // Optional: Cost Calculator (STAR only)
  costCalculator?: { ... };
};
```

#### Shared Step Components

Both creation and edit pages use the **SAME** step components:

- `components/case-study-form/step-one.tsx` - Case type selection
- `components/case-study-form/step-two.tsx` - Customer info + qualifier
- `components/case-study-form/step-three.tsx` - Basic information
- `components/case-study-form/step-four.tsx` - Problem description
- `components/case-study-form/step-five.tsx` - Solution + media
- `components/case-study-form/step-wps.tsx` - Welding Procedure (optional)
- `components/case-study-form/step-cost-calculator.tsx` - Cost calculator (optional)
- `components/case-study-form/challenge-qualifier.tsx` - Qualifier questions

**Key Point**: Changes to step components automatically affect both create and edit flows.

#### Step-by-Step Workflow

**User Journey:**
1. **Login** → Navigate to `/dashboard/new`
2. **Step 1**: Select case type (APPLICATION/TECH/STAR)
3. **Step 2 (Qualifier)**:
   - Search and select customer from NetSuite
   - Answer qualifier questions (NEW_CUSTOMER/CROSS_SELL/MAINTENANCE)
   - Determines if case counts toward BHAG goal
4. **Step 3 (Basic Info)**:
   - Customer details, industry, location
   - Component/workpiece information
   - Work type, wear types, dimensions
5. **Step 4 (Problem)**:
   - Problem description
   - Previous solution details
   - Competitor information
6. **Step 5 (Solution)**:
   - WA solution and products
   - Technical advantages
   - Expected service life
   - Revenue and cost savings
   - Upload images (Cloudinary)
   - Supporting documents
7. **Step 6: WPS** (TECH & STAR only):
   - Base metal information
   - Multiple layers with consumables, parameters, oscillation
   - Heating procedures (preheat, interpass, postheat)
   - PWHT (Post Weld Heat Treatment)
8. **Step 7: Cost Calculator** (STAR only):
   - Part lifecycle costs
   - Maintenance repair costs
   - ROI calculations
9. **Step 8: Finalize**:
   - Review all information
   - Submit or save draft

**Dynamic Steps**: Number of steps changes based on case type:
- **APPLICATION**: 6 steps (Type, Qualifier, Basic, Problem, Solution, Finalize)
- **TECH**: 7 steps (adds WPS)
- **STAR**: 8 steps (adds WPS + Cost Calculator)

#### Draft Saving Functionality

**Save Draft** button appears on steps 3-8 (hidden on step 1 & 2).

**Creation** (`app/dashboard/new/page.tsx:603-647`):
```typescript
const handleSaveDraft = async () => {
  // Creates case study with status: 'DRAFT'
  const result = await waCreateCaseStudy({ ...formData, status: 'DRAFT' });

  // Save WPS if TECH or STAR
  if (hasWPS && formData.wps && result.id) {
    await waSaveWeldingProcedure({ caseStudyId: result.id, ...formData.wps });
  }

  // Save Cost Calculator if STAR
  if (hasCostCalc && formData.costCalculator && result.id) {
    await waSaveCostCalculation(costCalcData);
  }
};
```

**Edit** (`components/edit-case-study-form.tsx:617-668`):
```typescript
const handleSaveDraft = async () => {
  // Updates existing case study, saves current step
  await waUpdateCaseStudy(caseStudy.id, {
    ...formData,
    status: 'DRAFT',
    lastEditedStep: currentStep, // Resume from this step later
  });

  // Update WPS and Cost Calculator separately
};
```

#### Edit Flow: Resume from Last Incomplete Step

When editing a DRAFT, the form automatically calculates which step to resume from:

**Resume Logic** (`components/edit-case-study-form.tsx:104-170`):
1. Check `lastEditedStep` if saved
2. Validate Step 2: Customer selected + qualifier completed?
3. Validate Step 3: Title, customer, industry, location, component filled?
4. Validate Step 4: Wear type and problem description filled?
5. Validate Step 5: Base metal, dimensions, solution, product, images (≥1)?
6. Validate Step 6 (TECH/STAR): WPS complete?
7. Return first incomplete step

#### Status Transitions

```
DRAFT ──────────────────────► SUBMITTED
  │                                │
  │                                ▼
  └─────────────────────► APPROVED / REJECTED
                                   │
                                   ▼
                               PUBLISHED
```

- **DRAFT**: Can be edited by owner
- **SUBMITTED**: Awaiting approval
- **APPROVED**: Approved by APPROVER
- **REJECTED**: Rejected with reason, can be re-edited
- **PUBLISHED**: Published by ADMIN

#### My Cases Details Page

**Location**: `/dashboard/cases/[id]/page.tsx`

**Purpose**: Private view for case contributors, approvers, and admins.

**Access Control**:
- Available for all statuses: DRAFT, SUBMITTED, APPROVED, REJECTED, PUBLISHED
- Shows edit button for DRAFT cases (owner only)
- Shows approval/rejection actions (APPROVER role)
- Shows admin actions (ADMIN role)

**Displays**:
- All case study fields from `WaCaseStudy` model
- WPS data from `WaWeldingProcedure` model (if exists)
- Cost Calculator data from `WaCostCalculator` model (if exists)
- Completion percentage and quality score
- Comments section (enhanced with replies)
- Tag colleagues functionality
- Translation toggle (original/translated view)
- PDF export, email, and sharing options

**Key Sections**:
- Header: title, location, country, status badge, type badge, quality badge
- Overview: customer, industry, work type, wear types with severity stars
- The Challenge: problem description, previous solution, competitor
- The Solution: WA solution, products, technical advantages, service life
- Financial: revenue, annual potential, customer savings (with currency)
- Media: images (Cloudinary), supporting documents
- WPS: Full welding procedure specification with multi-layer support (if TECH/STAR)
- Cost Calculator: ROI analysis with charts (if STAR)
- Comments: Threaded discussions
- Activity Feed: Recent changes and updates

#### Library Details Page

**Location**: `/dashboard/library/[id]/page.tsx`

**Purpose**: Public view for approved case studies accessible to all authenticated users.

**Access Control**:
- **Only shows APPROVED cases** (status check enforced)
- Returns 404 for non-approved or non-existent cases
- Available to all logged-in users

**Key Differences from My Cases Detail**:
- No edit button (read-only)
- No approval/rejection actions
- No comments section
- Simplified layout focused on content
- Emphasizes sharing and saving to personal library
- Save button to add to user's saved cases

**Translation Support**:
- Auto-translated content shown by default (if available)
- Toggle to view original language
- Language indicator badge with language name
- Query parameter: `?showOriginal=true` to view original

**Displays**:
- Case study title, customer, industry, location
- Type badge (APPLICATION/TECH/STAR)
- Translation status notice (if not English)
- The Challenge section
- The Solution section
- Financial metrics (if available)
- Images and media
- WPS data (if TECH/STAR)
- Cost Calculator (if STAR)
- Share and save buttons
- PDF export

**SEO/Metadata**:
```typescript
title: `${customerName} - ${industry} | Case Study Library`
description: `Industrial case study from ${industry} industry`
```

#### Adding a New Field: Complete Checklist

When adding a new field to the case study form, you MUST update ALL of these:

**1. TypeScript Type** (`app/dashboard/new/page.tsx`):
```typescript
export type CaseStudyFormData = {
  // Add your new field here
  newField: string;
};
```

**2. Initial State** (`app/dashboard/new/page.tsx:243-300`):
```typescript
const [formData, setFormData] = useState<CaseStudyFormData>({
  // Add default value
  newField: '',
});
```

**3. Step Component** (e.g., `components/case-study-form/step-three.tsx`):
```tsx
<Input
  value={formData.newField}
  onChange={(e) => updateFormData({ newField: e.target.value })}
/>
```

**4. Prisma Schema** (`prisma/schema.prisma`):
```prisma
model WaCaseStudy {
  newField String?
}
```
Then run: `npm run db:push`

**5. Server Actions** (`lib/actions/waCaseStudyActions.ts`):
- Update `waCreateCaseStudy()` to save the new field
- Update `waUpdateCaseStudy()` to update the new field

**6. Edit Form Initialization** (`components/edit-case-study-form.tsx:210-400`):
```typescript
const [formData, setFormData] = useState<CaseStudyFormData>({
  // Map from database to form
  newField: caseStudy.newField || '',
});
```

**7. Details Page Display** (`app/dashboard/cases/[id]/page.tsx`):
```tsx
{/* Add display for new field */}
<div>
  <Label>New Field</Label>
  <p>{caseStudy.newField}</p>
</div>
```

**8. Validation** (if required field):
- Add to `getMissingFields()` in `app/dashboard/new/page.tsx`
- Add to resume logic in `components/edit-case-study-form.tsx`

**9. E2E Tests** (`e2e/case-study-full-workflow.spec.ts`):
- Add test coverage for the new field

**10. PDF Export** (if needed):
- Update `lib/pdf-export-ppt.ts` to include new field

**11. Library Detail Page** (`/dashboard/library/[id]/page.tsx`):
- Add display for new field in public view (if applicable)

## NetSuite ERP Integration

### Overview

NetSuite integration provides real-time customer data for case study creation, including customer names, industries, locations, and contact information.

**Key Files**:
- `lib/integrations/netsuite.ts` - Core NetSuite client (OAuth 1.0a)
- `lib/integrations/netsuite-dual-source.ts` - Dual-source strategy (NetSuite or mock data)
- `lib/integrations/netsuite-sync.ts` - Synchronization utilities
- `lib/actions/waNetsuiteActions.ts` - Server actions for customer search
- `components/netsuite-customer-search.tsx` - Customer search modal component

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    NetSuite Integration                      │
└─────────────────────┬───────────────────────────────────────┘
                      │
      ┌───────────────┼───────────────┐
      │               │               │
      ▼               ▼               ▼
┌──────────┐   ┌──────────┐   ┌──────────┐
│ RESTlet  │   │  Redis   │   │IndexedDB │
│   API    │──►│  Cache   │──►│  Cache   │
│(NetSuite)│   │ (Upstash)│   │ (Browser)│
└──────────┘   └──────────┘   └──────────┘
      │               │               │
      └───────────────┼───────────────┘
                      │
                      ▼
              ┌──────────────┐
              │ Customer     │
              │ Search Modal │
              │ Component    │
              └──────────────┘
```

### Authentication: OAuth 1.0a (TBA)

NetSuite uses **Token-Based Authentication (TBA)** with OAuth 1.0a:

**Required Environment Variables**:
```bash
NETSUITE_ACCOUNT_ID="4129093"              # Welding Alloys account
NETSUITE_CONSUMER_KEY="..."                # From integration record
NETSUITE_CONSUMER_SECRET="..."             # From integration record
NETSUITE_TOKEN_ID="..."                    # From access token
NETSUITE_TOKEN_SECRET="..."                # From access token
NETSUITE_REST_URL="https://4129093.suitetalk.api.netsuite.com/services/rest"
NETSUITE_RESTLET_URL="https://4129093.restlets.api.netsuite.com/app/site/hosting/restlet.nl?script=123&deploy=1"
```

**OAuth Signature Generation** (`lib/integrations/netsuite.ts:39-93`):
1. Generate timestamp and nonce
2. Build parameter string (OAuth params + query params, sorted)
3. Create signature base string: `METHOD&BASE_URL&PARAMS`
4. Generate signing key: `consumerSecret&tokenSecret`
5. HMAC-SHA256 signature
6. Build Authorization header with realm (account ID)

**Security**:
- Input sanitization to prevent SQL injection
- Removes dangerous characters: `;`, `--`, `UNION`, `DROP`, `DELETE`, `INSERT`, `UPDATE`
- Escapes single quotes
- Length limit (100 chars) to prevent DoS

### Dual-Source Strategy

**Purpose**: Allow testing with mock data while NetSuite permissions are being configured.

**Configuration** (`NETSUITE_DATA_SOURCE` env var):
- `netsuite`: Use real NetSuite API
- `mock`: Use Prisma mock database (`WaMockCustomer` model)
- `auto`: Auto-detect (default - uses mock if available, NetSuite otherwise)

**Auto-Detection Logic**:
1. Check if NetSuite credentials are configured
2. Check if mock data exists in database
3. Default to mock for safety during testing
4. Fallback to mock if NetSuite API fails

### Caching Strategy (3-Tier)

#### Tier 1: Browser Cache (IndexedDB)
- **Location**: Client-side browser storage
- **Duration**: Persistent across sessions
- **Size**: No practical limit
- **Purpose**: Instant search without network requests
- **Key**: `netsuite:customers:all`

#### Tier 2: Server Cache (Redis/Upstash)
- **Location**: Upstash Redis cloud
- **Duration**: 1 week (604,800 seconds)
- **Size**: Chunked storage to handle 10MB Upstash limit
- **Purpose**: Reduce NetSuite API calls (expensive, slow)
- **Chunking**: Splits large datasets into ~5MB chunks

#### Tier 3: NetSuite API (RESTlet)
- **Fetch Time**: ~35 seconds for all customers
- **Frequency**: Only when cache is empty or expired
- **Timeout**: 120 seconds
- **Endpoint**: Custom RESTlet script (`?waType=customer`)

**Fetch Flow**:
```
1. Check IndexedDB (browser)
     ├─ Hit  → Filter client-side, return results
     └─ Miss → 2. Check Redis (server)
                   ├─ Hit  → Store in IndexedDB, filter, return
                   └─ Miss → 3. Fetch from NetSuite RESTlet
                                 └─ Cache in Redis (chunked)
                                 └─ Cache in IndexedDB
                                 └─ Filter and return
```

### Customer Search Component

**Location**: `components/netsuite-customer-search.tsx`

**Features**:
- Modal dialog with search input
- Debounced search (500ms delay)
- Displays customer with:
  - Company name
  - Entity ID (customer UID)
  - City, country
  - Industry/category
  - Case study count (if available)
  - Recent case studies
- Click to select customer
- Auto-fills customer name and industry in form

**Props**:
```typescript
type Props = {
  value: string;                                  // Current customer name
  onChange: (value: string) => void;             // Update customer name
  onCustomerSelect?: (customer: NetSuiteCustomer) => void;  // Customer selected
  label?: string;                                // Field label
  required?: boolean;                            // Required field
  placeholder?: string;                          // Placeholder text
  className?: string;                            // Additional CSS classes
};
```

**Usage in Forms**:
```tsx
<NetSuiteCustomerSearch
  value={formData.customerName}
  onChange={(value) => updateFormData({ customerName: value })}
  onCustomerSelect={(customer) => {
    updateFormData({
      customerName: customer.companyName,
      industry: customer.industry || '',
      location: customer.city || '',
      country: customer.country || '',
      customerSelected: true,  // Mark as selected (required for validation)
    });
  }}
  required
/>
```

### NetSuite Data Structure

**Customer Object**:
```typescript
interface NetSuiteCustomer {
  id: string;           // Numeric internal ID
  internalId: string;   // Same as id
  entityId: string;     // Customer UID (e.g., "E9008y", "CUST-001")
  companyName: string;  // Company name
  displayName: string;  // "CompanyName (EntityId)"
  address: string;      // Full address
  city: string;         // City
  country: string;      // Country code
  industry: string;     // Industry/category
}
```

**Cached Data** (optimized, essential fields only):
```typescript
{
  internalid: string;
  entityid: string;
  companyname: string;
  email: string;
  phone: string;
  billcity: string;
  billcountrycode: string;
  category: string;      // Industry
  address: string;
}
```

### Troubleshooting NetSuite Integration

**Common Issues**:

1. **401 Unauthorized**:
   - Check OAuth credentials in `.env.local`
   - Verify token hasn't expired
   - Check integration record is enabled in NetSuite

2. **Empty Search Results**:
   - Check if customer data is in NetSuite
   - Verify RESTlet script is deployed and accessible
   - Check Redis cache isn't storing empty array

3. **Slow Search (>5 seconds)**:
   - IndexedDB cache might be empty
   - Redis cache might be expired
   - NetSuite API fetch takes ~35 seconds on first load

4. **"NetSuite credentials not configured" error**:
   - Ensure all 5 required env vars are set
   - Check `NETSUITE_RESTLET_URL` format is correct

5. **Customer selection not working**:
   - Ensure `customerSelected: true` is set on selection
   - Check `onCustomerSelect` callback is defined
   - Verify qualifier step validation checks `customerSelected` field

**Debugging**:
```bash
# Check NetSuite configuration status
curl http://localhost:3010/api/admin/netsuite/check-config

# Test NetSuite connection
curl http://localhost:3010/api/admin/netsuite/test
```

**Monitoring**:
- Check console logs for `[NetSuite]` prefix
- Monitor Redis cache hits/misses
- Track API response times in browser DevTools

### Branch Strategy

```
main ─────────────────────────────────► Production (auto-deploy to Vercel)
  │
  ├── feat/security-fixes ──► Critical security patches
  ├── feat/cost-calculator ─► BRD compliance features
  ├── feat/ai-enhancements ─► AI/ML features
  └── feat/netsuite-integration ─► ERP integrations
```

**Dependency order:**
1. `security-fixes` must merge first (blocks schema changes)
2. `cost-calculator` depends on schema from security-fixes
3. Other features can be developed in parallel

### Pull Request Workflow

1. **Create PR** from feature branch to `main`
2. **Automated checks** run:
   - Linting and type checking
   - Unit tests
   - Build verification
   - Security scans (dependency audit, SAST, DAST)
   - SBOM generation
3. **Review** by team members
4. **Merge** to main (triggers deployment)
5. **Cleanup** worktree after merge

### Local Development Workflow

```bash
# 1. Start database (if local)
# Ensure PostgreSQL is running

# 2. Setup environment
cp .env.example .env.local
# Edit .env.local with your credentials

# 3. Initialize database
npm run db:push
npm run db:seed

# 4. Start dev server
npm run dev

# 5. Make changes and test
npm run test        # Unit tests
npm run test:e2e    # E2E tests
npm run lint        # Linting

# 6. Commit changes
git add .
git commit -m "feat: Add new feature

- Description of changes
- Any breaking changes
- Related issue numbers

🤖 Generated with [Claude Code](https://claude.com/claude-code)"

# 7. Push and create PR
git push -u origin feat/my-feature
# Create PR via GitHub UI
```

## Important Notes

- **ALWAYS** follow the `wa` naming convention for new code
- **NEVER** commit `.env.local` or sensitive credentials
- **ALWAYS** write tests for new features (unit + E2E)
- **ALWAYS** run `npm run lint` before committing
- **VERIFY** database changes with `npm run db:studio`
- **TEST** offline functionality when modifying server actions
- **DOCUMENT** BRD references in test descriptions
- **USE** git worktrees for parallel feature development
- **CHECK** CI/CD pipeline passes before merging PRs
- **REVIEW** security scan results in GitHub Actions
- **🚨 CRITICAL**: When adding/modifying case study fields, update ALL 5 pages: create, edit, my cases detail, library detail, and PDF export. Use the "Adding a New Field" checklist above.
- **REMEMBER**: Create and edit flows share the same step components - changes affect both flows automatically
- **NetSuite**: Customer search uses 3-tier caching (IndexedDB → Redis → NetSuite API) - first fetch takes ~35 seconds, subsequent searches are instant
- **Library Access**: Only APPROVED cases are visible in `/dashboard/library/[id]` - enforce status check
