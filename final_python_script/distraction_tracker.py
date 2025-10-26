#!/usr/bin/env python3
"""
Refactored Distraction Tracking System
======================================

This system combines gaze tracking and window monitoring to detect distractions:
1. Eyes leaving the screen (especially looking down)
2. Unproductive tabs/applications (blacklist + Claude AI assessment)

Key improvements:
- Concurrent distraction tracking (multiple active distractions)
- Asynchronous logging, Firebase, and Claude evaluation
- Refocus event logging
- Optimized Claude usage (only when needed)

Usage:
    python distraction_tracker.py
"""

import cv2
import numpy as np
import time
import threading
import queue
import json
import logging
import asyncio
import atexit
from datetime import datetime, timezone, timedelta
from typing import Dict, List, Optional, Tuple, Any, Set
from dataclasses import dataclass, asdict
from enum import Enum
import sys
import os
import math
import uuid
from dotenv import load_dotenv
load_dotenv(".env")

# Import our existing modules
from fresh_screen_gaze_tracking import FreshScreenGazeTracker

# Import platform-specific window logger
import platform
if platform.system() == "Darwin":  # macOS
    from window_logger_macos import WindowFocusLogger
else:
    from window_logger import WindowFocusLogger

# LangChain integration for structured output
try:
    from langchain_anthropic import ChatAnthropic
    from pydantic import BaseModel, Field
    # Check if API key is available
    ANTHROPIC_API_KEY = os.getenv('ANTHROPIC_API_KEY')
    LANGCHAIN_AVAILABLE = bool(ANTHROPIC_API_KEY)
    if not LANGCHAIN_AVAILABLE:
        print("Warning: LangChain Claude API key not found in environment variables.")
except ImportError:
    print("Warning: LangChain not available. Install langchain and langchain-anthropic for structured output.")
    LANGCHAIN_AVAILABLE = False

# Firebase integration
try:
    import firebase_admin
    from firebase_admin import credentials, firestore
    FIREBASE_AVAILABLE = True
except ImportError:
    print("Warning: Firebase not available. Install firebase-admin for cloud logging.")
    FIREBASE_AVAILABLE = False


class DistractionType(Enum):
    """Types of distractions that can be tracked"""
    GAZE_DISTRACTION = "gaze_distraction"
    WINDOW_DISTRACTION = "window_distraction"


class DistractionStatus(Enum):
    """Status of a distraction event"""
    ACTIVE = "active"
    RESOLVED = "resolved"


class ApplicationCategory(Enum):
    """Categories for applications"""
    GAME = "game"
    STREAMING = "streaming"
    MESSAGING = "messaging"
    SOCIAL_MEDIA = "social_media"
    PRODUCTIVITY = "productivity"
    BROWSER = "browser"
    ENTERTAINMENT = "entertainment"
    NEWS = "news"
    SHOPPING = "shopping"
    EDUCATION = "education"
    DEVELOPMENT = "development"
    OTHER = "other"


# Structured output schemas for LangChain
if LANGCHAIN_AVAILABLE:
    class ApplicationCategorization(BaseModel):
        """Structured output for application categorization"""
        category: str = Field(description="The application category from the predefined list")
        confidence: float = Field(description="Confidence score between 0.0 and 1.0", ge=0.0, le=1.0)
        reasoning: str = Field(description="Brief explanation for the categorization decision")
    
    class DistractionAssessment(BaseModel):
        """Structured output for distraction assessment"""
        is_distracting: bool = Field(description="Whether the application is distracting or productive")
        confidence: float = Field(description="Confidence score between 0.0 and 1.0", ge=0.0, le=1.0)
        reasoning: str = Field(description="Brief explanation for the assessment decision")
        suggested_action: str = Field(description="Suggested action for the user (e.g., 'continue', 'switch_to_productive_app')")


