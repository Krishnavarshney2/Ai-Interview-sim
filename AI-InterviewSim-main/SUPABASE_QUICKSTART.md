# 🚀 Quick Start: Supabase Authentication

## Step 1: Create Supabase Project (3 minutes)

1. **Go to**: https://app.supabase.com
2. **Click**: "New Project"
3. **Fill in**:
   - Project name: `luminal-ai` (or anything you want)
   - Database password: **Create a strong password and save it!**
   - Region: Choose closest to you (e.g., `East US North`)
4. **Wait**: 1-2 minutes for project to be created

## Step 2: Get Your Credentials (1 minute)

1. In your Supabase project dashboard:
   - Go to **Settings** (gear icon in left sidebar)
   - Click **API**
   
2. **Copy these two values**:
   ```
   Project URL: https://xxxxxxxxxxxxxxxxx.supabase.co
   anon public: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

## Step 3: Update Environment File (30 seconds)

1. **Open this file**: `frontend-next/.env.local`
2. **Replace the placeholder values** with your actual credentials:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-actual-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your-actual-key-here...
```

3. **Save the file**

## Step 4: Test Authentication (2 minutes)

1. **Make sure dev server is running**:
   ```bash
   cd frontend-next
   npm run dev
   ```

2. **Open browser**: http://localhost:3000

3. **Test Signup**:
   - Click "Get Started" or go to http://localhost:3000/auth/signup
   - Enter email and password (min 6 characters)
   - Click "Sign Up"
   - You should see: "✅ Account created!"

4. **Test Login**:
   - Go to http://localhost:3000/auth/login
   - Enter your email and password
   - Click "Sign In"
   - You should be redirected to `/dashboard`

5. **Check Navbar**:
   - You should see your email in the top right
   - "Start Interview" button visible
   - Click "Sign Out" button (logout icon) to test

## Step 5: Verify in Supabase Dashboard (1 minute)

1. **Go to**: https://app.supabase.com
2. **Click your project**
3. **Go to**: Authentication → Users
4. **You should see**: Your test account listed!

---

## ✅ What's Working Now

### Authentication Flow
- ✅ Email/Password signup
- ✅ Email/Password login
- ✅ Sign out functionality
- ✅ Persistent sessions (stays logged in on refresh)
- ✅ Auth state synced across all pages
- ✅ Navbar shows user email when logged in

### Files Created
```
frontend-next/
├── lib/
│   └── supabaseClient.ts          # Supabase client configuration
├── context/
│   └── AuthContext.tsx            # Authentication state management
├── app/
│   ├── auth/
│   │   ├── login/page.tsx         # Login page
│   │   ├── signup/page.tsx        # Signup page
│   │   └── callback/page.tsx      # OAuth callback handler
│   └── layout.tsx                 # Updated with AuthProvider
└── components/
    └── Navbar.tsx                 # Updated with auth state
```

### Files Updated
```
frontend-next/
├── .env.local                     # Environment variables (created)
└── .env.local.example             # Template for reference
```

---

## 🔧 Optional: Enable Google Sign-In

If you want Google authentication:

1. **Go to Supabase Dashboard** → Authentication → Providers
2. **Enable Google provider**
3. **Configure Google OAuth**:
   - Go to https://console.cloud.google.com
   - Create OAuth 2.0 credentials
   - Add authorized redirect URI: `https://your-project-id.supabase.co/auth/v1/callback`
   - Copy Client ID and Secret to Supabase
4. **Test**: Click "Continue with Google" on signup page

---

## ⚠️ Troubleshooting

### "Missing Supabase environment variables"
- Make sure `.env.local` file exists in `frontend-next/` folder
- Check that both `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set
- Restart dev server after changing `.env.local`

### Signup/Login not working
- Check browser console (F12) for errors
- Verify your Supabase project is active
- Check that Email provider is enabled in Supabase dashboard

### Navbar not showing email
- Make sure you're logged in (check `/auth/login`)
- Check browser console for AuthContext errors
- Refresh the page

### Still seeing "Sign In" button after login
- Check that `AuthProvider` wraps your app in `layout.tsx`
- Check browser console for Supabase connection errors
- Verify `.env.local` has correct values

---

## 📊 What's Next After Auth?

Now that authentication is working, you can:

1. **Connect resume upload** - Link setup page to `/api/parse-resume`
2. **Connect interview flow** - Use real Groq AI in backend
3. **Save interview data** - Store results in Supabase database
4. **Build dashboard** - Show real interview history
5. **Add Google OAuth** - One-click sign in

---

## 📞 Need Help?

- **Supabase Docs**: https://supabase.com/docs/guides/auth
- **Next.js Auth**: https://nextjs.org/docs/authentication
- **Check this file**: `ENDPOINTS_VERIFICATION.md` for full API map

---

*You're all set! 🎉*
