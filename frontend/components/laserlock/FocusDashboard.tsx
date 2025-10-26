"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Clock, Eye, Monitor, Zap, TrendingUp, Brain, Flame, Play, Square, Copy, CheckCircle2 } from "lucide-react";
import { GlassCard } from "./GlassCard";
import { StatCard } from "./StatCard";
import { Button } from "../ui/button";
import { motion } from "motion/react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";
import { db } from "@/lib/firebase";
import { collection, doc, onSnapshot } from "firebase/firestore";
import { useSession } from "@/contexts/SessionContext";

interface SessionData {
  session_id: string;
  start_time: any;
  status: string;
  gaze_distractions?: number;
  window_distractions?: number;
  total_events?: number;
  session_duration_seconds?: number;
  total_distraction_time_seconds?: number;
  current_gaze_x?: number;
  current_gaze_y?: number;
  current_window_title?: string;
  current_process_name?: string;
}

interface DistractionEvent {
  id: string;
  type: string;
  status: string;
  reason: string;
  start_time: any;
  end_time?: any;
  gaze_data?: any;
  window_data?: any;
}

export function FocusDashboard() {
  const router = useRouter();
  const { sessionId, isSessionActive, startSession, endSession } = useSession();
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [distractions, setDistractions] = useState<DistractionEvent[]>([]);
  const [copiedCommand, setCopiedCommand] = useState(false);
  const [focusScore, setFocusScore] = useState(100);
  const [sessionDuration, setSessionDuration] = useState(0);

  const userId = "demo-user";

  // Calculate focus score from session data
  useEffect(() => {
    if (sessionData && sessionData.session_duration_seconds && sessionData.session_duration_seconds > 0) {
      const totalTime = sessionData.session_duration_seconds;
      const distractionTime = sessionData.total_distraction_time_seconds || 0;
      const score = Math.max(0, Math.min(100, Math.round(((totalTime - distractionTime) / totalTime) * 100)));
      setFocusScore(score);
    }
  }, [sessionData]);

  // Update session duration timer
  useEffect(() => {
    if (isSessionActive && sessionData?.start_time) {
      const interval = setInterval(() => {
        const startTime = sessionData.start_time.toDate ? sessionData.start_time.toDate() : new Date(sessionData.start_time);
        const duration = Math.floor((Date.now() - startTime.getTime()) / 1000);
        setSessionDuration(duration);
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [isSessionActive, sessionData]);

  // Subscribe to session data
  useEffect(() => {
    if (!sessionId) return;

    const sessionRef = doc(db, "users", userId, "sessions", sessionId);
    const unsubscribe = onSnapshot(sessionRef, (doc) => {
      if (doc.exists()) {
        setSessionData(doc.data() as SessionData);
      }
    });

    return () => unsubscribe();
  }, [sessionId, userId]);

  // Subscribe to distraction events
  useEffect(() => {
    if (!sessionId) return;

    const distractionsRef = collection(db, "users", userId, "sessions", sessionId, "appAccessEvents");
    const unsubscribe = onSnapshot(distractionsRef, (snapshot) => {
      const events: DistractionEvent[] = [];
      snapshot.forEach((doc) => {
        events.push({ id: doc.id, ...doc.data() } as DistractionEvent);
      });
      // Sort by start time
      events.sort((a, b) => {
        const aTime = a.start_time?.toDate?.() || new Date(a.start_time);
        const bTime = b.start_time?.toDate?.() || new Date(b.start_time);
        return aTime.getTime() - bTime.getTime();
      });
      setDistractions(events);
    });

    return () => unsubscribe();
  }, [sessionId, userId]);

  const handleStartSession = async () => {
    await startSession();
  };

  const handleEndSession = async () => {
    await endSession();
    // Redirect to session summary (report page)
    router.push("/report");
  };

  const copyBackendCommand = () => {
    const command = `cd final_python_script && python distraction_tracker.py`;
    navigator.clipboard.writeText(command);
    setCopiedCommand(true);
    setTimeout(() => setCopiedCommand(false), 2000);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  // Prepare chart data from distractions
  const chartData = distractions.slice(-10).map((event, index) => {
    const startTime = event.start_time?.toDate?.() || new Date(event.start_time);
    const minutes = Math.floor((startTime.getTime() - (sessionData?.start_time?.toDate?.()?.getTime() || startTime.getTime())) / 60000);
    return {
      time: `${minutes}m`,
      distractions: index + 1,
    };
  });

  // Aggregate distraction counts by type
  const gazeCount = distractions.filter(d => d.type === "gaze_distraction").length;
  const windowCount = distractions.filter(d => d.type === "window_distraction").length;

  return (
    <div className="space-y-6">
      {/* Hero Section - Start/Stop Button */}
      <div className="text-center py-8">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {!isSessionActive ? (
            <Button
              size="lg"
              onClick={handleStartSession}
              className="w-48 h-48 rounded-full bg-gradient-to-br from-primary via-accent to-secondary text-primary-foreground shadow-[0_0_60px_rgba(167,139,250,0.6)] hover:shadow-[0_0_80px_rgba(167,139,250,0.8)] relative overflow-hidden group"
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-br from-secondary/20 to-transparent rounded-full"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.3, 0.6, 0.3],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
              <div className="relative z-10 flex flex-col items-center gap-2">
                <Play className="w-12 h-12" />
                <span className="text-xl font-bold">Start Focus</span>
              </div>
            </Button>
          ) : (
            <Button
              size="lg"
              onClick={handleEndSession}
              className="w-48 h-48 rounded-full bg-gradient-to-br from-red-500 to-orange-500 text-white shadow-[0_0_60px_rgba(239,68,68,0.6)] hover:shadow-[0_0_80px_rgba(239,68,68,0.8)]"
            >
              <div className="flex flex-col items-center gap-2">
                <Square className="w-12 h-12" />
                <span className="text-xl font-bold">End Session</span>
              </div>
            </Button>
          )}
        </motion.div>

        {/* Backend Instructions */}
        {isSessionActive && sessionId && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8"
          >
            <GlassCard className="max-w-2xl mx-auto">
              <h3 className="text-lg font-semibold text-primary mb-4">🚀 Start Backend Tracking</h3>
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Session created! Now start the Python backend to begin tracking:
                </p>
                <div className="flex items-center gap-2 bg-muted/20 p-3 rounded-lg">
                  <code className="flex-1 text-sm text-secondary">
                    cd final_python_script && python distraction_tracker.py
                  </code>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={copyBackendCommand}
                    className="shrink-0"
                  >
                    {copiedCommand ? (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Session ID: <span className="text-accent font-mono">{sessionId}</span>
                </p>
              </div>
            </GlassCard>
          </motion.div>
        )}
      </div>

      {/* Live Stats Grid */}
      {isSessionActive && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard 
              icon={Clock} 
              label="Session Time" 
              value={formatDuration(sessionDuration)} 
              color="text-primary" 
            />
            <StatCard 
              icon={Eye} 
              label="Gaze Distractions" 
              value={gazeCount.toString()} 
              color="text-secondary" 
            />
            <StatCard 
              icon={Monitor} 
              label="Window Distractions" 
              value={windowCount.toString()} 
              color="text-accent" 
            />
            <StatCard 
              icon={Zap} 
              label="Focus Score" 
              value={`${focusScore}%`} 
              color="text-primary" 
            />
          </div>

          {/* Main Content Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Distraction Timeline Chart */}
            <GlassCard glow>
              <h3 className="mb-4 text-primary">Real-Time Distraction Timeline</h3>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={chartData.length > 0 ? chartData : [{ time: "0m", distractions: 0 }]}>
                  <defs>
                    <linearGradient id="distractionGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#a78bfa" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(167,139,250,0.1)" />
                  <XAxis dataKey="time" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(15, 23, 42, 0.9)",
                      border: "1px solid rgba(167,139,250,0.3)",
                      borderRadius: "8px",
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="distractions" 
                    stroke="#a78bfa" 
                    fillOpacity={1} 
                    fill="url(#distractionGradient)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </GlassCard>

            {/* Current Status */}
            <GlassCard glow>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-secondary">Current Status</h3>
                <Brain className="w-5 h-5 text-secondary" />
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Current Window</p>
                  <p className="text-sm font-mono truncate">
                    {sessionData?.current_window_title || "Waiting for data..."}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Process</p>
                  <p className="text-sm font-mono">
                    {sessionData?.current_process_name || "None"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Gaze Position</p>
                  <p className="text-sm font-mono">
                    x: {sessionData?.current_gaze_x?.toFixed(3) || "0.000"}, 
                    y: {sessionData?.current_gaze_y?.toFixed(3) || "0.000"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Total Events</p>
                  <p className="text-2xl text-secondary font-bold">{distractions.length}</p>
                </div>
              </div>
            </GlassCard>
          </div>

          {/* Recent Distractions */}
          <GlassCard>
            <h3 className="mb-4 text-accent">Recent Distractions</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {distractions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No distractions yet. Stay focused! 🎯
                </p>
              ) : (
                distractions.slice(-10).reverse().map((distraction) => (
                  <div 
                    key={distraction.id} 
                    className="flex items-start gap-3 p-3 rounded-lg bg-muted/10 hover:bg-muted/20 transition-colors"
                  >
                    <div className={`w-2 h-2 rounded-full mt-1.5 ${
                      distraction.type === "gaze_distraction" ? "bg-secondary" : "bg-accent"
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {distraction.type === "gaze_distraction" ? "👀 Gaze" : "💻 Window"}: {distraction.reason}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(distraction.start_time?.toDate?.() || distraction.start_time).toLocaleTimeString()}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded ${
                      distraction.status === "active" ? "bg-orange-500/20 text-orange-400" : "bg-green-500/20 text-green-400"
                    }`}>
                      {distraction.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </GlassCard>
        </>
      )}

      {/* Placeholder when no session */}
      {!isSessionActive && (
        <GlassCard className="text-center py-12">
          <div className="space-y-4">
            <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto">
              <Zap className="w-10 h-10 text-primary" />
            </div>
            <div>
              <h3 className="text-xl text-primary mb-2">Ready to Focus?</h3>
              <p className="text-muted-foreground">
                Click the button above to start a new focus session and track your distractions in real-time.
              </p>
            </div>
          </div>
        </GlassCard>
      )}
    </div>
  );
}
