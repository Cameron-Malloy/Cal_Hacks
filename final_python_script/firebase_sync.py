#!/usr/bin/env python3
"""
Firebase Sync Module for Distraction Tracker

Syncs distraction events from distraction_events.json to Firebase Firestore.
Uses the exact data structure from the Python backend - no transformations needed!
"""

import json
import os
import time
from datetime import datetime
from typing import Optional, Dict, Any, List
import firebase_admin
from firebase_admin import credentials, firestore
from pathlib import Path


class FirebaseSync:
    """Handles syncing distraction events to Firebase Firestore"""

    def __init__(
        self,
        service_account_path: str = "productivly-563e3-firebase-adminsdk-fbsvc-7d29118195.json",
        events_file: str = "distraction_events.json"
    ):
        """
        Initialize Firebase sync

        Args:
            service_account_path: Path to Firebase service account JSON
            events_file: Path to distraction events JSON file
        """
        self.events_file = events_file
        self.service_account_path = service_account_path
        self.db = None

        # Initialize Firebase
        self._initialize_firebase()

    def _initialize_firebase(self):
        """Initialize Firebase Admin SDK"""
        if not os.path.exists(self.service_account_path):
            raise FileNotFoundError(
                f"Firebase service account file not found: {self.service_account_path}\n"
                "Download it from Firebase Console > Project Settings > Service Accounts"
            )

        try:
            # Initialize app if not already initialized
            if not firebase_admin._apps:
                cred = credentials.Certificate(self.service_account_path)
                firebase_admin.initialize_app(cred)

            self.db = firestore.client()
            print("✅ Firebase initialized successfully")
        except Exception as e:
            print(f"❌ Error initializing Firebase: {e}")
            raise

    def sync_event_to_firebase(
        self,
        event: Dict[str, Any],
        user_id: Optional[str] = None,
        session_id: Optional[str] = None
    ) -> bool:
        """
        Sync a single distraction event to Firebase

        Args:
            event: Distraction event dict (exact structure from JSON)
            user_id: Firebase user ID (optional, can be in event)
            session_id: Focus session ID (optional, can be in event)

        Returns:
            bool: True if synced successfully
        """
        try:
            # Add user_id and session_id if provided
            event_copy = event.copy()
            if user_id:
                event_copy['userId'] = user_id
            if session_id:
                event_copy['sessionId'] = session_id

            # Convert ISO timestamps to Firestore timestamps
            if event_copy.get('start_time'):
                event_copy['start_time'] = datetime.fromisoformat(
                    event_copy['start_time'].replace('Z', '+00:00')
                )
            if event_copy.get('end_time'):
                event_copy['end_time'] = datetime.fromisoformat(
                    event_copy['end_time'].replace('Z', '+00:00')
                )

            # Use the event ID from Python as the document ID
            doc_ref = self.db.collection('distractions').document(event['id'])
            doc_ref.set(event_copy, merge=True)

            print(f"✅ Synced {event['type']}: {event['reason'][:50]}...")
            return True

        except Exception as e:
            print(f"❌ Error syncing event {event.get('id', 'unknown')}: {e}")
            return False

    def sync_unsynced_events(
        self,
        user_id: Optional[str] = None,
        session_id: Optional[str] = None
    ) -> int:
        """
        Sync all unsynced events from the JSON file to Firebase

        Args:
            user_id: Firebase user ID to associate events with
            session_id: Focus session ID to associate events with

        Returns:
            int: Number of events synced
        """
        if not os.path.exists(self.events_file):
            print(f"⚠️  Events file not found: {self.events_file}")
            return 0

        synced_count = 0
        updated_events = []

        print(f"📂 Reading events from {self.events_file}...")

        # Read all events from the newline-delimited JSON file
        with open(self.events_file, 'r') as f:
            for line_num, line in enumerate(f, 1):
                line = line.strip()
                if not line:
                    continue

                try:
                    event = json.loads(line)

                    # Only sync events that haven't been synced yet
                    if not event.get('firebase_synced', False):
                        if self.sync_event_to_firebase(event, user_id, session_id):
                            event['firebase_synced'] = True
                            synced_count += 1

                    updated_events.append(event)

                except json.JSONDecodeError as e:
                    print(f"⚠️  Error parsing line {line_num}: {e}")
                    continue

        # Write back the updated events with firebase_synced flags
        if synced_count > 0:
            print(f"💾 Updating {self.events_file} with sync status...")
            with open(self.events_file, 'w') as f:
                for event in updated_events:
                    f.write(json.dumps(event) + '\n')

        print(f"✨ Synced {synced_count} events to Firebase")
        return synced_count

    def watch_and_sync(
        self,
        user_id: Optional[str] = None,
        session_id: Optional[str] = None,
        interval: int = 5
    ):
        """
        Continuously watch the events file and sync new events

        Args:
            user_id: Firebase user ID
            session_id: Focus session ID
            interval: Check interval in seconds
        """
        print(f"👀 Watching {self.events_file} for new events...")
        print(f"   Checking every {interval} seconds")
        print("   Press Ctrl+C to stop\n")

        last_size = 0

        try:
            while True:
                try:
                    # Check if file has grown
                    current_size = os.path.getsize(self.events_file)

                    if current_size > last_size:
                        # File has new content, sync unsynced events
                        synced = self.sync_unsynced_events(user_id, session_id)
                        if synced > 0:
                            print(f"🔄 {datetime.now().strftime('%H:%M:%S')} - Synced {synced} new events\n")
                        last_size = current_size

                except FileNotFoundError:
                    print(f"⚠️  Events file not found, waiting...")

                time.sleep(interval)

        except KeyboardInterrupt:
            print("\n\n⏹️  Stopped watching for events")

    def get_session_stats(self, session_id: str) -> Dict[str, Any]:
        """
        Get statistics for a focus session from Firebase

        Args:
            session_id: The session ID to get stats for

        Returns:
            Dict with session statistics
        """
        try:
            # Query all distractions for this session
            distractions = self.db.collection('distractions').where(
                'sessionId', '==', session_id
            ).stream()

            events = [doc.to_dict() for doc in distractions]

            if not events:
                return {
                    'total_distractions': 0,
                    'focus_score': 100
                }

            # Calculate stats
            gaze_count = len([e for e in events if e['type'] == 'gaze_distraction'])
            window_count = len([e for e in events if e['type'] == 'window_distraction'])

            # Calculate total distraction time
            total_distraction_time = 0
            for event in events:
                if event.get('start_time') and event.get('end_time'):
                    start = event['start_time']
                    end = event['end_time']
                    if isinstance(start, datetime) and isinstance(end, datetime):
                        duration = (end - start).total_seconds()
                        total_distraction_time += duration

            return {
                'total_distractions': len(events),
                'gaze_distractions': gaze_count,
                'window_distractions': window_count,
                'total_distraction_time': total_distraction_time,
                'average_distraction_duration': (
                    total_distraction_time / len(events) if events else 0
                )
            }

        except Exception as e:
            print(f"❌ Error getting session stats: {e}")
            return {}


