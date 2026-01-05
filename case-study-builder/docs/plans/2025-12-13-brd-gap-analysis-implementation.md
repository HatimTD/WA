# BRD v3.2 Gap Analysis & Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Close all gaps between BRD v3.2 requirements and current implementation

**Architecture:** TDD approach, implement missing features in priority order (P0 = Critical, P1 = High, P2 = Medium, P3 = Low)

**Tech Stack:** Next.js 14, TypeScript, Prisma, PostgreSQL, OpenAI API, NextAuth.js

---

## EXECUTIVE GAP SUMMARY

### BRD vs Implementation Status

| BRD Section | Requirement | Status | Priority |
|-------------|-------------|--------|----------|
| **3.1** | Challenge Qualifier Logic | NOT IMPLEMENTED | P0 |
| **3.2** | Flag System (WPS/Cost/App) | NOT IMPLEMENTED | P0 |
| **3.2** | Auto-flagging | NOT IMPLEMENTED | P1 |
| **3.3** | is_target field | NOT IMPLEMENTED | P0 |
| **3.4A** | Offline Mode/PWA | IMPLEMENTED | - |
| **3.4B** | Speech-to-Text | IMPLEMENTED | - |
| **3.4B** | AI Drafting from Bullets | PARTIAL | P2 |
| **3.4B** | AI Auto-Tagging | IMPLEMENTED | - |
| **3.4B** | AI Auto-Prompting | NOT IMPLEMENTED | P1 |
| **3.4C** | Translation + Badge | IMPLEMENTED | - |
| **3.4D** | CRM (Insightly) | WRONG CRM (NetSuite) | P2 |
| **3.4E** | SSO (Okta + Google) | PARTIAL (Google only) | P2 |
| **3.4F** | PDF Watermark | IMPLEMENTED | - |
| **3.5** | BHAG Dashboard | IMPLEMENTED | - |
| **3.5** | Gamification | IMPLEMENTED | - |
| **3.5** | Case Comparison | IMPLEMENTED | - |
| **3.5** | Social Features | PARTIAL | P2 |
| **6.2** | Customer Name Obfuscation | NOT IMPLEMENTED | P0 |
| **6.2** | PDF Obfuscation | NOT IMPLEMENTED | P1 |

---

## DETAILED GAP ANALYSIS

### GAP 1: Challenge Qualifier Logic (BRD 3.1) - P0 CRITICAL

**BRD Requirement:**
```
Workflow:
1. User Selects Customer
2. Question 1: "Has customer bought anything in last 3 years?"
   - NO → New Industrial Challenge (Target: Counted)
   - YES → Question 2
3. Question 2: "Has customer bought THIS specific product before?"
   - NO → Cross-Sell Challenge (Target: Counted)
   - YES → Maintenance Update (Target: NOT Counted)
```

**Current State:** Not implemented. Form starts directly with case type selection.

**Impact:** Cannot track progress toward 10,000 target. Data integrity compromised.

---

### GAP 2: Flag System (BRD 3.2) - P0 CRITICAL

**BRD Requirement:**
- Flag 1: Application Case Study (Base) - General + Problem/Solution filled
- Flag 2: Tech Case Study - WPS Details filled
- Flag 3: Star Case Study - Cost Calculator filled
- Complete Profile = All 3 flags

**Current State:** Only `CaseType` enum exists (APPLICATION/TECH/STAR). No flag fields. No auto-flagging.

**Missing Fields in Schema:**
- `hasApplicationFlag: Boolean`
- `hasWpsFlag: Boolean`
- `hasCostFlag: Boolean`
- `isTarget: Boolean` (for counter logic)
- `qualifierType: QualifierType` (NEW_CUSTOMER/CROSS_SELL/MAINTENANCE)

---

### GAP 3: Customer Data Obfuscation (BRD 6.2) - P0 CRITICAL

**BRD Requirement:**
```
Privileged Users (Full Visibility):
- Creator of the ICA
- Approvers/Managers in workflow
- System Administrators

Restricted Users (Obfuscated View):
- All other viewers see: "Customer: Confidential - Energy Sector"
```

**Current State:** All users see full customer data. No obfuscation logic.

---

