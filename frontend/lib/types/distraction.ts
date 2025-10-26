// TypeScript interfaces matching the exact structure from distraction_events.json

export interface GazeData {
  gaze_x: number;
  gaze_y: number;
  screen_x: number;
  screen_y: number;
  is_tracking: boolean;
  calibration_mode: boolean;
  calibration_step: number;
}

export interface WindowRect {
  left: number;
  top: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
}

export interface WindowData {
  timestamp?: string;
  window_title?: string;
  process_name?: string;
  process_path?: string;
  process_id?: number;
  window_class?: string;
  window_handle?: number;
  window_rect?: WindowRect;
}

export interface SwitchedTo {
  window_title: string;
  process_name: string;
  application_category: string;
}

export interface DistractionEvent {
  id: string; // UUID from Python
  type: "gaze_distraction" | "window_distraction";
  status: "active" | "resolved";
  reason: string;
  start_time: string; // ISO timestamp
  end_time: string | null; // ISO timestamp or null if still active
  gaze_data: GazeData;
  window_data: WindowData;
  claude_assessment: string | null;
  application_category: string | null;
  claude_confidence: number | null;
  claude_reasoning: string | null;
  suggested_action: string | null;
  firebase_synced: boolean;
  switched_to?: SwitchedTo; // Only present for window distractions

  // Optional fields for Firebase
  userId?: string; // Added when syncing to Firebase
  sessionId?: string; // Added when syncing to Firebase
}

export interface DistractionStats {
  totalDistractions: number;
  gazeDistractions: number;
  windowDistractions: number;
  totalDistractionTime: number; // seconds
  averageDistractionDuration: number; // seconds
  focusScore: number; // 0-100
  topDistractingApps: Array<{
    process_name: string;
    count: number;
  }>;
  distractionsByHour: Array<{
    hour: number;
    count: number;
  }>;
}
