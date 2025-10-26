"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { doc, setDoc, Timestamp } from "firebase/firestore";
import { config } from "@/lib/config";

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

    // Call backend API to start distraction tracking
    try {
      const response = await fetch(`${config.backendUrl}/api/session/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: newSessionId,
          user_id: userId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Failed to start backend session:', errorData);
        // Don't throw error - allow frontend session to continue even if backend fails
        alert('Warning: Could not start distraction tracking. Make sure the backend server is running.');
      } else {
        const data = await response.json();
        console.log('Backend session started successfully:', data);
      }
    } catch (error) {
      console.error('Error calling backend API:', error);
      alert('Warning: Could not connect to distraction tracking backend. Make sure the server is running at ' + config.backendUrl);
    }
  };

  const endSession = async () => {
    // Call backend API to stop distraction tracking
    if (sessionId) {
      try {
        const response = await fetch(`${config.backendUrl}/api/session/stop`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error('Failed to stop backend session:', errorData);
        } else {
          const data = await response.json();
          console.log('Backend session stopped successfully:', data);
        }
      } catch (error) {
        console.error('Error calling backend API:', error);
      }

      // Update Firestore session document
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

