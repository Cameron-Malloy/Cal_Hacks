# Front-End & Back-End Integration Guide

This guide explains how to run the integrated distraction tracking system where the front-end "Start Focus" button triggers the back-end Python distraction tracker.

## Architecture

The system now consists of:
1. **Next.js Front-End** - User interface with "Start Focus" button
2. **Flask API Server** - REST API that controls the distraction tracker
3. **Python Distraction Tracker** - Gaze and window monitoring system

When you click "Start Focus" in the UI:
- Front-end creates a session in Firebase
- Front-end calls Flask API with the session ID
- Flask API starts the Python distraction tracker with that session ID
- Both front-end and back-end write to the same Firebase session

## Setup Instructions

### 1. Install Backend Dependencies

```bash
cd final_python_script
pip install -r requirements.txt
```

Make sure Flask and Flask-CORS are installed:
```bash
pip install flask flask-cors
```

### 2. Configure Firebase

Ensure you have the Firebase service account credentials file:
- `final_python_script/firebase-service-account.json`

And the config file:
- `final_python_script/distraction_config.json`

Make sure `use_firebase: true` in `distraction_config.json`:
```json
{
  "use_firebase": true,
  "firebase_config_path": "firebase-service-account.json",
  "demo_user_id": "demo-user"
}
```

### 3. Start the Flask API Server

```bash
cd final_python_script
python api_server.py
```

You should see:
```
Starting Flask API server...
Server will be available at http://localhost:5000
```

The server exposes these endpoints:
- `POST /api/session/start` - Start tracking session
- `POST /api/session/stop` - Stop tracking session
- `GET /api/session/status` - Get session status
- `GET /api/health` - Health check

### 4. Start the Front-End

In a separate terminal:

```bash
cd frontend
npm install
npm run dev
```

The front-end will be available at `http://localhost:3000`

### 5. Optional: Configure Backend URL

If running the backend on a different machine or port, create a `.env.local` file in the `frontend` directory:

```bash
# frontend/.env.local
NEXT_PUBLIC_BACKEND_URL=http://localhost:5000
```

## Usage Flow

1. **Start Backend Server**: Run `python api_server.py` in `final_python_script/`
2. **Start Frontend**: Run `npm run dev` in `frontend/`
3. **Open Browser**: Navigate to `http://localhost:3000`
4. **Click "Start Focus"**:
   - Front-end creates session in Firebase
   - Front-end calls backend API
   - Backend starts distraction tracker with gaze calibration
   - Follow calibration instructions (look at dots, press SPACEBAR)
   - Tracking begins automatically
5. **Monitor Session**: Front-end displays real-time metrics from Firebase
6. **Click "End Session"**:
   - Front-end calls backend API to stop tracking
   - Backend saves final session data
   - Front-end shows session report

## Troubleshooting

### "Could not connect to distraction tracking backend"
- Make sure the Flask API server is running (`python api_server.py`)
- Check that it's running on port 5000
- Verify no firewall is blocking the connection

### "A tracking session is already active"
- Stop the current session by calling `/api/session/stop`
- Or restart the Flask API server

### Flask dependencies missing
```bash
pip install flask flask-cors
```

### Camera not found during calibration
- Ensure your webcam is connected and not being used by another application
- Grant camera permissions if prompted

## Technical Details

### Session ID Format
- Front-end: `session_${Date.now()}` (JavaScript timestamp)
- Backend: Uses the same session ID passed from front-end
- Both write to: `users/{userId}/sessions/{sessionId}` in Firebase

### Firebase Document Structure
```
users/
  demo-user/
    sessions/
      session_1234567890/
        session_id: "session_1234567890"
        start_time: Timestamp
        status: "active" | "completed"
        gaze_distractions: number
        window_distractions: number
        appAccessEvents/
          {eventId}/
            type: "gaze_distraction" | "window_distraction"
            start_time: Timestamp
            end_time: Timestamp
            ...
```

### API Endpoints

**POST /api/session/start**
```json
Request:
{
  "session_id": "session_1234567890",
  "user_id": "demo-user"
}

Response:
{
  "status": "success",
  "message": "Session started",
  "session_id": "session_1234567890",
  "user_id": "demo-user"
}
```

**POST /api/session/stop**
```json
Response:
{
  "status": "success",
  "message": "Session stopped",
  "session_id": "session_1234567890"
}
```

## Development Tips

- The backend runs in a separate thread, so the Flask API remains responsive
- If you modify the distraction tracker, restart the Flask API server
- The front-end will show warnings if it can't connect to the backend, but will still create Firebase sessions
- Check browser console and Python terminal for detailed logs
