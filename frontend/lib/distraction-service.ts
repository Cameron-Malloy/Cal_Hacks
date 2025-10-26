import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  onSnapshot,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import type { DistractionEvent, DistractionStats } from "./types/distraction";

// ========== DISTRACTION EVENT FUNCTIONS ==========

/**
 * Get all distraction events for a user
 */
export const getUserDistractions = async (
  userId: string,
  limitCount: number = 100
): Promise<DistractionEvent[]> => {
  const distractionsRef = collection(db, "distractions");
  const q = query(
    distractionsRef,
    where("userId", "==", userId),
    orderBy("start_time", "desc"),
    limit(limitCount)
  );

  const querySnapshot = await getDocs(q);
  const distractions: DistractionEvent[] = [];
  querySnapshot.forEach((doc) => {
    const data = doc.data();
    // Convert Firestore timestamps back to ISO strings for consistency
    distractions.push({
      ...data,
      start_time: data.start_time?.toDate?.()?.toISOString() || data.start_time,
      end_time: data.end_time?.toDate?.()?.toISOString() || data.end_time,
    } as DistractionEvent);
  });

  return distractions;
};

/**
 * Get distraction events for a specific session
 */
export const getSessionDistractions = async (
  sessionId: string
): Promise<DistractionEvent[]> => {
  const distractionsRef = collection(db, "distractions");
  const q = query(
    distractionsRef,
    where("sessionId", "==", sessionId),
    orderBy("start_time", "asc")
  );

  const querySnapshot = await getDocs(q);
  const distractions: DistractionEvent[] = [];
  querySnapshot.forEach((doc) => {
    const data = doc.data();
    distractions.push({
      ...data,
      start_time: data.start_time?.toDate?.()?.toISOString() || data.start_time,
      end_time: data.end_time?.toDate?.()?.toISOString() || data.end_time,
    } as DistractionEvent);
  });

  return distractions;
};

/**
 * Subscribe to real-time distraction updates for a session
 */
export const subscribeToSessionDistractions = (
  sessionId: string,
  callback: (distractions: DistractionEvent[]) => void
) => {
  const distractionsRef = collection(db, "distractions");
  const q = query(
    distractionsRef,
    where("sessionId", "==", sessionId),
    orderBy("start_time", "asc")
  );

  return onSnapshot(q, (querySnapshot) => {
    const distractions: DistractionEvent[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      distractions.push({
        ...data,
        start_time: data.start_time?.toDate?.()?.toISOString() || data.start_time,
        end_time: data.end_time?.toDate?.()?.toISOString() || data.end_time,
      } as DistractionEvent);
    });
    callback(distractions);
  });
};

// ========== STATISTICS FUNCTIONS ==========

/**
 * Calculate distraction statistics for a user or session
 */
export const calculateDistractionStats = (
  events: DistractionEvent[]
): DistractionStats => {
  const gazeDistractions = events.filter((e) => e.type === "gaze_distraction");
  const windowDistractions = events.filter((e) => e.type === "window_distraction");

  // Calculate total distraction time (only for resolved distractions)
  let totalDistractionTime = 0;
  events.forEach((event) => {
    if (event.start_time && event.end_time) {
      const start = new Date(event.start_time).getTime();
      const end = new Date(event.end_time).getTime();
      totalDistractionTime += (end - start) / 1000; // Convert to seconds
    }
  });

  // Find top distracting apps
  const appCounts: { [key: string]: number } = {};
  windowDistractions.forEach((event) => {
    const app = event.window_data?.process_name || "Unknown";
    appCounts[app] = (appCounts[app] || 0) + 1;
  });

  const topDistractingApps = Object.entries(appCounts)
    .map(([process_name, count]) => ({ process_name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Calculate distractions by hour
  const hourCounts: { [hour: number]: number } = {};
  events.forEach((event) => {
    const hour = new Date(event.start_time).getHours();
    hourCounts[hour] = (hourCounts[hour] || 0) + 1;
  });

  const distractionsByHour = Array.from({ length: 24 }, (_, hour) => ({
    hour,
    count: hourCounts[hour] || 0,
  }));

  return {
    totalDistractions: events.length,
    gazeDistractions: gazeDistractions.length,
    windowDistractions: windowDistractions.length,
    totalDistractionTime,
    averageDistractionDuration:
      events.length > 0 ? totalDistractionTime / events.length : 0,
    focusScore: 0, // Will be calculated by session
    topDistractingApps,
    distractionsByHour,
  };
};

/**
 * Calculate focus score for a session
 * Formula: (Session Time - Distraction Time) / Session Time * 100
 */
export const calculateFocusScore = (
  sessionDuration: number, // in seconds
  distractionEvents: DistractionEvent[]
): number => {
  if (sessionDuration <= 0) return 100;

  // Calculate total distraction time
  let totalDistractionTime = 0;
  distractionEvents.forEach((event) => {
    if (event.start_time && event.end_time) {
      const start = new Date(event.start_time).getTime();
      const end = new Date(event.end_time).getTime();
      totalDistractionTime += (end - start) / 1000; // Convert to seconds
    }
  });

  // Ensure distraction time doesn't exceed session duration
  totalDistractionTime = Math.min(totalDistractionTime, sessionDuration);

  // Calculate focus score
  const focusScore =
    ((sessionDuration - totalDistractionTime) / sessionDuration) * 100;

  // Clamp between 0 and 100
  return Math.max(0, Math.min(100, Math.round(focusScore)));
};

/**
 * Get distractions by date range
 */
export const getDistractionsByDateRange = async (
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<DistractionEvent[]> => {
  const distractionsRef = collection(db, "distractions");
  const q = query(
    distractionsRef,
    where("userId", "==", userId),
    where("start_time", ">=", Timestamp.fromDate(startDate)),
    where("start_time", "<=", Timestamp.fromDate(endDate)),
    orderBy("start_time", "desc")
  );

  const querySnapshot = await getDocs(q);
  const distractions: DistractionEvent[] = [];
  querySnapshot.forEach((doc) => {
    const data = doc.data();
    distractions.push({
      ...data,
      start_time: data.start_time?.toDate?.()?.toISOString() || data.start_time,
      end_time: data.end_time?.toDate?.()?.toISOString() || data.end_time,
    } as DistractionEvent);
  });

  return distractions;
};

/**
 * Get currently active (unresolved) distractions for a session
 */
export const getActiveDistractions = async (
  sessionId: string
): Promise<DistractionEvent[]> => {
  const distractionsRef = collection(db, "distractions");
  const q = query(
    distractionsRef,
    where("sessionId", "==", sessionId),
    where("status", "==", "active")
  );

  const querySnapshot = await getDocs(q);
  const distractions: DistractionEvent[] = [];
  querySnapshot.forEach((doc) => {
    const data = doc.data();
    distractions.push({
      ...data,
      start_time: data.start_time?.toDate?.()?.toISOString() || data.start_time,
      end_time: data.end_time?.toDate?.()?.toISOString() || data.end_time,
    } as DistractionEvent);
  });

  return distractions;
};
