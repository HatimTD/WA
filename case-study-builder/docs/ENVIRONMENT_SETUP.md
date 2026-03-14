# Environment Setup Guide

This document lists all required external services, their purpose, and where to get credentials.

## Required Services

| # | Service | Purpose | Link |
|---|---------|---------|------|
| 1 | **PostgreSQL (Vercel Postgres)** | Main database — stores users, case studies, approvals, comments, notifications | [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres) (powered by Neon, integrated into Vercel dashboard) |
| 2 | **Upstash Redis** | Server-side cache — stores NetSuite customer/employee/item data for fast search | [upstash.com](https://upstash.com) |
| 3 | **Google OAuth 2.0** | Google login (SSO) — authenticates @welding-alloys.com users via Google Workspace | [Google Cloud Console](https://console.cloud.google.com/apis/credentials) → Create OAuth 2.0 Client ID |
| 4 | **Cloudinary** | Image & file storage — stores case study photos and supporting documents | [cloudinary.com](https://cloudinary.com) |
| 5 | **OpenAI API** | AI features — auto-translation, tag suggestions, text improvement, image analysis | [platform.openai.com/api-keys](https://platform.openai.com/api-keys) |
| 6 | **NetSuite (OAuth 1.0a)** | ERP integration — syncs customers, employees, items, subsidiaries from NetSuite | Internal — credentials from NetSuite admin |
| 7 | **Resend** | Transactional emails — approval notifications, rejection alerts, GDPR verification | [resend.com](https://resend.com) |
| 8 | **Vercel** | Hosting & deployment — runs the app, manages cron jobs, edge functions | [vercel.com](https://vercel.com) |
| 9 | **Sentry** (optional) | Error monitoring — tracks runtime errors and performance issues | [sentry.io](https://sentry.io) |
| 10 | **Logtail** (optional) | Log management — centralized logging for debugging | [logtail.com](https://logtail.com) |

## Environment Variables

Create a `.env.local` file in the `case-study-builder/` directory with the following variables:

### Database (Vercel Postgres / Neon)

Vercel Postgres is the recommended option since the app deploys on Vercel. It's powered by Neon under the hood and is fully integrated into the Vercel dashboard.

**How to set up:**
1. Go to your Vercel project dashboard → **Storage** tab
2. Click **Create Database** → Select **Postgres (Neon)**
3. Choose a region close to your users (e.g., `eu-central-1` for Europe)
4. Vercel automatically creates these env vars in your project:

```bash
# These are auto-populated by Vercel when you create a Postgres database
# You do NOT need to set them manually if using Vercel Postgres
POSTGRES_URL="postgresql://user:password@host:5432/dbname?sslmode=require"
POSTGRES_PRISMA_URL="postgresql://user:password@host:5432/dbname?sslmode=require&pgbouncer=true"
POSTGRES_URL_NON_POOLING="postgresql://user:password@host:5432/dbname?sslmode=require"
```

> **Note:** If using Vercel Postgres, all 3 connection strings are auto-injected into your project environment. For local development, copy them from Vercel dashboard → Settings → Environment Variables into your `.env.local`.

**After creating the database, initialize it:**
```bash
npm run db:push        # Push Prisma schema to create all tables
npm run db:seed-lists  # Seed master lists (industries, wear types, subsidiaries, etc.)
```

### Authentication (NextAuth + Google OAuth)

Google OAuth is used for SSO login. Only users with a `@welding-alloys.com` Google Workspace account can log in (domain restriction is configured in Google Cloud Console).

**How to set up Google OAuth:**

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project (or select existing one for Welding Alloys)
3. Navigate to **APIs & Services → Credentials**
4. Click **Create Credentials → OAuth 2.0 Client ID**
5. Select **Web application** as the application type
6. Set the **Authorized JavaScript origins**:
   - `https://your-production-domain.com` (production)
   - `http://localhost:3010` (local development)
7. Set the **Authorized redirect URIs**:
   - `https://your-production-domain.com/api/auth/callback/google` (production)
   - `http://localhost:3010/api/auth/callback/google` (local development)
8. Click **Create** — you'll get the Client ID and Client Secret
9. (Optional) To restrict to `@welding-alloys.com` only: go to **OAuth consent screen → User type → Internal** (requires Google Workspace admin)

```bash
# NextAuth secret — generate with: openssl rand -base64 32
NEXTAUTH_SECRET="your-random-secret-here"

# App URL (must match the authorized redirect URI above)
NEXTAUTH_URL="https://your-production-domain.com"

# Google OAuth credentials from step 8 above
GOOGLE_CLIENT_ID="963683364438-xxxxx.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-xxxxx"
```

> **Important:** The `NEXTAUTH_URL` must exactly match the domain in your Google OAuth redirect URIs. For local development, set it to `http://localhost:3010`.

### Redis Cache (Upstash)

```bash
# From Upstash dashboard: https://console.upstash.com
UPSTASH_REDIS_REST_URL="https://your-region.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your-token"
```

### File Storage (Cloudinary)

```bash
# From Cloudinary dashboard: https://cloudinary.com/console
CLOUDINARY_URL="cloudinary://api_key:api_secret@cloud_name"
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="your-cloud-name"
```

### AI (OpenAI)

```bash
# From: https://platform.openai.com/api-keys
OPENAI_API_KEY="sk-..."
```

### NetSuite Integration

```bash
# NetSuite account ID (Welding Alloys)
NETSUITE_ACCOUNT_ID="4129093"

# OAuth 1.0a Token-Based Authentication (TBA)
# From NetSuite: Setup → Integration → Manage Integrations
NETSUITE_CONSUMER_KEY="your-consumer-key"
NETSUITE_CONSUMER_SECRET="your-consumer-secret"

# From NetSuite: Setup → Users/Roles → Access Tokens
NETSUITE_TOKEN_ID="your-token-id"
NETSUITE_TOKEN_SECRET="your-token-secret"

# NetSuite API endpoints
NETSUITE_REST_URL="https://4129093.suitetalk.api.netsuite.com/services/rest"
NETSUITE_RESTLET_URL="https://4129093.restlets.api.netsuite.com/app/site/hosting/restlet.nl?script=XXX&deploy=1"
```

### Email (Resend)

```bash
# From: https://resend.com/api-keys
RESEND_API_KEY="re_..."
```

### Cron Jobs (Vercel)

```bash
# Secret to authenticate cron job requests
# Generate with: openssl rand -base64 32
CRON_SECRET="your-cron-secret"
```

### Monitoring (Optional)

```bash
# Sentry — from: https://sentry.io/settings/projects/ ( you dont need it)
SENTRY_DSN="https://...@sentry.io/..."
NEXT_PUBLIC_SENTRY_DSN="https://...@sentry.io/..."

# Logtail — from: https://logtail.com ( you dont need it)
LOGTAIL_SOURCE_TOKEN="your-token"

# Vercel Analytics (auto-configured on Vercel)
NEXT_PUBLIC_VERCEL_ANALYTICS_ID="..."
```

### Development Only

```bash
# Dev login credentials (bypasses Google OAuth for local development)
DEV_ADMIN_EMAIL="admin@weldingalloys.com"
DEV_ADMIN_PASSWORD_HASH="$2a$10$..."  # bcrypt hash of your dev password
```

## Data Flow Architecture

```
Daily Cron (22:00 UTC)
  └─ POST /api/cron/netsuite-sync
       ├─ Customers → Redis cache (1 week TTL, chunked for 10MB limit)
       ├─ Employees → PostgreSQL waNetsuiteEmployee table + Redis cache
       ├─ Items     → Redis cache (1 week TTL, chunked)
       └─ Subsidiaries → Redis cache

Server Startup 
  ├─ Check Redis for customer cache
  │   ├─ Exists → Skip preload (0 API calls)
  │   └─ Missing → Fetch from NetSuite API → Store in Redis
  └─ Sync employees to PostgreSQL (always, for login auto-assign)

User Opens App
  ├─ Browser IndexedDB empty?
  │   ├─ Yes → Fetch from Redis → Store in IndexedDB
  │   └─ No → Use IndexedDB data
  └─ User searches → Instant from IndexedDB (<1ms)

Google Login
  └─ auth.ts JWT callback
       ├─ Find employee by email in waNetsuiteEmployee table
       ├─ Match → Auto-assign subsidiary, name, NetSuite ID
       └─ No match → User gets default CONTRIBUTOR role, no subsidiary
```

## Setup Steps

1. **Create all external service accounts** listed in the table above
2. **Copy `.env.example` to `.env.local`** and fill in all credentials
3. **Initialize database**: `npm run db:push && npm run db:seed-lists`
4. **Start dev server**: `npm run dev` (runs on port 3010)
5. **Verify NetSuite connection**: Check server logs for `[Server] Employee DB sync: X employees`
6. **Configure Google OAuth**: Add `http://localhost:3010/api/auth/callback/google` as redirect URI
7. **Deploy to Vercel**: Connect repo, add all env vars, deploy
8. **Set up cron**: Vercel cron is configured in `vercel.json` (daily at 22:00 UTC)
