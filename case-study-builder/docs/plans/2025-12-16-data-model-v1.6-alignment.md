# Data Model V1.6 Alignment Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Align the Case Study Builder application with Data Model Specification V1.6, including schema updates, admin panel Master List management, and frontend alignment.

**Architecture:** Multi-phase implementation starting with foundational schema changes (Master Lists, Subsidiary, Customer, Product), followed by User/Role enhancements, Case Study field updates, and finally frontend/admin UI updates. Each phase builds upon the previous one.

**Tech Stack:** Next.js 14, Prisma ORM, PostgreSQL, TypeScript, React, TailwindCSS, shadcn/ui

---

## Phase 1: Foundation - Master List & Reference Tables

### Task 1.1: Add waListKey Table to Prisma Schema

**Files:**
- Modify: `prisma/schema.prisma`

**Step 1: Add waListKey model**

Add after the existing enums section in schema.prisma:

```prisma
// =====================================================
// MASTER LIST SYSTEM (Data Model V1.6)
// Generic dropdown management for admin configurability
// =====================================================

model WaListKey {
  id            String         @id @default(cuid())
  keyName       String         @unique  // e.g., "Industry", "WearType", "DurationUnit"
  description   String?

  // Relations
  masterListItems WaMasterList[]

  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt

  @@map("ListKey")
}
```

**Step 2: Verify syntax**

Run: `npx prisma format`
Expected: Schema formatted successfully

**Step 3: Commit**

```bash
git add prisma/schema.prisma
git commit -m "feat(schema): add WaListKey model for master list management"
```

---

### Task 1.2: Add waMasterList Table to Prisma Schema

**Files:**
- Modify: `prisma/schema.prisma`

**Step 1: Add waMasterList model**

Add after WaListKey model:

```prisma
model WaMasterList {
  id                  String     @id @default(cuid())
  listKeyId           String
  listKey             WaListKey  @relation(fields: [listKeyId], references: [id], onDelete: Cascade)
  value               String     // Display value (e.g., "Cement", "Abrasion")
  netsuiteInternalId  Int?       @unique  // Optional ERP sync
  isActive            Boolean    @default(true)
  sortOrder           Int        @default(0)

  // Relations for FK usage
  icaWearTypes        WaIcaWearType[]
  customersIndustry   WaCustomer[]    @relation("CustomerIndustry")

  createdAt           DateTime   @default(now())
  updatedAt           DateTime   @updatedAt

  @@unique([listKeyId, value])
  @@index([listKeyId])
  @@index([isActive])
  @@map("MasterList")
}
```

**Step 2: Verify syntax**

Run: `npx prisma format`
Expected: Schema formatted successfully

**Step 3: Commit**

```bash
git add prisma/schema.prisma
git commit -m "feat(schema): add WaMasterList model for configurable dropdowns"
```

---

### Task 1.3: Add waSubsidiary Table

**Files:**
- Modify: `prisma/schema.prisma`

**Step 1: Add waSubsidiary model**

Add after WaMasterList model:

```prisma
// =====================================================
// MULTI-SUBSIDIARY SUPPORT (Data Model V1.6)
// ERP-synced subsidiary/region management
// =====================================================

model WaSubsidiary {
  id              String    @id @default(cuid())
  integrationId   String    @unique  // External ERP code
  name            String    // Legal name
  region          String    // EMEA, APAC, Americas, etc.
  currencyCode    String    @db.Char(3)  // ISO currency code
  isActive        Boolean   @default(true)

  // Relations
  users           User[]
  caseStudies     WaCaseStudy[]
  customers       WaCustomer[]

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  @@index([region])
  @@index([isActive])
  @@map("Subsidiary")
}
```

**Step 2: Verify syntax**

Run: `npx prisma format`
Expected: Schema formatted successfully

**Step 3: Commit**

```bash
git add prisma/schema.prisma
git commit -m "feat(schema): add WaSubsidiary model for multi-subsidiary support"
```

---

### Task 1.4: Add waCustomer Table

**Files:**
- Modify: `prisma/schema.prisma`

**Step 1: Add waCustomer model**

```prisma
// =====================================================
// CUSTOMER MASTER DATA (Data Model V1.6)
// Synced from Netsuite/Insightly CRM
// =====================================================

model WaCustomer {
  id                  String        @id @default(cuid())
  crmId               String?       @unique  // Insightly CRM ID
  netsuiteInternalId  Int?          @unique  // Netsuite ID
  companyName         String
  subsidiaryId        String
  subsidiary          WaSubsidiary  @relation(fields: [subsidiaryId], references: [id])
  industryId          String?
  industry            WaMasterList? @relation("CustomerIndustry", fields: [industryId], references: [id])
  lastPurchaseDate    DateTime?     // For "New Customer" validation
  syncedAt            DateTime?

  // Relations
  caseStudies         WaCaseStudy[]

  createdAt           DateTime      @default(now())
  updatedAt           DateTime      @updatedAt

  @@index([companyName])
  @@index([subsidiaryId])
  @@map("Customer")
}
```

**Step 2: Verify syntax**

