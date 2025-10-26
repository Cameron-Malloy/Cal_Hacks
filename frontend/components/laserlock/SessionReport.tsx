"use client";

import { useState, useEffect } from "react";
import { GlassCard } from "./GlassCard";
import { Button } from "../ui/button";
import { Share2, Save, Trophy, Clock, Eye, Monitor } from "lucide-react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, limit, getDocs, where } from "firebase/firestore";

interface TimelineEvent {
  eventId: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  type: string;
  reason: string;
  processName?: string;
  applicationCategory?: string;
  claudeAssessment?: string;
  claudeReasoning?: string;
  suggestedAction?: string;
  windowTitle?: string;
  status: string;
  offsetFromStart: number;
}

interface SessionStats {
  focusScore: number;
  totalDuration: number;
  gazeDistractions: number;
  windowDistractions: number;
  totalDistractions: number;
  longestStreak: number;
  averageTimeBetween: number;
  productivityData: Array<{ name: string; value: number; color: string }>;
  appTimeData: Array<{ app: string; time: number }>;
  focusTimelineData: Array<{ time: string; focus: number; distraction: number }>;
  timelineEvents: TimelineEvent[];
  sessionStartTime: Date | null;
  categoryData: Array<{ name: string; value: number; color: string }>;
  productivityTimelineData: Array<{ time: number; value: string; start: number; end: number }>;
  hourlyDistribution: Array<{ hour: number; count: number }>;
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

        // Group window distractions by window title
        const appCounts: { [key: string]: number } = {};
        distractions
          .filter(d => d.type === "window_distraction" && d.window_data)
          .forEach(event => {
            const appName = event.window_data.window_title || event.window_data.process_name || "Unknown";
            appCounts[appName] = (appCounts[appName] || 0) + 1;
          });

        const appTimeData = Object.entries(appCounts)
          .map(([app, count]) => ({
            app: app.replace('.exe', '').replace('.app', ''),
            time: count
          }))
          .sort((a, b) => b.time - a.time)
          .slice(0, 5);

        // Calculate distraction categories
        const categoryCounts: { [key: string]: number } = {};
        distractions.forEach(event => {
          let category = "";
          
          if (event.type === "gaze_distraction") {
            category = "Gaze Distraction";
          } else if (event.type === "window_distraction") {
            // Use application_category if available, otherwise use a default
            category = event.application_category || "Uncategorized Window";
          } else {
            category = "Unknown";
          }
          
          categoryCounts[category] = (categoryCounts[category] || 0) + 1;
        });

        const colors = ["#22d3ee", "#a78bfa", "#06b6d4", "#34d399", "#f472b6", "#fbbf24", "#fb923c", "#64748b"];
        const categoryData = Object.entries(categoryCounts)
          .map(([name, value], index) => ({
            name,
            value,
            color: colors[index % colors.length]
          }))
          .sort((a, b) => b.value - a.value);

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

        // Create timeline events for the Gantt-style chart
        const sessionStartTime = sessionData.start_time?.toDate?.() || new Date(sessionData.start_time);
        const timelineEvents: TimelineEvent[] = sortedDistractions
          .filter(d => d.start_time && d.end_time)
          .map(event => {
            const startTime = event.start_time.toDate?.() || new Date(event.start_time);
            const endTime = event.end_time.toDate?.() || new Date(event.end_time);
            const duration = (endTime.getTime() - startTime.getTime()) / 1000; // seconds
            
            // Calculate offset from session start in minutes
            const offsetFromStart = (startTime.getTime() - sessionStartTime.getTime()) / 1000 / 60;

            return {
              eventId: event.id || Math.random().toString(),
              startTime,
              endTime,
              duration: duration / 60, // convert to minutes
              type: event.type || 'unknown',
              reason: event.reason || '',
              processName: event.window_data?.process_name?.replace('.exe', '') || undefined,
              applicationCategory: event.application_category || undefined,
              claudeAssessment: event.claude_assessment || undefined,
              claudeReasoning: event.claude_reasoning || undefined,
              suggestedAction: event.suggested_action || undefined,
              windowTitle: event.window_data?.window_title || undefined,
              status: event.status || 'unknown',
              offsetFromStart,
            };
          });

