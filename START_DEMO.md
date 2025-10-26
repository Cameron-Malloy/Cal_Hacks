# 🚀 Start LaserLock Demo

## Quick Start Commands

### Terminal 1: Start Frontend

```bash
cd /Users/cameronmalloy/Cal_Hacks/frontend
npm run dev
```

Wait for: `✓ Ready in X seconds`

Then open browser to: **http://localhost:3000**

---

### Terminal 2: Start Backend (after clicking "Start Focus")

```bash
cd /Users/cameronmalloy/Cal_Hacks/final_python_script
python3 distraction_tracker.py
```

---

## If Frontend Won't Start

Try these fixes in order:

### Fix 1: Kill conflicting processes
```bash
pkill -9 -f "next"
lsof -ti:3000 | xargs kill -9
```

### Fix 2: Clear cache
```bash
cd /Users/cameronmalloy/Cal_Hacks/frontend
rm -rf .next
```

### Fix 3: Reinstall dependencies (if needed)
```bash
cd /Users/cameronmalloy/Cal_Hacks/frontend
rm -rf node_modules
npm install
```

### Fix 4: Start manually
```bash
cd /Users/cameronmalloy/Cal_Hacks/frontend
npx next dev --hostname localhost --port 3000
```

---

## Demo Flow

1. **Open browser** → http://localhost:3000
2. **Click** "Enter Demo Mode" button
3. **Click** big purple "Start Focus" button
4. **Copy** the backend command shown
5. **Run** backend in Terminal 2
6. **Calibrate** gaze tracking (5 points, press SPACE for each)
7. **Watch** dashboard update in real-time!

---

## What to Demo

- Look away from screen → Gaze distraction
- Open YouTube/Chrome → Window distraction
- Check Leaderboard → See competitive rankings
- End session → View final stats

---

## Already Seeded Data

✅ Leaderboard has 10 fake users + demo user  
✅ All Firebase connections configured  
✅ Backend writes to: `users/demo-user/sessions/{sessionId}`  
✅ Frontend reads from same path in real-time  

Everything is ready! 🎉

