# PesaTrack — React Native (Expo)

A dark, sleek personal finance tracker that **automatically reads your M-Pesa SMS messages** on Android.

---

## Quick Start (no Android Studio needed)

### Step 1 — Install Node.js
Download from https://nodejs.org (LTS version)

### Step 2 — Install Expo CLI
```bash
npm install -g expo-cli eas-cli
```

### Step 3 — Install dependencies
```bash
cd PesaTrack
npm install
```

### Step 4 — Install Expo Go on your phone
- Android: https://play.google.com/store/apps/details?id=host.exp.exponent
- iOS: https://apps.apple.com/app/expo-go/id982107779

### Step 5 — Run the app
```bash
npx expo start
```
Scan the QR code with Expo Go. The app opens on your phone instantly.

> **Note:** In Expo Go, SMS reading will show a "Development Mode" alert because
> native modules aren't bundled. You can still use the app fully — add transactions
> manually with the + button. For real SMS reading, do a standalone build (Step 6).

---

## Step 6 — Build a real APK with SMS access

This produces an actual `.apk` you can install from Files, with real READ_SMS permission.

### 6a — Create an Expo account (free)
https://expo.dev/signup

### 6b — Log in
```bash
eas login
```

### 6c — Configure the build
```bash
eas build:configure
```
Choose **Android** when asked.

### 6d — Build the APK
```bash
eas build -p android --profile preview
```
This uploads your code to Expo's cloud build service and returns a download link (~5–10 min).
**No Android Studio. No Java. No Gradle.** Just a download link.

### 6e — Install on your phone
1. Download the `.apk` from the link EAS gives you
2. Open it on your Android phone
3. Allow "Install unknown apps" if prompted
4. Open PesaTrack → tap **Allow SMS Access**
5. Grant the READ_SMS permission when Android asks
6. Your real M-Pesa inbox is scanned instantly ✓

---

## How SMS reading works

```
App opens
  │
  ├── Standalone APK?
  │     └── react-native-get-sms-android queries content://sms/inbox
  │           filtered to sender "MPESA", last 1000 messages
  │           → parseMpesaSMS() on each body
  │           → deduped + saved to AsyncStorage
  │
  └── Expo Go?
        └── Native module unavailable → "Development Mode" alert
              → add transactions manually with + button
```

---

## Project structure

```
PesaTrack/
├── App.js                        ← Root: state, navigation, SMS flow
├── app.json                      ← Expo config + permissions
├── package.json
└── src/
    ├── screens/
    │   ├── OverviewScreen.js     ← Balance + category chart + recent txns
    │   ├── TransactionsScreen.js ← Full list with filters + delete
    │   ├── AnalyticsScreen.js    ← Bar chart, donut, net trend
    │   ├── BudgetScreen.js       ← Monthly limits + progress bars
    │   └── SavingsScreen.js      ← Goals + top-up
    ├── components/
    │   ├── UI.js                 ← Card, Sheet, Input, Toast, etc.
    │   └── AddTransactionSheet.js
    ├── utils/
    │   ├── mpesa.js              ← SMS parser + formatters
    │   ├── useSmsImport.js       ← Permission + inbox hook
    │   ├── export.js             ← CSV export via expo-sharing
    │   └── theme.js              ← Colors, categories, emojis
    └── store/
        └── index.js              ← AsyncStorage persistence
```

---

## eas.json (add this to your project root for builds)

```json
{
  "build": {
    "preview": {
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "app-bundle"
      }
    }
  }
}
```

Create this file as `eas.json` in the project root before running `eas build`.
