#!/usr/bin/env python3
"""Get Firebase user IDs"""
import firebase_admin
from firebase_admin import credentials, auth
import os

# Initialize Firebase
script_dir = os.path.dirname(os.path.abspath(__file__))
service_account_path = os.path.join(script_dir, "productivly-563e3-firebase-adminsdk-fbsvc-7d29118195.json")

if not os.path.exists(service_account_path):
    print(f"❌ Service account file not found: {service_account_path}")
    exit(1)

if not firebase_admin._apps:
    cred = credentials.Certificate(service_account_path)
    firebase_admin.initialize_app(cred)

print("\n🔍 Fetching Firebase users...\n")

# List users
page = auth.list_users()
users = list(page.users)

if not users:
    print("❌ No users found! Sign up at http://localhost:3002 first.\n")
    exit(0)

print(f"✅ Found {len(users)} user(s):\n")

for i, user in enumerate(users, 1):
    print(f"👤 User {i}:")
    print(f"   UID: {user.uid}")
    print(f"   Email: {user.email or '(no email)'}")
    print(f"   Created: {user.user_metadata.creation_timestamp}")
    print()

if users:
    print("📋 To sync data, use this command:")
    print(f"   ./venv/bin/python firebase_sync.py --watch --user-id {users[0].uid}\n")
