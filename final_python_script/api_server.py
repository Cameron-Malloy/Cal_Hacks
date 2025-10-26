"""
Flask API Server for Distraction Tracker
Provides REST endpoints for front-end to control the distraction tracking session
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import threading
import logging
from typing import Optional
from distraction_tracker import DistractionTracker

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)  # Enable CORS for front-end requests

# Global state for tracking session
current_tracker: Optional[DistractionTracker] = None
tracker_thread: Optional[threading.Thread] = None
tracker_lock = threading.Lock()


def run_tracker_background(session_id: str, user_id: str):
    """Run the distraction tracker in background"""
    global current_tracker

    try:
        logger.info(f"Starting distraction tracker for session: {session_id}, user: {user_id}")
        current_tracker = DistractionTracker(session_id=session_id, user_id=user_id)
        current_tracker.run()
    except Exception as e:
        logger.error(f"Error running distraction tracker: {e}", exc_info=True)
    finally:
        with tracker_lock:
            current_tracker = None
        logger.info("Distraction tracker stopped")


@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'tracker_active': current_tracker is not None
    }), 200


@app.route('/api/session/start', methods=['POST'])
def start_session():
    """Start a new distraction tracking session"""
    global current_tracker, tracker_thread

    try:
        # Parse request data
        data = request.get_json()

        if not data:
            return jsonify({'error': 'No JSON data provided'}), 400

        session_id = data.get('session_id')
        user_id = data.get('user_id', 'demo_user')  # Default to demo_user

        if not session_id:
            return jsonify({'error': 'session_id is required'}), 400

        # Check if tracker is already running
        with tracker_lock:
            if current_tracker is not None:
                return jsonify({
                    'error': 'A tracking session is already active',
                    'active_session_id': current_tracker.session_id
                }), 409

        # Start tracker in background thread
        tracker_thread = threading.Thread(
            target=run_tracker_background,
            args=(session_id, user_id),
            daemon=True
        )
        tracker_thread.start()

        logger.info(f"Started session: {session_id} for user: {user_id}")

        return jsonify({
            'status': 'success',
            'message': 'Session started',
            'session_id': session_id,
            'user_id': user_id
        }), 200

    except Exception as e:
        logger.error(f"Error starting session: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500


@app.route('/api/session/stop', methods=['POST'])
def stop_session():
    """Stop the current distraction tracking session"""
    global current_tracker

    try:
        with tracker_lock:
            if current_tracker is None:
                return jsonify({
                    'error': 'No active tracking session'
                }), 404

            # Signal tracker to stop
            session_id = current_tracker.session_id
            current_tracker.stop()

        logger.info(f"Stopped session: {session_id}")

        return jsonify({
            'status': 'success',
            'message': 'Session stopped',
            'session_id': session_id
        }), 200

    except Exception as e:
        logger.error(f"Error stopping session: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500


@app.route('/api/session/status', methods=['GET'])
def session_status():
    """Get current session status"""
    with tracker_lock:
        if current_tracker is None:
            return jsonify({
                'active': False,
                'session_id': None
            }), 200

        return jsonify({
            'active': True,
            'session_id': current_tracker.session_id,
            'user_id': getattr(current_tracker, 'user_id', 'demo_user')
        }), 200


@app.errorhandler(404)
def not_found(_e):
    return jsonify({'error': 'Endpoint not found'}), 404


@app.errorhandler(500)
def internal_error(e):
    logger.error(f"Internal server error: {e}", exc_info=True)
    return jsonify({'error': 'Internal server error'}), 500


def main():
    """Main entry point"""
    logger.info("Starting Flask API server...")
    logger.info("Server will be available at http://localhost:5000")
    logger.info("Available endpoints:")
    logger.info("  POST /api/session/start - Start tracking session")
    logger.info("  POST /api/session/stop  - Stop tracking session")
    logger.info("  GET  /api/session/status - Get session status")
    logger.info("  GET  /api/health - Health check")

    # Run Flask app
    app.run(
        host='0.0.0.0',
        port=5000,
        debug=False,  # Set to False for production
        threaded=True
    )


if __name__ == '__main__':
    main()
