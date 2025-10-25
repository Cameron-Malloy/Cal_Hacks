# Eye Tracking with OpenCV and MediaPipe

A comprehensive Python eye tracking application that uses OpenCV and MediaPipe for real-time eye detection, blink detection, gaze direction estimation, and pupil tracking.

## Features

-   **Real-time Eye Detection**: Uses MediaPipe's face mesh for accurate eye landmark detection
-   **Blink Detection**: Implements Eye Aspect Ratio (EAR) algorithm for reliable blink detection
-   **Gaze Direction Estimation**: Determines whether the user is looking left, right, or center
-   **Pupil Center Detection**: Uses contour detection to find pupil centers
-   **Eye Movement Visualization**: Real-time visualization of eye landmarks and tracking data
-   **Performance Metrics**: Displays EAR values, blink count, and gaze directions

## Installation

### Prerequisites

-   Python 3.8 or higher
-   Webcam or camera device
-   Good lighting conditions for optimal tracking

### Setup

1. **Clone or download the project files**

2. **Create a virtual environment (recommended):**

    ```bash
    python -m venv venv
    source venv/bin/activate  # On Windows: venv\Scripts\activate
    ```

3. **Install dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

## Usage

### Basic Usage

Run the eye tracking application:

```bash
python research/eye_tracking.py
```

### Controls

-   **'q'**: Quit the application
-   **'r'**: Reset blink counter

### Understanding the Display

The application displays several pieces of information:

-   **Green circles**: Eye centers detected by MediaPipe
-   **Blue circles**: Detected pupil centers
-   **Blinks**: Total number of blinks detected
-   **EAR L/R**: Eye Aspect Ratio for left and right eyes (lower values indicate closed eyes)
-   **Gaze L/R**: Estimated gaze direction (Left, Center, Right)

## Technical Details

### Eye Aspect Ratio (EAR)

The Eye Aspect Ratio is calculated using the formula:

```
EAR = (|p2-p6| + |p3-p5|) / (2 * |p1-p4|)
```

Where p1-p6 are specific eye landmark points. EAR values:

-   **High (>0.25)**: Eyes are open
-   **Low (<0.25)**: Eyes are closed (blink)

### Gaze Direction Estimation

Gaze direction is estimated by analyzing the horizontal position of the eye center relative to the eye corners:

-   **Left**: Eye center is closer to the left corner
-   **Right**: Eye center is closer to the right corner
-   **Center**: Eye center is roughly in the middle

### Pupil Detection

Pupil centers are detected using:

1. Eye region extraction based on MediaPipe landmarks
2. Grayscale conversion and Gaussian blur
3. Binary thresholding
4. Contour detection to find the largest dark region (pupil)

## Customization

### Adjusting Sensitivity

You can modify these parameters in the `EyeTracker` class:

```python
# Blink detection sensitivity
self.EAR_THRESHOLD = 0.25  # Lower = more sensitive to blinks
self.CONSECUTIVE_FRAMES = 3  # Frames needed to confirm a blink

# Camera settings
cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
cap.set(cv2.CAP_PROP_FPS, 30)
```

### Adding New Features

The `EyeTracker` class is designed to be extensible. You can add:

-   **Drowsiness detection**: Monitor EAR values over time
-   **Eye movement patterns**: Track gaze patterns and fixations
-   **Data logging**: Save tracking data to files
-   **Calibration**: Implement user-specific calibration

## Troubleshooting

### Common Issues

1. **Camera not detected**:

    - Ensure your camera is connected and not being used by another application
    - Try changing the camera index in `cv2.VideoCapture(0)` to `cv2.VideoCapture(1)`

2. **Poor tracking accuracy**:

    - Ensure good lighting conditions
    - Keep your face centered in the camera view
    - Avoid wearing glasses with heavy reflections

3. **High CPU usage**:
    - Reduce camera resolution
    - Lower the frame rate
    - Disable pupil detection if not needed

### Performance Optimization

For better performance on slower systems:

```python
# Reduce camera resolution
cap.set(cv2.CAP_PROP_FRAME_WIDTH, 320)
cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 240)

# Skip pupil detection for better performance
# Comment out pupil detection code in process_frame method
```

## Advanced Usage Examples

### Custom Eye Tracking Class

```python
from eye_tracking import EyeTracker

# Create custom tracker
tracker = EyeTracker()

# Process a single frame
frame = cv2.imread('image.jpg')
results = tracker.process_frame(frame)

# Access tracking data
print(f"Left eye EAR: {results['ear_left']}")
print(f"Gaze direction: {results['gaze_left']}")
print(f"Pupil position: {results['left_pupil']}")
```

### Data Logging

```python
import json
import time

# Log tracking data
def log_eye_data(results, filename='eye_data.json'):
    timestamp = time.time()
    data = {
        'timestamp': timestamp,
        'ear_left': results['ear_left'],
        'ear_right': results['ear_right'],
        'gaze_left': results['gaze_left'],
        'gaze_right': results['gaze_right'],
        'blinks': results['blinks']
    }

    with open(filename, 'a') as f:
        f.write(json.dumps(data) + '\n')
```

## Dependencies

-   **OpenCV**: Computer vision library for image processing
-   **MediaPipe**: Google's framework for building perception pipelines
-   **NumPy**: Numerical computing library

## License

This project is open source and available under the MIT License.

## Contributing

Contributions are welcome! Please feel free to submit pull requests or open issues for bugs and feature requests.

## References

-   [MediaPipe Face Mesh](https://google.github.io/mediapipe/solutions/face_mesh.html)
-   [OpenCV Documentation](https://docs.opencv.org/)
-   [Eye Aspect Ratio Paper](https://www.pyimagesearch.com/2017/04/24/eye-blink-detection-opencv-python-dlib/)
