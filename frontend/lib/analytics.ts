import type { DistractionEvent, DistractionStats } from "./types/distraction";
import type { FocusSession } from "./firestore";

/**
 * Analytics Utilities - Calculate real-time analytics from backend data
 */

/**
 * Calculate focus score for a session
 * Formula: (Session Time - Distraction Time) / Session Time * 100
 */
export const calculateSessionFocusScore = (
  sessionDurationSeconds: number,
  distractionEvents: DistractionEvent[]
): number => {
  if (sessionDurationSeconds <= 0) return 100;

  // Calculate total distraction time from resolved events
  let totalDistractionTime = 0;
  distractionEvents.forEach((event) => {
    if (event.start_time && event.end_time && event.status === "resolved") {
      const start = new Date(event.start_time).getTime();
      const end = new Date(event.end_time).getTime();
      totalDistractionTime += (end - start) / 1000; // Convert to seconds
    }
  });

  // Ensure distraction time doesn't exceed session duration
  totalDistractionTime = Math.min(totalDistractionTime, sessionDurationSeconds);

  // Calculate focus score
  const focusScore =
    ((sessionDurationSeconds - totalDistractionTime) / sessionDurationSeconds) *
    100;

  // Clamp between 0 and 100
  return Math.max(0, Math.min(100, Math.round(focusScore)));
};

/**
 * Calculate comprehensive distraction statistics
 */