### GAP 4: AI Auto-Prompting (BRD 3.4B) - P1 HIGH

**BRD Requirement:** "Automatically prompt users for missing details based on selected Tier"

**Current State:** Completion indicator shows % but no active prompting.

---

### GAP 5: PDF Obfuscation (BRD 6.2) - P1 HIGH

**BRD Requirement:** "Any PDF exported by a restricted user must have these fields automatically masked"

**Current State:** PDF watermark exists but no field masking for restricted users.

---

### GAP 6: Okta SSO (BRD 3.4E) - P2 MEDIUM

**BRD Requirement:** "Integration with Okta (via Auth0 or direct) and/or Google Workspace"

**Current State:** Only Google OAuth implemented. No Okta.

---

### GAP 7: Insightly CRM (BRD 3.4D) - P2 MEDIUM

**BRD Requirement:** CRM Integration with Insightly

**Current State:** NetSuite implemented instead. BRD explicitly says "No integration with ERP systems (NetSuite)" in Out of Scope (3.6).

**Note:** This may be intentional deviation. Clarify with stakeholders.

---

### GAP 8: AI Drafting from Bullets (BRD 3.4B) - P2 MEDIUM

**BRD Requirement:** "System takes bullet points or voice notes and generates professional text"

**Current State:** General text improvement via AI exists, but not structured bullet-to-prose conversion.

---

### GAP 9: Enhanced Social Features (BRD 3.5) - P2 MEDIUM

**BRD Requirement:** "Sharing success stories internally via WhatsApp/Email links"

**Current State:** Email sharing exists. Tag colleagues exists. No WhatsApp/deep link sharing.

---

## IMPLEMENTATION TASKS

---

### Task 1: Add Qualifier Fields to Schema

**Files:**
- Modify: `prisma/schema.prisma`

**Step 1: Add enum and fields to schema**

```prisma
// Add after existing enums
enum QualifierType {
  NEW_CUSTOMER      // No purchase in 3 years
  CROSS_SELL        // Existing customer, new product
  MAINTENANCE       // Existing customer, existing product (NOT counted)
}

// Add to CaseStudy model
model CaseStudy {
  // ... existing fields ...

  // Challenge Qualifier (BRD 3.1)
  qualifierType       QualifierType?
  isTarget            Boolean       @default(false)  // Counts toward 10K goal
  customerLastPurchase DateTime?                      // For 3-year check

  // Flag System (BRD 3.2)
  hasApplicationFlag  Boolean       @default(false)
  hasWpsFlag          Boolean       @default(false)
  hasCostFlag         Boolean       @default(false)
}
```

**Step 2: Run Prisma migration**

```bash
npx prisma db push
npx prisma generate
```

**Step 3: Commit**

```bash
git add prisma/schema.prisma
git commit -m "feat: add qualifier and flag fields to schema (BRD 3.1, 3.2)"
```

---

### Task 2: Create Challenge Qualifier Component

**Files:**
- Create: `components/case-study-form/challenge-qualifier.tsx`
- Modify: `app/dashboard/new/page.tsx`

**Step 1: Create the qualifier component**

```tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

type QualifierResult = {
  qualifierType: 'NEW_CUSTOMER' | 'CROSS_SELL' | 'MAINTENANCE';
  isTarget: boolean;
  message: string;
};

type Props = {
  customerName: string;
  onComplete: (result: QualifierResult) => void;
};

export default function ChallengeQualifier({ customerName, onComplete }: Props) {
  const [step, setStep] = useState<1 | 2 | 'complete'>(1);
  const [result, setResult] = useState<QualifierResult | null>(null);

  const handleQuestion1 = (purchasedInLast3Years: boolean) => {
    if (!purchasedInLast3Years) {
      // New customer - counts toward target
      const res: QualifierResult = {
        qualifierType: 'NEW_CUSTOMER',
        isTarget: true,
        message: 'New Industrial Challenge - This will count toward the 10,000 target!'
      };
      setResult(res);
      setStep('complete');
      onComplete(res);
    } else {
      setStep(2);
    }
  };

  const handleQuestion2 = (boughtThisProductBefore: boolean) => {
    if (!boughtThisProductBefore) {
      // Cross-sell - counts toward target
      const res: QualifierResult = {
        qualifierType: 'CROSS_SELL',
        isTarget: true,
        message: 'Cross-Sell Challenge - This will count toward the 10,000 target!'
      };
      setResult(res);
      setStep('complete');
      onComplete(res);
    } else {
      // Maintenance - does NOT count
      const res: QualifierResult = {
        qualifierType: 'MAINTENANCE',
        isTarget: false,
        message: 'Knowledge Base Update - This is valuable but will not increment the strategic counter.'
      };
      setResult(res);
      setStep('complete');
      onComplete(res);
    }
  };

  if (step === 'complete' && result) {
    return (
      <Card className={result.isTarget ? 'border-green-500 bg-green-50 dark:bg-green-950' : 'border-gray-300'}>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            {result.isTarget ? (
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            ) : (
              <AlertCircle className="h-8 w-8 text-gray-500" />
            )}
            <div>
              <p className="font-semibold text-lg">
                {result.isTarget ? 'Challenge Accepted!' : 'Knowledge Update'}
              </p>
              <p className="text-sm text-muted-foreground">{result.message}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Challenge Qualifier</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {step === 1 && (
          <div className="space-y-4">
            <p className="text-lg font-medium">
              Has <strong>{customerName || 'this customer'}</strong> purchased anything from Welding Alloys in the last 3 years?
            </p>
            <div className="flex gap-4">
              <Button
                size="lg"
                variant="outline"
                className="flex-1 h-16 text-lg"
                onClick={() => handleQuestion1(false)}
              >
                <XCircle className="mr-2 h-5 w-5" />
                NO - New Customer
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="flex-1 h-16 text-lg"
                onClick={() => handleQuestion1(true)}
              >
                <CheckCircle2 className="mr-2 h-5 w-5" />
                YES - Existing Customer
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <p className="text-lg font-medium">
              Has <strong>{customerName || 'this customer'}</strong> purchased <strong>this specific product or solution</strong> from WA before?
            </p>
            <div className="flex gap-4">
              <Button
                size="lg"
                variant="outline"
                className="flex-1 h-16 text-lg border-green-500 hover:bg-green-50"
                onClick={() => handleQuestion2(false)}
              >
                <XCircle className="mr-2 h-5 w-5" />
                NO - Cross-Sell Opportunity
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="flex-1 h-16 text-lg"
                onClick={() => handleQuestion2(true)}
              >
                <CheckCircle2 className="mr-2 h-5 w-5" />
                YES - Existing Solution
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

**Step 2: Commit**

```bash
git add components/case-study-form/challenge-qualifier.tsx
git commit -m "feat: add Challenge Qualifier component (BRD 3.1)"
```

---

### Task 3: Create Auto-Flag Calculation Utility

**Files:**
- Create: `lib/utils/flag-calculator.ts`

**Step 1: Create utility**

```typescript
/**
 * Flag Calculator Utility
 * Implements BRD 3.2 - Case Study Tiers (Flags Logic)
 */

import { CaseStudy, WeldingProcedure } from '@prisma/client';

type CaseStudyWithWps = CaseStudy & {
  weldingProcedure?: WeldingProcedure | null;
};

/**
 * Check if Application Case Study flag should be set
 * Requires: General Information + Problem & Solution sections filled
 */
export function calculateApplicationFlag(caseStudy: CaseStudyWithWps): boolean {
  const requiredFields = [
    caseStudy.customerName,
    caseStudy.location,
    caseStudy.industry,
    caseStudy.componentWorkpiece,
    caseStudy.workType,
    caseStudy.wearType?.length > 0,
    caseStudy.problemDescription,
    caseStudy.previousSolution,
    caseStudy.baseMetal,
    caseStudy.waSolution,
    caseStudy.technicalAdvantages,
    caseStudy.solutionValueRevenue,
    caseStudy.annualPotentialRevenue,
    caseStudy.customerSavingsAmount,
    caseStudy.images?.length > 0, // Min 1 photo required
  ];

  return requiredFields.every(Boolean);
}

/**
 * Check if Tech Case Study flag should be set
 * Requires: All WPS Details filled
 */