Run: `npx prisma format`
Expected: Schema formatted successfully

**Step 3: Commit**

```bash
git add prisma/schema.prisma
git commit -m "feat(schema): add WaCustomer model for CRM integration"
```

---

### Task 1.5: Add waProduct Table

**Files:**
- Modify: `prisma/schema.prisma`

**Step 1: Add waProduct model**

```prisma
// =====================================================
// PRODUCT MASTER DATA (Data Model V1.6)
// Synced from Netsuite
// =====================================================

model WaProduct {
  id                  String        @id @default(cuid())
  netsuiteInternalId  Int           @unique
  itemName            String
  family              String?
  isActive            Boolean       @default(true)

  // Relations
  caseStudies         WaCaseStudy[]

  createdAt           DateTime      @default(now())
  updatedAt           DateTime      @updatedAt

  @@index([itemName])
  @@index([family])
  @@map("Product")
}
```

**Step 2: Verify syntax**

Run: `npx prisma format`
Expected: Schema formatted successfully

**Step 3: Commit**

```bash
git add prisma/schema.prisma
git commit -m "feat(schema): add WaProduct model for Netsuite product sync"
```

---

### Task 1.6: Add waIcaWearType Junction Table

**Files:**
- Modify: `prisma/schema.prisma`

**Step 1: Add waIcaWearType model**

```prisma
// =====================================================
// ICA WEAR TYPE JUNCTION (Data Model V1.6)
// Many-to-Many relationship for wear types
// =====================================================

model WaIcaWearType {
  id              String        @id @default(cuid())
  caseStudyId     String
  caseStudy       WaCaseStudy   @relation(fields: [caseStudyId], references: [id], onDelete: Cascade)
  masterListId    String
  masterList      WaMasterList  @relation(fields: [masterListId], references: [id])

  @@unique([caseStudyId, masterListId])
  @@index([caseStudyId])
  @@map("IcaWearType")
}
```

**Step 2: Verify syntax**

Run: `npx prisma format`
Expected: Schema formatted successfully

**Step 3: Commit**

```bash
git add prisma/schema.prisma
git commit -m "feat(schema): add WaIcaWearType junction table for M:M wear types"
```

---

### Task 1.7: Add waMediaAsset Table

**Files:**
- Modify: `prisma/schema.prisma`

**Step 1: Add FileType enum and waMediaAsset model**

```prisma
enum FileType {
  IMAGE
  VIDEO
  DOCUMENT
}

model WaMediaAsset {
  id          String      @id @default(cuid())
  caseStudyId String
  caseStudy   WaCaseStudy @relation(fields: [caseStudyId], references: [id], onDelete: Cascade)
  fileUrl     String      @db.VarChar(500)
  fileType    FileType
  isPrimary   Boolean     @default(false)
  caption     String?     @db.VarChar(255)
  aiTags      Json?       // Tags from Vision API
  uploadedAt  DateTime    @default(now())

  @@index([caseStudyId])
  @@index([fileType])
  @@map("MediaAsset")
}
```

**Step 2: Verify syntax**

Run: `npx prisma format`
Expected: Schema formatted successfully

**Step 3: Commit**

```bash
git add prisma/schema.prisma
git commit -m "feat(schema): add WaMediaAsset model with AI tagging support"
```

---

## Phase 2: User & Role Enhancement

### Task 2.1: Add waUserRole Junction Table

**Files:**
- Modify: `prisma/schema.prisma`

**Step 1: Add waUserRole model for multi-role support**

```prisma
// =====================================================
// USER ROLE JUNCTION (Data Model V1.6)
// Many-to-Many for users with multiple roles
// =====================================================

model WaUserRole {
  id          String    @id @default(cuid())
  userId      String
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  role        Role
  assignedAt  DateTime  @default(now())
  assignedBy  String?   // Admin who assigned the role

  @@unique([userId, role])
  @@index([userId])
  @@map("UserRole")
}
```

**Step 2: Add relation to User model**

In the User model, add:

```prisma
  userRoles     WaUserRole[]
```

**Step 3: Verify syntax**

Run: `npx prisma format`
Expected: Schema formatted successfully

**Step 4: Commit**

```bash
git add prisma/schema.prisma
git commit -m "feat(schema): add WaUserRole for multi-role user support"
```

---

### Task 2.2: Add Missing User Fields

**Files:**
- Modify: `prisma/schema.prisma`

**Step 1: Update User model with V1.6 fields**

Add these fields to the User model:

```prisma
  // Data Model V1.6 Fields
  ssoUid          String?       @unique  // Immutable SSO ID from IdP
  subsidiaryId    String?
  subsidiary      WaSubsidiary? @relation(fields: [subsidiaryId], references: [id])
  lastLoginDate   DateTime?
  status          UserStatus    @default(ACTIVE)
```

**Step 2: Add UserStatus enum**

```prisma
enum UserStatus {
  ACTIVE
  INACTIVE
}
```

**Step 3: Verify syntax**

Run: `npx prisma format`
Expected: Schema formatted successfully

**Step 4: Commit**

