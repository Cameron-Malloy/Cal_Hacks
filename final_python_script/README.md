# Distraction Tracking System

A comprehensive system that combines gaze tracking and window monitoring to detect and log distractions during work/study sessions.

## Features

- **Gaze-based Distraction Detection**: Tracks when your eyes leave the screen (especially looking down)
- **Window-based Distraction Detection**: Monitors active applications and browser tabs for unproductive content
- **Intelligent Assessment**: Uses Claude AI to assess whether content is distracting or productive
- **Configurable Blacklists**: Customizable lists of distracting apps and keywords
- **Comprehensive Logging**: Detailed logs of all distraction events with timestamps

## Installation

1. Install Python dependencies:
```bash
pip install -r requirements.txt
```

2. For Claude AI integration (optional), get an API key from Anthropic and add it to the config file.

## Usage

### Basic Usage
```bash
python distraction_tracker.py
```

### Configuration

Edit `distraction_config.json` to customize:

- **blacklisted_apps**: List of executable names to consider distracting
- **blacklisted_keywords**: Keywords in window titles that indicate distraction
- **use_claude**: Enable/disable Claude AI assessment
- **claude_api_key**: Your Anthropic API key for intelligent assessment
- **gaze_threshold_y**: Threshold for detecting "looking down" (0.0-1.0)
- **gaze_threshold_x_min/max**: Horizontal screen boundaries
- **distraction_timeout**: Seconds of sustained distraction before logging

### Example Configuration
```json
{
  "blacklisted_apps": ["chrome.exe", "discord.exe", "spotify.exe"],
  "blacklisted_keywords": ["youtube", "facebook", "gaming"],
  "use_claude": true,
  "claude_api_key": "your-api-key-here",
  "gaze_threshold_y": 0.8,
  "distraction_timeout": 2.0
}
```

## How It Works

### Phase 1: Calibration
1. Opens a calibration window
2. Shows 5 red dots at different screen positions
3. Look at each dot and press SPACEBAR when ready
4. System learns your eye movement patterns

### Phase 2: Monitoring
1. **Gaze Tracking**: Continuously monitors eye position
   - Detects when looking down (distracted)
   - Detects when looking off-screen horizontally
   - Logs sustained distractions after timeout period

2. **Window Monitoring**: Tracks active applications
   - Checks against blacklisted apps
   - Scans window titles for distracting keywords
   - Uses Claude AI for intelligent assessment (if enabled)

## Output Files

- **distraction_events.json**: Detailed log of all distraction events
- **distraction_tracker.log**: System log with timestamps
- **distraction_events.log**: Window focus events (from window logger)

## Distraction Event Format

```json
{
  "timestamp": "2024-01-15T10:30:45.123456",
  "type": "gaze_distraction",
  "reason": "Looking down (y=0.850 > 0.8)",
  "gaze_x": 0.523,
  "gaze_y": 0.850,
  "is_tracking": true,
  "window_title": "Visual Studio Code",
  "process_name": "Code.exe",
  "process_id": 1234
}
```

## Distraction Types

### Gaze Distractions
- **Looking Down**: Eyes move below threshold (default: y > 0.8)
- **Looking Off-Screen**: Eyes move beyond horizontal boundaries
- **No Face Detected**: Camera can't detect face (possible distraction)

### Window Distractions
- **Blacklisted Apps**: Known distracting applications
- **Blacklisted Keywords**: Distracting content in window titles
- **Claude Assessment**: AI-determined distracting content

## Troubleshooting

### Camera Issues
- Ensure camera is connected and not used by other applications
- Check camera permissions in Windows settings

### Calibration Problems
- Ensure good lighting on your face
- Keep head still during calibration
- Look directly at the red dots

### Window Detection Issues
- Run as administrator if window detection fails
- Check that pywin32 and psutil are properly installed

### Claude API Issues
- Verify API key is correct and has credits
- Check internet connection
- Disable Claude integration if not needed

## Customization

### Adding New Distraction Patterns
1. Edit `distraction_config.json`
2. Add new apps to `blacklisted_apps`
3. Add new keywords to `blacklisted_keywords`

### Adjusting Sensitivity
- Lower `gaze_threshold_y` to detect smaller downward glances
- Increase `distraction_timeout` to reduce false positives
- Adjust horizontal thresholds for different screen setups

### Custom Claude Prompts
Modify the `assess_with_claude()` method in `distraction_tracker.py` to customize AI assessment criteria.

## Privacy Notes

- All processing happens locally on your machine
- Claude API calls only send window titles and process names
- No personal data is stored or transmitted
- Camera data is processed in real-time and not saved

## System Requirements

- Windows 10/11
- Python 3.8+
- Webcam
- 4GB+ RAM recommended
- Internet connection (for Claude API, optional)

## License

This project is for educational and personal use. Please respect privacy and use responsibly.
