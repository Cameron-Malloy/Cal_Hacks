# 🚀 LaserLock Cal Hacks Demo Guide

## 🎯 Quick Start (5 Minutes)

### Prerequisites
- Python 3.11+ installed
- Node.js 18+ installed
- Firebase project set up (with credentials in `final_python_script/productivly-563e3-firebase-adminsdk-fbsvc-7d29118195.json`)

---

## Step 1: Seed Demo Data (One Time Setup)

```bash
cd final_python_script
python seed_demo_data.py
```

**Expected Output:**
```
✅ Firebase initialized successfully
✅ Seeded user: FocusNinja (Rank 1, 2850 min focus, Level 28)
✅ Seeded user: ZenMaster (Rank 2, 2700 min focus, Level 26)
...
✅ Seeded demo user: Demo User (You)
✨ Done! Your Firebase is now populated with demo data.
```

This creates:
- 10 fake leaderboard users
- 1 demo user (you)
- All with realistic focus times, levels, and streaks

---

## Step 2: Start the Frontend

```bash
cd frontend
npm install  # First time only
npm run dev
```

**Expected Output:**
```
  ▲ Next.js 15.1.4
  - Local:        http://localhost:3000
  - Network:      http://192.168.x.x:3000

 ✓ Starting...
 ✓ Ready in 2.3s
```

**Open browser:** http://localhost:3000

You should see:
- Beautiful LaserLock landing page
- "Enter Demo Mode" button
- Click it to enter the dashboard

---

## Step 3: Start a Focus Session

1. Click the big **"Start Focus"** button (purple glowing circle)
2. You'll see:
   - Session ID displayed
   - Backend command to copy
   - Instructions box

---

## Step 4: Start the Python Backend

**Open a new terminal** and run:

```bash
cd final_python_script
python distraction_tracker.py
```

**What happens:**
1. Calibration window opens
2. Look at the RED DOTS and press SPACEBAR for each
3. After 5 calibration points, tracking starts
4. Backend monitors:
   - Your gaze (eyes leaving screen)
   - Window focus (distracting apps/tabs)
5. Events sync to Firebase in real-time

**Expected Console Output:**
```
[FIREBASE] Firebase initialized successfully
✓ LangChain Claude initialized (if enabled)
✓ Firebase integration: Enabled
============================================================
CALIBRATION PHASE
============================================================
Space pressed - adding calibration point 1
Space pressed - adding calibration point 2
...
CALIBRATION COMPLETED!
============================================================
Now starting distraction monitoring...
Press Ctrl+C to stop.
============================================================
Status: Gaze=(0.456, 0.523), Window='Cursor', Active=0, Total=0
[FIREBASE] Synced gaze_distraction: Looking down...
```

---

## Step 5: Watch the Magic ✨

### In the Frontend Dashboard:

**Real-time updates** as you use your computer:

#### Stats Cards Update Live:
- ⏱️ **Session Time**: Counts up every second
- 👀 **Gaze Distractions**: Increments when you look away
- 💻 **Window Distractions**: Increments on distracting apps
- ⚡ **Focus Score**: Calculated live (100% = perfect focus)

#### Charts Update:
- **Distraction Timeline**: Shows when distractions occurred
- **Current Status**: Shows your current window, gaze position

#### Recent Distractions Feed:
- Lists each distraction as it happens
- Shows type (gaze 👀 or window 💻)
- Shows status (active 🟠 or resolved ✅)
- Updates in real-time!

---

## 🎬 Demo Script (For Presentation)

### Scene 1: Login (5 seconds)
```
"Let me show you LaserLock - click Enter Demo Mode"
→ Instant access, no signup needed
```

### Scene 2: Start Session (10 seconds)
```
"Click Start Focus to begin a session"
→ Session created instantly
"Now I start the Python backend" [copy command, run in terminal]
```

### Scene 3: Calibration (30 seconds)
```
"First, we calibrate gaze tracking - look at each dot and press space"
→ 5 calibration points
"Calibration complete, now tracking starts"
```

### Scene 4: Live Tracking Demo (60 seconds)

**Action 1: Look away from screen**
```
"Watch what happens when I look down at my phone..."
→ Dashboard shows: "👀 Gaze: Looking down (y=1.000 > 0.9)" [ACTIVE]
→ Stats update: Gaze Distractions +1
→ Focus score drops slightly

"When I look back..."
→ Dashboard shows: [RESOLVED]
→ Timeline chart updates
```

**Action 2: Switch to distracting app**
```
"Now let me open YouTube..."
→ Dashboard shows: "💻 Window: Blacklisted keyword 'youtube'" [ACTIVE]
→ Stats update: Window Distractions +1
→ Focus score drops more

"Back to work..."
→ Dashboard shows: [RESOLVED]
```

**Action 3: Check the stats**
```
"Look at the real-time stats:
- Session Time: 2m 34s
- Gaze Distractions: 1
- Window Distractions: 1  
- Focus Score: 94%

The timeline shows when distractions happened
Current status shows what I'm doing right now"
```

### Scene 5: Leaderboard (15 seconds)
```
"Navigate to Leaderboard"
→ Shows competitive rankings
→ Demo user appears in the list
→ Real-time updates from Firestore
"This creates accountability and motivation"
```