```bash
git add prisma/schema.prisma
git commit -m "feat(schema): add V1.6 user fields (ssoUid, subsidiary, status)"
```

---

## Phase 3: Case Study (waIca) Enhancement

### Task 3.1: Add Versioning Fields to WaCaseStudy

**Files:**
- Modify: `prisma/schema.prisma`

**Step 1: Add versioning fields**

Add to WaCaseStudy model:

```prisma
  // Versioning (Data Model V1.6)
  icaNumber       String?       @unique  // Format: ICAYYMMnnn
  parentIcaId     String?       // Links to previous version
  parentIca       WaCaseStudy?  @relation("IcaVersions", fields: [parentIcaId], references: [id])
  childVersions   WaCaseStudy[] @relation("IcaVersions")
  versionNumber   Int           @default(1)
  isLatest        Boolean       @default(true)
```

**Step 2: Verify syntax**

Run: `npx prisma format`
Expected: Schema formatted successfully

**Step 3: Commit**

```bash
git add prisma/schema.prisma
git commit -m "feat(schema): add versioning fields to WaCaseStudy"
```

---

### Task 3.2: Add Missing WaCaseStudy Fields

**Files:**
- Modify: `prisma/schema.prisma`

**Step 1: Add V1.6 required fields**

Add to WaCaseStudy model:

```prisma
  // Data Model V1.6 Fields
  title               String?       @db.VarChar(255)
  customerId          String?
  customer            WaCustomer?   @relation(fields: [customerId], references: [id])
  productId           String?
  product             WaProduct?    @relation(fields: [productId], references: [id])
  productNameManual   String?       @db.VarChar(255)  // Fallback if product not found
  subsidiaryId        String?
  subsidiary          WaSubsidiary? @relation(fields: [subsidiaryId], references: [id])

  // Qualifier booleans (replacing enum)
  isNewCustomer       Boolean       @default(false)
  isCrossSell         Boolean       @default(false)

  // Quality Indicators
  dataQualityScore    Int?          // 0-100 computed
  securityLevel       String        @default("Internal")  // Internal or Confidential

  // Solution description (was missing)
  solutionDescription String?       @db.Text

  // Job Duration
  jobDuration         Decimal?      @db.Decimal(10, 2)
  jobDurationUnitId   String?

  // Previous Service Unit
  prevServiceUnitId   String?

  // Financial Fields (from Cost Calculator inline)
  currency            String?       @db.Char(3)
  exchangeRate        Decimal?      @db.Decimal(10, 4)
  lifeStatus          LifeStatus?
  costOldSolution     Decimal?      @db.Decimal(15, 2)
  costWaSolution      Decimal?      @db.Decimal(15, 2)
  waServiceLife       Decimal?      @db.Decimal(10, 2)
  savingsAmount       Decimal?      @db.Decimal(15, 2)
  savingsPercent      Decimal?      @db.Decimal(5, 2)

  // WPS Fields (inline per V1.6)
  processType         String?       @db.VarChar(50)
  layersCount         Int?
  amperageMin         Int?
  amperageMax         Int?
  voltageMin          Int?
  voltageMax          Int?
  travelSpeed         String?       @db.VarChar(50)
  wireSpeed           String?       @db.VarChar(50)
  oscillation         String?       @db.VarChar(100)
  preheating          String?       @db.VarChar(100)
  shieldingGas        String?       @db.VarChar(50)
  wpsNotes            String?       @db.Text

  // Relations
  mediaAssets         WaMediaAsset[]
  icaWearTypes        WaIcaWearType[]
```

**Step 2: Add LifeStatus enum**

```prisma
enum LifeStatus {
  EXPECTED
  VERIFIED
}
```

**Step 3: Add ARCHIVED to Status enum**

Update Status enum:

```prisma
enum Status {
  DRAFT
  SUBMITTED
  APPROVED
  REJECTED
  PUBLISHED
  ARCHIVED
}
```

**Step 4: Verify syntax**

Run: `npx prisma format`
Expected: Schema formatted successfully

**Step 5: Commit**

```bash
git add prisma/schema.prisma
git commit -m "feat(schema): add V1.6 fields to WaCaseStudy (versioning, financial, WPS)"
```

---

### Task 3.3: Run Database Migration

**Files:**
- Create: `prisma/migrations/[timestamp]_data_model_v1_6/migration.sql`

**Step 1: Generate migration**

Run: `npx prisma migrate dev --name data_model_v1_6`
Expected: Migration created and applied

**Step 2: Generate Prisma client**

Run: `npx prisma generate`
Expected: Prisma Client generated

**Step 3: Commit**

```bash
git add prisma/migrations prisma/schema.prisma
git commit -m "chore: apply data model v1.6 database migration"
```

---

## Phase 4: Admin Panel - Master List Management

### Task 4.1: Create Master List API Routes

**Files:**
- Create: `app/api/admin/master-list/route.ts`
- Create: `app/api/admin/master-list/[id]/route.ts`
- Create: `app/api/admin/list-keys/route.ts`

**Step 1: Create list-keys API route**

Create `app/api/admin/list-keys/route.ts`:

