# 🔥 Simple Firebase Integration Guide

## What We're Doing

Your Python backend already collects distraction data in `distraction_events.json`. We're going to:

1. **Sync that exact data** to Firebase (no changes to the structure!)
2. **Display it in real-time** in your Next.js frontend
3. **Calculate focus scores** and show beautiful charts

## ✅ Files Created

### Python Backend (`final_python_script/`)
- ✅ **`firebase_sync.py`** - Script to push events to Firebase
- ✅ **`requirements_firebase.txt`** - Firebase dependencies

### Frontend (`frontend/`)
- ✅ **`lib/firebase.ts`** - Firebase config
- ✅ **`lib/auth.ts`** - Authentication functions
- ✅ **`lib/firestore.ts`** - User/session database functions
- ✅ **`lib/distraction-service.ts`** - Distraction data functions (NEW!)
- ✅ **`lib/types/distraction.ts`** - TypeScript types matching your JSON structure
- ✅ **`contexts/AuthContext.tsx`** - React authentication context

## 🎯 Quick Setup (3 Steps)

### Step 1: Set Up Firebase (10 minutes)

```bash
# 1. Go to https://console.firebase.google.com/
# 2. Create project "LaserLock"
# 3. Add Web App → Copy config values
# 4. Enable Authentication → Email/Password + Google
# 5. Create Firestore → Start in test mode
# 6. Download service account key → Save to final_python_script/firebase-service-account.json
```

### Step 2: Configure Frontend (2 minutes)

```bash
cd frontend

# Copy example file
cp .env.local.example .env.local

# Edit .env.local with your Firebase config (from Step 1)
nano .env.local
```

### Step 3: Install Python Firebase SDK (1 minute)

```bash
cd ../final_python_script

# Install Firebase Admin SDK
pip install -r requirements_firebase.txt
```

## 🚀 Usage

### One-Time Sync (Sync All Existing Events)

```bash
cd final_python_script

# Sync all unsynced events
python firebase_sync.py --user-id YOUR_FIREBASE_USER_ID --session-id SESSION_ID
```

### Real-Time Sync (Watch Mode)

```bash
cd final_python_script

# Start watching for new events
python firebase_sync.py --watch --user-id YOUR_FIREBASE_USER_ID --session-id SESSION_ID
```

### Full Workflow

**Terminal 1: Start Python Tracker + Sync**
```bash
cd final_python_script

# Start tracker (creates distraction_events.json)
python distraction_tracker.py

# In another window, start sync in watch mode
python firebase_sync.py --watch --user-id abc123 --session-id xyz789
```

**Terminal 2: Start Frontend**
```bash
cd frontend
npm run dev
```

**Browser:**
1. Open http://localhost:3001
2. Sign in
3. Watch distractions appear in real-time!

## 📊 What Gets Synced

Your `distraction_events.json` structure is used **exactly as-is**:

```json
{
  "id": "uuid-generated-by-python",
  "type": "gaze_distraction",
  "status": "resolved",
  "reason": "Looking down (y=1.000 > 0.9)",
  "start_time": "2025-10-25T07:15:36.826262",
  "end_time": "2025-10-25T07:15:43.043341",
  "gaze_data": { ... },
  "window_data": { ... },
  "firebase_synced": false  ← Changes to true after sync
}
```

The sync script just:
1. Reads events where `firebase_synced: false`
2. Pushes them to Firestore `distractions` collection
3. Updates the local file with `firebase_synced: true`

## 🎨 Frontend Display

The frontend will automatically:
- Show **total distractions** (gaze + window)
- Calculate **focus score** = (Time Focused / Total Time) × 100
- Display **distraction timeline** chart
- Show **top distracting apps** (from window_data.process_name)
- Update **in real-time** as Python tracker runs

## 🔧 Command Options

### firebase_sync.py

```bash
python firebase_sync.py [OPTIONS]

Options:
  --service-account PATH    Path to service account JSON (default: firebase-service-account.json)
  --events-file PATH        Path to events file (default: distraction_events.json)
  --user-id ID             Firebase user ID (required)
  --session-id ID          Focus session ID (optional)
  --watch                  Watch for new events continuously
  --interval SECONDS       Watch check interval (default: 5)
```

### Examples

```bash
# One-time sync
python firebase_sync.py --user-id abc123

# Watch mode with custom interval
python firebase_sync.py --watch --user-id abc123 --interval 2

# Use custom files
python firebase_sync.py --events-file my_events.json --service-account my-key.json
```

## 📁 Firebase Structure

### Firestore Collections

```
firestore/
├── users/
│   └── {userId}/
│       ├── email: "user@example.com"
│       ├── level: 28
│       ├── xp: 2450
│       └── totalDistractions: 45
│
├── focusSessions/
│   └── {sessionId}/
│       ├── userId: "abc123"
│       ├── startTime: Timestamp
│       ├── endTime: Timestamp
│       ├── focusScore: 94
│       └── totalDistractions: 3
│
└── distractions/                    ← Your distraction_events.json goes here!
    └── {eventId}/                   ← Using the UUID from Python
        ├── id: "uuid-from-python"
        ├── type: "gaze_distraction"
        ├── status: "resolved"
        ├── reason: "Looking down..."
        ├── start_time: Timestamp
        ├── end_time: Timestamp
        ├── gaze_data: { ... }
        ├── window_data: { ... }
        ├── userId: "abc123"         ← Added by sync script
        └── sessionId: "xyz789"      ← Added by sync script
```

## 🎯 Testing

### Test 1: Verify Sync Works

```bash
# 1. Run Python tracker for 30 seconds
python distraction_tracker.py

# 2. Look away from screen a few times

# 3. Stop tracker (Ctrl+C)

# 4. Check the events file
cat distraction_events.json | grep firebase_synced
# Should see: "firebase_synced": false

# 5. Run sync
python firebase_sync.py --user-id test123

# 6. Check again
cat distraction_events.json | grep firebase_synced
# Should see: "firebase_synced": true

# 7. Check Firebase Console
# Go to Firestore → distractions collection
# Should see your events!
```

### Test 2: Real-Time Sync

```bash
# Terminal 1: Start sync in watch mode
python firebase_sync.py --watch --user-id test123

# Terminal 2: Start tracker
python distraction_tracker.py

# Look away from screen
# Watch Terminal 1 - should see sync messages!
```

## 🐛 Troubleshooting

### "Service account file not found"
```bash
# Make sure you downloaded it from Firebase Console
ls firebase-service-account.json

# Should exist in final_python_script/
```

### "Firebase not initialized"
```bash
# Frontend: Check .env.local exists and has values
cat frontend/.env.local

# Restart dev server
cd frontend && npm run dev
```

### "No events synced"
```bash
# Check if events file has unsynced events
cat distraction_events.json | grep '"firebase_synced": false'

# If none, all events already synced!
```

## ⚡ Pro Tips

1. **Run sync in watch mode** during development - it's automatic!
2. **Use different session IDs** for each focus session
3. **Keep terminal open** with sync running - it's fast!
4. **Check Firebase Console** to see data flowing in real-time

---

## Next Steps

1. ✅ Set up Firebase project
2. ✅ Add config to `.env.local`
3. ✅ Install Python dependencies
4. ✅ Download service account JSON
5. ✅ Test sync with existing events
6. ✅ Run in watch mode
7. ✅ See data in frontend!

**Need help? All the code is ready - just need your Firebase credentials!** 🚀
