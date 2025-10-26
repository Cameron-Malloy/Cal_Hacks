# 🚀 Quick Start: Firebase Integration Checklist

## ✅ What's Already Done

I've created the following files for you:

1. **`lib/firebase.ts`** - Firebase initialization
2. **`lib/auth.ts`** - Authentication functions (signUp, signIn, Google auth, logout)
3. **`lib/firestore.ts`** - Database functions (user profiles, sessions, leaderboard)
4. **`contexts/AuthContext.tsx`** - React context for authentication state
5. **`.env.local.example`** - Template for environment variables
6. **`FIREBASE_SETUP.md`** - Complete setup documentation

## 📝 What You Need to Do

### 1. Set Up Firebase Project (5 minutes)
```bash
# Go to: https://console.firebase.google.com/
# 1. Create new project
# 2. Add Web App (get config values)
# 3. Enable Email/Password + Google auth
# 4. Create Firestore database (test mode)
```

### 2. Add Environment Variables (1 minute)
```bash
# Copy the example file
cp .env.local.example .env.local

# Edit .env.local with your Firebase config values from step 1
# Then restart your dev server
```

### 3. Install Firebase (Already Running)
```bash
npm install firebase
```

### 4. Update Your Layout (2 minutes)
**File: `app/layout.tsx`**

Add the AuthProvider wrapper:
```typescript
import { AuthProvider } from "@/contexts/AuthContext";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
```

### 5. Update Login Component (5 minutes)
See `FIREBASE_SETUP.md` Part 3, Step 2 for the complete updated Login component.

Key changes:
- Import `signInWithEmail`, `signUpWithEmail`, `signInWithGoogle` from `@/lib/auth`
- Use these functions instead of localStorage
- Handle loading and error states

### 6. Update Dashboard Component (10 minutes)
See `FIREBASE_SETUP.md` Part 3, Step 3 for examples.

Key changes:
- Use `useAuth()` hook to get `user` and `userProfile`
- Fetch real data with `getUserFocusSessions()`, `getUserProfile()`
- Display data from Firestore instead of mock data

### 7. Test Everything (5 minutes)
1. Sign up with email/password
2. Check Firebase Console → Authentication (user should appear)
3. Check Firebase Console → Firestore (user document should be created)
4. Log out and sign back in
5. Test Google Sign-In

## 🎯 Priority Order

For a hackathon demo, implement in this order:

1. **Authentication** (Login/Signup) - Critical for demo
2. **User Profile** (Dashboard stats: level, XP, streak) - Shows personalization
3. **Leaderboard** (Real user rankings) - Shows social features
4. **Focus Sessions** (Save and display sessions) - Core functionality

## 📊 Quick Firebase Console Check

After setup, your Firebase Console should show:

**Authentication Tab:**
- ✅ Email/Password enabled
- ✅ Google enabled
- ✅ At least 1 test user

**Firestore Tab:**
- ✅ `users` collection with documents
- ✅ Test mode rules active

## 🔥 Common Issues

**"Firebase not defined"**
```bash
# Make sure Firebase finished installing
npm list firebase

# If not installed:
npm install firebase --force
```

**"Configuration not found"**
```bash
# Make sure .env.local exists and has all values
cat .env.local

# Restart dev server
npm run dev
```

**"Permission denied"**
```bash
# Check Firestore rules in Firebase Console
# Make sure you're in "test mode" during development
```

## 🎨 Demo-Ready Features

With Firebase connected, you can showcase:

1. **Real Authentication** - Multiple sign-in methods
2. **User Profiles** - Persistent data across sessions
3. **Live Leaderboard** - Real-time updates
4. **Session History** - Stored focus sessions
5. **Streak Tracking** - Automated progress tracking

## ⚡ Pro Tips

- **Seed Data**: Create 5-10 test users with different stats for a better leaderboard demo
- **Real-time**: Use `subscribeToLeaderboard()` to show live updates
- **Error Handling**: Add toast notifications for better UX
- **Loading States**: Show skeletons while data loads

## 🆘 Need Help?

1. Check `FIREBASE_SETUP.md` for detailed instructions
2. Check Firebase Console for errors
3. Check browser console for error messages
4. Verify `.env.local` has correct values

---

**Estimated Total Time:** 30-45 minutes
**Time Until Demo-Ready:** With mocked data as fallback, 15-20 minutes
