#!/usr/bin/env python3
"""
Eye Tracking Script using OpenCV and MediaPipe
==============================================

This script provides comprehensive eye tracking functionality including:
- Real-time eye detection and tracking
- Pupil center detection
- Eye aspect ratio (EAR) calculation for blink detection
- Gaze direction estimation
- Eye movement visualization

Dependencies:
- opencv-python
- mediapipe
- numpy
- dlib (optional, for more advanced features)

Usage:
    python eye_tracking.py
"""

import cv2
import numpy as np
import mediapipe as mp
import math
from typing import Tuple, List, Optional
import time


class EyeTracker:
    """Advanced eye tracking class using MediaPipe and OpenCV"""
    
    def __init__(self):
        # Initialize MediaPipe face mesh
        self.mp_face_mesh = mp.solutions.face_mesh
        self.mp_drawing = mp.solutions.drawing_utils
        self.mp_drawing_styles = mp.solutions.drawing_styles
        
        # Face mesh model
        self.face_mesh = self.mp_face_mesh.FaceMesh(
            static_image_mode=False,
            max_num_faces=1,
            refine_landmarks=True,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        )
        
        # Eye landmark indices (MediaPipe face mesh)
        self.LEFT_EYE_INDICES = [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246]
        self.RIGHT_EYE_INDICES = [362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388, 387, 386, 385, 384, 398]
        
        # Specific eye corner and center points
        self.LEFT_EYE_CORNERS = [33, 133]  # Left and right corners of left eye
        self.RIGHT_EYE_CORNERS = [362, 263]  # Left and right corners of right eye
        
        # Eye center points (approximate)
        self.LEFT_EYE_CENTER = 468
        self.RIGHT_EYE_CENTER = 473
        
        # Blink detection parameters
        self.EAR_THRESHOLD = 0.25
        self.CONSECUTIVE_FRAMES = 3
        self.blink_counter = 0
        self.total_blinks = 0
        
        # Gaze tracking
        self.gaze_history = []
        self.max_history = 30
        
    def calculate_eye_aspect_ratio(self, landmarks, eye_indices: List[int]) -> float:
        """Calculate Eye Aspect Ratio (EAR) for blink detection"""
        # Get eye landmark coordinates
        eye_points = np.array([(landmarks[i].x, landmarks[i].y) for i in eye_indices])
        
        # Calculate distances
        A = np.linalg.norm(eye_points[1] - eye_points[5])
        B = np.linalg.norm(eye_points[2] - eye_points[4])
        C = np.linalg.norm(eye_points[0] - eye_points[3])
        
        # Calculate EAR
        ear = (A + B) / (2.0 * C)
        return ear
    
    def get_eye_center(self, landmarks, eye_indices: List[int]) -> Tuple[int, int]:
        """Get the center point of an eye"""
        eye_points = np.array([(landmarks[i].x, landmarks[i].y) for i in eye_indices])
        center_x = int(np.mean(eye_points[:, 0]))
        center_y = int(np.mean(eye_points[:, 1]))
        return center_x, center_y
    
    def detect_pupil_center(self, frame, eye_region) -> Tuple[int, int]:
        """Detect pupil center using contour detection"""
        # Convert to grayscale
        gray_eye = cv2.cvtColor(eye_region, cv2.COLOR_BGR2GRAY)
        
        # Apply Gaussian blur
        blurred = cv2.GaussianBlur(gray_eye, (5, 5), 0)
        
        # Apply threshold to get binary image
        _, thresh = cv2.threshold(blurred, 50, 255, cv2.THRESH_BINARY_INV)
        
        # Find contours
        contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        if contours:
            # Find the largest contour (likely the pupil)
            largest_contour = max(contours, key=cv2.contourArea)
            
            # Calculate centroid
            M = cv2.moments(largest_contour)
            if M["m00"] != 0:
                cx = int(M["m10"] / M["m00"])
                cy = int(M["m01"] / M["m00"])
                return cx, cy
        
        return None, None
    
    def estimate_gaze_direction(self, landmarks, eye_indices: List[int]) -> str:
        """Estimate gaze direction based on eye landmarks"""
        eye_points = np.array([(landmarks[i].x, landmarks[i].y) for i in eye_indices])
        
        # Calculate eye center
        eye_center = np.mean(eye_points, axis=0)
        
        # Calculate eye corners
        left_corner = eye_points[0]  # Leftmost point
        right_corner = eye_points[8]  # Rightmost point
        
        # Calculate eye width
        eye_width = np.linalg.norm(right_corner - left_corner)
        
        # Calculate horizontal position of eye center relative to corners
        horizontal_ratio = (eye_center[0] - left_corner[0]) / eye_width
        
        # Determine gaze direction
        if horizontal_ratio < 0.4:
            return "Left"
        elif horizontal_ratio > 0.6:
            return "Right"
        else:
            return "Center"
    
    def draw_eye_landmarks(self, frame, landmarks, eye_indices: List[int], color=(0, 255, 0)):
        """Draw eye landmarks on the frame"""
        h, w = frame.shape[:2]
        
        for idx in eye_indices:
            if idx < len(landmarks):
                x = int(landmarks[idx].x * w)
                y = int(landmarks[idx].y * h)
                cv2.circle(frame, (x, y), 2, color, -1)
    
    def extract_eye_region(self, frame, landmarks, eye_indices: List[int]) -> np.ndarray:
        """Extract eye region from the frame"""
        h, w = frame.shape[:2]
        
        # Get eye points
        eye_points = np.array([(int(landmarks[i].x * w), int(landmarks[i].y * h)) for i in eye_indices])
        
        # Get bounding box
        x_min, y_min = np.min(eye_points, axis=0)
        x_max, y_max = np.max(eye_points, axis=0)
        
        # Add padding
        padding = 10
        x_min = max(0, x_min - padding)
        y_min = max(0, y_min - padding)
        x_max = min(w, x_max + padding)
        y_max = min(h, y_max + padding)
        
        # Extract eye region
        eye_region = frame[y_min:y_max, x_min:x_max]
        return eye_region, (x_min, y_min)
    
    def process_frame(self, frame) -> dict:
        """Process a single frame and return eye tracking data"""
        results = {
            'blinks': 0,
            'gaze_left': 'Center',
            'gaze_right': 'Center',
            'left_eye_center': None,
            'right_eye_center': None,
            'left_pupil': None,
            'right_pupil': None,
            'ear_left': 0,
            'ear_right': 0
        }
        
        # Convert BGR to RGB
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        
        # Process the frame
        face_results = self.face_mesh.process(rgb_frame)
        
        if face_results.multi_face_landmarks:
            for face_landmarks in face_results.multi_face_landmarks:
                # Calculate EAR for both eyes
                left_ear = self.calculate_eye_aspect_ratio(face_landmarks.landmark, self.LEFT_EYE_INDICES)
                right_ear = self.calculate_eye_aspect_ratio(face_landmarks.landmark, self.RIGHT_EYE_INDICES)
                
                results['ear_left'] = left_ear
                results['ear_right'] = right_ear
                
                # Blink detection
                avg_ear = (left_ear + right_ear) / 2.0
                
                if avg_ear < self.EAR_THRESHOLD:
                    self.blink_counter += 1
                else:
                    if self.blink_counter >= self.CONSECUTIVE_FRAMES:
                        self.total_blinks += 1
                        results['blinks'] = 1
                    self.blink_counter = 0
                
                # Get eye centers
                h, w = frame.shape[:2]
                left_eye_center = self.get_eye_center(face_landmarks.landmark, self.LEFT_EYE_INDICES)
                right_eye_center = self.get_eye_center(face_landmarks.landmark, self.RIGHT_EYE_INDICES)
                
                results['left_eye_center'] = (int(left_eye_center[0] * w), int(left_eye_center[1] * h))
                results['right_eye_center'] = (int(right_eye_center[0] * w), int(right_eye_center[1] * h))
                
                # Estimate gaze direction
                results['gaze_left'] = self.estimate_gaze_direction(face_landmarks.landmark, self.LEFT_EYE_INDICES)
                results['gaze_right'] = self.estimate_gaze_direction(face_landmarks.landmark, self.RIGHT_EYE_INDICES)
                
                # Extract eye regions for pupil detection
                left_eye_region, left_offset = self.extract_eye_region(frame, face_landmarks.landmark, self.LEFT_EYE_INDICES)
                right_eye_region, right_offset = self.extract_eye_region(frame, face_landmarks.landmark, self.RIGHT_EYE_INDICES)
                
                # Detect pupils
                if left_eye_region.size > 0:
                    left_pupil = self.detect_pupil_center(frame, left_eye_region)
                    if left_pupil[0] is not None:
                        results['left_pupil'] = (left_pupil[0] + left_offset[0], left_pupil[1] + left_offset[1])
                
                if right_eye_region.size > 0:
                    right_pupil = self.detect_pupil_center(frame, right_eye_region)
                    if right_pupil[0] is not None:
                        results['right_pupil'] = (right_pupil[0] + right_offset[0], right_pupil[1] + right_offset[1])
        
        return results
    
    def draw_results(self, frame, results: dict):
        """Draw eye tracking results on the frame"""
        # Draw eye centers
        if results['left_eye_center']:
            cv2.circle(frame, results['left_eye_center'], 5, (0, 255, 0), -1)
            cv2.putText(frame, "L", (results['left_eye_center'][0] + 10, results['left_eye_center'][1]), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 1)
        
        if results['right_eye_center']:
            cv2.circle(frame, results['right_eye_center'], 5, (0, 255, 0), -1)
            cv2.putText(frame, "R", (results['right_eye_center'][0] + 10, results['right_eye_center'][1]), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 1)
        
        # Draw pupils
        if results['left_pupil']:
            cv2.circle(frame, results['left_pupil'], 3, (255, 0, 0), -1)
        
        if results['right_pupil']:
            cv2.circle(frame, results['right_pupil'], 3, (255, 0, 0), -1)
        
        # Display information
        cv2.putText(frame, f"Blinks: {self.total_blinks}", (10, 30), 
                   cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)
        cv2.putText(frame, f"EAR L: {results['ear_left']:.3f}", (10, 60), 
                   cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
        cv2.putText(frame, f"EAR R: {results['ear_right']:.3f}", (10, 80), 
                   cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
        cv2.putText(frame, f"Gaze L: {results['gaze_left']}", (10, 100), 
                   cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
        cv2.putText(frame, f"Gaze R: {results['gaze_right']}", (10, 120), 
                   cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)


def main():
    """Main function to run the eye tracking application"""
    print("Starting Eye Tracking Application...")
    print("Press 'q' to quit, 'r' to reset blink counter")
    
    # Initialize eye tracker
    tracker = EyeTracker()
    
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
    print("Make sure you have good lighting and your face is visible")
    
    try:
        while True:
            ret, frame = cap.read()
            if not ret:
                print("Error: Could not read frame")
                break
            
            # Flip frame horizontally for mirror effect
            frame = cv2.flip(frame, 1)
            
            # Process frame
            results = tracker.process_frame(frame)
            
            # Draw results
            tracker.draw_results(frame, results)
            
            # Display frame
            cv2.imshow('Eye Tracking', frame)
            
            # Handle key presses
            key = cv2.waitKey(1) & 0xFF
            if key == ord('q'):
                break
            elif key == ord('r'):
                tracker.total_blinks = 0
                print("Blink counter reset")
    
    except KeyboardInterrupt:
        print("\nApplication interrupted by user")
    
    finally:
        # Cleanup
        cap.release()
        cv2.destroyAllWindows()
        print("Eye tracking application closed")


if __name__ == "__main__":
    main()
