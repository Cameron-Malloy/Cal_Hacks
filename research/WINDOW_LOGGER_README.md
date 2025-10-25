# Window Focus Logger

A Python system to monitor and log the currently focused window on Windows.

## Features

- **Real-time monitoring**: Continuously tracks window focus changes
- **Detailed information**: Captures window title, process name, PID, window dimensions, and more
- **Multiple log formats**: JSON, text, or both formats
- **Flexible usage**: Can be used as a library or standalone script
- **One-time checks**: Get current window information without continuous monitoring

## Installation

1. Install required dependencies:
```bash
pip install pywin32 psutil
```

2. Or install from requirements.txt:
```bash
pip install -r requirements.txt
```

## Usage

### Command Line Usage

**Monitor window changes continuously:**
```bash
python window_focus_logger.py
```

**Log current window once and exit:**
```bash
python window_focus_logger.py --once
```

**Use different log formats:**
```bash
python window_focus_logger.py --format json    # JSON format (default)
python window_focus_logger.py --format text    # Human-readable text
python window_focus_logger.py --format both    # Both formats
```

**Change check interval:**
```bash
python window_focus_logger.py --interval 1.0   # Check every 1 second
```

**Specify custom log file:**
```bash
python window_focus_logger.py --log-file my_windows.log
```

### Library Usage

```python
from window_focus_logger import WindowFocusLogger

# Create logger instance
logger = WindowFocusLogger(log_file="windows.log", log_format="json")

# Get current window information
window_info = logger.get_current_window()
if window_info:
    print(f"Current window: {window_info['window_title']}")
    print(f"Process: {window_info['process_name']}")

# Start continuous monitoring
logger.monitor_focus_changes(check_interval=0.5)
```

## Log Output Examples

### JSON Format
```json
{
  "timestamp": "2024-01-15T10:30:45.123456",
  "window_title": "Visual Studio Code",
  "process_name": "Code.exe",
  "process_path": "C:\\Users\\User\\AppData\\Local\\Programs\\Microsoft VS Code\\Code.exe",
  "process_id": 1234,
  "window_class": "Chrome_WidgetWin_1",
  "window_handle": 123456,
  "window_rect": {
    "left": 100,
    "top": 100,
    "right": 1920,
    "bottom": 1080,
    "width": 1820,
    "height": 980
  }
}
```

### Text Format
```
2024-01-15 10:30:45,123 - INFO - Window: 'Visual Studio Code' | Process: Code.exe | PID: 1234
```

## Example Scripts

Run the example script to see different usage patterns:
```bash
python window_logger_example.py
```

## Requirements

- Windows operating system
- Python 3.7+
- pywin32 (Windows API access)
- psutil (Process utilities)

## Notes

- The script requires Windows API access, so it only works on Windows systems
- Some system windows may not be accessible due to security restrictions
- The monitoring runs until interrupted with Ctrl+C
- Log files are created in the current directory by default
