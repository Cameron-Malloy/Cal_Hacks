# Firebase Integration Setup Guide for LaserLock

## 📋 Overview
This guide walks you through integrating Firebase Authentication and Firestore into your LaserLock app.

## 🚀 Part 1: Firebase Console Setup

### Step 1: Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or "Create a project"
3. Enter project name: `laserlock` (or your preferred name)
4. (Optional) Enable Google Analytics
5. Click "Create project"

### Step 2: Register Web App
1. In your Firebase project, click the **Web icon** `</>`
2. Register app nickname: `LaserLock Web`
3. Check "Also set up Firebase Hosting" (optional)
4. Click "Register app"
5. **Copy the firebaseConfig object** - you'll need this!

```javascript
// Your config will look like this:
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

### Step 3: Enable Authentication
1. In Firebase Console, go to **Authentication** (left sidebar)
2. Click "Get started"
3. Click on "Sign-in method" tab
4. Enable the following providers:
   - **Email/Password**: Click → Enable → Save
   - **Google**: Click → Enable → Add your support email → Save

### Step 4: Create Firestore Database
1. In Firebase Console, go to **Firestore Database** (left sidebar)
2. Click "Create database"
3. Select **"Start in test mode"** (for development)
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /{document=**} {
         allow read, write: if request.time < timestamp.date(2025, 12, 31);
       }
     }
   }
   ```
4. Choose your Firestore location (e.g., `us-central1`)
5. Click "Enable"

### Step 5: Update Security Rules (After Testing)
Once you're ready for production, update Firestore rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own profile
    match /users/{userId} {
      allow read: if true; // Anyone can read (for leaderboard)
      allow write: if request.auth != null && request.auth.uid == userId;
    }

    // Focus sessions - users can only access their own
    match /focusSessions/{sessionId} {
      allow read, write: if request.auth != null &&
        resource.data.userId == request.auth.uid;
    }

    // Challenges - everyone can read, only admins can write
    match /challenges/{challengeId} {
      allow read: if true;
      allow write: if false; // Set to admin-only in production
    }
  }
}
```

## 🔧 Part 2: Local Environment Setup

### Step 1: Create Environment File
1. Copy the example file:
   ```bash
   cp .env.local.example .env.local
   ```

2. Edit `.env.local` with your Firebase config values:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   ```

3. **Important**: Add `.env.local` to your `.gitignore`:
   ```bash
   echo ".env.local" >> .gitignore
   ```

### Step 2: Verify Firebase Installation
The Firebase SDK should already be installed. Verify with:
```bash
npm list firebase
```

If not installed, run:
```bash
npm install firebase
```

## 🔗 Part 3: Update Your Components

### Step 1: Wrap App with AuthProvider
Update your root layout to include the AuthProvider:

**File: `app/layout.tsx`**
```typescript
import { AuthProvider } from "@/contexts/AuthContext";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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

### Step 2: Update Login Component
Update `components/laserlock/Login.tsx` to use Firebase Auth:

```typescript
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmail, signUpWithEmail, signInWithGoogle } from "@/lib/auth";

export function Login() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (isSignUp) {
        await signUpWithEmail(email, password);
      } else {
        await signInWithEmail(email, password);
      }
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError("");

    try {
      await signInWithGoogle();
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Google sign-in failed");
    } finally {
      setLoading(false);
    }
  };

  // ... rest of your component
}
```

### Step 3: Update Dashboard to Use Real Data
Update `components/laserlock/FocusDashboard.tsx`:

```typescript
"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getUserFocusSessions, createFocusSession } from "@/lib/firestore";
import type { FocusSession } from "@/lib/firestore";

export function FocusDashboard() {
  const { user, userProfile } = useAuth();
  const [sessions, setSessions] = useState<FocusSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadSessions();
    }
  }, [user]);

  const loadSessions = async () => {
    if (!user) return;

    try {
      const userSessions = await getUserFocusSessions(user.uid, 10);
      setSessions(userSessions);
    } catch (error) {
      console.error("Error loading sessions:", error);
    } finally {
      setLoading(false);
    }
  };

  // Display user stats from userProfile
  return (
    <div>
      <h2>Level {userProfile?.level || 1}</h2>
      <p>{userProfile?.xp || 0} XP</p>
      <p>Streak: {userProfile?.currentStreak || 0} days</p>
      {/* ... rest of your dashboard */}
    </div>
  );
}
```

### Step 4: Protect Routes
Create a protected route wrapper:

**File: `components/ProtectedRoute.tsx`**
```typescript
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    }
  }, [user, loading, router]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return user ? <>{children}</> : null;
}
```

## 📊 Part 4: Firestore Data Structure

Your Firestore database will have these collections:

### `users` Collection
```javascript
{
  uid: "firebase_user_id",
  email: "user@example.com",
  name: "User Name",
  level: 28,
  xp: 2450,
  totalFocusTime: 1560, // minutes
  currentStreak: 4,
  longestStreak: 12,
  achievements: ["early_bird", "flow_state"],
  badges: ["laser_focus", "zen_master"],
  createdAt: Timestamp,
  lastActiveAt: Timestamp
}
```

### `focusSessions` Collection
```javascript
{
  userId: "firebase_user_id",
  startTime: Timestamp,
  endTime: Timestamp,
  duration: 45, // minutes
  focusScore: 94, // percentage
  distractions: 2,
  category: "work",
  notes: "Great session!"
}
```

### `challenges` Collection (Optional)
```javascript
{
  title: "Morning Momentum",
  description: "Complete 30min focus before 10 AM",
  type: "daily",
  xpReward: 150,
  target: 30,
  progress: 0,
  completedBy: ["uid1", "uid2"]
}
```

## 🧪 Part 5: Testing Your Integration

### Test Authentication
1. Start your dev server: `npm run dev`
2. Go to http://localhost:3001
3. Try signing up with email/password
4. Check Firebase Console > Authentication > Users to see the new user

### Test Firestore
1. After signing in, check Firebase Console > Firestore Database
2. You should see a new document in the `users` collection
3. Create a focus session and verify it appears in `focusSessions`

### Test Real-time Updates
1. Open your app in two browser windows
2. Make changes in one window
3. Verify they appear in the other window (for leaderboard, etc.)

## 🔒 Security Checklist

- [ ] Never commit `.env.local` to git
- [ ] Update Firestore security rules before production
- [ ] Enable Firebase App Check for production
- [ ] Set up Firebase Authentication email verification
- [ ] Configure OAuth consent screen for Google Sign-In
- [ ] Review Firebase usage quotas and billing

## 🐛 Troubleshooting

### "Firebase: Error (auth/configuration-not-found)"
- Make sure `.env.local` exists and has all values
- Restart your dev server after creating `.env.local`

### "Missing or insufficient permissions"
- Check your Firestore security rules
- Make sure you're signed in before accessing data

### "Firebase App named '[DEFAULT]' already exists"
- This is normal if hot-reloading in development
- The code handles this with `getApps().length` check

## 📚 Next Steps

1. **Add more data**: Create seed data for challenges, achievements
2. **Implement real-time listeners**: Use `subscribeToUserProfile()` and `subscribeToLeaderboard()`
3. **Add analytics**: Track user behavior with Firebase Analytics
4. **Set up Cloud Functions**: Automate tasks like calculating streaks
5. **Deploy**: Use Firebase Hosting or Vercel

## 🤝 Need Help?

- [Firebase Docs](https://firebase.google.com/docs)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Next.js + Firebase Guide](https://firebase.google.com/docs/web/setup)