def main():
    """Main function for command-line usage"""
    import argparse

    parser = argparse.ArgumentParser(
        description='Sync distraction events to Firebase'
    )
    parser.add_argument(
        '--service-account',
        default='productivly-563e3-firebase-adminsdk-fbsvc-7d29118195.json',
        help='Path to Firebase service account JSON'
    )
    parser.add_argument(
        '--events-file',
        default='distraction_events.json',
        help='Path to distraction events JSON file'
    )
    parser.add_argument(
        '--user-id',
        help='Firebase user ID to associate events with'
    )
    parser.add_argument(
        '--session-id',
        help='Focus session ID to associate events with'
    )
    parser.add_argument(
        '--watch',
        action='store_true',
        help='Continuously watch for new events'
    )
    parser.add_argument(
        '--interval',
        type=int,
        default=5,
        help='Watch interval in seconds (default: 5)'
    )

    args = parser.parse_args()

    try:
        # Initialize Firebase sync
        sync = FirebaseSync(
            service_account_path=args.service_account,
            events_file=args.events_file
        )

        if args.watch:
            # Watch mode - continuously sync new events
            sync.watch_and_sync(
                user_id=args.user_id,
                session_id=args.session_id,
                interval=args.interval
            )
        else:
            # One-time sync of all unsynced events
            synced = sync.sync_unsynced_events(
                user_id=args.user_id,
                session_id=args.session_id
            )
            print(f"\n✨ Done! Synced {synced} events to Firebase")

    except Exception as e:
        print(f"\n❌ Error: {e}")
        return 1

    return 0


if __name__ == "__main__":
    exit(main())