```typescript
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const listKeys = await prisma.waListKey.findMany({
    include: {
      _count: {
        select: { masterListItems: true },
      },
    },
    orderBy: { keyName: 'asc' },
  });

  return NextResponse.json(listKeys);
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const { keyName, description } = body;

  if (!keyName) {
    return NextResponse.json({ error: 'keyName is required' }, { status: 400 });
  }

  const listKey = await prisma.waListKey.create({
    data: { keyName, description },
  });

  return NextResponse.json(listKey, { status: 201 });
}
```

**Step 2: Create master-list API routes**

Create `app/api/admin/master-list/route.ts`:

```typescript
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const listKeyId = searchParams.get('listKeyId');
  const keyName = searchParams.get('keyName');

  const where: any = { isActive: true };

  if (listKeyId) {
    where.listKeyId = listKeyId;
  } else if (keyName) {
    where.listKey = { keyName };
  }

  const items = await prisma.waMasterList.findMany({
    where,
    include: { listKey: true },
    orderBy: [{ sortOrder: 'asc' }, { value: 'asc' }],
  });

  return NextResponse.json(items);
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const { listKeyId, value, sortOrder, netsuiteInternalId } = body;

  if (!listKeyId || !value) {
    return NextResponse.json({ error: 'listKeyId and value are required' }, { status: 400 });
  }

  const item = await prisma.waMasterList.create({
    data: {
      listKeyId,
      value,
      sortOrder: sortOrder || 0,
      netsuiteInternalId,
    },
  });

  return NextResponse.json(item, { status: 201 });
}
```

**Step 3: Create master-list [id] API route**

Create `app/api/admin/master-list/[id]/route.ts`:

```typescript
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const { value, sortOrder, isActive, netsuiteInternalId } = body;

  const item = await prisma.waMasterList.update({
    where: { id: params.id },
    data: {
      ...(value !== undefined && { value }),
      ...(sortOrder !== undefined && { sortOrder }),
      ...(isActive !== undefined && { isActive }),
      ...(netsuiteInternalId !== undefined && { netsuiteInternalId }),
    },
  });

  return NextResponse.json(item);
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Soft delete by setting isActive to false
  await prisma.waMasterList.update({
    where: { id: params.id },
    data: { isActive: false },
  });

  return NextResponse.json({ success: true });
}
```

**Step 4: Commit**

```bash
git add app/api/admin/
git commit -m "feat(api): add master list management API routes"
```

---

### Task 4.2: Create Admin Master List Page

**Files:**
- Create: `app/dashboard/admin/master-list/page.tsx`

**Step 1: Create the admin master list page**

```typescript
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { List, Plus, Settings } from 'lucide-react';
import Link from 'next/link';
import MasterListManager from '@/components/admin/master-list-manager';

export default async function MasterListPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (user?.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  const listKeys = await prisma.waListKey.findMany({
    include: {
      masterListItems: {
        where: { isActive: true },
        orderBy: [{ sortOrder: 'asc' }, { value: 'asc' }],
      },
      _count: {
        select: { masterListItems: true },
      },
    },
    orderBy: { keyName: 'asc' },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-foreground">
            Master List Management
          </h1>
          <p className="text-gray-600 dark:text-muted-foreground mt-2">
            Manage dropdown options for Industries, Wear Types, Units, and more
          </p>
        </div>
        <Link href="/dashboard/admin">
          <Button variant="outline" className="gap-2">
            <Settings className="h-4 w-4" />
            Back to Admin
          </Button>
        </Link>
      </div>

      <MasterListManager initialListKeys={listKeys} />
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add app/dashboard/admin/master-list/
git commit -m "feat(admin): add master list management page"
```

---

### Task 4.3: Create Master List Manager Component

**Files:**
- Create: `components/admin/master-list-manager.tsx`

**Step 1: Create the component**

