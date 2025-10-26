"""
Window Focus Logger for macOS/Windows

This script monitors and logs the currently focused window.
It tracks window titles, process names, and timestamps of focus changes.
"""

import time
import logging
import json
from datetime import datetime
from typing import Optional, Dict, Any
import sys
import platform

# Platform-specific imports
if platform.system() == "Darwin":  # macOS
    try:
        from Quartz import (
            CGWindowListCopyWindowInfo,
            kCGWindowListOptionOnScreenOnly,
            kCGNullWindowID,
        )
        from AppKit import NSWorkspace
        import psutil
        PLATFORM = "macOS"
    except ImportError:
        print("Required packages not found. Please install them using:")
        print("pip install pyobjc-framework-Quartz pyobjc-framework-AppKit psutil")
        sys.exit(1)
elif platform.system() == "Windows":
    try:
        import win32gui
        import win32process
        import psutil
        PLATFORM = "Windows"
    except ImportError:
        print("Required packages not found. Please install them using:")
        print("pip install pywin32 psutil")
        sys.exit(1)
else:
    print(f"Unsupported platform: {platform.system()}")
    sys.exit(1)


class WindowFocusLogger:
    """A class to monitor and log window focus changes on Windows."""
    
    def __init__(self, log_file: str = "window_focus.log", log_format: str = "json"):
        """
        Initialize the window focus logger.
        
        Args:
            log_file: Path to the log file
            log_format: Format for logging ('json', 'text', or 'both')
        """
        self.log_file = log_file
        self.log_format = log_format
        self.current_window = None
        self.logger = self._setup_logger()
        
    def _setup_logger(self) -> logging.Logger:
        """Set up the logging configuration."""
        logger = logging.getLogger('WindowFocusLogger')
        logger.setLevel(logging.INFO)
        
        # Create file handler
        file_handler = logging.FileHandler(self.log_file)
        file_handler.setLevel(logging.INFO)
        
        # Create formatter
        if self.log_format in ['text', 'both']:
            formatter = logging.Formatter(
                '%(asctime)s - %(levelname)s - %(message)s'
            )
            file_handler.setFormatter(formatter)
        
        logger.addHandler(file_handler)
        
        # Also log to console
        console_handler = logging.StreamHandler()
        console_handler.setLevel(logging.INFO)
        console_formatter = logging.Formatter('%(asctime)s - %(message)s')
        console_handler.setFormatter(console_formatter)
        logger.addHandler(console_handler)
        
        return logger
    
    def get_active_window_info(self) -> Optional[Dict[str, Any]]:
        """
        Get information about the currently active window.
        
        Returns:
            Dictionary containing window information or None if no active window
        """
        try:
            # Get the handle of the active window
            hwnd = win32gui.GetForegroundWindow()
            
            if not hwnd:
                return None
            
            # Get window title
            window_title = win32gui.GetWindowText(hwnd)
            
            # Get process ID
            _, pid = win32process.GetWindowThreadProcessId(hwnd)
            
            # Get process information
            try:
                process = psutil.Process(pid)
                process_name = process.name()
                process_path = process.exe()
            except (psutil.NoSuchProcess, psutil.AccessDenied):
                process_name = "Unknown"
                process_path = "Unknown"
            
            # Get window class name
            try:
                window_class = win32gui.GetClassName(hwnd)
            except:
                window_class = "Unknown"
            
            # Get window rectangle
            try:
                rect = win32gui.GetWindowRect(hwnd)
                window_rect = {
                    "left": rect[0],
                    "top": rect[1],
                    "right": rect[2],
                    "bottom": rect[3],
                    "width": rect[2] - rect[0],
                    "height": rect[3] - rect[1]
                }
            except:
                window_rect = None
            
            return {
                "timestamp": datetime.now().isoformat(),
                "window_title": window_title,
                "process_name": process_name,
                "process_path": process_path,
                "process_id": pid,
                "window_class": window_class,
                "window_handle": hwnd,
                "window_rect": window_rect
            }
            
        except Exception as e:
            self.logger.error(f"Error getting window info: {e}")
            return None
    
    def log_window_info(self, window_info: Dict[str, Any]) -> None:
        """
        Log window information in the specified format.
        
        Args:
            window_info: Dictionary containing window information
        """
        if not window_info:
            return
        
        timestamp = window_info["timestamp"]
        window_title = window_info["window_title"]
        process_name = window_info["process_name"]
        
        # Create log message
        if self.log_format == "json":
            self.logger.info(json.dumps(window_info, indent=None))
        elif self.log_format == "text":
            self.logger.info(f"Window: '{window_title}' | Process: {process_name} | PID: {window_info['process_id']}")
        elif self.log_format == "both":
            # Log both formats
            self.logger.info(json.dumps(window_info, indent=None))
            self.logger.info(f"Window: '{window_title}' | Process: {process_name} | PID: {window_info['process_id']}")
    
    def monitor_focus_changes(self, check_interval: float = 0.5) -> None:
        """
        Monitor window focus changes continuously.
        
        Args:
            check_interval: Time interval between checks in seconds
        """
        self.logger.info("Starting window focus monitoring...")
        self.logger.info(f"Logging to: {self.log_file}")
        self.logger.info(f"Log format: {self.log_format}")
        self.logger.info(f"Check interval: {check_interval}s")
        self.logger.info("Press Ctrl+C to stop monitoring")
        
        try:
            while True:
                window_info = self.get_active_window_info()
                
                if window_info:
                    # Check if the window has changed
                    current_window_key = f"{window_info['window_title']}|{window_info['process_name']}"
                    
                    if self.current_window != current_window_key:
                        self.current_window = current_window_key
                        self.log_window_info(window_info)
                
                time.sleep(check_interval)
                
        except KeyboardInterrupt:
            self.logger.info("Monitoring stopped by user")
        except Exception as e:
            self.logger.error(f"Error during monitoring: {e}")
    
    def get_current_window(self) -> Optional[Dict[str, Any]]:
        """
        Get information about the current active window (one-time check).
        
        Returns:
            Dictionary containing current window information
        """
        return self.get_active_window_info()


def main():
    """Main function to run the window focus logger."""
    import argparse
    
    parser = argparse.ArgumentParser(description="Monitor and log Windows window focus changes")
    parser.add_argument("--log-file", default="window_focus.log", 
                       help="Path to the log file (default: window_focus.log)")
    parser.add_argument("--format", choices=["json", "text", "both"], default="json",
                       help="Log format (default: json)")
    parser.add_argument("--interval", type=float, default=0.5,
                       help="Check interval in seconds (default: 0.5)")
    parser.add_argument("--once", action="store_true",
                       help="Log current window once and exit")
    
    args = parser.parse_args()
    
    # Create logger instance
    logger = WindowFocusLogger(log_file=args.log_file, log_format=args.format)
    
    if args.once:
        # Log current window once and exit
        window_info = logger.get_current_window()
        if window_info:
            logger.log_window_info(window_info)
            print(f"Current window logged: {window_info['window_title']}")
        else:
            print("No active window found")
    else:
        # Start continuous monitoring
        logger.monitor_focus_changes(check_interval=args.interval)


if __name__ == "__main__":
    main()