export function calculateWpsFlag(caseStudy: CaseStudyWithWps): boolean {
  const wps = caseStudy.weldingProcedure;
  if (!wps) return false;

  const requiredWpsFields = [
    wps.baseMetalType,
    wps.surfacePreparation,
    wps.weldingProcess,
    wps.weldingPosition,
    wps.preheatTemperature || wps.interpassTemperature, // Temperature management
    wps.shieldingGas,
    wps.oscillationWidth || wps.oscillationFrequency, // Oscillation details
  ];

  return requiredWpsFields.every(Boolean);
}

/**
 * Check if Star Case Study flag should be set
 * Requires: All Cost Calculator fields filled
 */
export function calculateCostFlag(caseStudy: CaseStudyWithWps): boolean {
  const requiredCostFields = [
    caseStudy.costOfPart,
    caseStudy.oldSolutionLifetimeDays,
    caseStudy.waSolutionLifetimeDays,
    caseStudy.partsUsedPerYear,
    caseStudy.maintenanceRepairCostBefore,
    caseStudy.disassemblyCostBefore,
  ];

  return requiredCostFields.every(Boolean);
}

/**
 * Calculate all flags for a case study
 */
export function calculateAllFlags(caseStudy: CaseStudyWithWps) {
  return {
    hasApplicationFlag: calculateApplicationFlag(caseStudy),
    hasWpsFlag: calculateWpsFlag(caseStudy),
    hasCostFlag: calculateCostFlag(caseStudy),
  };
}

/**
 * Get case study tier based on flags
 */
export function getCaseStudyTier(flags: ReturnType<typeof calculateAllFlags>) {
  if (flags.hasCostFlag && flags.hasWpsFlag && flags.hasApplicationFlag) {
    return 'COMPLETE'; // All 3 flags
  }
  if (flags.hasCostFlag) return 'STAR';
  if (flags.hasWpsFlag) return 'TECH';
  if (flags.hasApplicationFlag) return 'APPLICATION';
  return 'INCOMPLETE';
}
```

**Step 2: Commit**

```bash
git add lib/utils/flag-calculator.ts
git commit -m "feat: add auto-flag calculation utility (BRD 3.2)"
```

---

### Task 4: Create Customer Data Obfuscation Utility

**Files:**
- Create: `lib/utils/data-obfuscation.ts`
- Modify: `lib/actions/case-study-actions.ts`

**Step 1: Create obfuscation utility**

```typescript
/**
 * Customer Data Obfuscation Utility
 * Implements BRD 6.2 - Privacy & Data Security
 */

import { CaseStudy, User, Role } from '@prisma/client';

type CaseStudyWithUser = CaseStudy & {
  contributor?: User | null;
  approver?: User | null;
};

/**
 * Check if user has privileged access to view full customer data
 * Privileged users:
 * - Creator of the ICA
 * - Approvers/Managers in the workflow
 * - System Administrators
 */
export function hasPrivilegedAccess(
  caseStudy: CaseStudyWithUser,
  currentUserId: string,
  currentUserRole: Role
): boolean {
  // System Administrators always have access
  if (currentUserRole === 'ADMIN') return true;

  // Approvers/Managers have access
  if (currentUserRole === 'APPROVER') return true;

  // Creator has access
  if (caseStudy.contributorId === currentUserId) return true;

  // Approver of this specific case has access
  if (caseStudy.approverId === currentUserId) return true;

  return false;
}

/**
 * Obfuscate customer name for restricted users
 * Returns: "Confidential - [Industry Sector]"
 */
export function obfuscateCustomerName(
  caseStudy: CaseStudyWithUser,
  isPrivileged: boolean
): string {
  if (isPrivileged) return caseStudy.customerName;

  const industry = caseStudy.industry || 'Industrial';
  return `Confidential - ${industry} Sector`;
}

/**
 * Obfuscate location for restricted users
 */
export function obfuscateLocation(
  caseStudy: CaseStudyWithUser,
  isPrivileged: boolean
): string {
  if (isPrivileged) return caseStudy.location;

  // Only show country/region, not specific plant
  const country = caseStudy.country || 'Global';
  return country;
}

/**
 * Apply all obfuscation rules to a case study
 */
