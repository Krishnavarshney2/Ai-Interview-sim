# Production Setup Guide

This guide walks you through setting up the Luminal AI platform for production.

## Prerequisites

- Python 3.11+
- Node.js 18+
- PostgreSQL 14+ (or Supabase)
- Redis 7+ (optional but recommended)
- Docker & Docker Compose (optional but recommended)

---

## Step 1: Environment Variables

Copy the example environment file and fill in your real values:

```bash
cp .env.example .env
```

### Required Variables

| Variable | Description | Where to get |
|----------|-------------|--------------|
| `GROQ_API_KEY` | LLM API key | https://console.groq.com |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Supabase Dashboard > Settings > API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key | Supabase Dashboard > Settings > API |
| `SUPABASE_SERVICE_KEY` | Supabase service role key | Supabase Dashboard > Settings > API (keep secret!) |
| `DATABASE_URL` | PostgreSQL connection string | See below |
| `REDIS_URL` | Redis connection string | See below |

### Database Options

**Option A: Local PostgreSQL (Docker)**
```bash
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/luminal_ai
```

**Option B: Supabase PostgreSQL (Production)**
```bash
# Go to Supabase Dashboard > Settings > Database > Connection String
# Use the "URI" format and replace `postgresql://` with `postgresql+asyncpg://`
DATABASE_URL=postgresql+asyncpg://postgres:[password]@db.[project].supabase.co:5432/postgres
```

### Redis Options

**Option A: Local Redis (Docker)**
```bash
REDIS_URL=redis://localhost:6379/0
```

**Option B: Upstash (Serverless)**
```bash
REDIS_URL=rediss://default:[password]@[host]:[port]
```

---

## Step 2: Local Development with Docker (Recommended)

The easiest way to get started:

```bash
# Start PostgreSQL + Redis + Backend
docker-compose up -d

# This starts:
# - PostgreSQL on port 5432
# - Redis on port 6379
# - FastAPI backend on port 8000
```

Then start the frontend:
```bash
cd frontend-next
npm install
npm run dev
```

Open http://localhost:3000

---

## Step 3: Manual Setup (Without Docker)

### 3a. Install Python Dependencies

```bash
pip install -r requirements.txt
```

### 3b. Set Up PostgreSQL

1. Install PostgreSQL locally
2. Create database:
```bash
psql -U postgres -c "CREATE DATABASE luminal_ai;"
```
3. Run the schema migration:
```bash
psql -U postgres -d luminal_ai -f db/migrations/001_initial_schema.sql
```

### 3c. Set Up Redis

```bash
# Install Redis locally or use Docker:
docker run -d -p 6379:6379 --name luminal_redis redis:7-alpine
```

### 3d. Start Backend

```bash
python main.py
# Or with uvicorn directly:
# uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### 3e. Start Frontend

```bash
cd frontend-next
npm install
npm run dev
```

---

## Step 4: Supabase Configuration

1. **Enable Email Provider**
   - Go to Authentication > Providers > Email
   - Turn OFF "Confirm email" (for easier testing)
   - Or keep it ON for production security

2. **Set Site URL**
   - Authentication > URL Configuration
   - Site URL: `http://localhost:3000`
   - Add `http://localhost:3000/**` to Redirect URLs

3. **Create Storage Bucket**
   - Storage > New Bucket
   - Name: `resumes`
   - Public: Yes (or configure RLS policies)

4. **Get Service Role Key**
   - Settings > API > service_role key
   - Add to `.env` as `SUPABASE_SERVICE_KEY`
   - **NEVER expose this in frontend code**

---

## Step 5: Production Deployment

### Backend (Docker)

```bash
# Build and run with Docker
docker build -t luminal-backend .
docker run -p 8000:8000 --env-file .env luminal-backend
```

### Frontend (Vercel)

```bash
cd frontend-next
vercel
```

### Environment Variables for Production

Set these in your hosting platform (Vercel, Railway, etc.):

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_API_URL=https://your-api-domain.com
DATABASE_URL=
REDIS_URL=
GROQ_API_KEY=
SUPABASE_SERVICE_KEY=
ENVIRONMENT=production
CORS_ORIGINS=https://your-frontend-domain.com
```

---

## Step 6: Verifying Your Setup

1. **Health Check**: Visit `http://localhost:8000/health`
   - Should show `database: connected` and `status: healthy`

2. **Sign Up**: Create an account at `http://localhost:3000/auth/signup`

3. **Upload Resume**: Go to Setup page and upload a PDF

4. **Start Interview**: Click "Initialize AI Interviewer"

5. **Check Database**: Verify data is being saved
```bash
psql -U postgres -d luminal_ai -c "SELECT COUNT(*) FROM interviews;"
```

---

## Troubleshooting

### "Database connection failed"
- Check `DATABASE_URL` format (must use `postgresql+asyncpg://`)
- Ensure PostgreSQL is running
- Check firewall / network access

### "Redis connection failed"
- Backend will still work but rate limiting falls back to DB
- Check `REDIS_URL`
- Ensure Redis is running

### "Supabase Storage upload failed"
- Verify `SUPABASE_SERVICE_KEY` is correct
- Ensure `resumes` bucket exists in Supabase Storage
- Check bucket permissions (RLS policies)

### "Authentication required" (401 errors)
- Frontend must pass `Authorization: Bearer <token>` header
- Check that `.env.local` in `frontend-next/` has correct Supabase credentials
- Ensure user is logged in before calling protected endpoints

---

## Architecture Overview

```
User -> Next.js Frontend (Port 3000)
  |
  |-> Supabase Auth (JWT tokens)
  |
  |-> FastAPI Backend (Port 8000)
       |
       |-> PostgreSQL (Persistent data)
       |-> Redis (Rate limiting, caching)
       |-> Supabase Storage (File uploads)
       |-> Groq API (LLM / AI)
```

### Database Schema

- **users**: Synced from Supabase Auth
- **resumes**: Parsed resume data + Supabase Storage reference
- **interviews**: Interview sessions metadata
- **interview_questions**: Q&A pairs per interview
- **feedback**: AI-generated evaluation scores

---

## Next Steps (Phase 2)

See the main README for Phase 2 features:
- Real analytics from saved data
- Password reset flow
- User profile/settings
- Stripe billing integration
- Admin dashboard
