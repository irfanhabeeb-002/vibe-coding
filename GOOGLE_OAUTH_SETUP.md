# Google OAuth Setup for വന്നോളി തിന്നോളി

## 🔧 Setup Instructions

### 1. Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API:
   - Go to "APIs & Services" > "Library"
   - Search for "Google+ API" and enable it
4. Create OAuth 2.0 credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client IDs"
   - Choose "Web application"
   - Add authorized redirect URIs:
     ```
     https://xzvifxqwrozipoyqswva.supabase.co/auth/v1/callback
     http://localhost:5173/auth/v1/callback (for development)
     ```
5. Copy the Client ID and Client Secret

### 2. Supabase Dashboard Setup

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to "Authentication" > "Providers"
4. Find "Google" and click "Edit"
5. Enable Google provider
6. Enter your Google Client ID and Client Secret
7. Save the changes

### 3. Environment Variables (Optional)

If you want to use environment variables, create a `.env.local` file:

```env
VITE_SUPABASE_URL=https://xzvifxqwrozipoyqswva.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

## 🚀 Testing the Setup

1. Start the development server: `npm run dev`
2. Click the "Sign In" button in the header
3. Click "Continue with Google"
4. You should be redirected to Google's OAuth page
5. After successful authentication, you'll be redirected back to the app

## 🔍 Troubleshooting

### Common Issues:

1. **"Invalid redirect URI" error:**
   - Make sure the redirect URI in Google Cloud Console matches exactly
   - Include both production and development URLs

2. **"Provider not enabled" error:**
   - Check that Google provider is enabled in Supabase dashboard
   - Verify Client ID and Secret are correct

3. **"Add Food" button still disabled:**
   - Check browser console for authentication errors
   - Verify user state is being set correctly
   - Check if session is being restored properly

### Debug Steps:

1. Open browser developer tools
2. Check the Console tab for authentication logs
3. Check the Network tab for OAuth requests
4. Verify the user state in React DevTools

## 📱 Features After Setup

Once Google OAuth is working:

- ✅ Users can sign in with their Google account
- ✅ "Add Food" button will be enabled for authenticated users
- ✅ User profile will be automatically created
- ✅ Users can create food posts and groups
- ✅ Real-time notifications will work
- ✅ All database operations will be authenticated

## 🔒 Security Notes

- Google OAuth is more secure than email/password
- User data is handled by Google's secure infrastructure
- No passwords are stored in your database
- Automatic session management with refresh tokens 