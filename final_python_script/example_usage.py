#!/usr/bin/env python3
"""
Example usage of the Distraction Tracking System

This script demonstrates how to use the distraction tracker
and shows how to analyze the results.
"""

import json
import os
from datetime import datetime
from distraction_tracker import DistractionTracker


def analyze_distraction_events(log_file: str = "distraction_events.json"):
    """Analyze distraction events from the log file"""
    
    if not os.path.exists(log_file):
        print(f"No log file found: {log_file}")
        return
    
    events = []
    with open(log_file, 'r') as f:
        for line in f:
            try:
                event = json.loads(line.strip())
                events.append(event)
            except json.JSONDecodeError:
                continue
    
    if not events:
        print("No events found in log file")
        return
    
    print(f"\n=== DISTRACTION ANALYSIS ===")
    print(f"Total events: {len(events)}")
    
    # Count by type
    gaze_distractions = [e for e in events if e['type'] == 'gaze_distraction']
    window_distractions = [e for e in events if e['type'] == 'window_distraction']
    
    print(f"Gaze-based distractions: {len(gaze_distractions)}")
    print(f"Window-based distractions: {len(window_distractions)}")
    
    # Most common window distractions
    if window_distractions:
        print(f"\n=== TOP DISTRACTING APPLICATIONS ===")
        app_counts = {}
        for event in window_distractions:
            app = event.get('process_name', 'Unknown')
            app_counts[app] = app_counts.get(app, 0) + 1
        
        sorted_apps = sorted(app_counts.items(), key=lambda x: x[1], reverse=True)
        for app, count in sorted_apps[:5]:
            print(f"{app}: {count} distractions")
    
    # Most common gaze distractions
    if gaze_distractions:
        print(f"\n=== GAZE DISTRACTION PATTERNS ===")
        reason_counts = {}
        for event in gaze_distractions:
            reason = event.get('reason', 'Unknown')
            reason_counts[reason] = reason_counts.get(reason, 0) + 1
        
        sorted_reasons = sorted(reason_counts.items(), key=lambda x: x[1], reverse=True)
        for reason, count in sorted_reasons:
            print(f"{reason}: {count} times")
    
    # Time analysis
    print(f"\n=== TIME ANALYSIS ===")
    if events:
        first_event = datetime.fromisoformat(events[0]['timestamp'])
        last_event = datetime.fromisoformat(events[-1]['timestamp'])
        duration = last_event - first_event
        
        print(f"Session duration: {duration}")
        print(f"Distractions per hour: {len(events) / (duration.total_seconds() / 3600):.1f}")


def run_quick_test():
    """Run a quick test of the distraction tracker"""
    print("=== QUICK DISTRACTION TRACKER TEST ===")
    print("This will run a short test session.")
    print("Press Ctrl+C to stop early.")
    print()
    
    # Create tracker with test config
    config = {
        'blacklisted_apps': ['chrome.exe', 'discord.exe'],
        'blacklisted_keywords': ['youtube', 'facebook'],
        'use_claude': False,  # Disable for quick test
        'gaze_threshold_y': 0.8,
        'distraction_timeout': 1.0  # Faster detection for testing
    }
    
    # Save test config
    with open('test_config.json', 'w') as f:
        json.dump(config, f, indent=2)
    
    try:
        tracker = DistractionTracker('test_config.json')
        tracker.run()
    except KeyboardInterrupt:
        print("\nTest interrupted by user")
    finally:
        # Clean up test config
        if os.path.exists('test_config.json'):
            os.remove('test_config.json')


def main():
    """Main function"""
    print("Distraction Tracking System - Example Usage")
    print("=" * 50)
    print("1. Run quick test")
    print("2. Analyze existing log file")
    print("3. Exit")
    
    choice = input("\nEnter your choice (1-3): ").strip()
    
    if choice == '1':
        run_quick_test()
    elif choice == '2':
        log_file = input("Enter log file path (default: distraction_events.json): ").strip()
        if not log_file:
            log_file = "distraction_events.json"
        analyze_distraction_events(log_file)
    elif choice == '3':
        print("Goodbye!")
    else:
        print("Invalid choice")


if __name__ == "__main__":
    main()
