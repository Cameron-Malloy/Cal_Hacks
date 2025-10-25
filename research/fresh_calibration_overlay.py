#!/usr/bin/env python3
"""
Fresh Calibration Overlay System
================================

This version implements a fresh approach:
1. Every run starts completely fresh (no JSON loading)
2. Opens a separate non-transparent calibration window first
3. After calibration, closes that window and opens the transparent overlay
4. No persistence - always starts from scratch

Usage:
    python fresh_calibration_overlay.py
"""

import cv2
import numpy as np
import time
import threading
import queue
from typing import Tuple, Optional
import sys
import os
import math

# Import the fresh gaze tracker
from fresh_screen_gaze_tracking import FreshScreenGazeTracker

# Windows-specific imports for transparency and click-through
try:
    import win32gui
    import win32con
    import win32api
    WINDOWS_API_AVAILABLE = True
except ImportError:
    print("Warning: Windows API not available. Install pywin32 for transparency features.")
    WINDOWS_API_AVAILABLE = False


class FreshCalibrationOverlay:
    """Fresh calibration overlay system with separate calibration window"""
    
    def __init__(self):
        # Initialize gaze tracker (fresh, no JSON loading)
        self.gaze_tracker = FreshScreenGazeTracker()
        
        # Force fresh start - no JSON files used
        self.gaze_tracker.is_calibrated = False
        self.gaze_tracker.calibration_data = {}
        
        # Get screen resolution
        self.screen_width = self.gaze_tracker.screen_width
        self.screen_height = self.gaze_tracker.screen_height
        
        # Overlay settings
        self.cursor_size = 20
        self.show_cursor = True
        self.show_trail = True
        self.show_status = True
        self.trail_length = 30
        
        # Gaze data
        self.current_gaze_x = 0.5
        self.current_gaze_y = 0.5
        self.is_tracking = False
        self.gaze_trail = []
        
        # Overlay state
        self.window_name = "Gaze Overlay"
        self.hwnd = None
        
        # Threading
        self.gaze_queue = queue.Queue(maxsize=5)
        self.running = False
        
        # Calibration state
        self.calibration_completed = False
        self.calibration_window_open = False
    
    def run_calibration_window(self):
        """Run the separate calibration window"""
        print("=" * 60)
        print("CALIBRATION PHASE")
        print("=" * 60)
        print("A calibration window will open for you to calibrate the gaze tracker.")
        print("This window is NOT transparent - you can see it clearly.")
        print()
        print("Instructions:")
        print("1. Look directly at the RED DOT on the camera window")
        print("2. Keep your head still and look at the dot")
        print("3. Press SPACEBAR when you're looking at the dot")
        print("4. Repeat for all 5 calibration points")
        print("5. After calibration, this window will close and the transparent overlay will start")
        print("=" * 60)
        
        # Initialize camera
        cap = cv2.VideoCapture(0)
        if not cap.isOpened():
            print("Error: Could not open camera")
            return False
        
        # Set camera properties
        cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
        cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
        cap.set(cv2.CAP_PROP_FPS, 30)
        
        print("Camera initialized. Starting calibration...")
        
        # Create calibration window
        cv2.namedWindow('Calibration Window', cv2.WINDOW_NORMAL)
        cv2.resizeWindow('Calibration Window', 800, 600)
        
        # Position window in center of screen
        if WINDOWS_API_AVAILABLE:
            try:
                hwnd = win32gui.FindWindow(None, 'Calibration Window')
                if hwnd:
                    # Get screen dimensions
                    screen_width = win32api.GetSystemMetrics(0)
                    screen_height = win32api.GetSystemMetrics(1)
                    
                    # Center the window
                    window_width = 800
                    window_height = 600
                    x = (screen_width - window_width) // 2
                    y = (screen_height - window_height) // 2
                    
                    # Move and resize window
                    win32gui.SetWindowPos(hwnd, win32con.HWND_TOP, x, y, window_width, window_height, 0)
                    
                    # Bring window to front
                    win32gui.SetForegroundWindow(hwnd)
                    win32gui.ShowWindow(hwnd, win32con.SW_RESTORE)
            except Exception as e:
                print(f"Warning: Could not position calibration window: {e}")
        
        self.calibration_window_open = True
        
        try:
            frame_count = 0
            while self.calibration_window_open:
                ret, frame = cap.read()
                if not ret:
                    print("Error: Could not read frame")
                    break
                
                frame_count += 1
                
                # Flip frame horizontally for mirror effect
                frame = cv2.flip(frame, 1)
                
                # Process frame with gaze tracker
                results = self.gaze_tracker.process_frame(frame)
                
                # Handle calibration mode
                if self.gaze_tracker.calibration_mode:
                    # Draw calibration target on frame
                    if self.gaze_tracker.calibration_step < len(self.gaze_tracker.calibration_targets):
                        target_x, target_y = self.gaze_tracker.calibration_targets[self.gaze_tracker.calibration_step]
                        self.draw_calibration_target(frame, target_x, target_y)
                    
                    # Show camera window during calibration
                    cv2.imshow('Calibration Window', frame)
                    
                    # Check for space key to add calibration point
                    key = cv2.waitKey(30) & 0xFF
                    if key == ord(' '):
                        print(f"Space pressed - adding calibration point {self.gaze_tracker.calibration_step + 1}")
                        # Add calibration point
                        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                        face_results = self.gaze_tracker.face_mesh.process(rgb_frame)
                        if face_results.multi_face_landmarks:
                            self.gaze_tracker.add_calibration_point(face_results.multi_face_landmarks[0].landmark)
                        else:
                            print("No face detected - cannot add calibration point")
                else:
                    # Calibration completed
                    print("Calibration completed! Closing calibration window...")
                    self.calibration_completed = True
                    self.calibration_window_open = False
                    break
                
                # Print debug info every 30 frames
                if frame_count % 30 == 0:
                    print(f"Frame {frame_count}: Tracking={results['is_tracking']}, Calibration Step={self.gaze_tracker.calibration_step}")
        
        except KeyboardInterrupt:
            print("\nCalibration interrupted")
            self.calibration_window_open = False
        
        finally:
            cap.release()
            cv2.destroyWindow('Calibration Window')
            print("Calibration window closed")
        
        return self.calibration_completed
    
    def draw_calibration_target(self, frame, target_x: float, target_y: float):
        """Draw calibration target on frame"""
        h, w = frame.shape[:2]
        
        # Convert normalized coordinates to frame coordinates
        frame_x = int(target_x * w)
        frame_y = int(target_y * h)
        
        # Draw larger, more visible target circle with pulsing effect
        pulse = int(5 * math.sin(time.time() * 4))  # Pulsing effect
        
        # Draw outer ring
        cv2.circle(frame, (frame_x, frame_y), 40 + pulse, (0, 0, 255), 4)
        # Draw inner circle
        cv2.circle(frame, (frame_x, frame_y), 25 + pulse, (0, 0, 255), -1)
        # Draw center dot
        cv2.circle(frame, (frame_x, frame_y), 8, (255, 255, 255), -1)
        
        # Draw crosshair
        cv2.line(frame, (frame_x - 60, frame_y), (frame_x + 60, frame_y), (0, 0, 255), 3)
        cv2.line(frame, (frame_x, frame_y - 60), (frame_x, frame_y + 60), (0, 0, 255), 3)
        
        # Draw instruction text with better visibility
        cv2.putText(frame, f"CALIBRATION POINT {self.gaze_tracker.calibration_step + 1}/{len(self.gaze_tracker.calibration_targets)}", 
                   (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 255), 3)
        cv2.putText(frame, "LOOK AT THE RED DOT", 
                   (10, 60), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 255), 3)
        cv2.putText(frame, "PRESS SPACEBAR WHEN READY", 
                   (10, 90), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 255), 3)
        
        # Add countdown or status
        if self.gaze_tracker.calibration_step < len(self.gaze_tracker.calibration_targets):
            remaining = len(self.gaze_tracker.calibration_targets) - self.gaze_tracker.calibration_step
            cv2.putText(frame, f"REMAINING: {remaining}", 
                       (10, 120), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 0), 2)
    
    def create_transparent_overlay(self):
        """Create the transparent overlay window"""
        # Create a black image with alpha channel
        self.overlay_image = np.zeros((self.screen_height, self.screen_width, 4), dtype=np.uint8)
        
        # Create named window with fullscreen properties
        cv2.namedWindow(self.window_name, cv2.WINDOW_NORMAL)
        cv2.setWindowProperty(self.window_name, cv2.WND_PROP_FULLSCREEN, cv2.WINDOW_FULLSCREEN)
        
        # Set window properties for transparency and always on top
        if WINDOWS_API_AVAILABLE:
            try:
                # Get window handle
                self.hwnd = win32gui.FindWindow(None, self.window_name)
                if self.hwnd:
                    # Remove window decorations (title bar, borders)
                    style = win32gui.GetWindowLong(self.hwnd, win32con.GWL_STYLE)
                    style = style & ~win32con.WS_CAPTION & ~win32con.WS_THICKFRAME & ~win32con.WS_MINIMIZEBOX & ~win32con.WS_MAXIMIZEBOX & ~win32con.WS_SYSMENU
                    win32gui.SetWindowLong(self.hwnd, win32con.GWL_STYLE, style)
                    
                    # Set extended window style for transparency
                    ex_style = win32gui.GetWindowLong(self.hwnd, win32con.GWL_EXSTYLE)
                    ex_style = ex_style | win32con.WS_EX_LAYERED | win32con.WS_EX_TRANSPARENT | win32con.WS_EX_TOPMOST
                    win32gui.SetWindowLong(self.hwnd, win32con.GWL_EXSTYLE, ex_style)
                    
                    # Position window to cover entire screen
                    win32gui.SetWindowPos(
                        self.hwnd, 
                        win32con.HWND_TOPMOST, 
                        0, 0, self.screen_width, self.screen_height,
                        win32con.SWP_SHOWWINDOW
                    )
                    
                    # Set window transparency - make it semi-transparent
                    win32gui.SetLayeredWindowAttributes(
                        self.hwnd, 
                        0,  # Color key (0 = black)
                        10,  # Alpha (200 = semi-transparent, 255 = opaque, 0 = transparent)
                        win32con.LWA_ALPHA
                    )
                    
                    print("✓ Transparent fullscreen overlay window created")
            except Exception as e:
                print(f"Warning: Could not set transparent window properties: {e}")
        
        print(f"Overlay window created: {self.screen_width}x{self.screen_height} (fullscreen)")
    
    def update_gaze_data(self, gaze_x: float, gaze_y: float, is_tracking: bool):
        """Update gaze data from the tracker"""
        self.current_gaze_x = gaze_x
        self.current_gaze_y = gaze_y
        self.is_tracking = is_tracking
        
        # Add to trail
        self.gaze_trail.append((gaze_x, gaze_y, time.time()))
        
        # Limit trail length
        if len(self.gaze_trail) > self.trail_length:
            self.gaze_trail.pop(0)
    
    def process_gaze_queue(self):
        """Process gaze data from the queue"""
        try:
            while not self.gaze_queue.empty():
                gaze_data = self.gaze_queue.get_nowait()
                self.update_gaze_data(gaze_data['gaze_x'], gaze_data['gaze_y'], gaze_data['is_tracking'])
        except queue.Empty:
            pass
    
    def draw_gaze_cursor(self, image: np.ndarray):
        """Draw gaze cursor on the overlay"""
        if not self.show_cursor or not self.is_tracking:
            return
        
        # Convert normalized coordinates to screen coordinates
        screen_x = int(self.current_gaze_x * self.screen_width)
        screen_y = int(self.current_gaze_y * self.screen_height)
        
        # Draw cursor with bright green color
        cv2.circle(image, (screen_x, screen_y), self.cursor_size, (0, 255, 0), -1)
        cv2.circle(image, (screen_x, screen_y), self.cursor_size + 5, (0, 255, 0), 3)
        
        # Draw crosshair
        cv2.line(image, (screen_x - 30, screen_y), (screen_x + 30, screen_y), (0, 255, 0), 3)
        cv2.line(image, (screen_x, screen_y - 30), (screen_x, screen_y + 30), (0, 255, 0), 3)
    
    def draw_gaze_trail(self, image: np.ndarray):
        """Draw gaze trail on the overlay"""
        if not self.show_trail or len(self.gaze_trail) < 2:
            return
        
        # Draw lines connecting consecutive points
        for i in range(1, len(self.gaze_trail)):
            prev_x, prev_y, prev_time = self.gaze_trail[i-1]
            curr_x, curr_y, curr_time = self.gaze_trail[i]
            
            # Convert normalized coordinates to screen coordinates
            prev_screen_x = int(prev_x * self.screen_width)
            prev_screen_y = int(prev_y * self.screen_height)
            curr_screen_x = int(curr_x * self.screen_width)
            curr_screen_y = int(curr_y * self.screen_height)
            
            # Draw line with color intensity based on recency
            time_diff = curr_time - prev_time
            alpha = max(0.3, 1.0 - (time_diff / 10.0))  # Fade over 10 seconds
            color_intensity = int(255 * alpha)
            
            # Use bright green color for trail
            color = (0, color_intensity, 0)
            
            cv2.line(image, (prev_screen_x, prev_screen_y), (curr_screen_x, curr_screen_y), color, 3)
    
    def draw_status_info(self, image: np.ndarray):
        """Draw status information on the overlay"""
        if not self.show_status:
            return
        
        # Status text
        status_text = "TRACKING" if self.is_tracking else "NO TRACKING"
        color = (0, 255, 0) if self.is_tracking else (0, 0, 255)
        
        cv2.putText(image, status_text, (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 1.0, color, 3)
        
        # Gaze coordinates
        screen_x = int(self.current_gaze_x * self.screen_width)
        screen_y = int(self.current_gaze_y * self.screen_height)
        cv2.putText(image, f"Screen: ({screen_x}, {screen_y})", 
                   (10, 70), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)
        
        # Trail count
        cv2.putText(image, f"Trail: {len(self.gaze_trail)}", 
                   (10, 110), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)
    
    def update_overlay(self):
        """Update the overlay display"""
        # Clear overlay
        self.overlay_image.fill(0)
        
        # Process gaze data
        self.process_gaze_queue()
        
        # Draw elements
        self.draw_gaze_trail(self.overlay_image)
        self.draw_gaze_cursor(self.overlay_image)
        self.draw_status_info(self.overlay_image)
        
        # Display
        cv2.imshow(self.window_name, self.overlay_image)
    
    def run_gaze_tracking(self):
        """Run the gaze tracking loop"""
        print("Starting gaze tracking...")
        
        # Initialize camera
        cap = cv2.VideoCapture(0)
        if not cap.isOpened():
            print("Error: Could not open camera")
            return
        
        # Set camera properties
        cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
        cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
        cap.set(cv2.CAP_PROP_FPS, 30)
        
        print("Camera initialized for transparent overlay.")
        
        try:
            frame_count = 0
            while self.running:
                ret, frame = cap.read()
                if not ret:
                    print("Error: Could not read frame")
                    break
                
                frame_count += 1
                
                # Flip frame horizontally for mirror effect
                frame = cv2.flip(frame, 1)
                
                # Process frame with gaze tracker
                results = self.gaze_tracker.process_frame(frame)
                
                # Update overlay with gaze data
                self.update_gaze_data(
                    results['gaze_x'], 
                    results['gaze_y'], 
                    results['is_tracking']
                )
                
                # Print debug info every 30 frames
                if frame_count % 30 == 0:
                    print(f"Frame {frame_count}: Tracking={results['is_tracking']}, Gaze=({results['gaze_x']:.3f}, {results['gaze_y']:.3f})")
                
                # Small delay
                time.sleep(0.033)  # ~30 FPS
        
        except KeyboardInterrupt:
            print("\nGaze tracking interrupted")
        
        finally:
            cap.release()
    
    def run_overlay(self):
        """Run the overlay display"""
        print("Starting transparent overlay...")
        print("The overlay should be transparent and click-through.")
        print("You should be able to click on applications behind it.")
        
        try:
            while self.running:
                # Update overlay display
                self.update_overlay()
                
                # Simple wait for overlay updates (no key handling since overlay is click-through)
                cv2.waitKey(1)
        
        except KeyboardInterrupt:
            print("\nOverlay interrupted")
        
        finally:
            self.running = False
            cv2.destroyAllWindows()
    
    def run(self):
        """Run the fresh calibration overlay system"""
        print("=" * 60)
        print("FRESH CALIBRATION OVERLAY SYSTEM")
        print("=" * 60)
        print("This system starts completely fresh every time:")
        print("1. Opens a separate calibration window (non-transparent)")
        print("2. After calibration, closes that window")
        print("3. Opens the transparent overlay")
        print("4. No JSON persistence - always starts fresh")
        print("=" * 60)
        
        # Phase 1: Calibration
        print("\nPHASE 1: CALIBRATION")
        print("Starting calibration window...")
        
        # Start calibration
        self.gaze_tracker.start_calibration()
        
        # Run calibration window
        calibration_success = self.run_calibration_window()
        
        if not calibration_success:
            print("Calibration failed or was cancelled.")
            return
        
        print("\n" + "=" * 60)
        print("CALIBRATION COMPLETED!")
        print("=" * 60)
        print("Now starting the transparent overlay...")
        print("The overlay will be transparent and click-through.")
        print("Press Ctrl+C in this terminal to quit.")
        print("=" * 60)
        
        # Phase 2: Transparent Overlay
        print("\nPHASE 2: TRANSPARENT OVERLAY")
        
        # Create transparent overlay
        self.create_transparent_overlay()
        
        self.running = True
        
        # Start gaze tracking in a separate thread
        gaze_thread = threading.Thread(target=self.run_gaze_tracking)
        gaze_thread.daemon = True
        gaze_thread.start()
        
        try:
            # Run overlay in main thread
            self.run_overlay()
        finally:
            print("Fresh calibration overlay system closed")


def main():
    """Main function"""
    try:
        overlay = FreshCalibrationOverlay()
        overlay.run()
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()