export function obfuscateCaseStudy<T extends CaseStudyWithUser>(
  caseStudy: T,
  currentUserId: string,
  currentUserRole: Role
): T {
  const isPrivileged = hasPrivilegedAccess(caseStudy, currentUserId, currentUserRole);

  if (isPrivileged) return caseStudy;

  return {
    ...caseStudy,
    customerName: obfuscateCustomerName(caseStudy, false),
    location: obfuscateLocation(caseStudy, false),
    // Add any other PII fields that need obfuscation
    contactName: null,
    contactEmail: null,
    contactPhone: null,
  };
}

/**
 * Obfuscate array of case studies
 */
export function obfuscateCaseStudies<T extends CaseStudyWithUser>(
  caseStudies: T[],
  currentUserId: string,
  currentUserRole: Role
): T[] {
  return caseStudies.map(cs => obfuscateCaseStudy(cs, currentUserId, currentUserRole));
}
```

**Step 2: Commit**

```bash
git add lib/utils/data-obfuscation.ts
git commit -m "feat: add customer data obfuscation utility (BRD 6.2)"
```

---

### Task 5: Create AI Auto-Prompting Component

**Files:**
- Create: `components/ai-auto-prompt.tsx`
- Create: `lib/actions/auto-prompt-actions.ts`

**Step 1: Create server action**

```typescript
'use server';

import OpenAI from 'openai';
import { CaseStudy } from '@prisma/client';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

type MissingField = {
  field: string;
  label: string;
  prompt: string;
  priority: 'required' | 'recommended';
};

/**
 * Analyze case study and generate prompts for missing fields
 * Implements BRD 3.4B - Auto-Prompting
 */
export async function generateAutoPrompts(
  caseStudy: Partial<CaseStudy>,
  targetTier: 'APPLICATION' | 'TECH' | 'STAR'
): Promise<MissingField[]> {
  const missingFields: MissingField[] = [];

  // Application tier required fields
  const applicationFields = [
    { field: 'customerName', label: 'Customer Name', priority: 'required' as const },
    { field: 'location', label: 'Location', priority: 'required' as const },
    { field: 'industry', label: 'Industry', priority: 'required' as const },
    { field: 'componentWorkpiece', label: 'Component/Workpiece', priority: 'required' as const },
    { field: 'problemDescription', label: 'Problem Description', priority: 'required' as const },
    { field: 'waSolution', label: 'WA Solution', priority: 'required' as const },
  ];

  // Check missing application fields
  for (const f of applicationFields) {
    if (!caseStudy[f.field as keyof CaseStudy]) {
      const prompt = await generateFieldPrompt(f.label, caseStudy);
      missingFields.push({ ...f, prompt });
    }
  }

  // Tech tier fields (if targeting TECH or STAR)
  if (targetTier === 'TECH' || targetTier === 'STAR') {
    // Add WPS field checks
  }

  // Star tier fields (if targeting STAR)
  if (targetTier === 'STAR') {
    // Add Cost Calculator field checks
  }

  return missingFields;
}

async function generateFieldPrompt(fieldLabel: string, context: Partial<CaseStudy>): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 100,
      messages: [{
        role: 'system',
        content: 'Generate a helpful, specific prompt to guide the user in filling out a case study field. Keep it under 2 sentences.'
      }, {
        role: 'user',
        content: `Field: ${fieldLabel}
Context: Industry=${context.industry || 'unknown'}, Component=${context.componentWorkpiece || 'unknown'}
Generate a prompt asking for this information.`
      }]
    });

    return response.choices[0]?.message?.content || `Please provide the ${fieldLabel}`;
  } catch {
    return `Please provide the ${fieldLabel}`;
  }
}
```

**Step 2: Create component**

```tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lightbulb, ChevronRight } from 'lucide-react';
import { generateAutoPrompts } from '@/lib/actions/auto-prompt-actions';

type Props = {
  caseStudy: any;
  targetTier: 'APPLICATION' | 'TECH' | 'STAR';
  onFieldFocus: (fieldName: string) => void;
};

