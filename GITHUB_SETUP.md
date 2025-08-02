# GitHub + Vercel Deployment Guide

## Step 1: Create GitHub Repository

1. Go to [github.com](https://github.com)
2. Click the "+" button → "New repository"
3. Name it: `safety-schedule`
4. Make it **Public** (free)
5. **Don't** initialize with README (we already have one)
6. Click "Create repository"

## Step 2: Push to GitHub

Copy and paste these commands in your terminal:

```bash
# Add your GitHub repository URL (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/safety-schedule.git

# Push to GitHub
git branch -M main
git push -u origin main
```

## Step 3: Deploy to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Sign up/Login with your GitHub account
3. Click "New Project"
4. Find your `safety-schedule` repository and click "Import"
5. Vercel will automatically detect it's a React app
6. Click "Deploy"

**That's it!** Your app will be live in about 30 seconds.

## Your App URL

After deployment, Vercel will give you a URL like:
- `https://safety-schedule-xyz.vercel.app`

You can share this URL with your team!

## Next Steps (Optional)

For real-time database functionality:
1. Set up Supabase (follow DEPLOYMENT.md)
2. Add environment variables in Vercel dashboard
3. Update the app to use Supabase instead of localStorage 