export const calculateDistractionStats = (
  events: DistractionEvent[]
): DistractionStats => {
  const gazeDistractions = events.filter(
    (e) => e.type === "gaze_distraction" && e.status === "resolved"
  );
  const windowDistractions = events.filter(
    (e) => e.type === "window_distraction" && e.status === "resolved"
  );

  // Calculate total distraction time (only for resolved distractions)
  let totalDistractionTime = 0;
  const resolvedEvents = events.filter((e) => e.status === "resolved");
  resolvedEvents.forEach((event) => {
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
  resolvedEvents.forEach((event) => {
    const hour = new Date(event.start_time).getHours();
    hourCounts[hour] = (hourCounts[hour] || 0) + 1;
  });

  const distractionsByHour = Array.from({ length: 24 }, (_, hour) => ({
    hour,
    count: hourCounts[hour] || 0,
  }));

  return {
    totalDistractions: resolvedEvents.length,
    gazeDistractions: gazeDistractions.length,
    windowDistractions: windowDistractions.length,
    totalDistractionTime,
    averageDistractionDuration:
      resolvedEvents.length > 0 ? totalDistractionTime / resolvedEvents.length : 0,
    focusScore: 0, // Will be calculated separately per session
    topDistractingApps,
    distractionsByHour,
  };
};

/**
 * Calculate weekly statistics from sessions
 */
export const calculateWeeklyStats = (sessions: FocusSession[]) => {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const weekSessions = sessions.filter((session) => {
    const sessionDate = session.startTime.toDate
      ? session.startTime.toDate()
      : new Date(session.startTime);
    return sessionDate >= weekAgo;
  });

  const totalFocusTime = weekSessions.reduce(
    (sum, session) => sum + (session.duration || 0),
    0
  );
  const totalDistractions = weekSessions.reduce(
    (sum, session) => sum + (session.distractions || 0),
    0
  );
  const avgFocusScore =
    weekSessions.length > 0
      ? weekSessions.reduce((sum, session) => sum + (session.focusScore || 0), 0) /
        weekSessions.length
      : 0;

  return {
    totalFocusTime, // in minutes
    totalSessions: weekSessions.length,
    totalDistractions,
    avgFocusScore: Math.round(avgFocusScore),
  };
};

/**
 * Group sessions by day of week
 */
export const groupSessionsByDay = (sessions: FocusSession[]) => {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dayData: {
    [key: string]: { focus: number; distractions: number; efficiency: number };
  } = {};

  days.forEach((day) => {
    dayData[day] = { focus: 0, distractions: 0, efficiency: 0 };
  });

  sessions.forEach((session) => {
    const sessionDate = session.startTime.toDate
      ? session.startTime.toDate()
      : new Date(session.startTime);
    const dayName = days[sessionDate.getDay()];

    dayData[dayName].focus += (session.duration || 0) / 60; // Convert to hours
    dayData[dayName].distractions += session.distractions || 0;
  });

  // Calculate efficiency (focus score average per day)
  const result = days.map((day) => {
    const daySessions = sessions.filter((s) => {
      const sessionDate = s.startTime.toDate
        ? s.startTime.toDate()
        : new Date(s.startTime);
      return days[sessionDate.getDay()] === day;
    });

    const efficiency =
      daySessions.length > 0
        ? daySessions.reduce((sum, s) => sum + (s.focusScore || 0), 0) /
          daySessions.length
        : 0;

    return {
      day,
      focus: Math.round(dayData[day].focus * 10) / 10, // Round to 1 decimal
      distractions: dayData[day].distractions,
      efficiency: Math.round(efficiency),
    };
  });

  return result;
};

/**
 * Calculate time-of-day performance
 */
export const calculateTimeOfDayPerformance = (sessions: FocusSession[]) => {
  const timeRanges = [
    { label: "6-9 AM", start: 6, end: 9 },
    { label: "9-12 PM", start: 9, end: 12 },
    { label: "12-3 PM", start: 12, end: 15 },
    { label: "3-6 PM", start: 15, end: 18 },
    { label: "6-9 PM", start: 18, end: 21 },
    { label: "9-12 AM", start: 21, end: 24 },
  ];

  return timeRanges.map((range) => {
    const rangeSessions = sessions.filter((session) => {
      const sessionDate = session.startTime.toDate
        ? session.startTime.toDate()
        : new Date(session.startTime);
      const hour = sessionDate.getHours();
      return hour >= range.start && hour < range.end;
    });

    const avgFocus =
      rangeSessions.length > 0
        ? rangeSessions.reduce((sum, s) => sum + (s.focusScore || 0), 0) /
          rangeSessions.length
        : 0;

    return {
      time: range.label,
      focus: Math.round(avgFocus),
    };
  });
};

/**
 * Calculate app usage breakdown from distraction events
 */
export const calculateAppUsage = (
  distractions: DistractionEvent[],
  totalMinutes: number
) => {
  const windowDistractions = distractions.filter(
    (e) => e.type === "window_distraction" && e.status === "resolved"
  );

  // Calculate time per app
  const appTimes: { [key: string]: number } = {};
  windowDistractions.forEach((event) => {
    const app = event.window_data?.process_name || "Unknown";
    if (event.start_time && event.end_time) {
      const duration =
        (new Date(event.end_time).getTime() -
          new Date(event.start_time).getTime()) /
        1000 /
        60; // minutes
      appTimes[app] = (appTimes[app] || 0) + duration;
    }
  });

  const totalAppTime = Object.values(appTimes).reduce((sum, time) => sum + time, 0);

  const appUsage = Object.entries(appTimes)
    .map(([app, minutes]) => ({
      app: app.replace(".exe", ""),
      hours: Math.round(minutes / 60),
      percentage: totalAppTime > 0 ? Math.round((minutes / totalAppTime) * 100) : 0,
    }))
    .sort((a, b) => b.hours - a.hours)
    .slice(0, 6);

  return appUsage;
};

/**
 * Calculate streak from sessions
 */
export const calculateStreak = (sessions: FocusSession[]): number => {
  if (sessions.length === 0) return 0;

  // Sort sessions by date (newest first)
  const sortedSessions = [...sessions].sort((a, b) => {
    const dateA = a.startTime.toDate ? a.startTime.toDate() : new Date(a.startTime);
    const dateB = b.startTime.toDate ? b.startTime.toDate() : new Date(b.startTime);
    return dateB.getTime() - dateA.getTime();
  });

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < 30; i++) {
    // Check last 30 days
    const checkDate = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
    const hasSession = sortedSessions.some((session) => {
      const sessionDate = session.startTime.toDate
        ? session.startTime.toDate()
        : new Date(session.startTime);
      sessionDate.setHours(0, 0, 0, 0);
      return sessionDate.getTime() === checkDate.getTime();
    });

    if (hasSession) {
      streak++;
    } else if (i > 0) {
      // Break streak if we miss a day (except today)
      break;
    }
  }

  return streak;
};

/**
 * Format seconds to MM:SS
 */
export const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
};

/**
 * Format minutes to hours and minutes
 */
export const formatDuration = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins}m`;
};
