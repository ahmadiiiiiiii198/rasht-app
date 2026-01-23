# 📱 Customer App FCM Push Notification Setup Guide

## ✅ CONFIGURATION COMPLETE!

The FCM push notification system has been fully configured for the customer app.

---

## What's Been Done

### 1. Firebase Console
- ✅ **Created new Android app** in Firebase project `adib-a6266`
- ✅ **Package name:** `com.efeskebap.customer`
- ✅ **App nickname:** `Efes Kebap Customer`
- ✅ **App ID:** `1:941204333853:android:37e10820b37215dc11edf4`

### 2. Android Configuration
- ✅ **google-services.json** placed in `android/app/`
- ✅ **build.gradle** updated with correct `applicationId` and `namespace`
- ✅ **AndroidManifest.xml** updated with push notification permissions
- ✅ **capacitor.config.ts** updated with correct app ID

### 3. Code Implementation
- ✅ **FCMService.ts** created for push notification handling
- ✅ **App.tsx** updated to initialize FCM on startup
- ✅ **NotificationListener.tsx** enhanced to handle FCM notifications

---

## 🚀 Build the App

To build the customer app with FCM support:

```bash
cd efes-customer-app

# Build the web app
npm run build

# Sync with Capacitor  
npx cap sync android

# Open in Android Studio
npx cap open android
```

Then build and install the APK from Android Studio.

---

## Step 4: Rebuild the App

```bash
cd efes-customer-app

# Build the web app
npm run build

# Sync with Capacitor
npx cap sync android

# Open in Android Studio (or build directly)
npx cap open android
```

---

## 🎉 What's Implemented

### FCMService.ts
- Requests push notification permissions
- Registers device and gets FCM token
- Saves token to Supabase `devices` table
- Associates device with user when logged in
- Handles foreground notifications

### NotificationListener.tsx (Enhanced)
- Listens for FCM push notifications in foreground
- Shows beautiful animated notification popup
- Plays sound and vibrates
- Works with both Supabase Realtime AND FCM push

### App.tsx
- Initializes FCM on app startup

---

## 📊 How It Works

1. **App Opens** → FCM initializes, requests permissions
2. **Token Received** → Saved to `devices` table with `app_type: 'customer'`
3. **User Logs In** → Device is associated with user_id
4. **Admin Sends Broadcast** → 
   - Message saved to `messages` table
   - `send-notification` Edge Function sends FCM to ALL devices
   - Customer app receives push notification
5. **Customer Opens App** → Sees notification popup with sound/vibration

---

## 🔧 Troubleshooting

### Push notifications not working
- Ensure `google-services.json` is in `android/app/`
- Check that the package name matches (`com.efeskebap.customer`)
- Verify Firebase project has Cloud Messaging enabled

### Token not saving to database
- Check Supabase RLS policies on `devices` table
- Verify the app has internet permission

### No sound/vibration
- Check device notification settings
- Ensure audio autoplay is allowed

---

## 📝 Files Modified

| File | Purpose |
|------|---------|
| `src/services/FCMService.ts` | NEW - FCM service for customer app |
| `src/App.tsx` | Added FCM initialization |
| `src/components/NotificationListener.tsx` | Added FCM notification handler |
| `capacitor.config.ts` | Updated app ID and push settings |

---

**Created:** December 31, 2025
**Status:** ✅ Code Complete - Awaiting Firebase Configuration
