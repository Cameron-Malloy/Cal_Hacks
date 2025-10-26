# 🚀 COMPLETE INTEGRATION ROADMAP

## ⚠️ CRITICAL UNDERSTANDING

The app has **3 SEPARATE PROCESSES** that must run simultaneously:

```
┌─────────────────────────────────────────────────────────────┐
│  1. Frontend (Next.js)    ← User interacts here             │
│     http://localhost:3002                                    │
└─────────────────────────────────────────────────────────────┘
                              ↓ ↑
                         Firebase Auth
                         Firestore Queries
                              ↓ ↑
┌─────────────────────────────────────────────────────────────┐
│  2. Python Distraction Tracker    ← Tracks eye gaze & apps  │
│     Writes to: distraction_events.json                       │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  3. Firebase Sync Script    ← Syncs events to Firestore     │
│     Reads: distraction_events.json                           │
│     Writes: Firebase /distractions collection                │
└─────────────────────────────────────────────────────────────┘
```

**The "Start Focus" button does NOT launch the Python tracker!**
It only creates a session record in Firestore. You must run the Python tracker separately.

---

## 📋 STEP-BY-STEP INTEGRATION

### Step 1: Get Your Firebase User ID

**Option A: Create a helper script**

Create `/Users/cameronmalloy/Cal_Hacks/frontend/get-user-id.js`:
```javascript
const admin = require('firebase-admin');
const serviceAccount = require('../final_python_script/productivly-563e3-firebase-adminsdk-fbsvc-7d29118195.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

async function listUsers() {
  const listUsersResult = await admin.auth().listUsers();
  listUsersResult.users.forEach((user) => {
    console.log('User ID:', user.uid);
    console.log('Email:', user.email);
    console.log('---');
  });
}

listUsers();
```

Run: `node get-user-id.js`

**Option B: Use Firebase Console**
1. Go to https://console.firebase.google.com
2. Select "productivly-563e3"
3. Go to Authentication → Users
4. Copy your User ID

**Option C: Check browser console**
1. Open http://localhost:3002
2. Log in
3. Open browser console (F12)
4. Type: `localStorage` and look for Firebase auth data

---

### Step 2: Terminal 1 - Frontend (Already Running ✅)
```bash
cd /Users/cameronmalloy/Cal_Hacks/frontend
npm run dev
```
**Status**: Running on http://localhost:3002

---

### Step 3: Terminal 2 - Python Distraction Tracker

```bash
cd /Users/cameronmalloy/Cal_Hacks/final_python_script

# Install dependencies if not already installed
pip install -r requirements_firebase.txt

# Run the tracker
python distraction_tracker.py
```

**What this does**:
- Tracks eye gaze using webcam
- Monitors active windows
- Writes events to `distraction_events.json` in real-time

---

### Step 4: Terminal 3 - Firebase Sync

**IMPORTANT**: Replace `YOUR_USER_ID` with your actual Firebase user ID from Step 1

```bash
cd /Users/cameronmalloy/Cal_Hacks/final_python_script

# Run in watch mode (continuously syncs new events)
python firebase_sync.py --watch --user-id YOUR_USER_ID
```

**What this does**:
- Watches `distraction_events.json` for new events
- Syncs them to Firestore in real-time
- Adds your `userId` to each event

**Example**:
```bash
python firebase_sync.py --watch --user-id abc123xyz456
```

---

### Step 5: Using the App

1. **Open http://localhost:3002**
2. **Log in** with the same account whose user ID you used in Step 4
3. **Click "Start Focus"** in the dashboard
   - This creates a session in Firestore
   - Note the session ID (check browser console if needed)
4. **The Python tracker should already be running** (from Step 3)
5. **Watch real-time updates**:
   - Gaze distractions appear when you look away
   - Window distractions appear when you switch apps
   - Focus score updates in real-time

---

## 🔧 TROUBLESHOOTING

### Issue 1: No Data Loading (0m focus time, 0 distractions)

**Cause**: No existing data in Firestore OR user not authenticated

**Fix**:
1. Check browser console for errors (F12)
2. Verify you're logged in (check top-right corner)
3. Run a test session:
   ```bash
   # Terminal 2
   python distraction_tracker.py

   # Terminal 3 (replace YOUR_USER_ID)
   python firebase_sync.py --user-id YOUR_USER_ID
   ```
4. Look away from screen - you should see events in terminal
5. Refresh dashboard - data should appear

### Issue 2: "Start Focus" Button Doesn't Launch Backend

**Cause**: This is expected behavior! The button only creates a Firestore record.

**Fix**: The Python tracker must run independently (see Step 3)

### Issue 3: Distraction Events Not Appearing in Frontend

