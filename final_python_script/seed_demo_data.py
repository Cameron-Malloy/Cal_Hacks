#!/usr/bin/env python3
"""
Seed Demo Data for LaserLock Cal Hacks Demo

This script populates Firebase Firestore with fake leaderboard data
for demonstration purposes.
"""

import firebase_admin
from firebase_admin import credentials, firestore
from datetime import datetime, timezone
import random
import os

# Demo user names for leaderboard
DEMO_USERS = [
    {"name": "FocusNinja", "email": "focusninja@demo.com"},
    {"name": "ZenMaster", "email": "zenmaster@demo.com"},
    {"name": "LaserEyes", "email": "lasereyes@demo.com"},
    {"name": "FlowState", "email": "flowstate@demo.com"},
    {"name": "DeepWork", "email": "deepwork@demo.com"},
    {"name": "Mindful", "email": "mindful@demo.com"},
    {"name": "Pranav", "email": "pranav@demo.com"},
    {"name": "Sarah", "email": "sarah@demo.com"},
    {"name": "Mike", "email": "mike@demo.com"},
    {"name": "Emma", "email": "emma@demo.com"},
]

# Our demo user (will be added to leaderboard)
DEMO_USER = {
    "uid": "demo-user",
    "name": "Demo User (You)",
    "email": "demo@laserlock.com"
}


def initialize_firebase():
    """Initialize Firebase Admin SDK"""
    # Look for service account file
    service_account_path = "productivly-563e3-firebase-adminsdk-fbsvc-7d29118195.json"
    
    if not os.path.exists(service_account_path):
        print(f"❌ Firebase service account file not found: {service_account_path}")
        print("Please download it from Firebase Console > Project Settings > Service Accounts")
        return None
    
    try:
        # Initialize app if not already initialized
        if not firebase_admin._apps:
            cred = credentials.Certificate(service_account_path)
            firebase_admin.initialize_app(cred)
        
        db = firestore.client()
        print("✅ Firebase initialized successfully")
        return db
    except Exception as e:
        print(f"❌ Error initializing Firebase: {e}")
        return None


def seed_user_profile(db, user_id, name, email, rank):
    """
    Seed a single user profile
    
    Args:
        db: Firestore client
        user_id: User ID
        name: User name
        email: User email
        rank: Leaderboard rank (1 = best)
    """
    # Calculate stats based on rank
    # Top users have more focus time, XP, higher levels
    base_focus_time = 3000  # minutes
    focus_time = base_focus_time - (rank * 150) + random.randint(-50, 50)
    
    base_xp = 2500
    xp = base_xp - (rank * 100) + random.randint(-50, 50)
    
    level = (xp // 100) + random.randint(0, 3)
    
    current_streak = max(1, 15 - rank + random.randint(-2, 2))
    longest_streak = current_streak + random.randint(5, 15)
    
    # Create user profile
    user_data = {
        "uid": user_id,
        "email": email,
        "name": name,
        "level": level,
        "xp": xp,
        "totalFocusTime": focus_time,
        "currentStreak": current_streak,
        "longestStreak": longest_streak,
        "achievements": [],
        "badges": [],
        "createdAt": firestore.SERVER_TIMESTAMP,
        "lastActiveAt": firestore.SERVER_TIMESTAMP,
    }
    
    # Add some achievements for top users
    if rank <= 3:
        user_data["achievements"] = ["laser_focus", "marathon_runner", "early_bird"]
        user_data["badges"] = ["gold", "diamond"]
    elif rank <= 5:
        user_data["achievements"] = ["laser_focus", "consistent"]
        user_data["badges"] = ["silver"]
    else:
        user_data["achievements"] = ["first_session"]
        user_data["badges"] = ["bronze"]
    
    # Write to Firestore
    user_ref = db.collection("users").document(user_id)
    user_ref.set(user_data)
    
    print(f"✅ Seeded user: {name} (Rank {rank}, {focus_time} min focus, Level {level})")


def seed_demo_user(db):
    """Seed the demo user profile"""
    user_data = {
        "uid": DEMO_USER["uid"],
        "email": DEMO_USER["email"],
        "name": DEMO_USER["name"],
        "level": 5,
        "xp": 450,
        "totalFocusTime": 120,  # 2 hours
        "currentStreak": 2,
        "longestStreak": 3,
        "achievements": ["first_session"],
        "badges": [],
        "createdAt": firestore.SERVER_TIMESTAMP,
        "lastActiveAt": firestore.SERVER_TIMESTAMP,
    }
    
    user_ref = db.collection("users").document(DEMO_USER["uid"])
    user_ref.set(user_data)
    
    print(f"✅ Seeded demo user: {DEMO_USER['name']}")


def seed_leaderboard(db):
    """Seed fake leaderboard data"""
    print("\n" + "=" * 60)
    print("SEEDING FAKE LEADERBOARD DATA")
    print("=" * 60)
    
    # Seed fake users
    for rank, user in enumerate(DEMO_USERS, start=1):
        user_id = f"fake-user-{rank}"
        seed_user_profile(db, user_id, user["name"], user["email"], rank)
    
    # Seed demo user (will appear in middle of leaderboard)
    seed_demo_user(db)
    
    print("\n" + "=" * 60)
    print("SEEDING COMPLETE!")
    print("=" * 60)
    print(f"✅ Created {len(DEMO_USERS)} fake users")
    print(f"✅ Created 1 demo user")
    print(f"✅ Total: {len(DEMO_USERS) + 1} users in leaderboard")
    print("=" * 60)


def main():
    """Main function"""
    print("🚀 LaserLock Demo Data Seeder")
    print("=" * 60)
    
    # Initialize Firebase
    db = initialize_firebase()
    if not db:
        print("❌ Failed to initialize Firebase. Exiting.")
        return 1
    
    # Seed leaderboard
    seed_leaderboard(db)
    
    print("\n✨ Done! Your Firebase is now populated with demo data.")
    print("You can now start the frontend and see the leaderboard!")
    
    return 0


if __name__ == "__main__":
    exit(main())