@dataclass
class DistractionEvent:
    """Data class for distraction events"""
    id: str
    type: DistractionType
    status: DistractionStatus
    reason: str
    start_time: datetime
    end_time: Optional[datetime] = None
    gaze_data: Optional[Dict[str, Any]] = None
    window_data: Optional[Dict[str, Any]] = None
    claude_assessment: Optional[bool] = None
    application_category: Optional[ApplicationCategory] = None
    category_confidence: Optional[float] = None
    category_reasoning: Optional[str] = None
    claude_confidence: Optional[float] = None
    claude_reasoning: Optional[str] = None
    suggested_action: Optional[str] = None
    firebase_synced: bool = False
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for Firebase serialization"""
        data = asdict(self)
        data['type'] = self.type.value
        data['status'] = self.status.value
        if self.application_category:
            data['application_category'] = self.application_category.value
        # Keep datetime objects as-is for Firebase compatibility
        # Firebase Firestore can directly handle Python datetime objects
        data['start_time'] = self.start_time
        if self.end_time:
            data['end_time'] = self.end_time
        return data


class DistractionTracker:
    """Main distraction tracking system combining gaze and window monitoring"""
    
    def __init__(self, config_file: str = "distraction_config.json", session_id: Optional[str] = None, user_id: Optional[str] = None):
        # Store user_id (defaults to config or 'demo-user')
        self.user_id = user_id

        # Initialize gaze tracker
        self.gaze_tracker = FreshScreenGazeTracker()

        # Initialize window logger
        self.window_logger = WindowFocusLogger(log_file="distraction_events.log", log_format="json")

        # Configuration
        self.config = self.load_config(config_file)

        # Set user_id from config if not provided
        if self.user_id is None:
            self.user_id = self.config.get('demo_user_id', 'demo-user')
        
        # Distraction detection settings
        self.gaze_threshold_y = self.config.get('gaze_threshold_y', 0.8)
        self.gaze_threshold_x_min = self.config.get('gaze_threshold_x_min', 0.1)
        self.gaze_threshold_x_max = self.config.get('gaze_threshold_x_max', 0.9)
        self.distraction_timeout = self.config.get('distraction_timeout', 2.0)
        
        # Window distraction settings
        self.blacklisted_apps = self.config.get('blacklisted_apps', [
            'chrome.exe', 'firefox.exe', 'edge.exe', 'discord.exe', 
            'slack.exe', 'telegram.exe', 'whatsapp.exe', 'spotify.exe',
            'youtube.exe', 'netflix.exe', 'steam.exe', 'minecraft.exe'
        ])
        
        self.blacklisted_keywords = self.config.get('blacklisted_keywords', [
            'youtube', 'facebook', 'twitter', 'instagram', 'tiktok',
            'reddit', 'discord', 'slack', 'netflix', 'spotify',
            'gaming', 'game', 'entertainment'
        ])
        
        # State tracking
        self.current_gaze_x = 0.5
        self.current_gaze_y = 0.5
        self.is_gaze_tracking = False
        self.current_window_info = None
        self.gaze_distraction_start_time = None
        self.last_distraction_check = time.time()
        
        # Window state tracking
        self.last_window_key = None
        self.last_window_info = None
        
        # Active distractions tracking (concurrent support)
        self.active_distractions: Dict[str, DistractionEvent] = {}
        self.distraction_events: List[DistractionEvent] = []
        self.running = False
        
        # Threading and async queues
        self.gaze_queue = queue.Queue(maxsize=10)
        self.window_queue = queue.Queue(maxsize=10)
        self.logging_queue = queue.Queue(maxsize=100)
        self.firebase_queue = queue.Queue(maxsize=100)
        self.claude_queue = queue.Queue(maxsize=50)
        
        # Firebase client
        self.firebase_app = None
        self.firestore_client = None
        if FIREBASE_AVAILABLE and self.config.get('use_firebase', False):
            print("[FIREBASE] FIREBASE INITIALIZATION STARTING...")
            print(f"[FIREBASE] Firebase available: {FIREBASE_AVAILABLE}")
            print(f"[FIREBASE] Use Firebase config: {self.config.get('use_firebase', False)}")
            try:
                firebase_config_path = self.config.get('firebase_config_path', 
                                                     'firebase-service-account.json')
                print(f"[FIREBASE] Looking for Firebase config at: {firebase_config_path}")
                print(f"[FIREBASE] Config file exists: {os.path.exists(firebase_config_path)}")
                
                if os.path.exists(firebase_config_path):
                    print("[FIREBASE] Loading Firebase credentials...")
                    cred = credentials.Certificate(firebase_config_path)
                    print("[FIREBASE] Credentials loaded successfully")
                    
                    print("[FIREBASE] Initializing Firebase app...")
                    try:
                        self.firebase_app = firebase_admin.initialize_app(cred)
                        print("[FIREBASE] Firebase app initialized successfully")
                    except Exception as app_error:
                        print(f"[ERROR] Firebase app initialization failed: {app_error}")
                        print("[FIREBASE] This might be due to:")
                        print("[FIREBASE] 1. System clock being wrong")
                        print("[FIREBASE] 2. Expired service account key")
                        print("[FIREBASE] 3. Network connectivity issues")
                        raise app_error
                    
                    print("[FIREBASE] Creating Firestore client...")
                    try:
                        self.firestore_client = firestore.client()
                        print("[FIREBASE] Firestore client created successfully")
                        print("SUCCESS: Firebase initialized successfully!")
                    except Exception as client_error:
                        print(f"[ERROR] Firestore client creation failed: {client_error}")
                        print("[FIREBASE] This might be due to:")
                        print("[FIREBASE] 1. Invalid service account permissions")
                        print("[FIREBASE] 2. Project ID mismatch")
                        print("[FIREBASE] 3. Firestore not enabled in Firebase console")
                        raise client_error
                else:
                    print(f"[ERROR] Firebase config file not found: {firebase_config_path}")
            except Exception as e:
                print(f"[ERROR] Could not initialize Firebase: {e}")
                print(f"[ERROR] Error type: {type(e).__name__}")
                import traceback
                print(f"[ERROR] Full traceback: {traceback.format_exc()}")
        else:
            print(f"[FIREBASE] Firebase disabled - Available: {FIREBASE_AVAILABLE}, Config enabled: {self.config.get('use_firebase', False)}")
        
        # Use provided session_id or generate a new one
        if session_id:
            self.session_id = session_id
            self.start_time = time.time()
        else:
            self.start_time = time.time()
            self.session_id = "session_" + str(self.start_time)
        
        # LangChain Claude client for structured output
        self.langchain_claude = None
        if LANGCHAIN_AVAILABLE:
            print("[CLAUDE] CLAUDE INITIALIZATION STARTING...")
            print(f"[CLAUDE] LangChain available: {LANGCHAIN_AVAILABLE}")
            print(f"[CLAUDE] API key available: {bool(ANTHROPIC_API_KEY)}")
            try:
                if ANTHROPIC_API_KEY:
                    print("[CLAUDE] Creating LangChain Claude client...")
                    self.langchain_claude = ChatAnthropic(
                        model="claude-3-haiku-20240307",
                        api_key=ANTHROPIC_API_KEY,
                        temperature=0.1
                    )
                    print("[CLAUDE] LangChain Claude client created successfully")
                    print("✓ LangChain Claude initialized")
                else:
                    print("[ERROR] Claude API key not found in environment variables")
            except Exception as e:
                print(f"[ERROR] Could not initialize LangChain Claude: {e}")
                print(f"[ERROR] Error type: {type(e).__name__}")
                import traceback
                print(f"[ERROR] Full traceback: {traceback.format_exc()}")
        else:
            print(f"[CLAUDE] Claude disabled - Available: {LANGCHAIN_AVAILABLE}")
        
        # Logging setup
        self.setup_logging()
        
        print("Refactored distraction tracker initialized")
        print(f"Blacklisted apps: {len(self.blacklisted_apps)}")
        print(f"Blacklisted keywords: {len(self.blacklisted_keywords)}")
        print(f"Claude integration: {'Enabled (LangChain)' if self.langchain_claude else 'Disabled'}")
        print(f"Firebase integration: {'Enabled' if self.firestore_client else 'Disabled'}")
        if self.firestore_client:
            print(f"[FIREBASE] Collection: {self.config.get('firebase_collection', 'appAccessEvents')}")
            print(f"[FIREBASE] Queue size: {self.firebase_queue.maxsize}")
        print(f"Concurrent distraction tracking: Enabled")
        
        # Register exit handler to resolve all active distractions
        atexit.register(self.resolve_all_active_distractions_on_exit)
    
    def get_pst_time(self) -> datetime:
        """Get current time in PST timezone"""
        # PST is UTC-8, PDT is UTC-7
        # For simplicity, we'll use PST (UTC-8) year-round
        pst_offset = timedelta(hours=-8)
        pst_timezone = timezone(pst_offset)
        return datetime.now(pst_timezone)
    
    def resolve_all_active_distractions_on_exit(self):
        """Resolve all active distractions when program exits"""
        print("\n" + "=" * 60)
        print("PROGRAM EXITING - RESOLVING ALL ACTIVE DISTRACTIONS")
        print("=" * 60)
        
        # Get current time in PST
        exit_time_pst = self.get_pst_time()
        
        print(f"Exit time (PST): {exit_time_pst}")
        
        # Resolve all active distractions (both gaze and window distractions)
        active_distraction_ids = list(self.active_distractions.keys())
        print(f"Found {len(active_distraction_ids)} active distractions to resolve")
        
        # Count by type for reporting
        gaze_count = 0
        window_count = 0
        
        for distraction_id in active_distraction_ids:
            if distraction_id in self.active_distractions:
                event = self.active_distractions[distraction_id]
                event.status = DistractionStatus.RESOLVED
                event.end_time = exit_time_pst  # Use PST time
                
                # Count by type
                if event.type == DistractionType.GAZE_DISTRACTION:
                    gaze_count += 1
                elif event.type == DistractionType.WINDOW_DISTRACTION:
                    window_count += 1
                
                # Log the distraction resolution
                duration = (event.end_time - event.start_time).total_seconds()
                print(f"Resolving {event.type.value}: {distraction_id} - Duration: {duration:.1f}s")
                
                # Queue for immediate Firebase sync
                if self.firestore_client:
                    self.firebase_queue.put(event)
                
                # Remove from active distractions
                del self.active_distractions[distraction_id]
        
        print(f"[SUCCESS] Resolved {len(active_distraction_ids)} active distractions")
        print(f"  - Gaze distractions: {gaze_count}")
        print(f"  - Window distractions: {window_count}")
        print("=" * 60)
    
    def load_config(self, config_file: str) -> Dict[str, Any]:
        """Load configuration from JSON file"""
        default_config = {
            'blacklisted_apps': [
                'chrome.exe', 'firefox.exe', 'edge.exe', 'discord.exe', 
                'slack.exe', 'telegram.exe', 'whatsapp.exe', 'spotify.exe',
                'youtube.exe', 'netflix.exe', 'steam.exe', 'minecraft.exe'
            ],
            'blacklisted_keywords': [
                'youtube', 'facebook', 'twitter', 'instagram', 'tiktok',
                'reddit', 'discord', 'slack', 'netflix', 'spotify',
                'gaming', 'game', 'entertainment'
            ],
            'use_claude': False,
            'use_firebase': False,
            'firebase_config_path': 'firebase-service-account.json',
            'firebase_collection': 'distraction_events',
            'gaze_threshold_y': 0.8,
            'gaze_threshold_x_min': 0.1,
            'gaze_threshold_x_max': 0.9,
            'distraction_timeout': 2.0
        }
        
        if os.path.exists(config_file):
            try:
                with open(config_file, 'r') as f:
                    config = json.load(f)
                # Merge with defaults
                for key, value in default_config.items():
                    if key not in config:
                        config[key] = value
                return config
            except Exception as e:
                print(f"Error loading config: {e}, using defaults")
                return default_config
        else:
            # Create default config file
            with open(config_file, 'w') as f:
                json.dump(default_config, f, indent=2)
            print(f"Created default config file: {config_file}")
            return default_config
    
    def setup_logging(self):
        """Setup logging for distraction events"""
        # Logging setup removed - using print statements instead
        pass
    
    def is_gaze_distracted(self, gaze_x: float, gaze_y: float) -> Tuple[bool, str]:
        """
        Check if gaze indicates distraction
        
        Returns:
            (is_distracted, reason)
        """
        # Check if looking down (distracted)
        if gaze_y > self.gaze_threshold_y:
            return True, f"Looking down (y={gaze_y:.3f} > {self.gaze_threshold_y})"
        
        # Check if looking off-screen horizontally
        if gaze_x < self.gaze_threshold_x_min:
            return True, f"Looking left off-screen (x={gaze_x:.3f} < {self.gaze_threshold_x_min})"
        
        if gaze_x > self.gaze_threshold_x_max:
            return True, f"Looking right off-screen (x={gaze_x:.3f} > {self.gaze_threshold_x_max})"
        
        return False, "Gaze on screen"
    
    def create_distraction_event(self, distraction_type: DistractionType, reason: str,
                                gaze_data: Dict[str, Any], window_data: Dict[str, Any]) -> DistractionEvent:
        """Create a new distraction event"""
        event_id = str(uuid.uuid4())
        event = DistractionEvent(
            id=event_id,
            type=distraction_type,
            status=DistractionStatus.ACTIVE,
            reason=reason,
            start_time=self.get_pst_time(),  # Use PST time
            gaze_data=gaze_data,
            window_data=window_data
        )
        return event
    
    def start_distraction(self, event: DistractionEvent):
        """Start tracking a new distraction"""
        self.active_distractions[event.id] = event
        self.distraction_events.append(event)
        
        # Log the distraction start
        print(f"DISTRACTION STARTED: {event.type.value} - {event.reason}")
        
        # Queue for logging (immediate)
        self.logging_queue.put(('start', event))
        
        # Determine if Claude processing is needed
        needs_claude = False
        
        if event.type == DistractionType.WINDOW_DISTRACTION and self.langchain_claude:
            # Only categorize if not already blacklisted (to avoid unnecessary calls)
            if not self.is_blacklisted_distraction(event):
                needs_claude = True
                self.claude_queue.put(('categorize_and_assess', event))
            else:
                # For blacklisted distractions, just categorize without assessment
                self.claude_queue.put(('categorize_only', event))
        
        # If no Claude processing needed, queue Firebase immediately
        if not needs_claude:
            self.firebase_queue.put(event)
    
    def resolve_distraction(self, event_id: str):
        """Resolve an active distraction"""
        if event_id in self.active_distractions:
            event = self.active_distractions[event_id]
            event.status = DistractionStatus.RESOLVED
            # Use PST time
            event.end_time = self.get_pst_time()
            
            # Log the distraction resolution
            duration = (event.end_time - event.start_time).total_seconds()
            print(f"DISTRACTION RESOLVED: {event.type.value} - Duration: {duration:.1f}s")
            
            # Queue for logging (immediate)
            self.logging_queue.put(('resolve', event))
            
            # Queue Firebase sync (will happen after any pending Claude processing)
            self.firebase_queue.put(event)
            
            # Remove from active distractions
            del self.active_distractions[event_id]
    
    def is_blacklisted_distraction(self, event: DistractionEvent) -> bool:
        """Check if distraction is already covered by blacklist/gaze detection"""
        if event.type == DistractionType.GAZE_DISTRACTION:
            return True  # Gaze distractions are always "blacklisted" (detected by gaze)
        
        if event.type == DistractionType.WINDOW_DISTRACTION and event.window_data:
            process_name = event.window_data.get('process_name', '').lower()
            window_title = event.window_data.get('window_title', '').lower()
            
            # Check if it's a blacklisted app
            for blacklisted_app in self.blacklisted_apps:
                if blacklisted_app.lower() in process_name:
                    return True
            
            # Check if it contains blacklisted keywords
            for keyword in self.blacklisted_keywords:
                if keyword.lower() in window_title:
                    return True
        
        return False
    
    def is_window_distracted(self, window_info: Dict[str, Any]) -> Tuple[bool, str]:
        """
        Check if current window indicates distraction
        
        Returns:
            (is_distracted, reason)
        """
        if not window_info:
            return False, "No window info"
        
        process_name = window_info.get('process_name', '').lower()
        window_title = window_info.get('window_title', '').lower()
        
        # Check blacklisted apps
        for blacklisted_app in self.blacklisted_apps:
            if blacklisted_app.lower() in process_name:
                return True, f"Blacklisted app: {process_name}"
        
        # Check blacklisted keywords in window title
        for keyword in self.blacklisted_keywords:
            if keyword.lower() in window_title:
                return True, f"Blacklisted keyword '{keyword}' in: {window_title}"
        
        return False, "Productive window"
    
    async def categorize_application(self, window_title: str, process_name: str) -> Tuple[ApplicationCategory, float, str]:
        """
        Use Claude API to categorize the application type with structured output
        
        Returns:
            Tuple of (ApplicationCategory enum value, confidence, reasoning)
        """
        print(f"[CLAUDE] CATEGORIZATION STARTING for: '{window_title}' ({process_name})")
        
        if not self.langchain_claude:
            print("[ERROR] ERROR: Claude client not available - skipping categorization")
            return (ApplicationCategory.OTHER, 0.0, "Claude client not available")
        
        print("[CLAUDE] Claude client is available, proceeding with categorization...")
        
        # Use LangChain structured output
        if self.langchain_claude and LANGCHAIN_AVAILABLE:
            try:
                print(f"[CLAUDE] Creating categorization prompt for: '{window_title}' ({process_name})")
                prompt = f"""
                Categorize this application based on its window title and process name:
                
                Window Title: "{window_title}"
                Process: "{process_name}"
                
                Choose the most appropriate category from these options:
                - GAME: Video games, gaming platforms (Steam, Epic Games, etc.)
                - STREAMING: Video/music streaming services (YouTube, Netflix, Spotify, Twitch, etc.)
                - MESSAGING: Communication apps (Discord, Slack, Telegram, WhatsApp, Teams, etc.)
                - SOCIAL_MEDIA: Social networking platforms (Facebook, Twitter, Instagram, TikTok, Reddit, etc.)
                - PRODUCTIVITY: Work applications (Office suite, project management, etc.)
                - BROWSER: Web browsers (Chrome, Firefox, Edge, etc.)
                - ENTERTAINMENT: Other entertainment content (gaming websites, entertainment news, etc.)
                - NEWS: News websites and applications
                - SHOPPING: E-commerce and shopping websites
                - EDUCATION: Educational content (Khan Academy, Coursera, educational videos, etc.)
                - DEVELOPMENT: Development tools (VS Code, GitHub, Stack Overflow, documentation, etc.)
                - OTHER: Anything that doesn't fit the above categories
                """
                
                print("[CLAUDE] Sending categorization request to Claude...")
                # Use structured output with simple invoke
                result = await self.langchain_claude.with_structured_output(ApplicationCategorization).ainvoke(prompt)
                print(f"[CLAUDE] Claude categorization response received")
                print(f"[CLAUDE] Category: {result.category}")
                print(f"[CLAUDE] Confidence: {result.confidence}")
                print(f"[CLAUDE] Reasoning: {result.reasoning}")
                
                # Map result to enum
                try:
                    category = ApplicationCategory(result.category.lower())
                    print(f"[CLAUDE] Successfully mapped to category: {category.value}")
                    return (category, result.confidence, result.reasoning)
                except ValueError:
                    print(f"[ERROR] Unknown category from Claude: {result.category}")
                    return (ApplicationCategory.OTHER, result.confidence, result.reasoning)
                    
            except Exception as e:
                print(f"[ERROR] ERROR: Claude categorization failed for '{window_title}' ({process_name})")
                print(f"[ERROR] Error message: {e}")
                print(f"[ERROR] Error type: {type(e).__name__}")
                import traceback
                print(f"[ERROR] Full traceback: {traceback.format_exc()}")
                return (ApplicationCategory.OTHER, 0.0, f"Error: {str(e)}")
    
    async def process_claude_assessment(self, event: DistractionEvent) -> bool:
        """
        Use Claude API to assess if window content is distracting with structured output
        
        Returns:
            True if distracting, False if productive
        """
        print(f"[CLAUDE] ASSESSMENT STARTING for event {event.id}")
        
        if not self.langchain_claude:
            print("[ERROR] ERROR: Claude client not available - skipping assessment")
            return False
        
        if not event.window_data:
            print("[ERROR] ERROR: No window data available for assessment")
            return False
        
        window_title = event.window_data.get('window_title', '')
        process_name = event.window_data.get('process_name', '')
        print(f"[CLAUDE] Assessing: '{window_title}' ({process_name})")
        
        print("[CLAUDE] Claude client is available, proceeding with assessment...")
        
        # Use LangChain structured output
        if self.langchain_claude and LANGCHAIN_AVAILABLE:
            try:
                print(f"[CLAUDE] Creating assessment prompt for: '{window_title}' ({process_name})")
                prompt = f"""
                Assess if this window/tab is distracting or productive for work/study:
                
                Window Title: "{window_title}"
                Process: "{process_name}"
                
                Consider it distracting if it's:
                - Social media (Facebook, Twitter, Instagram, TikTok, Reddit, Discord, Slack)
                - Entertainment (YouTube, Netflix, Spotify, gaming)
                - News sites (unless work-related)
                - Shopping sites
                - Personal communication apps
                
                Consider it productive if it's:
                - Work applications (VS Code, Excel, Word, PowerPoint)
                - Educational content (Khan Academy, Coursera, educational YouTube)
                - Professional tools (GitHub, Stack Overflow, documentation)
                - Work-related communication (work Slack, work email)
                """
                
                print("[CLAUDE] Sending assessment request to Claude...")
                # Use structured output with simple invoke
                result = await self.langchain_claude.with_structured_output(DistractionAssessment).ainvoke(prompt)
                print(f"[CLAUDE] Claude assessment response received")
                print(f"[CLAUDE] Is distracting: {result.is_distracting}")
                print(f"[CLAUDE] Confidence: {result.confidence}")
                print(f"[CLAUDE] Reasoning: {result.reasoning}")
                print(f"[CLAUDE] Suggested action: {result.suggested_action}")
                
                # Update the event with Claude's assessment
                event.claude_assessment = result.is_distracting
                event.claude_confidence = result.confidence
                event.claude_reasoning = result.reasoning
                event.suggested_action = result.suggested_action
                
                print(f"[CLAUDE] Assessment completed successfully")
                return result.is_distracting
                
            except Exception as e:
                print(f"[ERROR] ERROR: Claude assessment failed for event {event.id}")
                print(f"[ERROR] Error message: {e}")
                print(f"[ERROR] Error type: {type(e).__name__}")
                import traceback
                print(f"[ERROR] Full traceback: {traceback.format_exc()}")
                return False
    
    async def sync_to_firebase(self, event: DistractionEvent):
        """Sync distraction event to Firebase"""
        print(f"[FIREBASE] FIREBASE SYNC STARTING for event {event.id}")
        print(f"[FIREBASE] Event type: {event.type.value}")
        print(f"[FIREBASE] Event status: {event.status.value}")
        print(f"[FIREBASE] Event reason: {event.reason}")
        
        if not self.firestore_client:
            print("[ERROR] ERROR: Firebase client not available - skipping sync")
            return
        
        print("[FIREBASE] Firebase client is available, proceeding with sync...")
        
        try:
            collection_name = self.config.get('firebase_collection', 'appAccessEvents')
            print(f"[FIREBASE] Collection name: {collection_name}")
            print(f"[FIREBASE] Session ID: {self.session_id}")
            print(f"[FIREBASE] Event ID: {event.id}")

            # Build document reference using self.user_id
            doc_ref = self.firestore_client.collection('users').document(self.user_id).collection('sessions').document(self.session_id).collection(collection_name).document(event.id)
            print(f"[FIREBASE] Document reference path: users/{self.user_id}/sessions/{self.session_id}/{collection_name}/{event.id}")
            
            # Convert event to dict and ensure all fields are serializable
            print("[FIREBASE] Converting event to dictionary...")
            event_dict = event.to_dict()
            print(f"[FIREBASE] Event dict keys: {list(event_dict.keys())}")
            
            # Add timestamp for Firebase (use PST time)
            firebase_timestamp = self.get_pst_time()
            event_dict['firebase_timestamp'] = firebase_timestamp
            print(f"[FIREBASE] Added Firebase timestamp: {firebase_timestamp}")
            
            print("[FIREBASE] Attempting to write to Firestore...")
            doc_ref.set(event_dict)
            print("[FIREBASE] Firestore write completed successfully!")
            
            event.firebase_synced = True
            print(f"SUCCESS: Synced event {event.id} to Firebase collection '{collection_name}'")
            
        except Exception as e:
            print(f"[ERROR] ERROR: Firebase sync failed for event {event.id}")
            print(f"[ERROR] Error message: {e}")
            print(f"[ERROR] Error type: {type(e).__name__}")
            import traceback
            print(f"[ERROR] Full traceback: {traceback.format_exc()}")
            # Don't re-raise the exception to prevent worker thread crashes
    
    def push_session_start_data(self):
        """Push session start data to Firebase"""
        if not self.firestore_client:
            print("[FIREBASE] Firebase client not available - skipping session start data")
            return
        
        try:
            print("[FIREBASE] Pushing session start data...")
            
            # Create session document data
            session_data = {
                'session_id': self.session_id,
                'start_time': self.get_pst_time(),
                'status': 'active',
                'gaze_threshold_y': self.gaze_threshold_y,
                'gaze_threshold_x_min': self.gaze_threshold_x_min,
                'gaze_threshold_x_max': self.gaze_threshold_x_max,
                'distraction_timeout': self.distraction_timeout,
                'blacklisted_apps': self.blacklisted_apps,
                'blacklisted_keywords': self.blacklisted_keywords,
                'firebase_timestamp': self.get_pst_time()
            }

            # Build session document reference using self.user_id
            session_doc_ref = self.firestore_client.collection('users').document(self.user_id).collection('sessions').document(self.session_id)
            print(f"[FIREBASE] Session document path: users/{self.user_id}/sessions/{self.session_id}")
            
            # Write session data
            session_doc_ref.set(session_data)
            print(f"SUCCESS: Session start data pushed to Firebase")
            
        except Exception as e:
            print(f"[ERROR] Session start data push failed: {e}")
    
    def push_session_stats_update(self):
        """Push current session stats to Firebase"""
        if not self.firestore_client:
            print("[FIREBASE] Firebase client not available - skipping session stats update")
            return
        
        try:
            print("[FIREBASE] Pushing session stats update...")
            
            # Calculate current stats
            total_events = len(self.distraction_events)
            active_events = len(self.active_distractions)
            resolved_events = sum(1 for event in self.distraction_events if event.status == DistractionStatus.RESOLVED)
            
            gaze_distractions = sum(1 for event in self.distraction_events if event.type == DistractionType.GAZE_DISTRACTION)
            window_distractions = sum(1 for event in self.distraction_events if event.type == DistractionType.WINDOW_DISTRACTION)
            
            # Calculate total distraction time
            total_distraction_time = 0
            for event in self.distraction_events:
                if event.status == DistractionStatus.RESOLVED and event.end_time:
                    duration = (event.end_time - event.start_time).total_seconds()
                    total_distraction_time += duration
            
            # Calculate session duration
            session_duration = time.time() - self.start_time
            
            # Create stats update data
            stats_data = {
                'last_updated': self.get_pst_time(),
                'session_duration_seconds': session_duration,
                'total_events': total_events,
                'active_events': active_events,
                'resolved_events': resolved_events,
                'gaze_distractions': gaze_distractions,
                'window_distractions': window_distractions,
                'total_distraction_time_seconds': total_distraction_time,
                'current_gaze_x': self.current_gaze_x,
                'current_gaze_y': self.current_gaze_y,
                'is_gaze_tracking': self.is_gaze_tracking,
                'current_window_title': self.current_window_info.get('window_title', 'None') if self.current_window_info else 'None',
                'current_process_name': self.current_window_info.get('process_name', 'None') if self.current_window_info else 'None',
                'firebase_timestamp': self.get_pst_time()
            }
            
            # Build session document reference using self.user_id
            session_doc_ref = self.firestore_client.collection('users').document(self.user_id).collection('sessions').document(self.session_id)
            print(f"[FIREBASE] Updating session stats at: users/{self.user_id}/sessions/{self.session_id}")
            
            # Update session document with stats
            session_doc_ref.update(stats_data)
            print(f"SUCCESS: Session stats updated in Firebase")
            
        except Exception as e:
            print(f"[ERROR] Session stats update failed: {e}")
    
    def push_session_end_data(self):
        """Push session end data to Firebase"""
        if not self.firestore_client:
            print("[FIREBASE] Firebase client not available - skipping session end data")
            return
        
        try:
            print("[FIREBASE] Pushing session end data...")
            
            # Calculate final stats
            total_events = len(self.distraction_events)
            resolved_events = sum(1 for event in self.distraction_events if event.status == DistractionStatus.RESOLVED)
            
            gaze_distractions = sum(1 for event in self.distraction_events if event.type == DistractionType.GAZE_DISTRACTION)
            window_distractions = sum(1 for event in self.distraction_events if event.type == DistractionType.WINDOW_DISTRACTION)
            
            # Calculate total distraction time
            total_distraction_time = 0
            for event in self.distraction_events:
                if event.status == DistractionStatus.RESOLVED and event.end_time:
                    duration = (event.end_time - event.start_time).total_seconds()
                    total_distraction_time += duration
            
            # Calculate session duration
            session_duration = time.time() - self.start_time
            
            # Create session end data
            end_data = {
                'end_time': self.get_pst_time(),
                'status': 'completed',
                'session_duration_seconds': session_duration,
                'total_events': total_events,
                'resolved_events': resolved_events,
                'gaze_distractions': gaze_distractions,
                'window_distractions': window_distractions,
                'total_distraction_time_seconds': total_distraction_time,
                'firebase_timestamp': self.get_pst_time()
            }
            
            # Build session document reference using self.user_id
            session_doc_ref = self.firestore_client.collection('users').document(self.user_id).collection('sessions').document(self.session_id)
            print(f"[FIREBASE] Final session update at: users/{self.user_id}/sessions/{self.session_id}")
            
            # Update session document with end data
            session_doc_ref.update(end_data)
            print(f"SUCCESS: Session end data pushed to Firebase")
            
        except Exception as e:
            print(f"[ERROR] Session end data push failed: {e}")
    
    def run_async_logging_worker(self):
        """Run async logging worker in separate thread"""
        def worker():
            while self.running:
                try:
                    action, event = self.logging_queue.get(timeout=1)
                    
                    if action == 'start':
                        # Log distraction start to file with enhanced information
                        event_data = event.to_dict()
                        if event.type == DistractionType.WINDOW_DISTRACTION and event.window_data:
                            event_data['switched_to'] = {
                                'window_title': event.window_data.get('window_title', ''),
                                'process_name': event.window_data.get('process_name', ''),
                                'application_category': event.application_category.value if event.application_category else 'unknown'
                            }
                        
                        # Convert datetime objects to ISO format for JSON serialization
                        if 'start_time' in event_data and isinstance(event_data['start_time'], datetime):
                            event_data['start_time'] = event_data['start_time'].isoformat()
                        if 'end_time' in event_data and isinstance(event_data['end_time'], datetime):
                            event_data['end_time'] = event_data['end_time'].isoformat()
                        
                        with open('distraction_events.json', 'a') as f:
                            f.write(json.dumps(event_data) + '\n')
                            
                        # Also log to console with category info
                        if event.type == DistractionType.WINDOW_DISTRACTION and event.window_data:
                            category_info = f" (Category: {event.application_category.value if event.application_category else 'unknown'})"
                            print(f"WINDOW SWITCH: '{event.window_data.get('window_title', '')}' {category_info}")
                            
                    elif action == 'resolve':
                        # Log distraction resolution to file
                        event_data = event.to_dict()
                        # Convert datetime objects to ISO format for JSON serialization
                        if 'start_time' in event_data and isinstance(event_data['start_time'], datetime):
                            event_data['start_time'] = event_data['start_time'].isoformat()
                        if 'end_time' in event_data and isinstance(event_data['end_time'], datetime):
                            event_data['end_time'] = event_data['end_time'].isoformat()
                        
                        with open('distraction_events.json', 'a') as f:
                            f.write(json.dumps(event_data) + '\n')
                        
                    self.logging_queue.task_done()
                except queue.Empty:
                    continue
                except Exception as e:
                    print(f"Logging worker error: {e}")
        
        thread = threading.Thread(target=worker, daemon=True)
        thread.start()
        return thread
    
    def run_firebase_worker(self):
        """Run Firebase sync worker in separate thread"""
        def worker():
            print("[FIREBASE] FIREBASE WORKER THREAD STARTED")
            while self.running:
                try:
                    event = self.firebase_queue.get(timeout=1)
                    
                    # Run async Firebase sync with proper error handling
                    try:
                        print("[FIREBASE] Creating new event loop for Firebase sync...")
                        loop = asyncio.new_event_loop()
                        asyncio.set_event_loop(loop)
                        print("[FIREBASE] Running Firebase sync...")
                        loop.run_until_complete(self.sync_to_firebase(event))
                        print("[FIREBASE] Firebase sync completed successfully")
                    except Exception as e:
                        print(f"[ERROR] ERROR: Firebase sync error in worker for event {event.id}: {e}")
                    finally:
                        try:
                            print("[FIREBASE] Closing event loop...")
                            loop.close()
                            print("[FIREBASE] Event loop closed")
                        except Exception as e:
                            print(f"[ERROR] Error closing event loop: {e}")
                    
                    self.firebase_queue.task_done()
                except queue.Empty:
                    continue
                except Exception as e:
                    print(f"[ERROR] ERROR: Firebase worker error: {e}")
                    # Still mark task as done to prevent hanging
                    try:
                        self.firebase_queue.task_done()
                    except:
                        pass
        
        print("[FIREBASE] Starting Firebase worker thread...")
        thread = threading.Thread(target=worker, daemon=True)
        thread.start()
        print("[FIREBASE] Firebase worker thread started successfully")
        return thread
    
    def run_claude_worker(self):
        """Run Claude assessment worker in separate thread"""
        def worker():
            print("[CLAUDE] CLAUDE WORKER THREAD STARTED")
            while self.running:
                try:
                    task = self.claude_queue.get(timeout=1)
                    
                    # Handle different types of Claude tasks
                    if isinstance(task, tuple) and len(task) == 2:
                        task_type, event = task
                        print(f"[CLAUDE] Processing task type: {task_type} for event {event.id}")
                        
                        if task_type == 'categorize_and_assess':
                            # Categorize and assess the application
                            print(f"[CLAUDE] Starting categorize_and_assess for event {event.id}")
                            try:
                                print("[CLAUDE] Creating new event loop for Claude processing...")
                                loop = asyncio.new_event_loop()
                                asyncio.set_event_loop(loop)
                                print("[CLAUDE] Event loop created successfully")
                                
                                if event.window_data:
                                    window_title = event.window_data.get('window_title', '')
                                    process_name = event.window_data.get('process_name', '')
                                    print(f"[CLAUDE] Processing window: '{window_title}' ({process_name})")
                                    
                                    # First categorize
                                    print("[CLAUDE] Starting categorization...")
                                    category, category_confidence, category_reasoning = loop.run_until_complete(
                                        self.categorize_application(window_title, process_name)
                                    )
                                    event.application_category = category
                                    event.category_confidence = category_confidence
                                    event.category_reasoning = category_reasoning
                                    print(f"[CLAUDE] Categorization completed: {category.value}")
                                    print(f"[CLAUDE] Category confidence: {category_confidence:.2f}")
                                    print(f"[CLAUDE] Category reasoning: {category_reasoning}")
                                    
                                    # Then assess
                                    print("[CLAUDE] Starting assessment...")
                                    is_distracting = loop.run_until_complete(self.process_claude_assessment(event))
                                    print(f"[CLAUDE] Assessment completed: {is_distracting}")
                                    
                                    # Log additional structured output data if available
                                    if event.claude_confidence is not None:
                                        print(f"[CLAUDE] Confidence: {event.claude_confidence:.2f}")
                                    if event.claude_reasoning:
                                        print(f"[CLAUDE] Reasoning: {event.claude_reasoning}")
                                    if event.suggested_action:
                                        print(f"[CLAUDE] Suggested action: {event.suggested_action}")
                                
                                # Queue Firebase sync after Claude processing completes
                                self.firebase_queue.put(event)
                                print(f"[CLAUDE] categorize_and_assess completed successfully for event {event.id}")
                            except Exception as e:
                                print(f"[ERROR] ERROR: Claude categorize_and_assess failed for event {event.id}")
                                print(f"[ERROR] Error message: {e}")
                                print(f"[ERROR] Error type: {type(e).__name__}")
                                import traceback
                                print(f"[ERROR] Full traceback: {traceback.format_exc()}")
                            finally:
                                try:
                                    print("[CLAUDE] Closing event loop...")
                                    loop.close()
                                    print("[CLAUDE] Event loop closed")
                                except Exception as e:
                                    print(f"[ERROR] Error closing event loop: {e}")
                            
                        elif task_type == 'categorize_only':
                            # Only categorize (for blacklisted distractions)
                            print(f"[CLAUDE] Starting categorize_only for event {event.id}")
                            try:
                                print("[CLAUDE] Creating new event loop for categorization...")
                                loop = asyncio.new_event_loop()
                                asyncio.set_event_loop(loop)
                                print("[CLAUDE] Event loop created successfully")
                                
                                if event.window_data:
                                    window_title = event.window_data.get('window_title', '')
                                    process_name = event.window_data.get('process_name', '')
                                    print(f"[CLAUDE] Categorizing window: '{window_title}' ({process_name})")
                                    
                                    category, category_confidence, category_reasoning = loop.run_until_complete(
                                        self.categorize_application(window_title, process_name)
                                    )
                                    event.application_category = category
                                    event.category_confidence = category_confidence
                                    event.category_reasoning = category_reasoning
                                    print(f"[CLAUDE] Categorization completed: {category.value}")
                                    print(f"[CLAUDE] Category confidence: {category_confidence:.2f}")
                                    print(f"[CLAUDE] Category reasoning: {category_reasoning}")
                                
                                # Queue Firebase sync after categorization completes
                                self.firebase_queue.put(event)
                                print(f"[CLAUDE] categorize_only completed successfully for event {event.id}")
                            except Exception as e:
                                print(f"[ERROR] ERROR: Claude categorize_only failed for event {event.id}")
                                print(f"[ERROR] Error message: {e}")
                                print(f"[ERROR] Error type: {type(e).__name__}")
                                import traceback
                                print(f"[ERROR] Full traceback: {traceback.format_exc()}")
                            finally:
                                try:
                                    print("[CLAUDE] Closing event loop...")
                                    loop.close()
                                    print("[CLAUDE] Event loop closed")
                                except Exception as e:
                                    print(f"[ERROR] Error closing event loop: {e}")
                            
                    
                    self.claude_queue.task_done()
                except queue.Empty:
                    continue
                except Exception as e:
                    print(f"[ERROR] ERROR: Claude worker error: {e}")
                    print(f"[ERROR] Error type: {type(e).__name__}")
                    import traceback
                    print(f"[ERROR] Full traceback: {traceback.format_exc()}")
                    # Still mark task as done to prevent hanging
                    try:
                        self.claude_queue.task_done()
                    except:
                        pass
        
        print("[CLAUDE] Starting Claude worker thread...")
        thread = threading.Thread(target=worker, daemon=True)
        thread.start()
        print("[CLAUDE] Claude worker thread started successfully")
        return thread
    
    def update_gaze_data(self, gaze_data: Dict[str, Any]):
        """Update gaze tracking data and handle gaze-based distractions"""
        self.current_gaze_x = gaze_data.get('gaze_x', 0.5)
        self.current_gaze_y = gaze_data.get('gaze_y', 0.5)
        self.is_gaze_tracking = gaze_data.get('is_tracking', False)
        
        # Check for gaze-based distractions
        if self.is_gaze_tracking:
            is_distracted, reason = self.is_gaze_distracted(self.current_gaze_x, self.current_gaze_y)
            
            if is_distracted:
                if self.gaze_distraction_start_time is None:
                    self.gaze_distraction_start_time = time.time()
                elif time.time() - self.gaze_distraction_start_time > self.distraction_timeout:
                    # Check if we already have an active gaze distraction
                    active_gaze_distractions = [d for d in self.active_distractions.values() 
                                              if d.type == DistractionType.GAZE_DISTRACTION and d.status == DistractionStatus.ACTIVE]
                    
                    if not active_gaze_distractions:
                        # Create and start new gaze distraction
                        event = self.create_distraction_event(
                            DistractionType.GAZE_DISTRACTION,
                        reason,
                        gaze_data,
                        self.current_window_info or {}
                    )
                        self.start_distraction(event)
                    
                    self.gaze_distraction_start_time = None
            else:
                # Resolve any active gaze distractions
                active_gaze_distractions = [d for d in self.active_distractions.values() 
                                          if d.type == DistractionType.GAZE_DISTRACTION and d.status == DistractionStatus.ACTIVE]
                
                for distraction in active_gaze_distractions:
                    self.resolve_distraction(distraction.id)
                
                self.gaze_distraction_start_time = None
    
    def update_window_data(self, window_data: Dict[str, Any]):
        """Update window monitoring data and handle window-based distractions"""
        # Store previous window info for comparison
        previous_window_info = self.last_window_info
        previous_window_key = self.last_window_key
        
        # Update current window info
        self.current_window_info = window_data
        current_window_key = f"{window_data.get('window_title', '')}|{window_data.get('process_name', '')}"
                
        # If window changed, resolve any active distractions from the previous window
        if previous_window_key and previous_window_key != current_window_key:
            self.resolve_distractions_for_window(previous_window_key)
        
        # Check if current window is distracting
        is_distracted, reason = self.is_window_distracted(window_data)
        
        if is_distracted:
            # Check if we already have an active window distraction for this window
            active_window_distractions = [d for d in self.active_distractions.values() 
                                        if (d.type == DistractionType.WINDOW_DISTRACTION and 
                                            d.status == DistractionStatus.ACTIVE and
                                            d.window_data and
                                            f"{d.window_data.get('window_title', '')}|{d.window_data.get('process_name', '')}" == current_window_key)]
            
            if not active_window_distractions:
                # Create and start new window distraction
                event = self.create_distraction_event(
                    DistractionType.WINDOW_DISTRACTION,
                    reason,
                    {'gaze_x': self.current_gaze_x, 'gaze_y': self.current_gaze_y, 'is_tracking': self.is_gaze_tracking},
                    window_data
                )
                self.start_distraction(event)
        
        # Update window state tracking
        self.last_window_key = current_window_key
        self.last_window_info = window_data.copy()
    
    def resolve_distractions_for_window(self, window_key: str):
        """Resolve all active distractions for a specific window"""
        print(f"[WINDOW] Resolving distractions for window: {window_key}")
        
        # Find all active window distractions for this specific window
        active_window_distractions = [d for d in self.active_distractions.values() 
                                    if (d.type == DistractionType.WINDOW_DISTRACTION and 
                                        d.status == DistractionStatus.ACTIVE and
                                        d.window_data and
                                        f"{d.window_data.get('window_title', '')}|{d.window_data.get('process_name', '')}" == window_key)]
        
        print(f"[WINDOW] Found {len(active_window_distractions)} active distractions to resolve for window: {window_key}")
        
        for distraction in active_window_distractions:
            print(f"[WINDOW] Resolving distraction: {distraction.id} - {distraction.window_data.get('window_title', '')}")
            self.resolve_distraction(distraction.id)
    
    def run_gaze_monitoring(self):
        """Run gaze monitoring in separate thread"""
        print("Starting gaze monitoring...")
        
        # Initialize camera
        cap = cv2.VideoCapture(0)
        if not cap.isOpened():
            print("Error: Could not open camera")
            return
        
        # Set camera properties
        cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
        cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
        cap.set(cv2.CAP_PROP_FPS, 30)
        
        try:
            while self.running:
                ret, frame = cap.read()
                if not ret:
                    print("Error: Could not read frame")
                    break
                
                # Flip frame horizontally for mirror effect
                frame = cv2.flip(frame, 1)
                
                # Process frame with gaze tracker
                results = self.gaze_tracker.process_frame(frame)
                
                # Update gaze data
                self.update_gaze_data(results)
                
                # Small delay
                time.sleep(0.033)  # ~30 FPS
        
        except KeyboardInterrupt:
            print("\nGaze monitoring interrupted")
        
        finally:
            cap.release()
    
    def run_window_monitoring(self):
        """Run window monitoring in separate thread"""
        print("Starting window monitoring...")
        
        try:
            while self.running:
                window_info = self.window_logger.get_active_window_info()
                
                if window_info:
                    # Always update window data - the method will handle change detection
                    self.update_window_data(window_info)
                
                time.sleep(0.5)  # Check every 500ms
        
        except KeyboardInterrupt:
            print("\nWindow monitoring interrupted")
    
    def run_calibration(self):
        """Run calibration process"""
        print("=" * 60)
        print("CALIBRATION PHASE")
        print("=" * 60)
        print("A calibration window will open for gaze tracking.")
        print("Look at the red dots and press SPACEBAR when ready.")
        print("=" * 60)
        
        # Start calibration
        self.gaze_tracker.start_calibration()
        
        # Initialize camera for calibration
        cap = cv2.VideoCapture(0)
        if not cap.isOpened():
            print("Error: Could not open camera")
            return False
        
        # Set camera properties
        cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
        cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
        cap.set(cv2.CAP_PROP_FPS, 30)
        
        # Create calibration window
        cv2.namedWindow('Calibration Window', cv2.WINDOW_NORMAL)
        cv2.resizeWindow('Calibration Window', 800, 600)
        
        try:
            while self.gaze_tracker.calibration_mode:
                ret, frame = cap.read()
                if not ret:
                    print("Error: Could not read frame")
                    break
                
                # Flip frame horizontally for mirror effect
                frame = cv2.flip(frame, 1)
                
                # Process frame with gaze tracker
                results = self.gaze_tracker.process_frame(frame)
                
                # Draw calibration target
                if self.gaze_tracker.calibration_step < len(self.gaze_tracker.calibration_targets):
                    target_x, target_y = self.gaze_tracker.calibration_targets[self.gaze_tracker.calibration_step]
                    self.gaze_tracker.draw_calibration_target(frame, target_x, target_y)
                
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
        
        except KeyboardInterrupt:
            print("\nCalibration interrupted")
        
        finally:
            cap.release()
            cv2.destroyWindow('Calibration Window')
        
        return self.gaze_tracker.is_calibrated

    def stop(self):
        """Stop the distraction tracking system gracefully"""
        print("\n[STOP] Stopping distraction tracking system...")
        self.running = False

        # Push session end data to Firebase
        if self.firestore_client:
            print("[FIREBASE] Pushing session end data...")
            self.push_session_end_data()

        print("[STOP] Distraction tracker stopped successfully")

    def run(self):
        """Run the distraction tracking system"""
        print("=" * 60)
        print("DISTRACTION TRACKING SYSTEM")
        print("=" * 60)
        print("This system tracks:")
        print("1. Gaze-based distractions (eyes leaving screen)")
        print("2. Window-based distractions (unproductive apps/tabs)")
        print("=" * 60)
        
        # Phase 1: Calibration
        print("\nPHASE 1: CALIBRATION")
        calibration_success = self.run_calibration()
        
        if not calibration_success:
            print("Calibration failed or was cancelled.")
            return
        
        print("\n" + "=" * 60)
        print("CALIBRATION COMPLETED!")
        print("=" * 60)
        print("Now starting distraction monitoring...")
        print("Press Ctrl+C to stop.")
        print("=" * 60)
        
        # Phase 2: Monitoring
        print("\nPHASE 2: DISTRACTION MONITORING")
        
        self.running = True
        
        # Push session start data to Firebase
        if self.firestore_client:
            print("[FIREBASE] Pushing session start data...")
            self.push_session_start_data()
        
        # Start async workers
        logging_worker = self.run_async_logging_worker()
        firebase_worker = self.run_firebase_worker()
        claude_worker = self.run_claude_worker()
        
        # Start monitoring threads
        gaze_thread = threading.Thread(target=self.run_gaze_monitoring)
        gaze_thread.daemon = True
        gaze_thread.start()
        
        window_thread = threading.Thread(target=self.run_window_monitoring)
        window_thread.daemon = True
        window_thread.start()
        
        try:
            # Main monitoring loop
            last_stats_update = time.time()
            while self.running:
                time.sleep(1)
                
                # Status updates removed to reduce terminal clutter
                
                # Update session stats every 30 seconds
                if time.time() - last_stats_update >= 30:
                    if self.firestore_client:
                        print("[FIREBASE] Updating session stats...")
                        self.push_session_stats_update()
                    last_stats_update = time.time()
        
        except KeyboardInterrupt:
            print("\nDistraction monitoring stopped by user")
        
        finally:
            self.running = False
            
            # Push session end data to Firebase
            if self.firestore_client:
                print("[FIREBASE] Pushing session end data...")
                self.push_session_end_data()
            
            # Wait for queues to empty with timeout
            print("Waiting for async operations to complete...")
            
            # Wait for logging queue with timeout
            try:
                logging_timeout = threading.Event()
                def timeout_logging():
                    logging_timeout.wait(5)  # 5 second timeout
                    if not logging_timeout.is_set():
                        print("Warning: Logging queue timeout - forcing completion")
                        # Force empty the queue
                        while not self.logging_queue.empty():
                            try:
                                self.logging_queue.get_nowait()
                                self.logging_queue.task_done()
                            except:
                                break
                
                timeout_thread = threading.Thread(target=timeout_logging)
                timeout_thread.daemon = True
                timeout_thread.start()
                
                self.logging_queue.join()
                logging_timeout.set()
                print("✓ Logging operations completed")
            except Exception as e:
                print(f"Warning: Logging queue error: {e}")
            
            # Wait for Firebase queue with timeout
            try:
                firebase_timeout = threading.Event()
                def timeout_firebase():
                    firebase_timeout.wait(10)  # 10 second timeout
                    if not firebase_timeout.is_set():
                        print("Warning: Firebase queue timeout - forcing completion")
                        # Force empty the queue
                        while not self.firebase_queue.empty():
                            try:
                                self.firebase_queue.get_nowait()
                                self.firebase_queue.task_done()
                            except:
                                break
                
                timeout_thread = threading.Thread(target=timeout_firebase)
                timeout_thread.daemon = True
                timeout_thread.start()
                
                self.firebase_queue.join()
                firebase_timeout.set()
                print("✓ Firebase operations completed")
            except Exception as e:
                print(f"Warning: Firebase queue error: {e}")
            
            # Wait for Claude queue with timeout
            try:
                claude_timeout = threading.Event()
                def timeout_claude():
                    claude_timeout.wait(15)  # 15 second timeout
                    if not claude_timeout.is_set():
                        print("Warning: Claude queue timeout - forcing completion")
                        # Force empty the queue
                        while not self.claude_queue.empty():
                            try:
                                self.claude_queue.get_nowait()
                                self.claude_queue.task_done()
                            except:
                                break
                
                timeout_thread = threading.Thread(target=timeout_claude)
                timeout_thread.daemon = True
                timeout_thread.start()
                
                self.claude_queue.join()
                claude_timeout.set()
                print("✓ Claude operations completed")
            except Exception as e:
                print(f"Warning: Claude queue error: {e}")
            
            # Print summary
            print("\n" + "=" * 60)
            print("DISTRACTION TRACKING SUMMARY")
            print("=" * 60)
            print(f"Total distraction events: {len(self.distraction_events)}")
            
            # Count by type
            gaze_distractions = sum(1 for event in self.distraction_events if event.type == DistractionType.GAZE_DISTRACTION)
            window_distractions = sum(1 for event in self.distraction_events if event.type == DistractionType.WINDOW_DISTRACTION)
            
            # Count resolved vs active
            resolved_count = sum(1 for event in self.distraction_events if event.status == DistractionStatus.RESOLVED)
            active_count = len(self.active_distractions)
            
            print(f"Gaze-based distractions: {gaze_distractions}")
            print(f"Window-based distractions: {window_distractions}")
            print(f"Resolved events: {resolved_count}")
            print(f"Active events: {active_count}")
            print(f"Events logged to: distraction_events.json")
            
            if self.firestore_client:
                print(f"Events synced to Firebase: {self.config.get('firebase_collection', 'distraction_events')}")
            print("=" * 60)


def main():
    """Main function"""
    try:
        tracker = DistractionTracker()
        tracker.run()
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()
