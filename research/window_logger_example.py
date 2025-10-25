"""
Example usage of the Window Focus Logger

This script demonstrates different ways to use the window focus logger.
"""

from window_focus_logger import WindowFocusLogger
import time


def example_single_check():
    """Example: Get current window information once."""
    print("=== Single Window Check Example ===")
    
    logger = WindowFocusLogger(log_format="text")
    window_info = logger.get_current_window()
    
    if window_info:
        print(f"Current window: {window_info['window_title']}")
        print(f"Process: {window_info['process_name']}")
        print(f"PID: {window_info['process_id']}")
        print(f"Window size: {window_info['window_rect']['width']}x{window_info['window_rect']['height']}")
    else:
        print("No active window found")


def example_monitoring_session():
    """Example: Monitor window changes for a short period."""
    print("\n=== Short Monitoring Session Example ===")
    print("This will monitor window changes for 10 seconds...")
    
    logger = WindowFocusLogger(log_file="example_session.log", log_format="both")
    
    # Start monitoring in a separate thread or use a shorter duration
    # For this example, we'll just check a few times
    for i in range(5):
        window_info = logger.get_current_window()
        if window_info:
            logger.log_window_info(window_info)
        time.sleep(2)


def example_custom_logging():
    """Example: Custom logging with specific information."""
    print("\n=== Custom Logging Example ===")
    
    logger = WindowFocusLogger(log_format="json")
    window_info = logger.get_current_window()
    
    if window_info:
        # Extract specific information
        title = window_info['window_title']
        process = window_info['process_name']
        timestamp = window_info['timestamp']
        
        print(f"At {timestamp}:")
        print(f"  Application: {process}")
        print(f"  Window: {title}")
        
        # Log only specific fields
        custom_info = {
            "timestamp": timestamp,
            "app": process,
            "title": title
        }
        
        import json
        print(f"Custom log entry: {json.dumps(custom_info)}")


if __name__ == "__main__":
    print("Window Focus Logger Examples")
    print("=" * 40)
    
    try:
        example_single_check()
        example_monitoring_session()
        example_custom_logging()
        
        print("\n=== Usage Instructions ===")
        print("To run the full monitoring system:")
        print("  python window_focus_logger.py")
        print("\nTo log current window once:")
        print("  python window_focus_logger.py --once")
        print("\nTo use different log formats:")
        print("  python window_focus_logger.py --format text")
        print("  python window_focus_logger.py --format json")
        print("  python window_focus_logger.py --format both")
        print("\nTo change check interval:")
        print("  python window_focus_logger.py --interval 1.0")
        
    except ImportError as e:
        print(f"Error: {e}")
        print("Please install required dependencies:")
        print("pip install pywin32 psutil")
    except Exception as e:
        print(f"Error running examples: {e}")