        // Calculate longest streak and average time between distractions
        let longestStreak = 0;
        let totalTimeBetween = 0;
        let averageTimeBetween = 0;
        
        if (sortedDistractions.length > 1) {
          for (let i = 1; i < sortedDistractions.length; i++) {
            const prev = sortedDistractions[i - 1].start_time.toDate?.() || new Date(sortedDistractions[i - 1].start_time);
            const curr = sortedDistractions[i].start_time.toDate?.() || new Date(sortedDistractions[i].start_time);
            const streakMinutes = (curr.getTime() - prev.getTime()) / 1000 / 60;
            longestStreak = Math.max(longestStreak, streakMinutes);
            totalTimeBetween += streakMinutes;
          }
          averageTimeBetween = totalTimeBetween / (sortedDistractions.length - 1);
        } else if (sortedDistractions.length === 1 && sessionData.start_time) {
          // Only one distraction, time between is start of session to first distraction
          const sessionStart = sessionData.start_time.toDate?.() || new Date(sessionData.start_time);
          const firstDistraction = sortedDistractions[0].start_time.toDate?.() || new Date(sortedDistractions[0].start_time);
          averageTimeBetween = (firstDistraction.getTime() - sessionStart.getTime()) / 1000 / 60;
        } else if (sortedDistractions.length === 0) {
          // No distractions at all - average time between is the full session duration
          averageTimeBetween = sessionDuration / 60;
        }

        // Create productivity timeline (productive = white, distracted = purple)
        const productivityTimelineData = [];
        const sessionDurationMinutes = sessionDuration / 60;
        
        if (timelineEvents.length > 0) {
          let currentTime = 0;
          for (const event of timelineEvents) {
            // Add productive period before this event
            if (event.offsetFromStart > currentTime) {
              productivityTimelineData.push({
                time: currentTime,
                value: 'productive',
                start: currentTime,
                end: event.offsetFromStart
              });
            }
            
            // Add distracted period
            productivityTimelineData.push({
              time: event.offsetFromStart,
              value: 'distracted',
              start: event.offsetFromStart,
              end: event.offsetFromStart + event.duration
            });
            
            currentTime = event.offsetFromStart + event.duration;
          }
          
          // Add remaining productive time
          if (currentTime < sessionDurationMinutes) {
            productivityTimelineData.push({
              time: currentTime,
              value: 'productive',
              start: currentTime,
              end: sessionDurationMinutes
            });
          }
        } else {
          // All productive if no distractions
          productivityTimelineData.push({
            time: 0,
            value: 'productive',
            start: 0,
            end: sessionDurationMinutes
          });
        }

        // Calculate hourly distribution
        const hourCounts: { [key: number]: number } = {};
        distractions.forEach(event => {
          const startTime = event.start_time.toDate?.() || new Date(event.start_time);
          const hour = startTime.getHours();
          hourCounts[hour] = (hourCounts[hour] || 0) + 1;
        });
        
        const hourlyDistribution = Array.from({ length: 24 }, (_, hour) => ({
          hour,
          count: hourCounts[hour] || 0
        }));

