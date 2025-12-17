# waCamelCase Naming Convention Refactor Design

## Overview

Implement the BRD-mandated `waCamelCase` naming convention across the codebase while respecting Next.js framework constraints.

## Current State

- **271 total TypeScript files**
- **197 tests passing** (baseline)
- Current convention: `kebab-case` files, standard `camelCase` functions/variables

## Critical Constraints

### Files That CANNOT Be Renamed (Next.js Requirements)

Next.js App Router requires specific file names for routing to work:

| File Type | Purpose | Count |
|-----------|---------|-------|
| `page.tsx` | Route pages | ~40 |
| `layout.tsx` | Layouts | ~5 |
| `route.ts` | API routes | ~30 |
| `loading.tsx` | Loading states | ~5 |
| `error.tsx` | Error boundaries | ~2 |
| `not-found.tsx` | 404 pages | ~2 |

**Total: ~79 files MUST keep their names**

### Files That CAN Be Renamed

| Directory | Count | Action |
|-----------|-------|--------|
| `/components/` | 90 | Rename to `waCamelCase.tsx` |
| `/lib/actions/` | 15 | Rename to `waCamelCase.ts` |
| `/lib/utils/` | 12 | Rename to `waCamelCase.ts` |
| `/lib/integrations/` | 5 | Rename to `waCamelCase.ts` |
| `/lib/` (root files) | 20 | Rename to `waCamelCase.ts` |

**Total: ~142 files CAN be renamed**

## Naming Convention Rules

### File Names
- `kebab-case.tsx` → `waCamelCase.tsx`
- Example: `crm-customer-search.tsx` → `waCrmCustomerSearch.tsx`

### Function Names
- `functionName` → `waFunctionName`
- Example: `createCaseStudy` → `waCreateCaseStudy`

### Exported Components
- `ComponentName` → `WaComponentName`
- Example: `CRMCustomerSearch` → `WaCrmCustomerSearch`

### Variables (Local)
- Keep standard `camelCase` for local variables (readability)
- Only prefix exported constants: `MY_CONSTANT` → `WA_MY_CONSTANT`

### Exceptions (No Prefix)
- React hooks: `useState`, `useEffect` (external)
- Third-party imports
- Next.js special files
- Type definitions (keep standard TypeScript conventions)

## Implementation Phases

### Phase 1: Components (High Impact, 90 files)
1. Rename all files in `/components/`
2. Update all imports across the codebase
3. Update component exports
4. Run tests

### Phase 2: Lib Actions (15 files)
1. Rename server action files
2. Update imports in app routes
3. Run tests

### Phase 3: Lib Utils (12 files)
1. Rename utility files
2. Update all imports
3. Run tests

### Phase 4: Lib Integrations (5 files)
1. Rename integration files
2. Update imports
3. Run tests

### Phase 5: Function/Variable Renaming
1. Update exported function names to `waFunctionName`
2. Update all call sites
3. Run tests

## Verification Checklist

After each phase:
- [ ] `npm run build` succeeds
- [ ] `npm test` - all 197 tests pass
- [ ] Manual smoke test of key flows
- [ ] No TypeScript errors

## Rollback Plan

If any phase fails:
1. `git checkout .` in worktree
2. Document what failed
3. Fix approach before continuing

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Import path breaks | High | High | Systematic search/replace |
| Type export breaks | Medium | Medium | TypeScript will catch |
| Runtime errors | Low | High | Test coverage |
| Next.js routing breaks | Low | Critical | Don't rename App Router files |

## Estimated Scope

- **Files to rename**: ~142
- **Import statements to update**: ~800+
- **Function references to update**: ~500+
- **Time per phase**: Test after each file group

## Decision

Proceed with phased implementation in isolated worktree, merging to `test/merge-all-features` only after full verification.
