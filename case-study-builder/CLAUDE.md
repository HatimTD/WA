# Project Rules for Claude Code

## Naming Conventions

### waCamelCase Convention (MANDATORY)

All new code in this project MUST follow the `waCamelCase` naming convention with the `wa` prefix:

#### Functions & Methods
```typescript
// Correct
function waCalculateSavings() { }
function waUpdateCostCalculator() { }
async function waFetchCaseStudies() { }
const waHandleSubmit = () => { }

// Incorrect
function calculateSavings() { }
function updateCostCalculator() { }
```

#### Server Actions
```typescript
// Correct
export async function waSuggestTags() { }
export async function waGenerateAutoPrompts() { }
export async function waConvertBulletsToProse() { }

// Incorrect
export async function suggestTags() { }
```

#### API Route Handlers
```typescript
// Correct
export async function waAnalyzeImage() { }
export async function waExtractTextFromImage() { }

// Incorrect
export async function analyzeImage() { }
```

#### Utility Functions
```typescript
// Correct
export function waFormatCurrency() { }
export function waValidateEmail() { }
export function waIsValidImageUrl() { }

// Incorrect
export function formatCurrency() { }
```

#### Helper Functions (internal to components)
```typescript
// Correct
const waHandleChange = () => { }
const waValidateStep = () => { }

// Incorrect
const handleChange = () => { }
```

### Exceptions (DO NOT use wa prefix)

1. **React Component Names** - Use PascalCase without prefix:
   ```typescript
   // Correct
   export default function StepCostCalculator() { }
   export default function VoiceInput() { }

   // Incorrect
   export default function WaStepCostCalculator() { }
   ```

2. **Props/Type Definitions** - Use standard naming:
   ```typescript
   // Correct
   type Props = { formData: CaseStudyFormData }
   interface ImageAnalysisResult { }

   // Incorrect
   type WaProps = { }
   ```

3. **External Library Callbacks** - When required by library APIs:
   ```typescript
   // Correct (required by library)
   onChange={(e) => waHandleChange(e)}
   onSubmit={waHandleSubmit}
   ```

4. **Standard React Hooks** - Use standard naming:
   ```typescript
   // Correct
   const [isLoading, setIsLoading] = useState(false);
   useEffect(() => { }, []);
   ```

### Database Models (Prisma)

All Prisma models use the `Wa` prefix (PascalCase):
```prisma
model WaCaseStudy { }
model WaUser { }
model WaWeldingProcedure { }
```

### File Naming

- **Server Actions**: `wa[ActionName]Actions.ts` (e.g., `waAiSuggestionsActions.ts`)
- **Utilities**: `wa[UtilityName].ts` (e.g., `waFormatters.ts`)
- **Components**: Standard naming without prefix (e.g., `step-cost-calculator.tsx`)

## Code Style

- Use TypeScript for all new files
- Prefer `async/await` over `.then()` chains
- Add JSDoc comments to exported functions
- Use descriptive variable names

## Testing

- Test files should be in `__tests__/` or `e2e/` directories
- Use `waLoginAsAdmin()` helper for authenticated E2E tests
- Follow BRD requirements for validation testing