### Scene 6: End Session (5 seconds)
```
"Click End Session"
→ Final stats saved
→ Session marked as completed
```

---

## 🎯 Key Demo Points to Emphasize

### 1. **Real-Time Tracking**
- "Everything updates **instantly** - no refresh needed"
- "Backend Python + Frontend React communicating through Firebase"

### 2. **Dual Detection**
- "We catch **two types** of distractions:"
  - "👀 Gaze: When you physically look away"
  - "💻 Window: When you switch to distracting apps"

### 3. **Computer Vision + App Monitoring**
- "Uses **MediaPipe** for gaze tracking"
- "Monitors **window focus** at OS level"
- "Combines both for comprehensive distraction detection"

### 4. **Neurodiverse Focus**
- "Designed for people with ADHD"
- "Real-time feedback helps you **notice and correct** distractions"
- "Gamification keeps you **motivated**"

### 5. **Data Insights**
- "All data stored in Firebase"
- "Historical trends and patterns"
- "See when you're most focused"

---

## 🐛 Troubleshooting

### Frontend doesn't show live updates?
**Check:**
1. Is Python backend running?
2. Session ID matches between frontend and backend?
3. Check browser console for Firebase errors

### Backend crashes during calibration?
**Check:**
1. Is your webcam accessible?
2. Try running: `python -c "import cv2; print(cv2.VideoCapture(0).isOpened())"`
3. Should print `True`

### No distractions detected?
**Check:**
1. Backend calibration completed successfully?
2. Look at console - should show: `Status: Gaze=(x, y), Window='...', Active=X, Total=Y`
3. Try looking down significantly (below screen)
4. Try opening YouTube or Chrome

### Firebase sync not working?
**Check:**
1. Service account JSON file exists?
2. Path in `distraction_config.json` is correct?
3. Console shows: `[FIREBASE] Firebase initialized successfully`?

---

## 📊 What Gets Stored in Firebase

### Users Collection
```
users/demo-user/
  - uid: "demo-user"
  - name: "Demo User (You)"
  - level: 5
  - totalFocusTime: 120 minutes
  - currentStreak: 2 days
```

### Sessions Collection
```
users/demo-user/sessions/{sessionId}/
  - session_id: "session_1234567890"
  - start_time: Timestamp
  - status: "active" | "completed"
  - total_events: 5
  - gaze_distractions: 2
  - window_distractions: 3
```

### Events Collection
```
users/demo-user/sessions/{sessionId}/appAccessEvents/{eventId}/
  - id: "uuid-from-python"
  - type: "gaze_distraction" | "window_distraction"
  - status: "active" | "resolved"
  - reason: "Looking down (y=1.000 > 0.9)"
  - start_time: Timestamp
  - end_time: Timestamp
  - gaze_data: {...}
  - window_data: {...}
```

---

## 🎨 UI Features Showcase

### Dashboard
- ⭕ **Giant Focus Button**: Can't miss it, beautiful glow effect
- 📊 **Live Stats Cards**: Update every second
- 📈 **Timeline Chart**: Visual distraction pattern
- 📝 **Recent Distractions Feed**: Scrollable list
- 💻 **Current Status**: Real-time window/gaze data

### Leaderboard
- 🏆 **Top 3 Special Icons**: Trophy, Medal, Award
- 🔥 **Streak Counter**: Shows daily consistency
- ⚡ **Real-time Updates**: Positions change live
- 👤 **Highlight Current User**: Purple gradient

### Profile
- 📊 **Stats Overview**: Total time, level, XP
- 🏅 **Achievements**: Unlockable badges
- 📈 **Progress Chart**: Your growth over time

---

## 🚀 Performance Notes

- **Frontend**: Instant page loads with Next.js
- **Backend**: ~30 FPS gaze tracking
- **Firebase**: <100ms real-time updates
- **Focus Score**: Calculated client-side, updates every second

---

## 📝 Post-Demo Cleanup

To reset for another demo:

```bash
# Option 1: Keep data, start new session
# Just click "Start Focus" again

# Option 2: Reset all data
cd final_python_script
python seed_demo_data.py  # Re-seeds from scratch
```

---

## 🎯 Cal Hacks Judging Criteria Alignment

### Innovation ✨
- Novel combination of gaze tracking + app monitoring
- Real-time Firebase sync between Python and React
- Computer vision for ADHD support

### Technical Complexity 🔧
- MediaPipe integration
- Multi-threaded Python (gaze, window, Firebase workers)
- Real-time Firestore listeners
- Cross-platform window monitoring

### Design 🎨
- Beautiful glassmorphism UI
- Smooth animations with Framer Motion
- Intuitive UX (big button, clear stats)

### Social Impact 💜
- Addresses real problem (ADHD distraction)
- Evidence-based approach (gaze tracking research)
- Gamification for motivation

---

## 🎉 You're Ready!

Everything is set up for an impressive demo. The integration is complete:

✅ **Backend** tracks distractions and syncs to Firebase  
✅ **Frontend** shows real-time updates from Firebase  
✅ **Leaderboard** displays competitive rankings  
✅ **Demo mode** requires no authentication  
✅ **Seed data** provides realistic leaderboard  

**Break a leg at Cal Hacks! 🚀**

