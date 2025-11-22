# Netlify Deployment Guide

This guide will help you deploy the Efes Customer App to Netlify.

## Quick Deploy

### Automatic Configuration (Recommended)

The `netlify.toml` file in this repo contains all the necessary configuration. Simply:

1. **Connect your repository to Netlify**
   - Go to https://app.netlify.com/
   - Click "Add new site" → "Import an existing project"
   - Choose your Git provider (GitHub)
   - Select the repository: `ahmadiiiiiiii198/salah-pizzeria-mobile`

2. **Netlify will auto-detect the settings from `netlify.toml`:**
   - Build command: `npm run build`
   - Publish directory: `build`
   - Node version: `18` (from .nvmrc)

3. **Click "Deploy site"**

### Manual Configuration (If needed)

If the automatic configuration doesn't work, set these manually in Netlify:

**Build settings:**
- Base directory: (leave empty)
- Build command: `npm run build`
- Publish directory: `build`

**Environment:**
- Node version: `18`
  - Set in Site settings → Build & deploy → Environment → Environment variables
  - Add `NODE_VERSION` with value `18`

## Troubleshooting

### Build fails with Node version errors

**Solution:** Make sure Node 18 is being used.
- Check the build log for "Node version"
- If it shows Node 22 or higher, the `.nvmrc` file may not be detected
- Go to Site settings → Environment variables → Add:
  - Key: `NODE_VERSION`
  - Value: `18`

### Build fails with "command not found" or similar

**Solution:** Clear cache and retry
- Go to Site settings → Build & deploy → Clear cache and retry deploy

### SPA routing doesn't work (404 on page refresh)

**Solution:** Already configured in `netlify.toml`
- The redirect rule `/* → /index.html` handles all routes
- If still broken, manually add a `_redirects` file to the `public` folder:
  ```
  /*    /index.html   200
  ```

### Environment variables needed?

This app uses hardcoded Supabase credentials (in `src/lib/supabase.ts`).
No environment variables are required for basic deployment.

## What Gets Deployed

- The compiled React app (Create React App build)
- All static assets (images, fonts, etc.)
- Supabase integration (API calls to backend)

## Important Notes

- **This is a web build** of a mobile app (Capacitor/React Native for Web)
- The mobile-specific features (push notifications, etc.) won't work in the browser
- For full mobile functionality, install the APK on an Android device

## Post-Deployment

After successful deployment:
1. Test the deployed site URL
2. Verify all pages load correctly
3. Test the Menu, Cart, and Order functionality
4. Check that the circular navigation works on mobile screens

## Support

If you encounter issues:
1. Check the full build log in Netlify
2. Look for the specific error message after "npm run build" runs
3. Compare with the local build (run `npm run build` locally to verify it works)
