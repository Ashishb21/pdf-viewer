# 🚀 Complete Guide: Getting Google OAuth Credentials

This guide will help you get your Google Client ID and Client Secret for your PDF Viewer app.

## Step 1: Go to Google Cloud Console

1. Open your web browser
2. Go to: **https://console.cloud.google.com/**
3. Sign in with your Google account (Gmail account)

## Step 2: Create a New Project

1. At the top of the page, you'll see a project selector (it might say "Select a project")
2. Click on it, then click **"New Project"**
3. Enter project details:
   - **Project name**: `PDF Viewer App` (or any name you like)
   - **Organization**: Leave as default
4. Click **"Create"**
5. Wait for the project to be created (takes a few seconds)

## Step 3: Enable Required APIs

1. In the left sidebar, click **"APIs & Services"** → **"Library"**
2. In the search box, type: `Google Identity`
3. Look for **"Google Identity Services API"** and click on it
4. Click the **"Enable"** button
5. Wait for it to be enabled

## Step 4: Configure OAuth Consent Screen

1. In the left sidebar, go to **"APIs & Services"** → **"OAuth consent screen"**
2. Choose **"External"** (unless you have Google Workspace, then choose Internal)
3. Click **"Create"**
4. Fill in the required information:
   - **App name**: `PDF Viewer` (or your preferred name)
   - **User support email**: Your email address
   - **App logo**: Skip this (optional)
   - **App domain**: Skip this (optional)
   - **Developer contact information**: Your email address
5. Click **"Save and Continue"**
6. On "Scopes" page, click **"Save and Continue"** (no changes needed)
7. On "Test users" page, click **"Add Users"** and add your Gmail address
8. Click **"Save and Continue"**
9. Review and click **"Back to Dashboard"**

## Step 5: Create OAuth 2.0 Credentials

1. In the left sidebar, go to **"APIs & Services"** → **"Credentials"**
2. Click **"Create Credentials"** → **"OAuth 2.0 Client IDs"**
3. If you see a message about configuring OAuth consent screen, you may need to complete Step 4 first
4. Fill in the form:
   - **Application type**: Select **"Web application"**
   - **Name**: `PDF Viewer OAuth Client` (or any name)
   
5. **Authorized JavaScript origins**: Click **"Add URI"** and add:
   ```
   http://localhost:3000
   ```
   Click **"Add URI"** again and add:
   ```
   http://localhost:8000
   ```

6. **Authorized redirect URIs**: Click **"Add URI"** and add:
   ```
   http://localhost:8000/api/auth/google/callback
   ```

7. Click **"Create"**

## Step 6: Copy Your Credentials

After clicking "Create", you'll see a popup with your credentials:

- **Your Client ID**: This looks like: `123456789-abc123def456.apps.googleusercontent.com`
- **Your Client Secret**: This looks like: `GOCSPX-1234567890abcdef`

**IMPORTANT**: Copy both of these values! You can also download the JSON file for backup.

## Step 7: Update Your .env File

1. Open the file: `/Users/ashishbansal/Documents/claude-projects/PdfViewer/backend/.env`
2. Replace the placeholder values:

```env
# Replace these lines:
GOOGLE_CLIENT_ID="REPLACE_WITH_YOUR_GOOGLE_CLIENT_ID"
GOOGLE_CLIENT_SECRET="REPLACE_WITH_YOUR_GOOGLE_CLIENT_SECRET"

# With your actual values (example):
GOOGLE_CLIENT_ID="123456789-abc123def456.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-1234567890abcdef"
```

## Step 8: Test Your Setup

1. Save the .env file
2. Restart your servers:
   ```bash
   # Stop current servers (Ctrl+C if running)
   npm run fullstack
   ```
3. Go to `http://localhost:3000`
4. Click **"Continue with Google"**
5. You should be redirected to Google's login page!

## 🔥 Quick Visual Reference

Here's what you're looking for at each step:

**Google Cloud Console Home**: Look for "New Project" button
**APIs Library**: Search box → type "Google Identity" 
**OAuth Consent Screen**: Choose "External" → Fill app name and email
**Credentials**: "Create Credentials" → "OAuth 2.0 Client IDs"
**Web Application**: Add the URIs exactly as shown above

## 🚨 Common Issues & Solutions

**Issue**: "OAuth consent screen not configured"
**Solution**: Complete Step 4 (OAuth consent screen) first

**Issue**: "Redirect URI mismatch" 
**Solution**: Make sure you added exactly: `http://localhost:8000/api/auth/google/callback`

**Issue**: Still getting "Google OAuth not configured"
**Solution**: 
1. Double-check your .env file has the correct values
2. Restart your backend server
3. Make sure there are no extra spaces in the .env values

## 🎉 Success!

Once everything is set up, users will be able to:
- Click "Continue with Google" 
- Sign in with their Google account
- Get automatically logged into your PDF Viewer
- New users get 100 free credits!

---

Need help? The credentials should look like this in your .env file:
```
GOOGLE_CLIENT_ID="1234567890-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-AbCdEfGhIjKlMnOpQrStUvWxYz"
```