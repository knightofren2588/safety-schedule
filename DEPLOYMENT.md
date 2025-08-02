# Safety Schedule Deployment Guide

## 🚀 Deploy to Vercel (Free Hosting)

### Step 1: Prepare for Deployment

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Build the project:**
   ```bash
   npm run build
   ```

### Step 2: Deploy to Vercel

1. **Login to Vercel:**
   ```bash
   vercel login
   ```

2. **Deploy:**
   ```bash
   vercel
   ```

3. **Follow the prompts:**
   - Project name: `safety-schedule`
   - Framework: `Create React App`
   - Build command: `npm run build`
   - Output directory: `build`

## 🗄️ Set up Supabase (Real-time Database)

### Step 1: Create Supabase Account

1. Go to [supabase.com](https://supabase.com)
2. Sign up for free account
3. Create new project

### Step 2: Get Your Credentials

1. Go to Settings → API
2. Copy your:
   - **Project URL** (e.g., `https://xyz.supabase.co`)
   - **Anon Key** (public key)

### Step 3: Set Environment Variables

1. In your Vercel dashboard, go to your project
2. Go to Settings → Environment Variables
3. Add these variables:
   ```
   REACT_APP_SUPABASE_URL=your_project_url
   REACT_APP_SUPABASE_ANON_KEY=your_anon_key
   ```

### Step 4: Create Database Tables

Run these SQL commands in Supabase SQL Editor:

```sql
-- Create schedules table
CREATE TABLE schedules (
  id SERIAL PRIMARY KEY,
  week_num INTEGER NOT NULL,
  day TEXT NOT NULL,
  location TEXT NOT NULL,
  staff TEXT,
  start_time TEXT,
  end_time TEXT,
  hours DECIMAL(4,1),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create call_offs table
CREATE TABLE call_offs (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL,
  staff TEXT NOT NULL,
  reason TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create pto_requests table
CREATE TABLE pto_requests (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL,
  staff TEXT NOT NULL,
  reason TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create pickup_shifts table
CREATE TABLE pickup_shifts (
  id SERIAL PRIMARY KEY,
  week_num INTEGER NOT NULL,
  day TEXT NOT NULL,
  location TEXT NOT NULL,
  staff TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_offs ENABLE ROW LEVEL SECURITY;
ALTER TABLE pto_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE pickup_shifts ENABLE ROW LEVEL SECURITY;

-- Create policies (allow all for now - you can restrict later)
CREATE POLICY "Allow all" ON schedules FOR ALL USING (true);
CREATE POLICY "Allow all" ON call_offs FOR ALL USING (true);
CREATE POLICY "Allow all" ON pto_requests FOR ALL USING (true);
CREATE POLICY "Allow all" ON pickup_shifts FOR ALL USING (true);
```

## 🔄 Update App for Real-time

After setting up Supabase, you'll need to update the app to use the database instead of localStorage. The app will automatically sync changes across all users in real-time.

## 📱 Benefits of This Setup

✅ **Real-time updates** - Changes sync instantly across all devices
✅ **No data loss** - Everything stored in secure database
✅ **Multiple users** - Everyone can access the same schedule
✅ **Mobile friendly** - Works on phones, tablets, computers
✅ **Free hosting** - Vercel provides free hosting
✅ **Free database** - Supabase free tier is generous

## 🔐 Security Notes

- The current setup allows all users to edit (good for your team)
- You can add authentication later if needed
- Passwords are still client-side (consider moving to server-side auth)

## 📊 Data Storage

**Estimated storage per month:**
- Schedule changes: ~1KB per change
- Call-offs: ~100 bytes per entry
- PTO requests: ~100 bytes per entry
- **Total: Likely under 1MB per month**

Supabase free tier gives you 500MB, so you're well within limits! 