        setStats({
          focusScore,
          totalDuration: Math.round(sessionDuration / 60), // Convert to minutes
          gazeDistractions: gazeCount,
          windowDistractions: windowCount,
          totalDistractions: totalCount,
          longestStreak: Math.round(longestStreak),
          averageTimeBetween: isNaN(averageTimeBetween) ? 0 : Math.round(averageTimeBetween * 10) / 10, // Round to 1 decimal
          productivityData,
          appTimeData,
          focusTimelineData: focusTimelineData.length > 0 ? focusTimelineData : [{ time: "Start", focus: 100, distraction: 0 }],
          timelineEvents,
          sessionStartTime,
          categoryData,
          productivityTimelineData,
          hourlyDistribution
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
    averageTimeBetween: 0,
    productivityData: [
      { name: "Focused", value: 100, color: "#22d3ee" },
      { name: "Distracted", value: 0, color: "#ef4444" },
    ],
    appTimeData: [],
    focusTimelineData: [{ time: "Start", focus: 100, distraction: 0 }],
    timelineEvents: [],
    sessionStartTime: null,
    categoryData: [],
    productivityTimelineData: [],
    hourlyDistribution: Array.from({ length: 24 }, (_, hour) => ({ hour, count: 0 }))
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
                label={({ name, value }) => `${name}\n${value}%`}
                outerRadius={75}
                innerRadius={40}
                fill="#8884d8"
                dataKey="value"
              >
                {stats.productivityData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-slate-900/95 border border-purple-500/30 rounded-lg p-3 shadow-xl backdrop-blur-sm">
                        <p className="font-semibold text-white mb-1">{payload[0].name}</p>
                        <p className="text-cyan-400 text-sm">{payload[0].value}%</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend 
                verticalAlign="bottom" 
                height={36}
                iconType="circle"
                wrapperStyle={{ fontSize: '12px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </GlassCard>

        {/* Bar Chart - Distracting Apps */}
        <GlassCard>
          <h3 className="mb-4 text-secondary">Most Distracting Applications</h3>
          {stats.appTimeData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={stats.appTimeData} margin={{ top: 10, right: 10, left: 10, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(167,139,250,0.1)" />
                <XAxis 
                  dataKey="app" 
                  stroke="#94a3b8"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  interval={0}
                  tick={{ fontSize: 10 }}
                />
                <YAxis 
                  stroke="#94a3b8"
                  tick={{ fontSize: 12 }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-slate-900/95 border border-purple-500/30 rounded-lg p-3 shadow-xl backdrop-blur-sm">
                          <p className="font-semibold text-white mb-1">{payload[0].payload.app}</p>
                          <p className="text-cyan-400 text-sm">Count: <span className="text-white font-medium">{payload[0].value}</span></p>
                        </div>
                      );
                    }
                    return null;
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

        {/* Pie Chart - Distraction Categories */}
        <GlassCard>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-accent">Distraction Categories</h3>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Avg Time Between</p>
              <p className="text-3xl font-bold text-primary">{(stats.averageTimeBetween ?? 0).toFixed(1)}<span className="text-lg font-normal text-muted-foreground"> min</span></p>
            </div>
          </div>
          {stats.categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={stats.categoryData}
                  cx="50%"
                  cy="45%"
                  labelLine={false}
                  label={({ name, value, percent }: any) => percent > 0.05 ? `${name}: ${value}` : ''}
                  outerRadius={70}
                  innerRadius={30}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                >
                  {stats.categoryData.map((entry, index) => (
                    <Cell key={`category-cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const total = stats.categoryData.reduce((sum, item) => sum + item.value, 0);
                      const percent = ((payload[0].value / total) * 100).toFixed(1);
                      return (
                        <div className="bg-slate-900/95 border border-purple-500/30 rounded-lg p-3 shadow-xl backdrop-blur-sm">
                          <p className="font-semibold text-white mb-1">{payload[0].name}</p>
                          <p className="text-accent text-sm">Count: <span className="text-white font-medium">{payload[0].value}</span></p>
                          <p className="text-accent text-sm">Share: <span className="text-white font-medium">{percent}%</span></p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={36}
                  iconType="circle"
                  wrapperStyle={{ fontSize: '11px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-muted-foreground">
              No category data available
            </div>
          )}
        </GlassCard>
      </div>

      {/* Productivity Timeline - Shows productive vs distracted periods */}
      {stats.productivityTimelineData.length > 0 && (
        <GlassCard>
          <h3 className="mb-4 text-accent">Productivity Timeline</h3>
          <ProductivityTimeline data={stats.productivityTimelineData} sessionDuration={stats.totalDuration} />
        </GlassCard>
      )}

      {/* Hourly Distribution Chart */}
      <GlassCard>
        <h3 className="mb-4 text-secondary">Distractions by Hour</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={stats.hourlyDistribution} margin={{ top: 10, right: 30, left: 10, bottom: 40 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(167,139,250,0.1)" />
            <XAxis 
              dataKey="hour" 
              stroke="#94a3b8"
              label={{ value: 'Hour of Day', position: 'bottom', offset: -5 }}
              tick={{ fontSize: 11 }}
            />
            <YAxis 
              stroke="#94a3b8"
              label={{ value: 'Distractions', angle: -90, position: 'insideLeft' }}
              tick={{ fontSize: 11 }}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-slate-900/95 border border-purple-500/30 rounded-lg p-3 shadow-xl backdrop-blur-sm">
                      <p className="font-semibold text-white mb-1">
                        {payload[0].payload.hour}:00 - {payload[0].payload.hour + 1}:00
                      </p>
                      <p className="text-accent text-sm">Count: <span className="text-white font-medium">{payload[0].value}</span></p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="count" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </GlassCard>

      {/* Timeline View */}
      {stats.timelineEvents.length > 0 && (
        <GlassCard>
          <h3 className="mb-4 text-primary">Event Timeline</h3>
          <EventTimelineChart events={stats.timelineEvents} sessionStartTime={stats.sessionStartTime} />
        </GlassCard>
      )}

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

// Custom Timeline Chart Component
function EventTimelineChart({ events, sessionStartTime }: { events: TimelineEvent[], sessionStartTime: Date | null }) {
  // Calculate session bounds
  const sessionEndTime = events.length > 0 
    ? new Date(Math.max(...events.map(e => e.endTime.getTime())))
    : new Date();
  
  const sessionDurationMinutes = sessionStartTime && events.length > 0
    ? (sessionEndTime.getTime() - sessionStartTime.getTime()) / (1000 * 60)
    : Math.max(...events.map(e => e.offsetFromStart + e.duration)) || 60;

  // Prepare data for Gantt-style bar chart
  const chartData = events.map((event, index) => ({
    name: `Event ${index + 1}`,
    start: event.offsetFromStart,
    end: event.offsetFromStart + event.duration,
    duration: event.duration,
    type: event.type,
    event: event
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const event = data.event;
      
      return (
        <div className="bg-slate-900/95 border border-purple-500/30 rounded-lg p-4 shadow-xl backdrop-blur-sm">
          <p className="font-semibold text-primary mb-3 border-b border-purple-500/30 pb-2">
            {event.type === "gaze_distraction" ? "👁️ Gaze Distraction" : "🪟 Window Distraction"}
          </p>
          
          <div className="space-y-2 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <span className="text-muted-foreground">Duration:</span>
              <span className="text-primary">{event.duration.toFixed(2)} min</span>
              
              <span className="text-muted-foreground">Status:</span>
              <span className={event.status === 'active' ? 'text-yellow-500' : 'text-green-500'}>{event.status}</span>
            </div>
            
            <div className="border-t border-purple-500/20 pt-2 mt-2">
              <p className="text-muted-foreground text-xs mb-1">Reason:</p>
              <p className="text-white">{event.reason}</p>
            </div>
            
            {event.processName && (
              <>
                <p className="text-muted-foreground text-xs mb-1">Application:</p>
                <p className="text-accent font-medium">{event.processName}</p>
              </>
            )}
            
            {event.windowTitle && (
              <>
                <p className="text-muted-foreground text-xs mb-1">Window:</p>
                <p className="text-white text-xs truncate max-w-xs">{event.windowTitle}</p>
              </>
            )}
            
            {event.applicationCategory && (
              <>
                <p className="text-muted-foreground text-xs mb-1">Category:</p>
                <p className="text-secondary">{event.applicationCategory}</p>
              </>
            )}
            
            {event.claudeAssessment && (
              <>
                <p className="text-muted-foreground text-xs mb-1">AI Assessment:</p>
                <p className="text-purple-300 text-xs">{event.claudeAssessment}</p>
              </>
            )}
            
            {event.suggestedAction && (
              <>
                <p className="text-muted-foreground text-xs mb-1">Suggested Action:</p>
                <p className="text-green-300 text-xs">{event.suggestedAction}</p>
              </>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  const getBarColor = (type: string) => {
    return type === "gaze_distraction" ? "#06b6d4" : "#a78bfa"; // cyan for gaze, purple for window
  };

  // Calculate the actual maximum time from all events
  const maxEventEnd = events.length > 0 
    ? Math.max(...events.map(e => e.offsetFromStart + e.duration))
    : sessionDurationMinutes;
  
  // Add small buffer (10% or 0.5 min minimum) for visual clarity
  const maxDuration = Math.max(maxEventEnd * 1.1, maxEventEnd + 0.5);

  return (
    <div className="w-full overflow-x-auto">
      <ResponsiveContainer width="100%" height={Math.max(500, events.length * 60)} minWidth={900}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 20, right: 50, left: 80, bottom: 60 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(167,139,250,0.1)" horizontal={true} />
          <XAxis 
            type="number" 
            domain={[0, maxDuration]}
            label={{ value: 'Time from Session Start (minutes)', position: 'bottom', offset: -5 }}
            stroke="#94a3b8"
            tick={{ fontSize: 11 }}
          />
          <YAxis 
            dataKey="name"
            type="category"
            stroke="#94a3b8"
            tick={{ fontSize: 10 }}
            width={70}
          />
          <Tooltip content={<CustomTooltip />} />
          
          {/* Stack two bars: first creates the position (transparent), second shows duration */}
          <Bar 
            dataKey="start" 
            stackId="timeline"
            fill="transparent"
            isAnimationActive={false}
          />
          <Bar 
            dataKey="duration" 
            stackId="timeline"
            isAnimationActive={false}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getBarColor(entry.type)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// Productivity Timeline Component - Shows productive vs distracted periods
function ProductivityTimeline({ data, sessionDuration }: { data: Array<{ time: number; value: string; start: number; end: number }>, sessionDuration: number }) {
  const maxTime = sessionDuration > 0 ? sessionDuration : 60;
  
  if (!data || data.length === 0) {
    return (
      <div className="w-full h-20 flex items-center justify-center text-muted-foreground">
        No productivity data available
      </div>
    );
  }
  
  return (
    <div className="w-full relative">
      <div className="relative h-20 w-full overflow-hidden rounded-lg">
        {data.map((segment, index) => {
          const widthPercent = ((segment.end - segment.start) / maxTime) * 100;
          const leftPercent = (segment.start / maxTime) * 100;
          
          return (
            <div
              key={`segment-${index}`}
              className="absolute h-full"
              style={{
                left: `${leftPercent}%`,
                width: `${widthPercent}%`,
                backgroundColor: segment.value === 'productive' ? 'rgba(255, 255, 255, 0.9)' : '#8b5cf6',
                border: segment.value === 'distracted' ? '2px solid #a78bfa' : '1px solid #e5e7eb',
                borderRadius: '4px',
                transition: 'all 0.3s ease',
              }}
            />
          );
        })}
      </div>
      
      {/* Legend */}
      <div className="flex items-center gap-4 mt-2 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-white border border-gray-300 rounded" />
          <span className="text-muted-foreground">Productive</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-purple-600 border-2 border-purple-400 rounded" />
          <span className="text-muted-foreground">Distracted</span>
        </div>
      </div>
      
      {/* Time markers */}
      <div className="flex justify-between mt-1 text-xs text-muted-foreground">
        {[0, 0.25, 0.5, 0.75, 1].map(fraction => (
          <span key={`marker-${fraction}`}>
            {Math.round(fraction * maxTime)}m
          </span>
        ))}
      </div>
    </div>
  );
}