```typescript
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus, Edit2, Trash2, GripVertical } from 'lucide-react';
import { toast } from 'sonner';

type MasterListItem = {
  id: string;
  value: string;
  sortOrder: number;
  isActive: boolean;
  netsuiteInternalId?: number | null;
};

type ListKey = {
  id: string;
  keyName: string;
  description?: string | null;
  masterListItems: MasterListItem[];
  _count: { masterListItems: number };
};

type Props = {
  initialListKeys: ListKey[];
};

export default function MasterListManager({ initialListKeys }: Props) {
  const [listKeys, setListKeys] = useState<ListKey[]>(initialListKeys);
  const [selectedKey, setSelectedKey] = useState<ListKey | null>(
    initialListKeys[0] || null
  );
  const [isAddingKey, setIsAddingKey] = useState(false);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyDescription, setNewKeyDescription] = useState('');
  const [newItemValue, setNewItemValue] = useState('');
  const [newItemSortOrder, setNewItemSortOrder] = useState(0);
  const [editingItem, setEditingItem] = useState<MasterListItem | null>(null);

  const handleAddListKey = async () => {
    if (!newKeyName.trim()) {
      toast.error('Key name is required');
      return;
    }

    try {
      const response = await fetch('/api/admin/list-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyName: newKeyName,
          description: newKeyDescription,
        }),
      });

      if (!response.ok) throw new Error('Failed to create list key');

      const newKey = await response.json();
      setListKeys([...listKeys, { ...newKey, masterListItems: [], _count: { masterListItems: 0 } }]);
      setNewKeyName('');
      setNewKeyDescription('');
      setIsAddingKey(false);
      toast.success('List key created');
    } catch (error) {
      toast.error('Failed to create list key');
    }
  };

  const handleAddItem = async () => {
    if (!selectedKey || !newItemValue.trim()) {
      toast.error('Value is required');
      return;
    }

    try {
      const response = await fetch('/api/admin/master-list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listKeyId: selectedKey.id,
          value: newItemValue,
          sortOrder: newItemSortOrder,
        }),
      });

      if (!response.ok) throw new Error('Failed to create item');

      const newItem = await response.json();

      // Update local state
      const updatedKeys = listKeys.map(key => {
        if (key.id === selectedKey.id) {
          return {
            ...key,
            masterListItems: [...key.masterListItems, newItem],
            _count: { masterListItems: key._count.masterListItems + 1 },
          };
        }
        return key;
      });

      setListKeys(updatedKeys);
      setSelectedKey(updatedKeys.find(k => k.id === selectedKey.id) || null);
      setNewItemValue('');
      setNewItemSortOrder(0);
      setIsAddingItem(false);
      toast.success('Item added');
    } catch (error) {
      toast.error('Failed to add item');
    }
  };

  const handleUpdateItem = async () => {
    if (!editingItem) return;

    try {
      const response = await fetch(`/api/admin/master-list/${editingItem.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          value: editingItem.value,
          sortOrder: editingItem.sortOrder,
        }),
      });

      if (!response.ok) throw new Error('Failed to update item');

      // Update local state
      const updatedKeys = listKeys.map(key => ({
        ...key,
        masterListItems: key.masterListItems.map(item =>
          item.id === editingItem.id ? editingItem : item
        ),
      }));

      setListKeys(updatedKeys);
      setSelectedKey(updatedKeys.find(k => k.id === selectedKey?.id) || null);
      setEditingItem(null);
      toast.success('Item updated');
    } catch (error) {
      toast.error('Failed to update item');
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('Are you sure you want to deactivate this item?')) return;

    try {
      const response = await fetch(`/api/admin/master-list/${itemId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete item');

      // Update local state
      const updatedKeys = listKeys.map(key => ({
        ...key,
        masterListItems: key.masterListItems.filter(item => item.id !== itemId),
        _count: {
          masterListItems: key.masterListItems.filter(item => item.id !== itemId).length,
        },
      }));

      setListKeys(updatedKeys);
      setSelectedKey(updatedKeys.find(k => k.id === selectedKey?.id) || null);
      toast.success('Item deactivated');
    } catch (error) {
      toast.error('Failed to delete item');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* List Keys Panel */}
      <Card className="lg:col-span-1">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">List Categories</CardTitle>
          <Dialog open={isAddingKey} onOpenChange={setIsAddingKey}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1">
                <Plus className="h-4 w-4" />
                Add
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New List Category</DialogTitle>
                <DialogDescription>
                  Create a new category for dropdown options
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Key Name</Label>
                  <Input
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    placeholder="e.g., Industry, WearType, DurationUnit"
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <Input
                    value={newKeyDescription}
                    onChange={(e) => setNewKeyDescription(e.target.value)}
                    placeholder="What this list controls"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddingKey(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddListKey}>Create</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {listKeys.map((key) => (
              <Button
                key={key.id}
                variant={selectedKey?.id === key.id ? 'default' : 'ghost'}
                className="w-full justify-between"
                onClick={() => setSelectedKey(key)}
              >
                <span>{key.keyName}</span>
                <span className="text-xs opacity-70">
                  {key._count.masterListItems} items
                </span>
              </Button>
            ))}
            {listKeys.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No list categories yet. Create one to get started.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Items Panel */}
      <Card className="lg:col-span-2">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">
            {selectedKey ? `${selectedKey.keyName} Items` : 'Select a Category'}
          </CardTitle>
          {selectedKey && (
            <Dialog open={isAddingItem} onOpenChange={setIsAddingItem}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1">
                  <Plus className="h-4 w-4" />
                  Add Item
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Item</DialogTitle>
                  <DialogDescription>
                    Add a new option to {selectedKey.keyName}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Value</Label>
                    <Input
                      value={newItemValue}
                      onChange={(e) => setNewItemValue(e.target.value)}
                      placeholder="e.g., Mining & Quarrying"
                    />
                  </div>
                  <div>
                    <Label>Sort Order</Label>
                    <Input
                      type="number"
                      value={newItemSortOrder}
                      onChange={(e) => setNewItemSortOrder(parseInt(e.target.value) || 0)}
                      placeholder="0"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddingItem(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddItem}>Add</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </CardHeader>
        <CardContent>
          {selectedKey ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead className="w-24">Order</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedKey.masterListItems.map((item, index) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                    </TableCell>
                    <TableCell>{item.value}</TableCell>
                    <TableCell>{item.sortOrder}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingItem(item)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive"
                          onClick={() => handleDeleteItem(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {selectedKey.masterListItems.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      No items yet. Add one to get started.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              Select a category from the left to manage its items
            </p>
          )}
        </CardContent>
      </Card>

      {/* Edit Item Dialog */}
      <Dialog open={!!editingItem} onOpenChange={(open) => !open && setEditingItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Item</DialogTitle>
          </DialogHeader>
          {editingItem && (
            <div className="space-y-4">
              <div>
                <Label>Value</Label>
                <Input
                  value={editingItem.value}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, value: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Sort Order</Label>
                <Input
                  type="number"
                  value={editingItem.sortOrder}
                  onChange={(e) =>
                    setEditingItem({
                      ...editingItem,
                      sortOrder: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingItem(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateItem}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add components/admin/master-list-manager.tsx
git commit -m "feat(admin): add MasterListManager component"
```

---

### Task 4.4: Add Master List Link to Admin Dashboard

**Files:**
- Modify: `app/dashboard/admin/page.tsx`

**Step 1: Add Master List quick action**

In the Quick Actions section, add after "Manage Users":

```typescript
<Link href="/dashboard/admin/master-list">
  <Button variant="outline" className="w-full gap-2 dark:border-border dark:text-foreground dark:hover:bg-background">
    <List className="h-4 w-4" />
    Master Lists
  </Button>
</Link>
```

**Step 2: Import List icon**

Add to imports: `List` from lucide-react

**Step 3: Commit**

```bash
git add app/dashboard/admin/page.tsx
git commit -m "feat(admin): add master list link to admin dashboard"
```

---

### Task 4.5: Seed Initial Master List Data

**Files:**
- Create: `prisma/seed-master-lists.ts`

**Step 1: Create seed script**

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedMasterLists() {
  console.log('Seeding master lists...');

  // Create List Keys
  const industryKey = await prisma.waListKey.upsert({
    where: { keyName: 'Industry' },
    update: {},
    create: {
      keyName: 'Industry',
      description: 'Customer industry categories',
    },
  });

  const wearTypeKey = await prisma.waListKey.upsert({
    where: { keyName: 'WearType' },
    update: {},
    create: {
      keyName: 'WearType',
      description: 'Types of wear/damage',
    },
  });

  const durationUnitKey = await prisma.waListKey.upsert({
    where: { keyName: 'DurationUnit' },
    update: {},
    create: {
      keyName: 'DurationUnit',
      description: 'Time duration units',
    },
  });

  const serviceUnitKey = await prisma.waListKey.upsert({
    where: { keyName: 'ServiceUnit' },
    update: {},
    create: {
      keyName: 'ServiceUnit',
      description: 'Service life measurement units',
    },
  });

  // Seed Industries
  const industries = [
    'Mining & Quarrying',
    'Cement',
    'Steel & Metal Processing',
    'Power Generation',
    'Pulp & Paper',
    'Oil & Gas',
    'Chemical & Petrochemical',
    'Marine',
    'Agriculture',
    'Construction',
    'Recycling',
    'Other',
  ];

  for (let i = 0; i < industries.length; i++) {
    await prisma.waMasterList.upsert({
      where: {
        listKeyId_value: {
          listKeyId: industryKey.id,
          value: industries[i],
        },
      },
      update: { sortOrder: i },
      create: {
        listKeyId: industryKey.id,
        value: industries[i],
        sortOrder: i,
      },
    });
  }

  // Seed Wear Types
  const wearTypes = [
    { value: 'Abrasion', sort: 0 },
    { value: 'Impact', sort: 1 },
    { value: 'Corrosion', sort: 2 },
    { value: 'High Temperature', sort: 3 },
    { value: 'Combination', sort: 4 },
  ];

  for (const wt of wearTypes) {
    await prisma.waMasterList.upsert({
      where: {
        listKeyId_value: {
          listKeyId: wearTypeKey.id,
          value: wt.value,
        },
      },
      update: { sortOrder: wt.sort },
      create: {
        listKeyId: wearTypeKey.id,
        value: wt.value,
        sortOrder: wt.sort,
      },
    });
  }

  // Seed Duration Units
  const durationUnits = ['Hours', 'Days', 'Weeks', 'Months', 'Years'];

  for (let i = 0; i < durationUnits.length; i++) {
    await prisma.waMasterList.upsert({
      where: {
        listKeyId_value: {
          listKeyId: durationUnitKey.id,
          value: durationUnits[i],
        },
      },
      update: { sortOrder: i },
      create: {
        listKeyId: durationUnitKey.id,
        value: durationUnits[i],
        sortOrder: i,
      },
    });
  }

  // Seed Service Units
  const serviceUnits = ['Hours', 'Cycles', 'Tonnes', 'Months', 'Years'];

  for (let i = 0; i < serviceUnits.length; i++) {
    await prisma.waMasterList.upsert({
      where: {
        listKeyId_value: {
          listKeyId: serviceUnitKey.id,
          value: serviceUnits[i],
        },
      },
      update: { sortOrder: i },
      create: {
        listKeyId: serviceUnitKey.id,
        value: serviceUnits[i],
        sortOrder: i,
      },
    });
  }

  console.log('Master lists seeded successfully!');
}

seedMasterLists()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

**Step 2: Add to package.json scripts**

```json
"db:seed-lists": "npx ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed-master-lists.ts"
```

**Step 3: Run seed**

Run: `npm run db:seed-lists`
Expected: Master lists seeded successfully

**Step 4: Commit**

```bash
git add prisma/seed-master-lists.ts package.json
git commit -m "feat(seed): add master list seed data"
```

---

## Phase 5: Frontend Alignment

### Task 5.1: Create useMasterList Hook

**Files:**
- Create: `hooks/use-master-list.ts`

**Step 1: Create the hook**

```typescript
'use client';

import { useState, useEffect } from 'react';

type MasterListItem = {
  id: string;
  value: string;
  sortOrder: number;
};

export function useMasterList(keyName: string) {
  const [items, setItems] = useState<MasterListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchItems() {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/admin/master-list?keyName=${keyName}`);

        if (!response.ok) {
          throw new Error('Failed to fetch master list');
        }

        const data = await response.json();
        setItems(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    }

    fetchItems();
  }, [keyName]);

  return { items, isLoading, error };
}
```

**Step 2: Commit**

```bash
git add hooks/use-master-list.ts
git commit -m "feat(hooks): add useMasterList hook for dynamic dropdowns"
```

---

### Task 5.2: Update StepTwo to Use Master List for Industries

**Files:**
- Modify: `components/case-study-form/step-two.tsx`

**Step 1: Replace hardcoded INDUSTRIES with useMasterList**

Replace the hardcoded INDUSTRIES constant and update the component:

```typescript
import { useMasterList } from '@/hooks/use-master-list';

