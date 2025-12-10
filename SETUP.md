# Setup Guide

## Quick Start

Follow these steps to get your Job Tracking System up and running.

### Step 1: Supabase Setup

1. Go to [supabase.com](https://supabase.com) and create an account
2. Create a new project
3. Wait for the project to be provisioned (takes 1-2 minutes)

### Step 2: Database Migration

The database tables have already been created via the migration system. The migration includes:
- **jobs** table with RLS policies
- **companies** table with RLS policies
- **transactions** table with RLS policies
- Proper indexes for performance
- Foreign key relationships
- Auto-updating timestamps

### Step 3: Get Your Credentials

1. In your Supabase project dashboard, go to **Settings** → **API**
2. Copy your **Project URL**
3. Copy your **anon/public** key

### Step 4: Configure Environment

1. Create a `.env` file in the project root:

```bash
cp .env.example .env
```

2. Edit `.env` and add your credentials:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### Step 5: Install and Run

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The application will open at `http://localhost:5173`

### Step 6: Create Your First User

1. Click "Yeni Hesap Oluştur" (Create New Account)
2. Enter your email and password (min 6 characters)
3. Click "Kayıt Ol" (Sign Up)
4. After successful registration, log in with your credentials

## Verification

To verify everything is working:

1. ✅ Can you see the login page?
2. ✅ Can you create a new account?
3. ✅ Can you log in?
4. ✅ Can you see the dashboard?
5. ✅ Can you create a new job?

If all checks pass, your system is ready to use!

## Troubleshooting

### "Missing Supabase environment variables"
- Make sure your `.env` file exists and has both `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- Restart the development server after creating/modifying `.env`

### "Failed to sign up" or "Failed to sign in"
- Check that your Supabase project is active
- Verify your environment variables are correct
- Check the browser console for detailed error messages

### Database tables don't exist
- The migration should have created all tables automatically
- If not, check the Supabase dashboard → Table Editor to verify tables exist
- Contact support if tables are missing

### RLS Policy Errors
- RLS policies are automatically created with the migration
- Users can only see their own data
- If you're getting permission errors, make sure you're logged in

## Production Deployment

### Environment Variables

When deploying to production, set these environment variables in your hosting platform:

```
VITE_SUPABASE_URL=your_production_supabase_url
VITE_SUPABASE_ANON_KEY=your_production_anon_key
```

### Build Command

```bash
npm run build
```

### Output Directory

```
dist/
```

### Recommended Platforms

- **Vercel**: Zero-config deployment, automatic HTTPS
- **Netlify**: Great for static sites, easy rollbacks
- **Cloudflare Pages**: Fast global CDN, generous free tier

## Next Steps

Once your system is running:

1. **Create your first job** to track a project
2. **Add employers and employees** to manage relationships
3. **Record transactions** to track income and expenses
4. **Monitor statistics** to see your financial overview

## Need Help?

- Check the main README.md for detailed documentation
- Review the code comments for implementation details
- Open an issue on GitHub for bug reports or questions
