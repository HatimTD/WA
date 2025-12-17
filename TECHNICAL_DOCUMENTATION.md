# Case Study Builder - Technical Documentation

**Document Version:** 1.0
**Last Updated:** December 2024
**Application:** Case Study Builder | Welding Alloys
**Classification:** Technical Infrastructure Report

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Technology Stack Overview](#2-technology-stack-overview)
3. [System Architecture](#3-system-architecture)
4. [Database Schema & Data Models](#4-database-schema--data-models)
5. [Backend Infrastructure](#5-backend-infrastructure)
6. [Authentication & Authorization](#6-authentication--authorization)
7. [Third-Party Integrations](#7-third-party-integrations)
8. [Progressive Web App (PWA) & Offline Capabilities](#8-progressive-web-app-pwa--offline-capabilities)
9. [Security Implementation](#9-security-implementation)
10. [API Reference](#10-api-reference)
11. [Environment Configuration](#11-environment-configuration)
12. [Deployment & Build Process](#12-deployment--build-process)
13. [Testing Infrastructure](#13-testing-infrastructure)
14. [Application Features](#14-application-features)

---

## 1. Executive Summary

The **Case Study Builder** is an enterprise-grade Progressive Web Application (PWA) designed for Welding Alloys to capture, manage, approve, and share industrial welding case studies. The platform enables field engineers and technical staff to document customer solutions, track welding procedures, and build a searchable knowledge base.

### Key Capabilities

| Capability | Description |
|------------|-------------|
| **Case Study Management** | Multi-type case studies (Application, Tech, Star) with rich metadata |
| **Approval Workflow** | Role-based submission and approval process |
| **Offline-First Architecture** | Full functionality without internet connectivity |
| **AI Integration** | OpenAI-powered text summarization and translation |
| **Gamification** | Points, badges, and leaderboards to encourage contributions |
| **Analytics** | Comprehensive reporting and data visualization |
| **Multi-language Support** | Built-in translation capabilities |

---

## 2. Technology Stack Overview

### 2.1 Core Technologies

| Category | Technology | Version | Purpose |
|----------|------------|---------|---------|
| **Runtime** | Node.js | LTS | Server-side JavaScript runtime |
| **Framework** | Next.js | 16.0.0 | Full-stack React framework with App Router |
| **Language** | TypeScript | 5.6 | Type-safe JavaScript |
| **UI Library** | React | 19.0.0 | Component-based UI with Server Components |
| **Package Manager** | npm | Latest | Dependency management |

### 2.2 Frontend Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| **Tailwind CSS** | 3.4.17 | Utility-first CSS framework |
| **shadcn/ui** | Latest | Pre-built accessible UI components |
| **Radix UI** | Various | Headless UI primitives |
| **Lucide React** | 0.446.0 | Icon library |
| **Recharts** | 2.15.4 | Data visualization and charts |
| **next-themes** | 0.4.6 | Dark/light theme management |
| **Sonner** | 2.0.7 | Toast notifications |

### 2.3 Backend Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| **Prisma ORM** | 6.19.0 | Database abstraction layer |
| **PostgreSQL** | Latest | Primary relational database |
| **NextAuth.js** | 5.0.0-beta | Authentication framework |
| **Zod** | 3.23.8 | Runtime schema validation |
| **bcryptjs** | 2.4.3 | Password hashing |

### 2.4 Third-Party Services

| Service | Package | Version | Purpose |
|---------|---------|---------|---------|
| **OpenAI** | openai | 4.104.0 | AI text processing |
| **Cloudinary** | cloudinary | 2.8.0 | Image/media storage |
| **Resend** | resend | 6.4.2 | Transactional email |
| **Google OAuth** | next-auth | 5.0.0-beta | SSO authentication |

### 2.5 PWA & Offline Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| **Serwist** | 9.2.1 | Service worker management |
| **Dexie** | 4.2.1 | IndexedDB wrapper for offline storage |
| **dexie-react-hooks** | 4.2.0 | React hooks for Dexie |

### 2.6 Additional Libraries

| Library | Version | Purpose |
|---------|---------|---------|
| **jsPDF** | 2.5.2 | PDF document generation |
| **jspdf-autotable** | 5.0.2 | PDF table generation |
| **sharp** | 0.34.5 | Image processing |
| **vosk-browser** | 0.0.8 | Browser-based voice recognition |
| **class-variance-authority** | 0.7.0 | Component variant management |
| **clsx** | 2.1.1 | Conditional CSS class names |
| **tailwind-merge** | 2.5.2 | Tailwind class merging |

---

## 3. System Architecture

### 3.1 High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │   Browser   │  │     PWA     │  │   Mobile    │  │   Tablet    │    │
│  │   (React)   │  │  (Serwist)  │  │  (Safari)   │  │  (Chrome)   │    │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘    │
│         │                │                │                │            │
│         └────────────────┴────────────────┴────────────────┘            │
│                                   │                                      │
│                    ┌──────────────┴──────────────┐                      │
│                    │      Service Worker         │                      │
│                    │   (Offline Caching/Sync)    │                      │
│                    └──────────────┬──────────────┘                      │
│                                   │                                      │
│                    ┌──────────────┴──────────────┐                      │
│                    │     IndexedDB (Dexie)       │                      │
│                    │    (Offline Data Store)     │                      │
│                    └─────────────────────────────┘                      │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ HTTPS
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           APPLICATION LAYER                              │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    Next.js 16 App Router                         │   │
│  ├─────────────────────────────────────────────────────────────────┤   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │   │
│  │  │   React     │  │   Server    │  │      API Routes         │  │   │
│  │  │ Components  │  │   Actions   │  │   (REST Endpoints)      │  │   │
│  │  │   (RSC)     │  │             │  │                         │  │   │
│  │  └─────────────┘  └─────────────┘  └─────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                   │                                      │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                      Middleware Layer                            │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │   │
│  │  │  NextAuth   │  │    RBAC     │  │   Maintenance Mode      │  │   │
│  │  │   (JWT)     │  │   Control   │  │      Handler            │  │   │
│  │  └─────────────┘  └─────────────┘  └─────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ Prisma Client
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                            DATA LAYER                                    │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                     PostgreSQL Database                          │   │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐   │   │
│  │  │  Users  │ │  Cases  │ │Comments │ │  WPS    │ │ Config  │   │   │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        EXTERNAL SERVICES                                 │
├─────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │   OpenAI    │  │ Cloudinary  │  │   Resend    │  │   Google    │    │
│  │   (GPT-4)   │  │  (Images)   │  │   (Email)   │  │   (OAuth)   │    │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘    │
└─────────────────────────────────────────────────────────────────────────┘
```

### 3.2 Directory Structure

```
case-study-builder/
├── app/                           # Next.js App Router
│   ├── api/                       # REST API endpoints
│   │   ├── admin/                 # Admin operations
│   │   ├── approvals/             # Approval workflow
│   │   ├── auth/[...nextauth]/    # NextAuth handler
│   │   ├── case-studies/          # Case CRUD operations
│   │   ├── comments/              # Comments system
│   │   ├── email/                 # Email operations
│   │   ├── notifications/         # Notification system
│   │   ├── saved-cases/           # Bookmarks
│   │   ├── system-config/         # System settings
│   │   └── user/                  # User management
│   ├── dashboard/                 # Protected dashboard routes
│   │   ├── admin/                 # Admin panel
│   │   ├── analytics/             # Analytics dashboard
│   │   ├── approvals/             # Approval queue
│   │   ├── bhag/                  # BHAG progress tracker
│   │   ├── cases/[id]/            # Case detail/edit
│   │   ├── compare/               # Case comparison
│   │   ├── leaderboard/           # User rankings
│   │   ├── library/               # Case library
│   │   ├── my-cases/              # User's cases
│   │   ├── new/                   # New case form
│   │   ├── saved/                 # Saved cases
│   │   ├── search/                # Advanced search
│   │   ├── settings/              # User settings
│   │   └── system-settings/       # System config
│   ├── library/                   # Public case library
│   ├── login/                     # Login page
│   ├── dev-login/                 # Development login
│   ├── maintenance/               # Maintenance page
│   ├── offline/                   # Offline fallback
│   ├── layout.tsx                 # Root layout
│   ├── manifest.ts                # PWA manifest
│   ├── sw.ts                      # Service worker
│   └── page.tsx                   # Landing page
├── components/                    # React components
│   ├── ui/                        # shadcn/ui components
│   ├── case-study-form/           # Multi-step form
│   └── [feature components]       # Feature-specific components
├── lib/                           # Business logic
│   ├── actions/                   # Server actions (20+ files)
│   ├── db/                        # Database utilities
│   ├── sync/                      # Offline sync service
│   ├── types/                     # TypeScript types
│   ├── email.ts                   # Email templates
│   ├── pdf-export.ts              # PDF generation
│   ├── prisma.ts                  # Prisma client
│   └── utils.ts                   # Utility functions
├── hooks/                         # React hooks
├── prisma/                        # Database
│   ├── schema.prisma              # Database schema
│   └── seed.ts                    # Seed data
├── types/                         # TypeScript declarations
├── __tests__/                     # Test files
├── public/                        # Static assets
├── auth.ts                        # NextAuth config
├── auth.config.ts                 # Auth callbacks
├── proxy.ts                       # Middleware
└── [config files]                 # Various configurations
```

---

## 4. Database Schema & Data Models

### 4.1 Entity-Relationship Diagram

```
┌──────────────────┐       ┌──────────────────┐       ┌──────────────────┐
│      User        │       │    CaseStudy     │       │ WeldingProcedure │
├──────────────────┤       ├──────────────────┤       ├──────────────────┤
│ id (PK)          │──┐    │ id (PK)          │───────│ id (PK)          │
│ email (unique)   │  │    │ type             │       │ caseStudyId (FK) │
│ name             │  │    │ status           │       │ baseMetalType    │
│ image            │  │    │ contributorId(FK)│◄──┐   │ waProductName    │
│ role             │  │    │ approverId (FK)  │◄──┤   │ weldingProcess   │
│ region           │  │    │ customerName     │   │   │ [30+ fields]     │
│ totalPoints      │  │    │ industry         │   │   └──────────────────┘
│ badges[]         │  │    │ location         │   │
│ notificationPref │  │    │ waSolution       │   │   ┌──────────────────┐
│ displayPref      │  │    │ waProduct        │   │   │  CostCalculator  │
└────────┬─────────┘  │    │ images[]         │   │   ├──────────────────┤
         │            │    │ supportingDocs[] │   │   │ id (PK)          │
         │            │    │ [20+ fields]     │   │   │ caseStudyId (FK) │───┐
         │            │    └────────┬─────────┘   │   │ materialCost*    │   │
         │            │             │             │   │ laborCost*       │   │
         │            └─────────────┼─────────────┘   │ downtimeCost*    │   │
         │                          │                 │ annualSavings    │   │
         │                          │                 └──────────────────┘   │
         │            ┌─────────────┴──────────────────────────────────────┘
         │            │
         │            ▼
         │  ┌──────────────────┐       ┌──────────────────┐
         │  │     Comment      │       │ CommentReaction  │
         │  ├──────────────────┤       ├──────────────────┤
         ├──│ id (PK)          │───────│ id (PK)          │
         │  │ content          │       │ commentId (FK)   │
         │  │ caseStudyId (FK) │       │ userId (FK)      │
         │  │ userId (FK)      │◄──────│ type             │
         │  │ likes            │       └──────────────────┘
         │  └──────────────────┘
         │
         │  ┌──────────────────┐       ┌──────────────────┐
         │  │    SavedCase     │       │   Notification   │
         │  ├──────────────────┤       ├──────────────────┤
         ├──│ id (PK)          │       │ id (PK)          │
         │  │ userId (FK)      │◄──────│ userId (FK)      │
         │  │ caseStudyId (FK) │       │ type             │
         │  └──────────────────┘       │ title            │
         │                             │ message          │
         │                             │ read             │
         │                             └──────────────────┘
         │
         │  ┌──────────────────┐       ┌──────────────────┐
         │  │     Account      │       │     Session      │
         │  ├──────────────────┤       ├──────────────────┤
         └──│ id (PK)          │       │ id (PK)          │
            │ userId (FK)      │       │ userId (FK)      │
            │ provider         │       │ sessionToken     │
            │ providerAccountId│       │ expires          │
            └──────────────────┘       └──────────────────┘
```

### 4.2 Core Data Models

#### 4.2.1 User Model

```prisma
model User {
  id            String    @id @default(cuid())
  name          String?
  email         String    @unique
  emailVerified DateTime?
  image         String?
  role          Role      @default(CONTRIBUTOR)
  region        String?
  totalPoints   Int       @default(0)
  badges        Badge[]

  // Preferences (JSON)
  notificationPreferences Json?  // Email/in-app notification settings
  displayPreferences      Json?  // Theme, results per page, view type

  // Relations
  caseStudies   CaseStudy[] @relation("Contributor")
  approvals     CaseStudy[] @relation("Approver")
  rejectedCases CaseStudy[] @relation("Rejector")
  comments      Comment[]
  savedCases    SavedCase[]
  notifications Notification[]
  accounts      Account[]
  sessions      Session[]

  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

enum Role {
  CONTRIBUTOR  // Can create and submit case studies
  APPROVER     // Can approve/reject submitted cases
  ADMIN        // Full system access
  VIEWER       // Read-only access
}

enum Badge {
  EXPLORER    // 10 Application Case Studies approved
  EXPERT      // 10 Tech Case Studies approved
  CHAMPION    // 10 Star Case Studies approved
}
```

#### 4.2.2 CaseStudy Model

```prisma
model CaseStudy {
  id                      String    @id @default(cuid())
  type                    CaseType  @default(APPLICATION)
  status                  Status    @default(DRAFT)

  // Contributors & Approval Chain
  contributorId           String
  contributor             User      @relation("Contributor")
  approverId              String?
  approver                User?     @relation("Approver")
  submittedAt             DateTime?
  approvedAt              DateTime?

  // Rejection Tracking
  rejectionReason         String?   @db.Text
  rejectedAt              DateTime?
  rejectedBy              String?
  rejector                User?     @relation("Rejector")

  // Core Fields
  customerName            String
  industry                String
  componentWorkpiece      String
  workType                WorkType
  wearType                WearType[]
  problemDescription      String    @db.Text
  previousSolution        String?
  previousServiceLife     String?
  competitorName          String?
  baseMetal               String?
  generalDimensions       String?

  // WA Solution
  waSolution              String
  waProduct               String
  technicalAdvantages     String?   @db.Text
  expectedServiceLife     String?
  solutionValueRevenue    Decimal?  @db.Decimal(12,2)
  annualPotentialRevenue  Decimal?  @db.Decimal(12,2)
  customerSavingsAmount   Decimal?  @db.Decimal(12,2)

  // Location
  location                String
  country                 String?

  // Media (Cloudinary URLs)
  images                  String[]
  supportingDocs          String[]

  // Translation
  originalLanguage        String    @default("en")
  translationAvailable    Boolean   @default(false)
  translatedText          String?   @db.Text

  // Relations
  wps                     WeldingProcedure?
  costCalculator          CostCalculator?
  comments                Comment[]
  savedBy                 SavedCase[]

  createdAt               DateTime  @default(now())
  updatedAt               DateTime  @updatedAt

  // Unique constraint prevents duplicate cases
  @@unique([customerName, location, componentWorkpiece, waProduct])
  @@index([status, type])
  @@index([industry, componentWorkpiece])
  @@index([contributorId])
}

enum CaseType {
  APPLICATION  // 1 point - Basic application case
  TECH         // 2 points - Technical case with WPS
  STAR         // 3 points - Complete case with cost analysis
}

enum Status {
  DRAFT       // Work in progress
  SUBMITTED   // Awaiting approval
  APPROVED    // Approved and published
  REJECTED    // Rejected with feedback
  PUBLISHED   // Visible in public library
}

enum WorkType {
  WORKSHOP    // Workshop-based work
  ON_SITE     // On-site at customer location
  BOTH        // Both workshop and on-site
}

enum WearType {
  ABRASION    // Abrasive wear
  IMPACT      // Impact damage
  CORROSION   // Corrosion damage
  TEMPERATURE // High temperature wear
  COMBINATION // Multiple wear types
}
```

#### 4.2.3 WeldingProcedure Model (WPS)

```prisma
model WeldingProcedure {
  id                    String    @id @default(cuid())
  caseStudyId           String    @unique
  caseStudy             CaseStudy @relation(fields: [caseStudyId])

  // Base Metal Information
  baseMetalType         String?
  baseMetalGrade        String?
  baseMetalThickness    String?
  surfacePreparation    String?

  // WA Product Details
  waProductName         String
  waProductDiameter     String?
  shieldingGas          String?
  shieldingFlowRate     String?
  flux                  String?
  standardDesignation   String?

  // Welding Parameters
  weldingProcess        String    // MIG, TIG, SMAW, etc.
  currentType           String?   // AC, DC+, DC-
  currentModeSynergy    String?
  wireFeedSpeed         String?
  intensity             String?
  voltage               String?
  heatInput             String?
  weldingPosition       String?   // Flat, Horizontal, Vertical, Overhead
  torchAngle            String?
  stickOut              String?
  travelSpeed           String?

  // Oscillation Parameters
  oscillationWidth      String?
  oscillationSpeed      String?
  oscillationStepOver   String?
  oscillationTempo      String?

  // Temperature Control
  preheatTemperature    String?
  interpassTemperature  String?
  postheatTemperature   String?
  pwhtDetails           String?   // Post-weld heat treatment

  // Results & Quality
  layerNumbers          Int?
  hardness              String?
  defectsObserved       String?
  additionalNotes       String?   @db.Text

  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt
}
```

#### 4.2.4 CostCalculator Model

```prisma
model CostCalculator {
  id                          String    @id @default(cuid())
  caseStudyId                 String    @unique
  caseStudy                   CaseStudy @relation(fields: [caseStudyId])

  // Before WA Solution
  materialCostBefore          Float
  laborCostBefore             Float
  downtimeCostBefore          Float
  maintenanceFrequencyBefore  Int       // Times per year

  // After WA Solution
  materialCostAfter           Float
  laborCostAfter              Float
  downtimeCostAfter           Float
  maintenanceFrequencyAfter   Int

  // Calculated Results
  totalCostBefore             Float
  totalCostAfter              Float
  annualSavings               Float
  savingsPercentage           Int

  createdAt                   DateTime  @default(now())
  updatedAt                   DateTime  @updatedAt
}
```

#### 4.2.5 Supporting Models

```prisma
model Comment {
  id            String    @id @default(cuid())
  content       String    @db.Text
  caseStudyId   String
  caseStudy     CaseStudy @relation(fields: [caseStudyId])
  userId        String
  user          User      @relation(fields: [userId])
  likes         Int       @default(0)
  reactions     CommentReaction[]

  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  @@index([caseStudyId])
}

model CommentReaction {
  id          String        @id @default(cuid())
  commentId   String
  comment     Comment       @relation(fields: [commentId])
  userId      String
  type        ReactionType
  createdAt   DateTime      @default(now())

  @@unique([commentId, userId, type])
  @@index([commentId])
}

enum ReactionType {
  LIKE        // 👍
  LOVE        // ❤️
  CELEBRATE   // 🎉
  INSIGHTFUL  // 💡
  HELPFUL     // 🙌
  THUMBS_DOWN // 👎
}

model SavedCase {
  id          String    @id @default(cuid())
  userId      String
  user        User      @relation(fields: [userId])
  caseStudyId String
  caseStudy   CaseStudy @relation(fields: [caseStudyId])
  createdAt   DateTime  @default(now())

  @@unique([userId, caseStudyId])
  @@index([userId])
  @@index([caseStudyId])
}

model Notification {
  id        String           @id @default(cuid())
  userId    String
  user      User             @relation(fields: [userId])
  type      NotificationType
  title     String
  message   String           @db.Text
  read      Boolean          @default(false)
  link      String?
  createdAt DateTime         @default(now())

  @@index([userId, read])
  @@index([createdAt])
}

enum NotificationType {
  CASE_APPROVED
  CASE_REJECTED
  NEW_COMMENT
  BADGE_EARNED
  BHAG_MILESTONE
  SYSTEM_ANNOUNCEMENT
}

model SystemConfig {
  id        String   @id @default(cuid())
  key       String   @unique
  value     String
  updatedAt DateTime @updatedAt
  updatedBy String?
  createdAt DateTime @default(now())
}

model EmailTemplate {
  id          String              @id @default(cuid())
  name        String
  type        EmailTemplateType   @unique
  subject     String
  htmlContent String              @db.Text
  textContent String?             @db.Text
  logoUrl     String?
  isActive    Boolean             @default(true)
  variables   String[]            // {{userName}}, {{caseTitle}}, etc.

  createdAt   DateTime            @default(now())
  updatedAt   DateTime            @updatedAt
}

enum EmailTemplateType {
  CASE_APPROVED
  CASE_REJECTED
  NEW_COMMENT
  BADGE_EARNED
  BHAG_MILESTONE
  WELCOME
  SYSTEM_ANNOUNCEMENT
}
```

---

## 5. Backend Infrastructure

### 5.1 Server Actions

The application uses Next.js Server Actions for secure server-side operations. Located in `/lib/actions/`:

| Action File | Purpose | Key Functions |
|-------------|---------|---------------|
| `case-study-actions.ts` | CRUD operations for case studies | create, update, delete, submit, publish |
| `approval-actions.ts` | Approval workflow | approve, reject, getPendingCases |
| `comment-actions.ts` | Comment management | create, delete, react |
| `analytics-actions.ts` | Analytics data | getUserStats, getOverview, getCharts |
| `notification-actions.ts` | Notification system | create, markRead, getUnread |
| `openai-actions.ts` | AI integration | summarize, translate, improve |
| `image-upload-actions.ts` | Image handling | uploadImage, deleteImage |
| `document-upload-actions.ts` | Document handling | uploadDocument |
| `search-actions.ts` | Search functionality | searchCases, getFilters |
| `badge-actions.ts` | Badge management | checkAndAwardBadges |
| `bhag-actions.ts` | BHAG tracking | getProgress, updateTarget |
| `cost-calculator-actions.ts` | Cost calculations | calculate, save |
| `wps-actions.ts` | Welding procedures | save, update |
| `system-config-actions.ts` | System settings | get, update |
| `admin-actions.ts` | Admin operations | updateRole, deleteUser |
| `autocomplete-actions.ts` | Form autocomplete | getIndustries, getProducts |

### 5.2 API Route Architecture

RESTful API endpoints located in `/app/api/`:

```
/api
├── /auth/[...nextauth]           # NextAuth handler
│   └── POST, GET                 # OAuth callbacks, session
│
├── /case-studies
│   ├── /[id]                     # Single case operations
│   │   └── GET                   # Get case by ID
│   └── /search                   # Search endpoint
│       └── GET                   # Search with filters
│
├── /approvals
│   └── GET                       # Get pending approvals (APPROVER+)
│
├── /comments
│   ├── GET, POST                 # List/create comments
│   ├── /[id]
│   │   └── DELETE                # Delete comment
│   └── /react
│       └── POST                  # Add reaction
│
├── /saved-cases
│   └── GET, POST                 # List/save bookmarks
│
├── /notifications
│   ├── GET                       # List notifications
│   ├── /[id]
│   │   └── PATCH                 # Mark as read
│   └── /test
│       └── POST                  # Test notification
│
├── /user
│   ├── /update-profile           # Update profile
│   │   └── POST
│   ├── /preferences              # User preferences
│   │   └── PUT
│   ├── /upload-avatar            # Avatar upload
│   │   └── POST
│   └── /export-data              # GDPR data export
│       └── GET
│
├── /admin
│   ├── /update-user-role         # Change user role
│   │   └── POST
│   └── /delete-user              # Delete user
│       └── DELETE
│
├── /system-config
│   ├── GET                       # List all config
│   └── /[key]
│       └── GET, PUT              # Get/update config
│
├── /email
│   ├── /preview                  # Preview templates
│   │   └── GET
│   └── /test                     # Send test email
│       └── POST
│
├── /maintenance-status           # Maintenance mode check
│   └── GET
│
├── /change-role                  # Role change
│   └── POST
│
└── /dev
    └── /switch-role              # Dev role switching
        └── POST
```

---

## 6. Authentication & Authorization

### 6.1 Authentication Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Client    │────▶│   NextAuth  │────▶│   Google    │────▶│  Database   │
│             │     │  Middleware │     │    OAuth    │     │   (User)    │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
       │                   │                   │                   │
       │ 1. Login Click    │                   │                   │
       │──────────────────▶│                   │                   │
       │                   │ 2. Redirect       │                   │
       │                   │──────────────────▶│                   │
       │                   │                   │ 3. Auth           │
       │                   │◀──────────────────│                   │
       │                   │ 4. Token + User   │                   │
       │                   │───────────────────────────────────────▶│
       │                   │                   │ 5. Create/Update  │
       │                   │◀───────────────────────────────────────│
       │◀──────────────────│                   │                   │
       │  6. JWT Session   │                   │                   │
```

### 6.2 Authentication Providers

#### Google OAuth (Primary)
```typescript
Google({
  clientId: process.env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  authorization: {
    params: {
      prompt: 'consent',
      access_type: 'offline',
      response_type: 'code',
      hd: 'weldingalloys.com', // Domain restriction
    },
  },
})
```

#### Credentials Provider (Development/Testing)
- Email/password authentication
- bcrypt password hashing
- Database user lookup

### 6.3 Role-Based Access Control (RBAC)

| Role | Permissions |
|------|-------------|
| **VIEWER** | Read-only access to approved cases |
| **CONTRIBUTOR** | Create, edit own cases, submit for approval |
| **APPROVER** | All CONTRIBUTOR permissions + approve/reject cases |
| **ADMIN** | Full system access, user management, system config |

### 6.4 Protected Routes

| Route Pattern | Required Role | Description |
|---------------|---------------|-------------|
| `/dashboard/*` | Any authenticated | Dashboard access |
| `/dashboard/admin/*` | ADMIN | Admin panel |
| `/dashboard/system-settings` | ADMIN | System configuration |
| `/dashboard/approvals` | APPROVER+ | Approval queue |
| `/library/*` | None (public) | Public case library |

### 6.5 Session Management

- **Strategy:** JWT (JSON Web Tokens)
- **Adapter:** Prisma Adapter
- **Session Data:**
  - `user.id` - User identifier
  - `user.role` - User role for RBAC
  - `user.region` - Geographic region
  - `user.totalPoints` - Gamification points

---

## 7. Third-Party Integrations

### 7.1 OpenAI Integration

**Purpose:** AI-powered text processing for case studies

**Features:**
- Text summarization (up to 500 tokens)
- Multi-language translation
- Text improvement/polishing

**Implementation:** `/lib/actions/openai-actions.ts`

```typescript
// Example: Summarize case study description
const summary = await summarizeText(problemDescription);

// Example: Translate to Spanish
const translated = await translateText(content, 'Spanish');
```

**Model Used:** GPT-4o-mini (cost-effective, fast)

### 7.2 Cloudinary Integration

**Purpose:** Cloud-based image and document storage

**Features:**
- Image upload and optimization
- Document storage (PDF, DOC, etc.)
- Automatic format conversion
- CDN delivery

**Configuration:**
```
CLOUDINARY_URL=cloudinary://api_key:api_secret@cloud_name
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
```

**Upload Constraints:**
- Max file size: 10MB
- Allowed image types: JPEG, PNG, WebP, GIF
- Automatic optimization applied

### 7.3 Resend Email Integration

**Purpose:** Transactional email delivery

**Email Templates:**
| Template | Trigger | Description |
|----------|---------|-------------|
| Case Approved | Case approval | Notifies contributor of approval |
| Case Rejected | Case rejection | Includes rejection feedback |
| New Comment | Comment added | Notifies case owner |
| Badge Earned | Badge awarded | Congratulates user |
| BHAG Milestone | Progress milestone | Team notification |
| Welcome | User registration | Onboarding email |

**Implementation:** `/lib/email.ts`

### 7.4 Google OAuth Integration

**Purpose:** Single Sign-On (SSO) for enterprise users

**Domain Restriction:** `@weldingalloys.com` only (production)

**Scopes:**
- `openid` - User identification
- `email` - Email address
- `profile` - Name and picture

---

## 8. Progressive Web App (PWA) & Offline Capabilities

### 8.1 PWA Configuration

**Manifest:** `/app/manifest.ts`

```typescript
{
  name: 'Case Study Builder | Welding Alloys',
  short_name: 'CS Builder',
  description: 'Capture, manage, and share industrial welding case studies',
  start_url: '/?source=pwa',
  display: 'standalone',
  theme_color: '#006838',  // Welding Alloys green
  background_color: '#111827',
  orientation: 'portrait-primary',
  categories: ['productivity', 'business', 'utilities'],
}
```

**PWA Shortcuts:**
- New Case Study (`/dashboard/new`)
- Library (`/dashboard/library`)
- Search (`/dashboard/search`)

### 8.2 Service Worker (Serwist)

**Configuration:** `/next.config.ts`

```typescript
withSerwist({
  swSrc: 'app/sw.ts',
  swDest: 'public/sw.js',
  disable: process.env.NODE_ENV !== 'production',
  reloadOnOnline: true,
  cacheOnNavigation: true,
})
```

**Caching Strategy:**
- Precaching for critical assets
- Network-first with cache fallback
- Offline page fallback (`/offline`)

### 8.3 Offline Storage (Dexie/IndexedDB)

**Database Name:** `CaseStudyBuilderDB`

**Schema:** `/lib/db/schema.ts`

| Table | Purpose | Key Indexes |
|-------|---------|-------------|
| `caseStudies` | Draft and cached cases | status, type, industry, contributorId |
| `savedCases` | User bookmarks | userId, caseStudyId |
| `users` | Cached user data | email, role |
| `comments` | Cached comments | caseStudyId, userId |
| `weldingProcedures` | WPS data | caseStudyId, waProductName |
| `analytics` | Cached analytics | type, cachedAt |
| `pendingChanges` | Sync queue | entity, operation |
| `syncMetadata` | Sync status | entity, lastSyncedAt |

### 8.4 Offline Sync Service

**Location:** `/lib/sync/syncService.ts`

**Features:**
- Queue offline actions for later sync
- Auto-sync when connection restored
- Retry logic (max 5 attempts)
- Conflict resolution

**Supported Offline Operations:**
- Create/edit case study drafts
- Save/unsave cases (bookmarks)
- Browse cached approved cases
- View saved cases (fully cached)
- Search previously loaded data

---

## 9. Security Implementation

### 9.1 Security Headers

Configured in `/next.config.ts`:

| Header | Value | Purpose |
|--------|-------|---------|
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains; preload` | Force HTTPS |
| `X-Content-Type-Options` | `nosniff` | Prevent MIME sniffing |
| `X-Frame-Options` | `SAMEORIGIN` | Clickjacking protection |
| `X-XSS-Protection` | `1; mode=block` | XSS filter |
| `Referrer-Policy` | `origin-when-cross-origin` | Control referrer info |
| `Permissions-Policy` | `camera=(self), microphone=(self)` | Feature permissions |

### 9.2 Content Security Policy (CSP)

```
default-src 'self';
script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.jsdelivr.net;
style-src 'self' 'unsafe-inline';
img-src 'self' data: https: blob:;
font-src 'self' data:;
connect-src 'self' https://api.openai.com https://res.cloudinary.com
            https://*.google.com https://*.googleapis.com;
media-src 'self';
object-src 'none';
frame-src 'none';
base-uri 'self';
form-action 'self';
frame-ancestors 'none';
upgrade-insecure-requests;
```

### 9.3 Authentication Security

- **Domain restriction:** Only `@weldingalloys.com` emails (production)
- **JWT sessions:** Secure, httpOnly cookies
- **Password hashing:** bcrypt with salt rounds
- **OAuth:** Server-side token handling

### 9.4 Data Validation

- **Zod schemas:** Runtime validation on all inputs
- **Prisma:** Parameterized queries (SQL injection prevention)
- **File uploads:** Type and size validation

### 9.5 Maintenance Mode

- Admin-only bypass
- Configurable via SystemConfig
- Automatic redirect to `/maintenance`

---

## 10. API Reference

### 10.1 Case Studies API

#### GET /api/case-studies/[id]
Retrieve a single case study by ID.

**Response:**
```json
{
  "id": "clx...",
  "type": "TECH",
  "status": "APPROVED",
  "customerName": "ACME Corp",
  "industry": "Mining",
  "waSolution": "Hardox overlay",
  "waProduct": "HARDFACE HC-O",
  "contributor": {
    "id": "...",
    "name": "John Doe",
    "email": "john@weldingalloys.com"
  },
  "wps": { ... },
  "costCalculator": { ... },
  "comments": [ ... ]
}
```

#### GET /api/case-studies/search
Search case studies with filters.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `q` | string | Search query |
| `type` | enum | APPLICATION, TECH, STAR |
| `status` | enum | DRAFT, SUBMITTED, APPROVED, etc. |
| `industry` | string | Industry filter |
| `page` | number | Page number (default: 1) |
| `limit` | number | Results per page (default: 10) |

### 10.2 Approvals API

#### GET /api/approvals
Get pending cases for approval (APPROVER+ only).

**Response:**
```json
{
  "cases": [
    {
      "id": "...",
      "customerName": "...",
      "submittedAt": "2024-12-01T...",
      "contributor": { ... }
    }
  ],
  "total": 15
}
```

### 10.3 Comments API

#### POST /api/comments
Create a new comment.

**Request Body:**
```json
{
  "caseStudyId": "clx...",
  "content": "Great case study!"
}
```

#### POST /api/comments/react
Add reaction to a comment.

**Request Body:**
```json
{
  "commentId": "clx...",
  "type": "LIKE"
}
```

### 10.4 Notifications API

#### GET /api/notifications
Get user notifications.

**Response:**
```json
{
  "notifications": [
    {
      "id": "...",
      "type": "CASE_APPROVED",
      "title": "Case Study Approved",
      "message": "Your case study has been approved!",
      "read": false,
      "createdAt": "..."
    }
  ],
  "unreadCount": 5
}
```

### 10.5 User API

#### PUT /api/user/preferences
Update user preferences.

**Request Body:**
```json
{
  "notificationPreferences": {
    "emailNotifications": true,
    "inAppNotifications": true
  },
  "displayPreferences": {
    "theme": "dark",
    "resultsPerPage": 20
  }
}
```

### 10.6 Admin API

#### POST /api/admin/update-user-role
Update a user's role (ADMIN only).

**Request Body:**
```json
{
  "userId": "clx...",
  "role": "APPROVER"
}
```

---

## 11. Environment Configuration

### 11.1 Required Environment Variables

```bash
# Database
POSTGRES_URL=postgresql://user:password@host:5432/database

# Authentication
NEXTAUTH_SECRET=your-secret-key-generated-with-openssl
NEXTAUTH_URL=https://your-domain.com

# Google OAuth
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret

# Cloudinary
CLOUDINARY_URL=cloudinary://api_key:api_secret@cloud_name
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name

# OpenAI
OPENAI_API_KEY=sk-your-api-key

# Resend (Email)
RESEND_API_KEY=re_your-api-key
RESEND_FROM_EMAIL=noreply@your-domain.com
```

### 11.2 Optional Environment Variables

```bash
# Application
NEXT_PUBLIC_APP_URL=https://casestudy.weldingalloys.com
NODE_ENV=production

# Development
DEV_PASSWORD=your-dev-password

# Monitoring (Optional)
SENTRY_DSN=https://your-sentry-dsn
VERCEL_ANALYTICS_ID=your-analytics-id

# Build
SERWIST_SUPPRESS_TURBOPACK_WARNING=1
```

### 11.3 SystemConfig Keys

Stored in database, configurable via Admin panel:

| Key | Default | Description |
|-----|---------|-------------|
| `bhag_target` | 1000 | BHAG target case count |
| `maintenance_mode` | false | Enable maintenance mode |
| `points_application` | 1 | Points for Application case |
| `points_tech` | 2 | Points for Tech case |
| `points_star` | 3 | Points for Star case |
| `badge_explorer_threshold` | 10 | Cases for Explorer badge |
| `badge_expert_threshold` | 10 | Cases for Expert badge |
| `badge_champion_threshold` | 10 | Cases for Champion badge |

---

## 12. Deployment & Build Process

### 12.1 Build Commands

```bash
# Development
npm run dev          # Start dev server (port 3010, webpack mode)

# Production Build
npm run build        # prisma generate && next build

# Production Start
npm run start        # Start production server (port 3010)

# Vercel Build (CI/CD)
npm run vercel-build # Full build with Prisma setup
```

### 12.2 Database Commands

```bash
npm run db:push      # Push schema to database
npm run db:studio    # Open Prisma Studio GUI
npm run db:seed      # Seed initial data
```

### 12.3 Deployment Checklist

1. **Environment Variables**
   - [ ] All required variables configured
   - [ ] Production URLs set correctly
   - [ ] API keys validated

2. **Database**
   - [ ] PostgreSQL instance provisioned
   - [ ] Schema pushed (`prisma db push`)
   - [ ] Seed data loaded if needed

3. **External Services**
   - [ ] Cloudinary configured
   - [ ] OpenAI API key active
   - [ ] Resend verified domain
   - [ ] Google OAuth credentials

4. **Security**
   - [ ] HTTPS enforced
   - [ ] CSP headers configured
   - [ ] Domain restrictions active

### 12.4 Recommended Hosting

- **Platform:** Vercel (optimized for Next.js)
- **Database:** Vercel Postgres, Supabase, or Neon
- **Region:** Deploy close to user base

---

## 13. Testing Infrastructure

### 13.1 Testing Stack

| Tool | Version | Purpose |
|------|---------|---------|
| Jest | 30.2.0 | Test runner |
| Testing Library | 16.3.0 | React component testing |
| jest-environment-jsdom | 30.2.0 | Browser environment |

### 13.2 Test Commands

```bash
npm run test         # Run tests with coverage
npm run test:watch   # Watch mode
npm run test:ci      # CI mode (2 workers)
```

### 13.3 Test Coverage

Coverage targets:
- `app/**`
- `components/**`
- `lib/**`
- `hooks/**`

### 13.4 Test Structure

```
__tests__/
├── api/              # API route tests
├── components/       # Component tests
├── hooks/            # Hook tests
├── lib/              # Utility tests
├── pages/            # Page tests
├── integration/      # Integration tests
└── master-test-suite.test.ts
```

---

## 14. Application Features

### 14.1 Case Study Types

| Type | Points | Description | Required Fields |
|------|--------|-------------|-----------------|
| **APPLICATION** | 1 | Basic application case | Core fields only |
| **TECH** | 2 | Technical case | Core + WPS data |
| **STAR** | 3 | Complete case | Core + WPS + Cost Calculator |

### 14.2 Approval Workflow

```
DRAFT ──▶ SUBMITTED ──▶ APPROVED ──▶ PUBLISHED
                 │
                 └──▶ REJECTED (with feedback)
                           │
                           └──▶ Revise & Resubmit
```

### 14.3 Gamification System

**Points:**
- Awarded on case approval
- Based on case type (1-3 points)

**Badges:**
| Badge | Requirement | Description |
|-------|-------------|-------------|
| Explorer | 10 Application cases | Recognition for Application contributions |
| Expert | 10 Tech cases | Recognition for technical expertise |
| Champion | 10 Star cases | Top contributor status |

**BHAG (Big Hairy Audacious Goal):**
- Company-wide target (default: 1000 cases)
- Milestone notifications at 25%, 50%, 75%, 100%

### 14.4 Search & Discovery

**Search Fields:**
- Customer name
- Industry
- Component/workpiece
- WA product
- Location/country
- Problem description

**Filters:**
- Case type
- Status
- Industry
- Work type
- Wear type
- Date range

### 14.5 Collaboration Features

**Comments:**
- Threaded comments on cases
- Emoji reactions (6 types)
- Owner notifications

**Saved Cases:**
- Bookmark cases for offline access
- Personal collection management

### 14.6 Analytics Dashboard

**User Analytics:**
- Cases submitted (by type)
- Points earned
- Badges achieved
- Contribution timeline

**System Analytics (Admin):**
- Total cases by status
- Approval rates
- Top contributors
- BHAG progress

### 14.7 Admin Capabilities

- User role management
- System configuration
- Maintenance mode control
- Email template management
- User deletion (GDPR compliance)

---

## Appendix A: Technology Version Matrix

| Technology | Version | License | Notes |
|------------|---------|---------|-------|
| Next.js | 16.0.0 | MIT | App Router |
| React | 19.0.0 | MIT | Server Components |
| TypeScript | 5.6 | Apache 2.0 | Strict mode |
| Prisma | 6.19.0 | Apache 2.0 | PostgreSQL |
| NextAuth | 5.0.0-beta | ISC | v5 beta |
| Tailwind CSS | 3.4.17 | MIT | JIT mode |
| Dexie | 4.2.1 | Apache 2.0 | IndexedDB |
| Serwist | 9.2.1 | MIT | Service Worker |
| OpenAI SDK | 4.104.0 | MIT | GPT-4o-mini |
| Cloudinary | 2.8.0 | MIT | Image hosting |
| Resend | 6.4.2 | MIT | Email service |
| Zod | 3.23.8 | MIT | Validation |
| Recharts | 2.15.4 | MIT | Charts |
| jsPDF | 2.5.2 | MIT | PDF generation |

---

## Appendix B: Database Indexes

```sql
-- Case Studies
CREATE INDEX idx_case_status_type ON "CaseStudy"(status, type);
CREATE INDEX idx_case_industry ON "CaseStudy"(industry, "componentWorkpiece");
CREATE INDEX idx_case_contributor ON "CaseStudy"("contributorId");
CREATE UNIQUE INDEX idx_case_unique ON "CaseStudy"(
  "customerName", location, "componentWorkpiece", "waProduct"
);

-- Comments
CREATE INDEX idx_comment_case ON "Comment"("caseStudyId");

-- Reactions
CREATE INDEX idx_reaction_comment ON "CommentReaction"("commentId");
CREATE UNIQUE INDEX idx_reaction_unique ON "CommentReaction"(
  "commentId", "userId", type
);

-- Saved Cases
CREATE INDEX idx_saved_user ON "SavedCase"("userId");
CREATE INDEX idx_saved_case ON "SavedCase"("caseStudyId");
CREATE UNIQUE INDEX idx_saved_unique ON "SavedCase"("userId", "caseStudyId");

-- Notifications
CREATE INDEX idx_notif_user_read ON "Notification"("userId", read);
CREATE INDEX idx_notif_created ON "Notification"("createdAt");
```

---

## Appendix C: API Response Codes

| Code | Meaning | Common Causes |
|------|---------|---------------|
| 200 | Success | Request completed |
| 201 | Created | Resource created |
| 400 | Bad Request | Invalid input, validation error |
| 401 | Unauthorized | Missing/invalid authentication |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Duplicate resource |
| 500 | Server Error | Internal error |

---

**Document End**

*For questions or updates to this documentation, contact the development team.*
