#!/bin/bash

# Startup script for the integrated distraction tracking system
# This script starts both the Flask API backend and the Next.js frontend

echo "========================================="
echo "Distraction Tracking System Startup"
echo "========================================="
echo ""

# Check if we're in the right directory
if [ ! -d "final_python_script" ] || [ ! -d "frontend" ]; then
    echo "Error: Please run this script from the Cal_Hacks directory"
    exit 1
fi

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "Shutting down servers..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    exit 0
}

trap cleanup SIGINT SIGTERM

# Start Flask API Server
echo "Starting Flask API Server..."
cd final_python_script
python api_server.py &
BACKEND_PID=$!
cd ..

# Wait a bit for backend to start
sleep 2

# Check if backend started successfully
if ! kill -0 $BACKEND_PID 2>/dev/null; then
    echo "Error: Flask API server failed to start"
    echo "Make sure you have installed the dependencies:"
    echo "  cd final_python_script"
    echo "  pip install -r requirements.txt"
    exit 1
fi

echo "✓ Flask API Server started (PID: $BACKEND_PID)"
echo "  Available at: http://localhost:5000"
echo ""

# Start Next.js Frontend
echo "Starting Next.js Frontend..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

# Wait a bit for frontend to start
sleep 3

# Check if frontend started successfully
if ! kill -0 $FRONTEND_PID 2>/dev/null; then
    echo "Error: Frontend server failed to start"
    echo "Make sure you have installed the dependencies:"
    echo "  cd frontend"
    echo "  npm install"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

echo "✓ Next.js Frontend started (PID: $FRONTEND_PID)"
echo "  Available at: http://localhost:3000"
echo ""
echo "========================================="
echo "Both servers are running!"
echo "========================================="
echo "Press Ctrl+C to stop both servers"
echo ""

# Wait for processes
wait