**Check**:
1. ✅ Python tracker running? (Terminal 2)
2. ✅ Firebase sync running? (Terminal 3)
3. ✅ Correct user ID in sync command?
4. ✅ Logged into the same Firebase account?

**Debug**:
```bash
# Check if events are being written to JSON
tail -f /Users/cameronmalloy/Cal_Hacks/final_python_script/distraction_events.json

# Check if sync is working
# You should see: "✅ Synced gaze_distraction..." messages
```

### Issue 4: Firebase Permission Errors

**Check `.env.local`**:
```bash
cat /Users/cameronmalloy/Cal_Hacks/frontend/.env.local
```

Should contain:
```
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=productivly-563e3
...
```

### Issue 5: No Session ID for Linking Distractions

**Current limitation**: The sync script needs the session ID to link distractions to sessions.

**Workaround for now**:
1. Click "Start Focus" in dashboard
2. Check browser console: `getCurrentSession()`
3. Get session ID
4. Restart sync with session ID:
   ```bash
   python firebase_sync.py --watch --user-id YOUR_USER_ID --session-id SESSION_ID
   ```

**Better solution (TODO)**: Auto-detect active session or modify frontend to pass session ID to backend

---

## 🎯 EXPECTED BEHAVIOR (When Working)

### When You Start:
1. Click "Start Focus" → Timer starts
2. Python tracker detects distractions
3. Events appear in `distraction_events.json`
4. Sync script pushes to Firestore
5. Frontend updates in real-time (2-5 second delay)

### What You Should See:
- **Gaze Distractions**: When you look away from screen
- **Window Distractions**: When you switch to distracting apps
- **Focus Score**: Updates every second (starts at 100%, decreases with distractions)
- **Current App**: Shows active window name

### After Session Ends:
1. Click "Focus Active" button to stop
2. Session saved to Firestore
3. Go to "Report" tab → See your session history
4. Go to "Leaderboard" tab → See your ranking

---

## 🏗️ ARCHITECTURE IMPROVEMENTS NEEDED

### Current Limitations:

1. **Manual Process Management**
   - Need to manually start 3 processes
   - No automatic session ID linking

2. **User ID Hardcoded**
   - Must manually get and enter user ID

3. **No Background Service**
   - Python tracker doesn't run as service

### Recommended Improvements:

**Option A: Simple Shell Script** (Quick Fix)
Create `start-all.sh`:
```bash
#!/bin/bash
USER_ID="$1"

if [ -z "$USER_ID" ]; then
    echo "Usage: ./start-all.sh YOUR_USER_ID"
    exit 1
fi

# Start frontend
cd frontend && npm run dev &

# Start tracker
cd ../final_python_script
python distraction_tracker.py &

# Start sync
python firebase_sync.py --watch --user-id $USER_ID &

echo "All processes started!"
echo "Frontend: http://localhost:3002"
```

**Option B: Electron App** (Better UX)
Wrap everything in an Electron app that manages all 3 processes

**Option C: Desktop App with Tray Icon**
Build a native desktop app with system tray integration

---

## ✅ VERIFICATION CHECKLIST

Run through this checklist:

- [ ] Frontend running on http://localhost:3002
- [ ] Can log in with Firebase Auth
- [ ] Python tracker running (check for webcam indicator)
- [ ] Firebase sync running (watch mode)
- [ ] distraction_events.json updating with new events
- [ ] User ID matches logged-in user
- [ ] Click "Start Focus" → timer starts
- [ ] Look away from screen → gaze distraction detected
- [ ] Switch to YouTube/etc → window distraction detected
- [ ] Dashboard shows real-time updates
- [ ] Focus score decreases with distractions
- [ ] "Report" tab shows session history after stopping

---

## 🚨 QUICK START (TL;DR)

```bash
# Terminal 1
cd /Users/cameronmalloy/Cal_Hacks/frontend
npm run dev

# Terminal 2
cd /Users/cameronmalloy/Cal_Hacks/final_python_script
python distraction_tracker.py

# Terminal 3 (GET YOUR USER ID FIRST!)
cd /Users/cameronmalloy/Cal_Hacks/final_python_script
python firebase_sync.py --watch --user-id YOUR_ACTUAL_USER_ID
```

Then:
1. Open http://localhost:3002
2. Log in
3. Click "Start Focus"
4. Look away to test!

---

## 📞 NEXT STEPS FOR PRODUCTION

1. **Automatic Session Linking**: Modify sync script to auto-detect active sessions
2. **Background Service**: Convert Python tracker to system service
3. **Desktop App**: Build Electron wrapper for easier deployment
4. **Auto User Detection**: Get user ID from Firebase token instead of CLI arg
5. **Process Manager**: Use PM2 or similar to manage processes
6. **Installer**: Create one-click installer for end users

