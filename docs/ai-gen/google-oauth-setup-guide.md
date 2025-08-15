# Google OAuth Setup Guide for Calendar Integration

## Step 1: Access Google Cloud Console
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Sign in with your Google account

## Step 2: Create or Select Project
1. Click the project dropdown at the top
2. Either select an existing project or click "New Project"
3. If creating new:
   - Project name: `call-center-automation`
   - Click "Create"

## Step 3: Enable Required APIs
1. Go to "APIs & Services" → "Library"
2. Search for "Google Calendar API"
3. Click on it and press "Enable"
4. Also search for "Google People API" and enable it

## Step 4: Configure OAuth Consent Screen
1. Go to "APIs & Services" → "OAuth consent screen"
2. Choose "External" user type
3. Fill in the required information:
   - **App name**: `Call Center Calendar Integration`
   - **User support email**: Your email address
   - **App logo**: (optional)
   - **App domain**: Leave blank for development
   - **Authorized domains**: Leave blank for development
   - **Developer contact information**: Your email address
4. Click "Save and Continue"

### Scopes Section:
1. Click "Add or Remove Scopes"
2. Add these scopes:
   - `https://www.googleapis.com/auth/calendar.readonly`
   - `https://www.googleapis.com/auth/userinfo.email`
3. Click "Update" then "Save and Continue"

### Test Users Section:
1. Add your email address as a test user
2. Click "Save and Continue"

## Step 5: Create OAuth Credentials
1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth client ID"
3. Choose "Web application"
4. **Name**: `Call Center App`
5. **Authorized JavaScript origins**:
   - `http://localhost:19080`
   - `http://localhost:3000` (if you use port 3000)
6. **Authorized redirect URIs**:
   - `http://localhost:19080/api/calendar/google/callback`
   - `http://localhost:3000/api/calendar/google/callback` (if you use port 3000)
7. Click "Create"

## Step 6: Copy Credentials
1. After creation, you'll see a popup with:
   - **Client ID**: Copy this value
   - **Client Secret**: Copy this value (you'll need this for the backend)

## Step 7: Update Environment Variables
Add or update these in your `.env` file:

```env
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
```

## Step 8: Publish App (Optional for Development)
For development, your app will work in "Testing" mode with the test users you added.
For production, you'll need to publish the app:
1. Go back to "OAuth consent screen"
2. Click "Publish App"

## Important Notes:
- The redirect URI must match exactly: `http://localhost:19080/api/calendar/google/callback`
- For development, you can use "Testing" mode and add specific test users
- Make sure the port number (19080) matches your development server
- The app will show "unverified" warnings in development mode - this is normal

## Troubleshooting:
- If you get "access blocked" error, check redirect URIs match exactly
- If you get "app not verified" warning, click "Advanced" → "Go to app"
- Make sure APIs are enabled and OAuth consent screen is configured