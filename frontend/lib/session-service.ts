import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDoc,
  Timestamp,
  increment,
} from "firebase/firestore";
import { db } from "./firebase";
import type { FocusSession } from "./firestore";

/**
 * Session Service - Manages focus session lifecycle
 */

export interface ActiveSession {
  id: string;
  userId: string;
  startTime: Date;
  distractionCount: number;
}

let currentSession: ActiveSession | null = null;

/**
 * Start a new focus session
 */
export const startFocusSession = async (
  userId: string
): Promise<ActiveSession> => {
  const startTime = new Date();

  // Create session in Firestore
  const sessionData = {
    userId,
    startTime: Timestamp.fromDate(startTime),
    endTime: null as any, // Will be set when session ends
    duration: 0,
    focusScore: 0,
    distractions: 0,
  };

  const sessionRef = await addDoc(collection(db, "focusSessions"), sessionData);

  currentSession = {
    id: sessionRef.id,
    userId,
    startTime,
    distractionCount: 0,
  };

  console.log("Focus session started:", currentSession.id);
  return currentSession;
};

/**
 * End the current focus session
 */
export const endFocusSession = async (
  sessionId: string,
  userId: string,
  focusScore: number,
  distractionCount: number
): Promise<void> => {
  const endTime = new Date();
  const sessionRef = doc(db, "focusSessions", sessionId);

  // Get session start time
  const sessionSnap = await getDoc(sessionRef);
  if (!sessionSnap.exists()) {
    throw new Error("Session not found");
  }

  const startTime = sessionSnap.data().startTime.toDate();
  const duration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000 / 60); // minutes

  // Update session
  await updateDoc(sessionRef, {
    endTime: Timestamp.fromDate(endTime),
    duration,
    focusScore,
    distractions: distractionCount,
  });

  // Update user's total focus time
  const userRef = doc(db, "users", userId);
  await updateDoc(userRef, {
    totalFocusTime: increment(duration),
    lastActiveAt: Timestamp.now(),
  });

  console.log("Focus session ended:", sessionId, "Duration:", duration, "min");
  currentSession = null;
};

/**
 * Get current active session
 */
export const getCurrentSession = (): ActiveSession | null => {
  return currentSession;
};

/**
 * Update distraction count for current session
 */
export const incrementSessionDistractions = async (
  sessionId: string
): Promise<void> => {
  if (currentSession && currentSession.id === sessionId) {
    currentSession.distractionCount++;
  }

  const sessionRef = doc(db, "focusSessions", sessionId);
  await updateDoc(sessionRef, {
    distractions: increment(1),
  });
};

/**
 * Get session by ID
 */
export const getSessionById = async (
  sessionId: string
): Promise<FocusSession | null> => {
  const sessionRef = doc(db, "focusSessions", sessionId);
  const sessionSnap = await getDoc(sessionRef);

  if (sessionSnap.exists()) {
    return { id: sessionSnap.id, ...sessionSnap.data() } as FocusSession;
  }
  return null;
};
