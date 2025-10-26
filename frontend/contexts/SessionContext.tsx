"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { doc, setDoc, Timestamp } from "firebase/firestore";

interface SessionContextType {
  sessionId: string | null;
  isSessionActive: boolean;
  startSession: () => Promise<void>;
  endSession: () => Promise<void>;
}

const SessionContext = createContext<SessionContextType>({
  sessionId: null,
  isSessionActive: false,
  startSession: async () => {},
  endSession: async () => {},
});

export const useSession = () => useContext(SessionContext);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const userId = "demo-user";

  // Load session from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedSessionId = localStorage.getItem("activeSessionId");
      const savedSessionActive = localStorage.getItem("isSessionActive") === "true";
      
      if (savedSessionId && savedSessionActive) {
        setSessionId(savedSessionId);
        setIsSessionActive(true);
      }
    }
  }, []);

  const startSession = async () => {
    const newSessionId = `session_${Date.now()}`;
    setSessionId(newSessionId);
    setIsSessionActive(true);

    // Save to localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem("activeSessionId", newSessionId);
      localStorage.setItem("isSessionActive", "true");
    }

    // Create session document in Firestore
    const sessionRef = doc(db, "users", userId, "sessions", newSessionId);
    await setDoc(sessionRef, {
      session_id: newSessionId,
      start_time: Timestamp.now(),
      status: "active",
      gaze_threshold_y: 0.9,
      gaze_threshold_x_min: 0.1,
      gaze_threshold_x_max: 0.9,
      distraction_timeout: 2.0,
    });
  };

  const endSession = async () => {
    if (sessionId) {
      const sessionRef = doc(db, "users", userId, "sessions", sessionId);
      await setDoc(
        sessionRef,
        {
          status: "completed",
          end_time: Timestamp.now(),
        },
        { merge: true }
      );
    }

    // Clear from localStorage but keep sessionId for viewing
    if (typeof window !== "undefined") {
      localStorage.setItem("isSessionActive", "false");
      localStorage.setItem("lastCompletedSessionId", sessionId || "");
    }

    setIsSessionActive(false);
    // Don't clear sessionId immediately so components can still display it
  };

  return (
    <SessionContext.Provider
      value={{
        sessionId,
        isSessionActive,
        startSession,
        endSession,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