export default function AIAutoPrompt({ caseStudy, targetTier, onFieldFocus }: Props) {
  const [prompts, setPrompts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchPrompts() {
      setLoading(true);
      const result = await generateAutoPrompts(caseStudy, targetTier);
      setPrompts(result.slice(0, 3)); // Show top 3 missing
      setLoading(false);
    }
    fetchPrompts();
  }, [caseStudy, targetTier]);

  if (loading || prompts.length === 0) return null;

  return (
    <Card className="border-amber-300 bg-amber-50 dark:bg-amber-950/20">
      <CardContent className="pt-4">
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb className="h-5 w-5 text-amber-600" />
          <span className="font-medium text-amber-800 dark:text-amber-200">
            Missing fields for {targetTier} tier:
          </span>
        </div>
        <div className="space-y-2">
          {prompts.map((p, i) => (
            <Button
              key={i}
              variant="ghost"
              className="w-full justify-between text-left h-auto py-2"
              onClick={() => onFieldFocus(p.field)}
            >
              <span className="text-sm">{p.prompt}</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
```

**Step 3: Commit**

```bash
git add lib/actions/auto-prompt-actions.ts components/ai-auto-prompt.tsx
git commit -m "feat: add AI auto-prompting for missing fields (BRD 3.4B)"
```

---

### Task 6: Update PDF Export with Obfuscation

**Files:**
- Modify: `lib/pdf-export.ts`

**Step 1: Add obfuscation parameter**

```typescript
// Add to existing pdf-export.ts

import { hasPrivilegedAccess, obfuscateCustomerName, obfuscateLocation } from './utils/data-obfuscation';

export async function generateCaseStudyPDF(
  caseStudy: CaseStudyWithRelations,
  user: { id: string; name: string; role: Role },
  options?: { obfuscate?: boolean }
) {
  const isPrivileged = hasPrivilegedAccess(caseStudy, user.id, user.role);
  const shouldObfuscate = options?.obfuscate ?? !isPrivileged;

  // Use obfuscated values if not privileged
  const displayCustomerName = shouldObfuscate
    ? obfuscateCustomerName(caseStudy, false)
    : caseStudy.customerName;

  const displayLocation = shouldObfuscate
    ? obfuscateLocation(caseStudy, false)
    : caseStudy.location;

  // ... rest of PDF generation using displayCustomerName and displayLocation
}
```

**Step 2: Commit**

```bash
git add lib/pdf-export.ts
git commit -m "feat: add customer data obfuscation to PDF export (BRD 6.2)"
```

---

## REMAINING TASKS (Lower Priority)

### Task 7: AI Bullet-to-Prose Drafting (P2)
- Create `components/bullet-to-prose.tsx`
- Add OpenAI prompt to convert bullets to professional text

### Task 8: Okta SSO Integration (P2)
- Add `@auth/okta-adapter` package
- Configure Okta provider in `auth.ts`
- Update environment variables

### Task 9: WhatsApp Share Links (P2)
- Create `components/share-buttons.tsx` with WhatsApp deep links
- Format: `https://wa.me/?text={encodedUrl}`

### Task 10: Insightly CRM Integration (P2 - Needs Clarification)
- **Note:** BRD says Insightly but NetSuite is implemented
- Clarify with stakeholders before implementing

---

## TESTING CHECKLIST

- [ ] Challenge Qualifier shows correct questions
- [ ] isTarget field correctly set based on qualifier answers
- [ ] Flags auto-calculate based on field completion
- [ ] Restricted users see obfuscated customer names
- [ ] PDF export shows obfuscated data for restricted users
- [ ] AI auto-prompts appear for missing required fields
- [ ] BHAG counter only counts isTarget=true cases

---

## VERIFICATION COMMANDS

```bash
# Run all tests
npm run test

# Type check
npx tsc --noEmit

# Build
npm run build

# E2E tests
npx playwright test
```

---

## COMMIT HISTORY (Expected)

1. `feat: add qualifier and flag fields to schema (BRD 3.1, 3.2)`
2. `feat: add Challenge Qualifier component (BRD 3.1)`
3. `feat: add auto-flag calculation utility (BRD 3.2)`
4. `feat: add customer data obfuscation utility (BRD 6.2)`
5. `feat: add AI auto-prompting for missing fields (BRD 3.4B)`
6. `feat: add customer data obfuscation to PDF export (BRD 6.2)`
7. `test: add tests for qualifier, flags, and obfuscation`
