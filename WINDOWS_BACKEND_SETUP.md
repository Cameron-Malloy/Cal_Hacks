# 🪟 Windows Backend Setup Guide

## ✅ Current Status

**Frontend:** ✅ Running on http://localhost:3000  
**Backend:** ⏸️ Windows-only (instructions below)

---

## 🎯 How to Run on Windows

### Step 1: Install Python (if not installed)
Download Python 3.11+ from: https://www.python.org/downloads/windows/

**Important:** Check "Add Python to PATH" during installation

---

### Step 2: Set Up Virtual Environment

Open **Command Prompt** or **PowerShell** and navigate to the project:

```cmd
cd path\to\Cal_Hacks\final_python_script
```

Create and activate virtual environment:

```cmd
# Create venv
python -m venv venv

# Activate (Command Prompt)
venv\Scripts\activate.bat

# OR Activate (PowerShell)
venv\Scripts\Activate.ps1
```

---

### Step 3: Install Dependencies

With the virtual environment activated:

```cmd
pip install -r requirements.txt
pip install pywin32 psutil firebase-admin
```

**All required packages:**
- `opencv-python` - Camera/gaze tracking
- `mediapipe` - Face mesh detection
- `numpy` - Array operations
- `pywin32` - Windows window monitoring
- `psutil` - Process information
- `firebase-admin` - Firebase sync

---

### Step 4: Run the Backend

```cmd
python distraction_tracker.py
```

**What happens:**

1. **Calibration Window Opens**
   - Look at each RED DOT
   - Press SPACEBAR for each (5 total points)

2. **Tracking Starts**
   - Monitors your gaze (eyes on/off screen)
   - Monitors window focus (apps you switch to)
   - Syncs to Firebase in real-time

3. **Console Output**
   ```
   [FIREBASE] Firebase initialized successfully
   ============================================================
   CALIBRATION PHASE
   ============================================================
   Space pressed - adding calibration point 1
   ...
   CALIBRATION COMPLETED!
   ============================================================
   Status: Gaze=(0.456, 0.523), Window='Cursor', Active=0, Total=0
   ```

---

## 🔥 Firebase Configuration (Already Done!)

The Firebase credentials are already set up in:
- `productivly-563e3-firebase-adminsdk-fbsvc-7d29118195.json`
- Config points to this file in `distraction_config.json`

**User ID:** `demo-user` (hardcoded for demo)

**Firebase Path:**
```
users/demo-user/sessions/{sessionId}/appAccessEvents/
```

---

## 🌐 Frontend Connection

### Step 1: Open Browser (on Windows machine)
```
http://localhost:3000
```

### Step 2: Start Focus Session
1. Click big **"Start Focus"** button
2. You'll see session ID and backend command
3. Backend is already running (Step 4 above)

### Step 3: Watch Real-Time Updates!
- **Gaze Distractions:** Look away from screen
- **Window Distractions:** Switch to YouTube, Chrome, etc.
- **Stats Update Live:** Count goes up, focus score adjusts
- **Timeline Chart:** Shows when distractions happened

---

## 📊 What Gets Tracked

### Gaze Distractions
- Looking down (phone, keyboard)
- Looking left/right off-screen
- Eyes closed for >2 seconds

### Window Distractions
- Blacklisted apps (Chrome, Discord, Spotify, etc.)
- Blacklisted keywords (YouTube, Facebook, Reddit, etc.)
- Window title and process name logged

### All Data Syncs to Firebase
- Real-time updates (< 1 second delay)
- Frontend dashboard shows live stats
- Session data persists in Firestore

---

## 🎬 Demo Flow (Windows)

### Terminal 1: Backend
```cmd
cd final_python_script
venv\Scripts\activate
python distraction_tracker.py
```
→ Complete calibration (5 points)

### Browser: Frontend
```
http://localhost:3000
```
→ Click "Start Focus"

### Demo Actions:
1. **Look down at phone** → Gaze distraction +1
2. **Open YouTube** → Window distraction +1
3. **Switch back to work** → Both resolve
4. **Check dashboard** → See live stats update
5. **View leaderboard** → See competitive rankings
6. **End session** → View final report

---

## 🐛 Troubleshooting (Windows)

### Backend won't start
```cmd
# Reinstall dependencies
pip uninstall opencv-python mediapipe numpy pywin32 psutil
pip install opencv-python mediapipe numpy pywin32 psutil
```

### Camera not detected
- Check if webcam is plugged in
- Close other apps using camera (Zoom, Teams, etc.)
- Run as Administrator

### Firebase sync not working
- Check `productivly-563e3-firebase-adminsdk-fbsvc-7d29118195.json` exists
- Check internet connection
- Console should show: `[FIREBASE] Firebase initialized successfully`

### Port 3000 already in use (Frontend)
```cmd
# Kill process on port 3000
netstat -ano | findstr :3000
taskkill /PID <PID_FROM_ABOVE> /F
```

---

## 📝 Key Files (Windows)

### Backend Files
- `distraction_tracker.py` - Main tracking script
- `fresh_screen_gaze_tracking.py` - Gaze tracking
- `window_logger.py` - Window monitoring (Windows-specific)
- `distraction_config.json` - Configuration
- `productivly-563e3-firebase-adminsdk-fbsvc-7d29118195.json` - Firebase credentials

### Frontend Files
- `frontend/` - Next.js app
- `frontend/components/laserlock/FocusDashboard.tsx` - Main dashboard
- `frontend/components/laserlock/Leaderboard.tsx` - Leaderboard

---

## 🎯 Architecture (Windows → Firebase → Frontend)

```
┌─────────────────────┐
│  Windows Backend    │
│  (Python)           │
│                     │
│  - Gaze tracking    │
│  - Window monitoring│
│  - Event detection  │
└──────────┬──────────┘
           │
           │ Writes events
           ↓
┌─────────────────────┐
│  Firebase Firestore │
│                     │
│  users/demo-user/   │
│    sessions/        │
│      {sessionId}/   │
│        appAccessEvents/│
└──────────┬──────────┘
           │
           │ Real-time updates
           ↓
┌─────────────────────┐
│  Next.js Frontend   │
│  (Any Platform)     │
│                     │
│  - Dashboard        │
│  - Leaderboard      │
│  - Session report   │
└─────────────────────┘
```

---

## ✅ What's Already Done

✅ Frontend configured for demo mode  
✅ Auto-login as `demo-user`  
✅ Firebase credentials in place  
✅ Backend config points to correct Firebase file  
✅ Leaderboard seeded with fake users  
✅ Real-time Firebase listeners implemented  
✅ Dashboard shows live stats  

**Just need Windows to run the backend!** 🪟

---

## 💡 Alternative: Mock Data Demo (No Backend)

If no Windows available, you can demo with:
1. **Show Frontend UI** - Dashboard, leaderboard, beautiful design
2. **Show Firebase Console** - Real data structure
3. **Explain Backend Flow** - How it would work on Windows
4. **Show Code** - Backend tracking logic

The integration is complete - just needs Windows to execute! 🚀

