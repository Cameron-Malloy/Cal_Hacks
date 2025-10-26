#!/usr/bin/env python3
"""
Fresh Screen Gaze Tracking Script
=================================

This version removes JSON persistence and always starts fresh.
No loading/saving of calibration data - every run is completely fresh.

Usage:
    python fresh_screen_gaze_tracking.py
"""

import cv2
import numpy as np
import mediapipe as mp
import math
from typing import Tuple, List, Optional
import time

# Try to import pyautogui with fallback handling
try:
    import pyautogui
    PYAUTOGUI_AVAILABLE = True
except Exception as e:
    print(f"Warning: pyautogui not available ({e})")
    print("Screen size detection will use default values")
    PYAUTOGUI_AVAILABLE = False


class FreshScreenGazeTracker:
    """Fresh screen gaze tracking - no JSON persistence, always starts fresh"""
    
    def __init__(self):
        # Initialize MediaPipe face mesh
        self.mp_face_mesh = mp.solutions.face_mesh
        self.mp_drawing = mp.solutions.drawing_utils
        self.mp_drawing_styles = mp.solutions.drawing_styles
        
        # Face mesh model - optimized for performance
        self.face_mesh = self.mp_face_mesh.FaceMesh(
            static_image_mode=False,
            max_num_faces=1,
            refine_landmarks=False,  # Disabled for better performance
            min_detection_confidence=0.3,  # Lower threshold for faster detection
            min_tracking_confidence=0.3  # Lower threshold for faster tracking
        )
        
        # Eye landmark indices (MediaPipe face mesh)
        self.LEFT_EYE_INDICES = [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246]
        self.RIGHT_EYE_INDICES = [362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388, 387, 386, 385, 384, 398]
        
        # Iris landmark indices (more precise for gaze tracking)
        self.LEFT_IRIS_INDICES = [468, 469, 470, 471, 472]
        self.RIGHT_IRIS_INDICES = [473, 474, 475, 476, 477]
        
        # Calibration data (fresh, no loading)
        self.calibration_points = []
        self.calibration_data = {}
        self.is_calibrated = False
        
        # Screen information
        if PYAUTOGUI_AVAILABLE:
            try:
                self.screen_width, self.screen_height = pyautogui.size()
            except Exception as e:
                print(f"Warning: Could not get screen size from pyautogui ({e})")
                print("Using default screen resolution: 1920x1080")
                self.screen_width = 1920
                self.screen_height = 1080
        else:
            print("Using default screen resolution: 1920x1080")
            self.screen_width = 1920
            self.screen_height = 1080
        
        # Gaze smoothing
        self.gaze_history = []
        self.max_history = 5
        self.smoothing_factor = 0.3
        
        # Current gaze position
        self.current_gaze_x = 0
        self.current_gaze_y = 0
        
        # Gaze trail tracking
        self.gaze_trail_points = []  # List of (x, y, timestamp) tuples
        self.last_save_time = time.time()
        self.save_interval = 5.0  # Save every 5 seconds
        
        # Calibration mode
        self.calibration_mode = False
        self.calibration_step = 0
        self.calibration_targets = [
            (0.1, 0.1),   # Top-left
            (0.9, 0.1),   # Top-right
            (0.1, 0.9),   # Bottom-left
            (0.9, 0.9),   # Bottom-right
            (0.5, 0.5),   # Center
        ]
        
        print("Fresh gaze tracker initialized - no calibration data loaded")
    
    def start_calibration(self):
        """Start calibration process"""
        self.calibration_mode = True
        self.calibration_step = 0
        self.calibration_points = []
        self.is_calibrated = False
        self.calibration_data = {}
        print("Starting fresh calibration...")
        print("Look at the red dot and press SPACE when ready")
    
    def add_calibration_point(self, eye_landmarks):
        """Add a calibration point"""
        if self.calibration_step < len(self.calibration_targets):
            target_x, target_y = self.calibration_targets[self.calibration_step]
            
            # Calculate eye center
            left_eye_center = self.get_eye_center(eye_landmarks, self.LEFT_EYE_INDICES)
            right_eye_center = self.get_eye_center(eye_landmarks, self.RIGHT_EYE_INDICES)
            
            # Calculate iris centers for more precision
            left_iris_center = self.get_iris_center(eye_landmarks, self.LEFT_IRIS_INDICES)
            right_iris_center = self.get_iris_center(eye_landmarks, self.RIGHT_IRIS_INDICES)
            
            calibration_point = {
                'target': (target_x, target_y),
                'left_eye': left_eye_center,
                'right_eye': right_eye_center,
                'left_iris': left_iris_center,
                'right_iris': right_iris_center,
                'timestamp': time.time()
            }
            
            self.calibration_points.append(calibration_point)
            self.calibration_step += 1
            
            print(f"Calibration point {self.calibration_step}/{len(self.calibration_targets)} recorded")
            
            if self.calibration_step >= len(self.calibration_targets):
                self.finish_calibration()
    
    def finish_calibration(self):
        """Finish calibration and calculate mapping parameters"""
        if len(self.calibration_points) >= 3:
            # Calculate linear mapping parameters
            self.calibration_data = self.calculate_calibration_mapping()
            self.is_calibrated = True
            print("Calibration completed successfully!")
            print("Calibration data calculated and stored in memory (not saved to file)")
        else:
            print("Not enough calibration points. Need at least 3 points.")
        
        self.calibration_mode = False
        self.calibration_step = 0
    
    def calculate_calibration_mapping(self):
        """Calculate mapping parameters from calibration points"""
        # Extract eye positions and target screen positions
        eye_positions = []
        screen_positions = []
        
        for point in self.calibration_points:
            # Use average of left and right iris centers
            left_iris = point['left_iris']
            right_iris = point['right_iris']
            eye_center = ((left_iris[0] + right_iris[0]) / 2, (left_iris[1] + right_iris[1]) / 2)
            
            eye_positions.append(eye_center)
            screen_positions.append(point['target'])
        
        # Convert to numpy arrays
        eye_pos = np.array(eye_positions)
        screen_pos = np.array(screen_positions)
        
        # Calculate linear transformation matrix
        # Using least squares to find transformation matrix
        A = np.column_stack([eye_pos, np.ones(len(eye_pos))])
        
        # Solve for x and y transformations separately
        x_coeffs = np.linalg.lstsq(A, screen_pos[:, 0], rcond=None)[0]
        y_coeffs = np.linalg.lstsq(A, screen_pos[:, 1], rcond=None)[0]
        
        mapping_data = {
            'x_coeffs': x_coeffs.tolist(),
            'y_coeffs': y_coeffs.tolist(),
            'calibration_points': len(self.calibration_points),
            'timestamp': time.time()
        }
        
        return mapping_data
    
    def get_eye_center(self, landmarks, eye_indices: List[int]) -> Tuple[float, float]:
        """Get the center point of an eye"""
        eye_points = np.array([(landmarks[i].x, landmarks[i].y) for i in eye_indices])
        center_x = np.mean(eye_points[:, 0])
        center_y = np.mean(eye_points[:, 1])
        return center_x, center_y
    
    def get_iris_center(self, landmarks, iris_indices: List[int]) -> Tuple[float, float]:
        """Get the center point of the iris"""
        iris_points = np.array([(landmarks[i].x, landmarks[i].y) for i in iris_indices])
        center_x = np.mean(iris_points[:, 0])
        center_y = np.mean(iris_points[:, 1])
        return center_x, center_y
    
    def map_gaze_to_screen(self, eye_landmarks) -> Tuple[float, float]:
        """Map eye gaze to screen coordinates"""
        if not self.is_calibrated:
            return 0.5, 0.5  # Return center if not calibrated
        
        # Get iris centers
        left_iris = self.get_iris_center(eye_landmarks, self.LEFT_IRIS_INDICES)
        right_iris = self.get_iris_center(eye_landmarks, self.RIGHT_IRIS_INDICES)
        
        # Average the iris centers
        eye_center = ((left_iris[0] + right_iris[0]) / 2, (left_iris[1] + right_iris[1]) / 2)
        
        # Apply linear transformation
        x_coeffs = np.array(self.calibration_data['x_coeffs'])
        y_coeffs = np.array(self.calibration_data['y_coeffs'])
        
        # Calculate screen coordinates
        eye_vector = np.array([eye_center[0], eye_center[1], 1])
        screen_x = np.dot(eye_vector, x_coeffs)
        screen_y = np.dot(eye_vector, y_coeffs)
        
        # Clamp to screen bounds
        screen_x = max(0, min(1, screen_x))
        screen_y = max(0, min(1, screen_y))
        
        return screen_x, screen_y
    
    def smooth_gaze(self, x: float, y: float) -> Tuple[float, float]:
        """Apply smoothing to gaze coordinates"""
        self.gaze_history.append((x, y))
        
        if len(self.gaze_history) > self.max_history:
            self.gaze_history.pop(0)
        
        # Calculate weighted average
        weights = np.linspace(0.1, 1.0, len(self.gaze_history))
        weights = weights / np.sum(weights)
        
        smoothed_x = sum(point[0] * weight for point, weight in zip(self.gaze_history, weights))
        smoothed_y = sum(point[1] * weight for point, weight in zip(self.gaze_history, weights))
        
        return smoothed_x, smoothed_y
    
    def save_gaze_point(self, x: float, y: float):
        """Save a gaze point to the trail"""
        current_time = time.time()
        self.gaze_trail_points.append((x, y, current_time))
        self.last_save_time = current_time
        print(f"Saved gaze point: ({x:.3f}, {y:.3f}) at {current_time:.1f}s")
    
    def clear_gaze_trail(self):
        """Clear all saved gaze points"""
        self.gaze_trail_points = []
        print("Gaze trail cleared")
    
    def process_frame(self, frame) -> dict:
        """Process a single frame and return gaze tracking data"""
        results = {
            'gaze_x': 0.5,
            'gaze_y': 0.5,
            'screen_x': 0,
            'screen_y': 0,
            'is_tracking': False,
            'calibration_mode': self.calibration_mode,
            'calibration_step': self.calibration_step
        }
        
        # Convert BGR to RGB
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        
        # Process the frame
        face_results = self.face_mesh.process(rgb_frame)
        
        if face_results.multi_face_landmarks:
            for face_landmarks in face_results.multi_face_landmarks:
                results['is_tracking'] = True
                
                if self.calibration_mode:
                    # In calibration mode, don't track gaze
                    continue
                
                # Map gaze to screen coordinates
                gaze_x, gaze_y = self.map_gaze_to_screen(face_landmarks.landmark)
                
                # Apply smoothing
                smoothed_x, smoothed_y = self.smooth_gaze(gaze_x, gaze_y)
                
                # Convert to screen pixels
                screen_x = int(smoothed_x * self.screen_width)
                screen_y = int(smoothed_y * self.screen_height)
                
                results['gaze_x'] = smoothed_x
                results['gaze_y'] = smoothed_y
                results['screen_x'] = screen_x
                results['screen_y'] = screen_y
                
                # Update current gaze position
                self.current_gaze_x = screen_x
                self.current_gaze_y = screen_y
                
                # Check if it's time to save a gaze point (every 5 seconds)
                current_time = time.time()
                if current_time - self.last_save_time >= self.save_interval:
                    self.save_gaze_point(smoothed_x, smoothed_y)
        
        return results
    
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
        cv2.putText(frame, f"CALIBRATION POINT {self.calibration_step + 1}/{len(self.calibration_targets)}", 
                   (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 255), 3)
        cv2.putText(frame, "LOOK AT THE RED DOT", 
                   (10, 60), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 255), 3)
        cv2.putText(frame, "PRESS SPACEBAR WHEN READY", 
                   (10, 90), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 255), 3)
        
        # Add countdown or status
        if self.calibration_step < len(self.calibration_targets):
            remaining = len(self.calibration_targets) - self.calibration_step
            cv2.putText(frame, f"REMAINING: {remaining}", 
                       (10, 120), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 0), 2)
    
    def draw_gaze_cursor(self, frame, gaze_x: float, gaze_y: float):
        """Draw gaze cursor on frame"""
        h, w = frame.shape[:2]
        
        # Convert normalized coordinates to frame coordinates
        frame_x = int(gaze_x * w)
        frame_y = int(gaze_y * h)
        
        # Draw gaze cursor
        cv2.circle(frame, (frame_x, frame_y), 10, (0, 255, 0), -1)
        cv2.circle(frame, (frame_x, frame_y), 15, (0, 255, 0), 2)
        
        # Draw crosshair
        cv2.line(frame, (frame_x - 20, frame_y), (frame_x + 20, frame_y), (0, 255, 0), 2)
        cv2.line(frame, (frame_x, frame_y - 20), (frame_x, frame_y + 20), (0, 255, 0), 2)
        
        # Draw screen coordinates
        screen_x = int(gaze_x * self.screen_width)
        screen_y = int(gaze_y * self.screen_height)
        
        cv2.putText(frame, f"Screen: ({screen_x}, {screen_y})", 
                   (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
        cv2.putText(frame, f"Gaze: ({gaze_x:.3f}, {gaze_y:.3f})", 
                   (10, 60), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
    
    def draw_gaze_trail(self, frame):
        """Draw the gaze trail connecting all saved points"""
        if len(self.gaze_trail_points) < 2:
            return
        
        h, w = frame.shape[:2]
        
        # Draw lines connecting consecutive points
        for i in range(1, len(self.gaze_trail_points)):
            prev_x, prev_y, prev_time = self.gaze_trail_points[i-1]
            curr_x, curr_y, curr_time = self.gaze_trail_points[i]
            
            # Convert normalized coordinates to frame coordinates
            prev_frame_x = int(prev_x * w)
            prev_frame_y = int(prev_y * h)
            curr_frame_x = int(curr_x * w)
            curr_frame_y = int(curr_y * h)
            
            # Draw line with color intensity based on recency
            # More recent points are brighter
            time_diff = curr_time - prev_time
            alpha = max(0.3, 1.0 - (time_diff / 60.0))  # Fade over 60 seconds
            color_intensity = int(255 * alpha)
            
            # Use different colors for different segments
            color = (color_intensity, color_intensity // 2, color_intensity // 3)  # Blue-ish
            
            cv2.line(frame, (prev_frame_x, prev_frame_y), (curr_frame_x, curr_frame_y), color, 2)
        
        # Draw points
        for i, (x, y, timestamp) in enumerate(self.gaze_trail_points):
            frame_x = int(x * w)
            frame_y = int(y * h)
            
            # Color based on age (newer points are brighter)
            current_time = time.time()
            age = current_time - timestamp
            alpha = max(0.3, 1.0 - (age / 60.0))
            color_intensity = int(255 * alpha)
            
            # Draw point
            cv2.circle(frame, (frame_x, frame_y), 3, (0, color_intensity, color_intensity), -1)
            
            # Draw point number
            cv2.putText(frame, str(i+1), (frame_x + 5, frame_y - 5), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.4, (255, 255, 255), 1)
    
    def draw_results(self, frame, results: dict):
        """Draw tracking results on the frame"""
        # Always draw gaze trail first (behind other elements)
        self.draw_gaze_trail(frame)
        
        if self.calibration_mode:
            if self.calibration_step < len(self.calibration_targets):
                target_x, target_y = self.calibration_targets[self.calibration_step]
                self.draw_calibration_target(frame, target_x, target_y)
        else:
            if results['is_tracking']:
                self.draw_gaze_cursor(frame, results['gaze_x'], results['gaze_y'])
            
            # Draw status information
            status_text = "Calibrated" if self.is_calibrated else "Not Calibrated"
            cv2.putText(frame, f"Status: {status_text}", 
                       (10, 90), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
            
            # Draw trail information
            cv2.putText(frame, f"Trail Points: {len(self.gaze_trail_points)}", 
                       (10, 120), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
            
            if not results['is_tracking']:
                cv2.putText(frame, "No face detected", 
                           (10, 150), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 255), 2)


def main():
    """Main function to run the fresh screen gaze tracking application"""
    print("Starting Fresh Screen Gaze Tracking Application...")
    print("This version starts completely fresh - no calibration data is loaded or saved.")
    print("Controls:")
    print("  'c' - Start calibration")
    print("  'r' - Reset calibration")
    print("  't' - Clear gaze trail")
    print("  'q' - Quit")
    print("  SPACE - Next calibration point (during calibration)")
    print("  Gaze points are automatically saved every 5 seconds")
    
    # Initialize gaze tracker
    tracker = FreshScreenGazeTracker()
    
    # Initialize camera
    cap = cv2.VideoCapture(0)
    
    if not cap.isOpened():
        print("Error: Could not open camera")
        return
    
    # Set camera properties
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
    cap.set(cv2.CAP_PROP_FPS, 30)
    
    print("Camera initialized successfully")
    print("Screen resolution:", tracker.screen_width, "x", tracker.screen_height)
    
    try:
        frame_count = 0
        print("Starting main loop...")
        while True:
            ret, frame = cap.read()
            if not ret:
                print("Error: Could not read frame")
                break
            
            frame_count += 1
            
            # Flip frame horizontally for mirror effect
            frame = cv2.flip(frame, 1)
            
            # Process frame
            results = tracker.process_frame(frame)
            
            # Draw results
            tracker.draw_results(frame, results)
            
            # Add frame counter for debugging
            cv2.putText(frame, f"Frame: {frame_count}", (10, frame.shape[0] - 20), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
            
            # Display frame
            cv2.imshow('Fresh Screen Gaze Tracking', frame)
            
            # Print debug info every 30 frames
            if frame_count % 30 == 0:
                print(f"Frame {frame_count}: Tracking={results['is_tracking']}, Gaze=({results['gaze_x']:.3f}, {results['gaze_y']:.3f})")
            
            # Handle key presses
            key = cv2.waitKey(1) & 0xFF
            if key == ord('q'):
                print("Quit key pressed")
                break
            elif key == ord('c'):
                tracker.start_calibration()
            elif key == ord('r'):
                tracker.is_calibrated = False
                tracker.calibration_data = {}
                print("Calibration reset")
            elif key == ord('t'):
                tracker.clear_gaze_trail()
            elif key == ord(' ') and tracker.calibration_mode:
                # Add calibration point
                rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                face_results = tracker.face_mesh.process(rgb_frame)
                if face_results.multi_face_landmarks:
                    tracker.add_calibration_point(face_results.multi_face_landmarks[0].landmark)
    
    except KeyboardInterrupt:
        print("\nApplication interrupted by user")
    
    finally:
        # Cleanup
        cap.release()
        cv2.destroyAllWindows()
        print("Fresh screen gaze tracking application closed")


if __name__ == "__main__":
    main()
