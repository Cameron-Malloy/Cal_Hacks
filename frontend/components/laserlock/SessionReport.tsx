"use client";

import { useState, useEffect } from "react";
import { GlassCard } from "./GlassCard";
import { Button } from "../ui/button";
import { Share2, Save, Trophy, Clock, Eye, Monitor } from "lucide-react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, limit, getDocs, where } from "firebase/firestore";

interface SessionStats {
  focusScore: number;
  totalDuration: number;
  gazeDistractions: number;
  windowDistractions: number;
  totalDistractions: number;
  longestStreak: number;
  productivityData: Array<{ name: string; value: number; color: string }>;
  appTimeData: Array<{ app: string; time: number }>;
  focusTimelineData: Array<{ time: string; focus: number; distraction: number }>;
}

export function SessionReport() {
  const [stats, setStats] = useState<SessionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const userId = "demo-user";

  useEffect(() => {
    const fetchSessionStats = async () => {
      try {
        // Get the most recent session
        const sessionsRef = collection(db, "users", userId, "sessions");
        const sessionsQuery = query(sessionsRef, orderBy("start_time", "desc"), limit(1));
        const sessionsSnap = await getDocs(sessionsQuery);

        if (sessionsSnap.empty) {
          setStats(getEmptyStats());
          setLoading(false);
          return;
        }

        const sessionDoc = sessionsSnap.docs[0];
        const sessionData = sessionDoc.data();
        const sessionId = sessionDoc.id;

        // Get all distractions for this session
        const distractionsRef = collection(db, "users", userId, "sessions", sessionId, "appAccessEvents");
        const distractionsSnap = await getDocs(distractionsRef);

        const distractions: any[] = [];
        distractionsSnap.forEach((doc) => {
          distractions.push({ id: doc.id, ...doc.data() });
        });

        // Calculate stats
        const gazeCount = distractions.filter(d => d.type === "gaze_distraction").length;
        const windowCount = distractions.filter(d => d.type === "window_distraction").length;
        const totalCount = distractions.length;

        // Calculate total distraction time
        let totalDistractionTime = 0;
        distractions.forEach(event => {
          if (event.start_time && event.end_time) {
            const start = event.start_time.toDate?.() || new Date(event.start_time);
            const end = event.end_time.toDate?.() || new Date(event.end_time);
            totalDistractionTime += (end.getTime() - start.getTime()) / 1000;
          }
        });

        // Calculate session duration
        const sessionDuration = sessionData.session_duration_seconds || 0;
        const focusScore = sessionDuration > 0
          ? Math.round(((sessionDuration - totalDistractionTime) / sessionDuration) * 100)
          : 100;

        // Calculate productivity distribution
        const productiveTime = sessionDuration - totalDistractionTime;
        const productivityData = [
          { name: "Focused", value: Math.round((productiveTime / sessionDuration) * 100), color: "#22d3ee" },
          { name: "Distracted", value: Math.round((totalDistractionTime / sessionDuration) * 100), color: "#ef4444" },
        ];

        // Group window distractions by app
        const appCounts: { [key: string]: number } = {};
        distractions
          .filter(d => d.type === "window_distraction" && d.window_data)
          .forEach(event => {
            const appName = event.window_data.process_name || "Unknown";
            appCounts[appName] = (appCounts[appName] || 0) + 1;
          });

        const appTimeData = Object.entries(appCounts)
          .map(([app, count]) => ({
            app: app.replace('.exe', '').replace('.app', ''),
            time: count
          }))
          .sort((a, b) => b.time - a.time)
          .slice(0, 5);

        // Create timeline data (last 10 distractions)
        const sortedDistractions = distractions
          .filter(d => d.start_time)
          .sort((a, b) => {
            const aTime = a.start_time.toDate?.() || new Date(a.start_time);
            const bTime = b.start_time.toDate?.() || new Date(b.start_time);
            return aTime.getTime() - bTime.getTime();
          })
          .slice(-10);

        const focusTimelineData = sortedDistractions.map((event, index) => {
          const eventTime = event.start_time.toDate?.() || new Date(event.start_time);
          return {
            time: eventTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
            focus: Math.max(0, 100 - (index + 1) * 10),
            distraction: 1
          };
        });

        // Calculate longest streak (time between distractions)
        let longestStreak = 0;
        if (sortedDistractions.length > 1) {
          for (let i = 1; i < sortedDistractions.length; i++) {
            const prev = sortedDistractions[i - 1].start_time.toDate?.() || new Date(sortedDistractions[i - 1].start_time);
            const curr = sortedDistractions[i].start_time.toDate?.() || new Date(sortedDistractions[i].start_time);
            const streakMinutes = (curr.getTime() - prev.getTime()) / 1000 / 60;
            longestStreak = Math.max(longestStreak, streakMinutes);
          }
        }

        setStats({
          focusScore,
          totalDuration: Math.round(sessionDuration / 60), // Convert to minutes
          gazeDistractions: gazeCount,
          windowDistractions: windowCount,
          totalDistractions: totalCount,
          longestStreak: Math.round(longestStreak),
          productivityData,
          appTimeData,
          focusTimelineData: focusTimelineData.length > 0 ? focusTimelineData : [{ time: "Start", focus: 100, distraction: 0 }]
        });

      } catch (error) {
        console.error("Error fetching session stats:", error);
        setStats(getEmptyStats());
      } finally {
        setLoading(false);
      }
    };

    fetchSessionStats();
  }, [userId]);

  const getEmptyStats = (): SessionStats => ({
    focusScore: 0,
    totalDuration: 0,
    gazeDistractions: 0,
    windowDistractions: 0,
    totalDistractions: 0,
    longestStreak: 0,
    productivityData: [
      { name: "Focused", value: 100, color: "#22d3ee" },
      { name: "Distracted", value: 0, color: "#ef4444" },
    ],
    appTimeData: [],
    focusTimelineData: [{ time: "Start", focus: 100, distraction: 0 }]
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <GlassCard className="text-center py-12">
          <p className="text-muted-foreground">Loading session report...</p>
        </GlassCard>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="space-y-6">
        <GlassCard className="text-center py-12">
          <p className="text-muted-foreground">No session data available</p>
          <p className="text-sm text-muted-foreground mt-2">Complete a focus session to see your report!</p>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Score Header */}
      <GlassCard className="text-center bg-gradient-to-br from-primary/20 via-accent/20 to-secondary/20" glow>
        <div className="py-8">
          <p className="text-muted-foreground mb-2">Session Focus Score</p>
          <div className="text-7xl bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent mb-4">
            {stats.focusScore}%
          </div>
          <div className="flex items-center justify-center gap-2">
            <div className="px-4 py-2 rounded-full bg-secondary/20 text-secondary">
              {stats.focusScore >= 90 ? "A+ Performance" : 
               stats.focusScore >= 80 ? "A Performance" :
               stats.focusScore >= 70 ? "B Performance" :
               stats.focusScore >= 60 ? "C Performance" : "Keep Practicing!"}
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Highlights */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <GlassCard className="text-center">
          <div className="flex items-center justify-center mb-2">
            <Clock className="w-5 h-5 text-primary" />
          </div>
          <p className="text-muted-foreground text-sm mb-2">Total Minutes</p>
          <p className="text-3xl text-primary">{stats.totalDuration}</p>
        </GlassCard>
        <GlassCard className="text-center">
          <div className="flex items-center justify-center mb-2">
            <Eye className="w-5 h-5 text-secondary" />
          </div>
          <p className="text-muted-foreground text-sm mb-2">Gaze Distractions</p>
          <p className="text-3xl text-secondary">{stats.gazeDistractions}</p>
        </GlassCard>
        <GlassCard className="text-center">
          <div className="flex items-center justify-center mb-2">
            <Monitor className="w-5 h-5 text-accent" />
          </div>
          <p className="text-muted-foreground text-sm mb-2">Window Distractions</p>
          <p className="text-3xl text-accent">{stats.windowDistractions}</p>
        </GlassCard>
        <GlassCard className="text-center">
          <div className="flex items-center justify-center mb-2">
            <Trophy className="w-5 h-5 text-primary" />
          </div>
          <p className="text-muted-foreground text-sm mb-2">Longest Streak</p>
          <p className="text-3xl text-primary">{stats.longestStreak} min</p>
        </GlassCard>
      </div>

      {/* Charts Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Pie Chart - Time Distribution */}
        <GlassCard>
          <h3 className="mb-4 text-primary">Time Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={stats.productivityData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name} ${value}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {stats.productivityData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(15, 23, 42, 0.9)",
                  border: "1px solid rgba(167,139,250,0.3)",
                  borderRadius: "8px",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </GlassCard>

        {/* Bar Chart - Distracting Apps */}
        <GlassCard>
          <h3 className="mb-4 text-secondary">Most Distracting Applications</h3>
          {stats.appTimeData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={stats.appTimeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(167,139,250,0.1)" />
                <XAxis dataKey="app" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(15, 23, 42, 0.9)",
                    border: "1px solid rgba(167,139,250,0.3)",
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="time" fill="#a78bfa" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-muted-foreground">
              No window distractions recorded
            </div>
          )}
        </GlassCard>

        {/* Line Chart - Focus Timeline */}
        <GlassCard className="md:col-span-2">
          <h3 className="mb-4 text-accent">Distraction Timeline</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={stats.focusTimelineData}>
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
              <Line type="monotone" dataKey="focus" stroke="#8b5cf6" strokeWidth={3} name="Focus Level" />
            </LineChart>
          </ResponsiveContainer>
        </GlassCard>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-4 justify-center">
        <Button className="bg-primary hover:bg-primary/80">
          <Save className="w-4 h-4 mr-2" />
          Save Report
        </Button>
        <Button variant="outline" className="border-secondary text-secondary hover:bg-secondary/10">
          <Share2 className="w-4 h-4 mr-2" />
          Share
        </Button>
        <Button variant="outline" className="border-accent text-accent hover:bg-accent/10">
          <Trophy className="w-4 h-4 mr-2" />
          Submit to Leaderboard
        </Button>
      </div>
    </div>
  );
}
