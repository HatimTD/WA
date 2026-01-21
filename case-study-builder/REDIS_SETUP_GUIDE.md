# Redis Setup Guide - Upstash (Free Tier)

## 🚀 Quick Start (5 minutes)

### Step 1: Create Upstash Account

1. Go to: https://upstash.com
2. Click **"Sign Up"** (free, no credit card required)
3. Sign up with GitHub, Google, or Email

### Step 2: Create Redis Database

1. After login, click **"Create Database"**
2. Choose options:
   - **Name:** `netsuite-cache` (or any name)
   - **Type:** Choose **"Regional"** for lowest latency
     - Select region closest to your server (e.g., `us-east-1` for US East Coast)
   - **TLS:** Leave enabled ✅
   - **Eviction:** Select **"noeviction"** (we manage TTL manually)

3. Click **"Create"**

### Step 3: Get Credentials

1. After creation, you'll see your database dashboard
2. Click on your database name
3. Scroll to **"REST API"** section
4. Copy two values:
   - **UPSTASH_REDIS_REST_URL**: `https://xxxxx.upstash.io`
   - **UPSTASH_REDIS_REST_TOKEN**: `AXxxxxx...`

### Step 4: Add to .env.local

1. Open `case-study-builder/.env.local`
2. Add these lines (replace with your actual values):

```env
# Redis Cache (Upstash)
UPSTASH_REDIS_REST_URL="https://caring-coyote-12345.upstash.io"
UPSTASH_REDIS_REST_TOKEN="AXn1cG1234567890abcdefghijklmnopqrstuvwxyz"
```

### Step 5: Restart Dev Server

```bash
# Stop current server (Ctrl+C)
# Restart
npm run dev
```

### Step 6: Verify It's Working

Watch the server logs:

```
[Server] Initializing...
[Redis] Connected to Upstash Redis ✅
[NetSuite] Starting background cache preload...
[Redis] Cached 38658 customers for 1 week ✅
[Redis] Cached 70368 items for 1 week ✅
```

Search for a customer - should see:
```
[Redis] Cache HIT - customers ⚡
```

## 📊 Free Tier Limits

Upstash free tier includes:
- ✅ **10,000 commands per day**
- ✅ **256 MB storage**
- ✅ **Unlimited databases**
- ✅ **REST API access**
- ✅ **TLS encryption**
- ✅ **Global replication** (on paid plans)

### Estimated Usage:

| Operation | Commands | Frequency | Daily Total |
|-----------|----------|-----------|-------------|
| Cache preload (startup) | 2 (SET) | 1x/day | 2 |
| Customer search (hit) | 1 (GET) | 100x/day | 100 |
| Item search (hit) | 1 (GET) | 50x/day | 50 |
| **Total** | | | **~152/day** |

**You'll use <2% of free tier!** 🎉

## 🔧 Configuration Options

### Cache Duration

Default is 1 week (604800 seconds). To change:

```typescript
// lib/cache/redis-client.ts
private cacheTTL = 604800; // seconds

// Options:
// 1 hour: 3600
// 1 day: 86400
// 1 week: 604800 (current)
// 2 weeks: 1209600
// 1 month: 2592000
```

### Eviction Policy

**Current:** `noeviction` - Returns error when memory full (prevents data loss)

**Alternative:** `allkeys-lru` - Automatically removes least recently used keys

Change in Upstash dashboard: Database Settings > Eviction Policy

## 📈 Monitoring

### Upstash Dashboard

View real-time stats:
- **Requests per second**
- **Memory usage**
- **Hit/miss ratio**
- **Response time**

### Application Logs

Enable detailed logging:

```typescript
// Set in .env.local
REDIS_DEBUG=true
```

Logs will show:
```
[Redis] GET netsuite:customers:all - HIT (1.2ms)
[Redis] SET netsuite:items:all - OK (2.1ms)
[Redis] Cache size: 55MB / 256MB (21% used)
```

## 🐛 Troubleshooting

### Error: "Connection refused"

**Problem:** Redis URL or token incorrect

**Solution:**
1. Verify credentials in Upstash dashboard
2. Check `.env.local` has correct values
3. Restart dev server

### Error: "Request timeout"

**Problem:** Network issue or Redis down

**Solution:**
1. Check Upstash status: https://status.upstash.com
2. Verify firewall not blocking Upstash
3. Try different region

### Cache Not Working

**Problem:** Data still fetching from NetSuite every time

**Solution:**
1. Check logs for `[Redis] Connected ✅`
2. Verify `NETSUITE_DATA_SOURCE="netsuite"` in .env.local
3. Clear cache and restart:
   ```bash
   # In browser console or API call:
   fetch('/api/cache/clear', { method: 'POST' })
   ```

### "Too many requests" Error

**Problem:** Exceeded free tier limit (10K/day)

**Solution:**
1. Check Upstash dashboard for usage
2. Increase cache TTL to reduce requests
3. Upgrade to paid plan ($10/month for 100K/day)

## 🔒 Security

### Best Practices:

✅ **Never commit credentials**
- Use `.env.local` (gitignored)
- Never put in `.env.example`

✅ **Use TLS**
- Upstash enables TLS by default
- All data encrypted in transit

✅ **Rotate tokens**
- Regenerate tokens periodically
- Do this in Upstash dashboard

✅ **Limit access**
- Only give tokens to trusted team members
- Each developer should have own database

## 📱 Production Deployment

### Vercel

1. Go to: https://vercel.com/dashboard
2. Select your project
3. Go to: Settings > Environment Variables
4. Add:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`
5. Redeploy

### Other Platforms

Same environment variables work on:
- ✅ AWS (Elastic Beanstalk, Lambda)
- ✅ Google Cloud (App Engine, Cloud Run)
- ✅ Azure (App Service)
- ✅ Railway
- ✅ Render
- ✅ Fly.io

## 🎯 Next Steps

After Redis is working:

1. ✅ **Monitor usage** - Check Upstash dashboard weekly
2. ✅ **Add alerts** - Set up notifications for errors
3. ✅ **Test offline** - Verify app works when Redis down
4. ✅ **Add IndexedDB** - Implement client-side cache (next phase)

## 💡 Upgrade Path

If you outgrow free tier:

| Plan | Price | Commands/Day | Storage |
|------|-------|--------------|---------|
| Free | $0 | 10,000 | 256 MB |
| Pay as you go | $0.20 per 100K | Unlimited | $0.25/GB |
| Pro 2K | $10/month | 100,000 | 2 GB |
| Pro 10K | $50/month | 500,000 | 10 GB |

**Recommendation:** Start with free tier, upgrade only if needed.

## 🆘 Support

- **Upstash Docs:** https://docs.upstash.com/redis
- **Upstash Discord:** https://upstash.com/discord
- **Upstash Status:** https://status.upstash.com

---

**Ready?** Follow Step 1 above to get started! 🚀