// Remove hardcoded INDUSTRIES constant

export default function StepTwo({ formData, updateFormData }: Props) {
  const { items: industries, isLoading: industriesLoading } = useMasterList('Industry');
  const { items: wearTypes, isLoading: wearTypesLoading } = useMasterList('WearType');

  // ... rest of the component

  // Update the Industry Select:
  <Select value={formData.industry} onValueChange={(value) => updateFormData({ industry: value })}>
    <SelectTrigger className="dark:bg-input dark:border-border dark:text-foreground">
      <SelectValue placeholder={industriesLoading ? "Loading..." : "Select industry"} />
    </SelectTrigger>
    <SelectContent className="dark:bg-popover dark:border-border">
      {industries.map((industry) => (
        <SelectItem key={industry.id} value={industry.value}>
          {industry.value}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>

  // Update Wear Type checkboxes to use dynamic list:
  {wearTypesLoading ? (
    <p className="text-sm text-muted-foreground">Loading wear types...</p>
  ) : (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {wearTypes.map((wear) => (
        <div key={wear.id} className="flex items-center space-x-2">
          <Checkbox
            id={wear.id}
            checked={formData.wearType?.includes(wear.value)}
            onCheckedChange={() => toggleWearType(wear.value)}
          />
          <Label htmlFor={wear.id} className="font-normal cursor-pointer dark:text-foreground">
            {wear.value}
          </Label>
        </div>
      ))}
    </div>
  )}
```

**Step 2: Commit**

```bash
git add components/case-study-form/step-two.tsx
git commit -m "feat(form): use master list for industries and wear types"
```

---

### Task 5.3: Add Title Field to Case Study Form

**Files:**
- Modify: `app/dashboard/new/page.tsx`
- Modify: `components/case-study-form/step-two.tsx`

**Step 1: Add title to CaseStudyFormData type**

In `app/dashboard/new/page.tsx`, add to type:

```typescript
title: string;
```

And initialize in state:

```typescript
title: '',
```

**Step 2: Add title input to StepTwo**

Add at the top of the form grid:

```typescript
{/* Title - New V1.6 Field */}
<div className="space-y-2 md:col-span-2">
  <Label htmlFor="title" className="dark:text-foreground">
    Case Study Title <span className="text-red-500 dark:text-red-400">*</span>
  </Label>
  <Input
    id="title"
    value={formData.title}
    onChange={(e) => updateFormData({ title: e.target.value })}
    placeholder="e.g., Crusher Hammer Rebuild - ABC Mining"
    className="dark:bg-input dark:border-border dark:text-foreground"
    required
  />
  <p className="text-xs text-muted-foreground">
    A descriptive title for this case study
  </p>
</div>
```

**Step 3: Update validation**

In `validateStep` for 'Basic Info':

```typescript
case 'Basic Info':
  return !!(
    formData.title &&
    formData.customerName &&
    // ... rest of validation
  );
```

**Step 4: Commit**

```bash
git add app/dashboard/new/page.tsx components/case-study-form/step-two.tsx
git commit -m "feat(form): add title field per Data Model V1.6"
```

---

### Task 5.4: Add Subsidiary Selector to User Profile

**Files:**
- Modify: `components/settings-form.tsx`
- Create: `hooks/use-subsidiaries.ts`

**Step 1: Create subsidiaries hook**

```typescript
'use client';

import { useState, useEffect } from 'react';

type Subsidiary = {
  id: string;
  name: string;
  region: string;
  currencyCode: string;
};

export function useSubsidiaries() {
  const [subsidiaries, setSubsidiaries] = useState<Subsidiary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchSubsidiaries() {
      try {
        const response = await fetch('/api/subsidiaries');
        if (response.ok) {
          const data = await response.json();
          setSubsidiaries(data);
        }
      } catch (error) {
        console.error('Failed to fetch subsidiaries:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchSubsidiaries();
  }, []);

  return { subsidiaries, isLoading };
}
```

**Step 2: Commit**

```bash
git add hooks/use-subsidiaries.ts
git commit -m "feat(hooks): add useSubsidiaries hook"
```

---

### Task 5.5: Create Subsidiary Management Admin Page

**Files:**
- Create: `app/dashboard/admin/subsidiaries/page.tsx`
- Create: `app/api/admin/subsidiaries/route.ts`

**Step 1: Create API route**

```typescript
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const subsidiaries = await prisma.waSubsidiary.findMany({
    where: { isActive: true },
    orderBy: [{ region: 'asc' }, { name: 'asc' }],
  });

  return NextResponse.json(subsidiaries);
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  if (user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const { integrationId, name, region, currencyCode } = body;

  if (!integrationId || !name || !region || !currencyCode) {
    return NextResponse.json(
      { error: 'All fields are required' },
      { status: 400 }
    );
  }

  const subsidiary = await prisma.waSubsidiary.create({
    data: { integrationId, name, region, currencyCode },
  });

  return NextResponse.json(subsidiary, { status: 201 });
}
```

**Step 2: Commit**

```bash
git add app/api/admin/subsidiaries/
git commit -m "feat(api): add subsidiary management API"
```

---

## Phase 6: Update Actions and Data Flow

### Task 6.1: Update waCaseStudyActions for New Fields

**Files:**
- Modify: `lib/actions/waCaseStudyActions.ts`

**Step 1: Update the create action to include new V1.6 fields**

Add new fields to the create/update functions:

```typescript
// Add to the create function data object:
title: data.title,
icaNumber: await generateIcaNumber(),
isNewCustomer: data.qualifierType === 'NEW_CUSTOMER',
isCrossSell: data.qualifierType === 'CROSS_SELL',
dataQualityScore: calculateDataQualityScore(data),
securityLevel: data.securityLevel || 'Internal',
solutionDescription: data.solutionDescription,
// ... other new fields
```

**Step 2: Create ICA number generator helper**

```typescript
async function generateIcaNumber(): Promise<string> {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = (now.getMonth() + 1).toString().padStart(2, '0');

  // Get count of cases this month
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const count = await prisma.waCaseStudy.count({
    where: {
      createdAt: { gte: startOfMonth },
    },
  });

  const sequence = (count + 1).toString().padStart(3, '0');
  return `ICA${year}${month}${sequence}`;
}
```

**Step 3: Create data quality score calculator**

```typescript
function calculateDataQualityScore(data: any): number {
  let score = 0;
  const totalFields = 20;

  // Core fields (each worth 5 points)
  if (data.title) score += 5;
  if (data.customerName) score += 5;
  if (data.industry) score += 5;
  if (data.location) score += 5;
  if (data.componentWorkpiece) score += 5;
  if (data.problemDescription) score += 5;
  if (data.waSolution) score += 5;
  if (data.waProduct) score += 5;

  // Optional fields (each worth 3 points)
  if (data.baseMetal) score += 3;
  if (data.generalDimensions) score += 3;
  if (data.previousSolution) score += 3;
  if (data.technicalAdvantages) score += 3;
  if (data.images?.length > 0) score += 5;
  if (data.wps) score += 10;

  return Math.min(100, score);
}
```

**Step 4: Commit**

```bash
git add lib/actions/waCaseStudyActions.ts
git commit -m "feat(actions): update case study actions for V1.6 fields"
```

---

## Summary: Files Modified/Created

### Schema Changes
- `prisma/schema.prisma` - Major updates with new tables and fields

### New API Routes
- `app/api/admin/list-keys/route.ts`
- `app/api/admin/master-list/route.ts`
- `app/api/admin/master-list/[id]/route.ts`
- `app/api/admin/subsidiaries/route.ts`

### New Admin Pages
- `app/dashboard/admin/master-list/page.tsx`
- `app/dashboard/admin/subsidiaries/page.tsx`

### New Components
- `components/admin/master-list-manager.tsx`

### New Hooks
- `hooks/use-master-list.ts`
- `hooks/use-subsidiaries.ts`

### Modified Components
- `components/case-study-form/step-two.tsx`
- `app/dashboard/new/page.tsx`
- `app/dashboard/admin/page.tsx`
- `lib/actions/waCaseStudyActions.ts`

### Seed Data
- `prisma/seed-master-lists.ts`

---

**Plan complete and saved to `docs/plans/2025-12-16-data-model-v1.6-alignment.md`. Two execution options:**

**1. Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

**2. Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

**Which approach?**
