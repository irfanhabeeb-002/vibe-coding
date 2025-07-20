# Troubleshooting: Food Posts Not Showing Up

## 🚨 Problem
You're adding food through the form but posts aren't appearing on the home page.

## 🔍 Quick Diagnosis

### Step 1: Run the Debug Script
```bash
node debug-supabase.js
```

This will tell you exactly what's wrong:
- If posts exist in the database
- If RLS policies are blocking access
- If user profiles are missing
- If date/time filters are causing issues

### Step 2: Check Browser Console
Open your browser's developer tools (F12) and check the console for:
- Error messages
- Database connection issues
- RLS policy violations

## 🛠️ Common Fixes

### Fix 1: RLS Policy Issues (Most Common)
If the debug script shows posts exist but aren't visible, run:
```bash
node fix-rls-policies.js
```

This will:
- Temporarily disable RLS to test
- Re-enable RLS with proper policies
- Test post creation and visibility

### Fix 2: Missing User Profile
If posts exist but user profiles are missing:
1. Sign out and sign back in
2. The app should automatically create your profile
3. Or manually create a profile in Supabase

### Fix 3: Date/Time Issues
If posts are being filtered out due to `available_until`:
1. Check that you're setting future dates when creating posts
2. The app filters out expired posts automatically

### Fix 4: Database Schema Issues
If tables don't exist or have wrong structure:
```bash
node setup-database.js
```

## 🔧 Manual Database Checks

### Check 1: Verify Tables Exist
In Supabase SQL Editor, run:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('food_posts', 'profiles', 'groups');
```

### Check 2: Count Posts
```sql
SELECT COUNT(*) FROM food_posts;
```

### Check 3: Check RLS Status
```sql
SELECT table_name, row_security 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'food_posts';
```

### Check 4: List RLS Policies
```sql
SELECT policy_name, cmd, permissive 
FROM information_schema.policies 
WHERE table_schema = 'public' 
AND table_name = 'food_posts';
```

## 🎯 Specific Solutions

### Solution 1: Posts Exist But Not Visible
**Problem**: Posts are in database but not showing on home page
**Cause**: RLS policies are too restrictive
**Fix**: Run `node fix-rls-policies.js`

### Solution 2: No Posts in Database
**Problem**: Posts aren't being created at all
**Cause**: Insert permissions or missing fields
**Fix**: 
1. Check browser console for errors
2. Verify all required fields are filled
3. Check if user is authenticated

### Solution 3: Posts Show But No User Names
**Problem**: Posts appear but show "Anonymous" or "Unknown"
**Cause**: Missing user profiles
**Fix**: Sign out and sign back in to create profile

### Solution 4: Posts Disappear After Creation
**Problem**: Posts appear briefly then disappear
**Cause**: Date/time filtering or RLS policies
**Fix**: 
1. Check `available_until` date is in future
2. Verify `is_active` is true
3. Run RLS fix script

## 🔍 Debug Steps

### Step 1: Check Database Connection
```bash
node debug-supabase.js
```

### Step 2: Check Browser Console
1. Open browser dev tools (F12)
2. Go to Console tab
3. Look for error messages
4. Check network tab for failed requests

### Step 3: Test Post Creation
1. Try creating a new post
2. Check if success message appears
3. Check if post appears in database
4. Check if post appears on home page

### Step 4: Verify Environment Variables
Ensure your `.env` file has:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## 🚀 Quick Fix Sequence

1. **Run debug script**:
   ```bash
   node debug-supabase.js
   ```

2. **If RLS issues found**:
   ```bash
   node fix-rls-policies.js
   ```

3. **If schema issues found**:
   ```bash
   node setup-database.js
   ```

4. **Refresh your app** and test again

## 📞 Still Having Issues?

If the above steps don't work:

1. **Check Supabase Dashboard**:
   - Go to your Supabase project
   - Check Database > Tables
   - Verify tables exist and have data

2. **Check Authentication**:
   - Verify user is signed in
   - Check if user profile exists
   - Try signing out and back in

3. **Check RLS Policies**:
   - Go to Database > Policies
   - Verify policies exist for food_posts table
   - Check if policies are too restrictive

4. **Check Logs**:
   - Go to Supabase Dashboard > Logs
   - Look for error messages
   - Check for RLS policy violations

## 🎯 Most Likely Solution

**90% of the time**, the issue is RLS policies. Run:
```bash
node fix-rls-policies.js
```

This will fix the most common issues and get your posts showing up immediately. 