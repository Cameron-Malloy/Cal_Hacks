@echo off
echo Starting Distraction Tracking System...
echo.
echo Make sure you have installed the requirements:
echo pip install -r requirements.txt
echo.
echo Press any key to continue or Ctrl+C to cancel...
pause > nul

python distraction_tracker.py

echo.
echo Distraction tracking session completed.
echo Check distraction_events.json for results.
pause
