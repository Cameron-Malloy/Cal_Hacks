import { GlassCard } from "./GlassCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
} from "recharts";
import { TrendingUp, Clock, Target, Zap, Calendar, Eye, Activity } from "lucide-react";
import { Badge } from "../ui/badge";

// Weekly Data
const weeklyData = [
  { day: "Mon", focus: 2.5, distractions: 8, efficiency: 85 },
  { day: "Tue", focus: 3.2, distractions: 5, efficiency: 92 },
  { day: "Wed", focus: 2.8, distractions: 12, efficiency: 78 },
  { day: "Thu", focus: 4.1, distractions: 3, efficiency: 95 },
  { day: "Fri", focus: 3.5, distractions: 7, efficiency: 88 },
  { day: "Sat", focus: 2.0, distractions: 15, efficiency: 65 },
  { day: "Sun", focus: 1.8, distractions: 10, efficiency: 70 },
];

// Monthly Trend
const monthlyData = [
  { week: "W1", hours: 12, score: 1450 },
  { week: "W2", hours: 15, score: 1620 },
  { week: "W3", hours: 18, score: 1780 },
  { week: "W4", hours: 19, score: 1847 },
];

// Time of Day Performance
const timeOfDayData = [
  { time: "6-9 AM", focus: 75 },
  { time: "9-12 PM", focus: 95 },
  { time: "12-3 PM", focus: 65 },
  { time: "3-6 PM", focus: 80 },
  { time: "6-9 PM", focus: 70 },
  { time: "9-12 AM", focus: 45 },
];

// App Usage
const appUsageData = [
  { app: "Figma", hours: 45, percentage: 29 },
  { app: "VS Code", hours: 38, percentage: 24 },
  { app: "Notion", hours: 22, percentage: 14 },
  { app: "Chrome", hours: 20, percentage: 13 },
  { app: "Slack", hours: 18, percentage: 12 },
  { app: "Others", hours: 13, percentage: 8 },
];

// Performance Radar
const performanceData = [
  { category: "Focus Duration", value: 85 },
  { category: "Consistency", value: 72 },
  { category: "Recovery Speed", value: 90 },
  { category: "Break Efficiency", value: 78 },
  { category: "Distraction Control", value: 82 },
  { category: "Flow State", value: 88 },
];

// Streak Calendar (4 weeks)
const generateStreakData = () => {
  const weeks = 4;
  const days = 7;
  const data = [];
  
  for (let w = 0; w < weeks; w++) {
    for (let d = 0; d < days; d++) {
      const hasSession = Math.random() > 0.3; // 70% chance of session
      const intensity = hasSession ? Math.floor(Math.random() * 4) + 1 : 0;
      data.push({ week: w, day: d, intensity });
    }
  }
  return data;
};

const streakData = generateStreakData();

function getStreakColor(intensity: number) {
  if (intensity === 0) return "bg-muted/20";
  if (intensity === 1) return "bg-primary/30";
  if (intensity === 2) return "bg-primary/50";
  if (intensity === 3) return "bg-primary/70";
  return "bg-primary";
}

export function MyStats() {
  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <GlassCard className="text-center bg-gradient-to-br from-primary/20 to-secondary/20">
          <Clock className="w-6 h-6 text-primary mx-auto mb-2" />
          <p className="text-2xl text-primary mb-1">156h</p>
          <p className="text-xs text-muted-foreground">Total Focus Time</p>
          <Badge className="mt-2 bg-secondary/20 text-secondary text-xs">+23h this month</Badge>
        </GlassCard>

        <GlassCard className="text-center">
          <Target className="w-6 h-6 text-secondary mx-auto mb-2" />
          <p className="text-2xl text-secondary mb-1">1,847</p>
          <p className="text-xs text-muted-foreground">Best Focus Score</p>
          <Badge className="mt-2 bg-primary/20 text-primary text-xs">Top 15%</Badge>
        </GlassCard>

        <GlassCard className="text-center">
          <Activity className="w-6 h-6 text-accent mx-auto mb-2" />
          <p className="text-2xl text-accent mb-1">87%</p>
          <p className="text-xs text-muted-foreground">Avg Efficiency</p>
          <Badge className="mt-2 bg-accent/20 text-accent text-xs">+5% vs last week</Badge>
        </GlassCard>

        <GlassCard className="text-center">
          <Zap className="w-6 h-6 text-primary mx-auto mb-2" />
          <p className="text-2xl text-primary mb-1">342</p>
          <p className="text-xs text-muted-foreground">Total Sessions</p>
          <Badge className="mt-2 bg-secondary/20 text-secondary text-xs">~2.2 per day</Badge>
        </GlassCard>
      </div>

      {/* Charts Tabs */}
      <GlassCard glow>
        <Tabs defaultValue="weekly">
          <TabsList className="grid w-full grid-cols-3 mb-6 bg-muted/20">
            <TabsTrigger value="weekly">This Week</TabsTrigger>
            <TabsTrigger value="monthly">This Month</TabsTrigger>
            <TabsTrigger value="alltime">All Time</TabsTrigger>
          </TabsList>

          <TabsContent value="weekly" className="space-y-6">
            {/* Focus Hours by Day */}
            <div>
              <h4 className="mb-4 text-primary flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Daily Focus Hours
              </h4>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(167,139,250,0.1)" />
                  <XAxis dataKey="day" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(15, 23, 42, 0.9)",
                      border: "1px solid rgba(167,139,250,0.3)",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="focus" fill="#a78bfa" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Efficiency Trend */}
            <div>
              <h4 className="mb-4 text-secondary flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Efficiency & Distractions
              </h4>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(167,139,250,0.1)" />
                  <XAxis dataKey="day" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(15, 23, 42, 0.9)",
                      border: "1px solid rgba(167,139,250,0.3)",
                      borderRadius: "8px",
                    }}
                  />
                  <Line type="monotone" dataKey="efficiency" stroke="#22d3ee" strokeWidth={3} name="Efficiency %" />
                  <Line type="monotone" dataKey="distractions" stroke="#ef4444" strokeWidth={2} strokeDasharray="5 5" name="Distractions" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="monthly" className="space-y-6">
            {/* Monthly Progress */}
            <div>
              <h4 className="mb-4 text-primary">Monthly Progress</h4>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={monthlyData}>
                  <defs>
                    <linearGradient id="hoursGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#a78bfa" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(167,139,250,0.1)" />
                  <XAxis dataKey="week" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(15, 23, 42, 0.9)",
                      border: "1px solid rgba(167,139,250,0.3)",
                      borderRadius: "8px",
                    }}
                  />
                  <Area type="monotone" dataKey="hours" stroke="#a78bfa" fillOpacity={1} fill="url(#hoursGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="alltime" className="space-y-6">
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">All-time statistics coming soon!</p>
            </div>
          </TabsContent>
        </Tabs>
      </GlassCard>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Time of Day Performance */}
        <GlassCard>
          <h4 className="mb-4 text-accent flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Peak Performance Times
          </h4>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={timeOfDayData} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(167,139,250,0.1)" />
              <XAxis type="number" stroke="#94a3b8" />
              <YAxis type="category" dataKey="time" stroke="#94a3b8" width={80} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(15, 23, 42, 0.9)",
                  border: "1px solid rgba(167,139,250,0.3)",
                  borderRadius: "8px",
                }}
              />
              <Bar dataKey="focus" fill="#8b5cf6" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </GlassCard>

        {/* Performance Radar */}
        <GlassCard>
          <h4 className="mb-4 text-primary">Performance Profile</h4>
          <ResponsiveContainer width="100%" height={250}>
            <RadarChart data={performanceData}>
              <PolarGrid stroke="rgba(167,139,250,0.2)" />
              <PolarAngleAxis dataKey="category" stroke="#94a3b8" tick={{ fontSize: 11 }} />
              <Radar name="Performance" dataKey="value" stroke="#a78bfa" fill="#a78bfa" fillOpacity={0.6} />
            </RadarChart>
          </ResponsiveContainer>
        </GlassCard>
      </div>

      {/* App Usage Breakdown */}
      <GlassCard>
        <h4 className="mb-4 text-secondary flex items-center gap-2">
          <Eye className="w-4 h-4" />
          App Usage Breakdown
        </h4>
        <div className="space-y-3">
          {appUsageData.map((app, i) => (
            <div key={i} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">{app.app}</span>
                <span className="text-xs text-muted-foreground">
                  {app.hours}h ({app.percentage}%)
                </span>
              </div>
              <div className="h-2 bg-muted/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-secondary"
                  style={{ width: `${app.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Activity Calendar */}
      <GlassCard glow>
        <h4 className="mb-4 text-primary flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          Activity Calendar (Last 4 Weeks)
        </h4>
        <div className="overflow-x-auto">
          <div className="inline-flex flex-col gap-1 min-w-max">
            <div className="flex gap-1 text-xs text-muted-foreground mb-2 pl-8">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div key={day} className="w-4 text-center">
                  {day[0]}
                </div>
              ))}
            </div>
            {[0, 1, 2, 3].map((week) => (
              <div key={week} className="flex items-center gap-1">
                <span className="text-xs text-muted-foreground w-6">W{week + 1}</span>
                {[0, 1, 2, 3, 4, 5, 6].map((day) => {
                  const dataPoint = streakData.find((d) => d.week === week && d.day === day);
                  return (
                    <div
                      key={day}
                      className={`w-4 h-4 rounded ${getStreakColor(dataPoint?.intensity || 0)} cursor-pointer hover:scale-110 transition-transform`}
                      title={`Intensity: ${dataPoint?.intensity || 0}`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
          <div className="flex items-center justify-end gap-2 mt-4">
            <span className="text-xs text-muted-foreground">Less</span>
            <div className="w-3 h-3 rounded bg-muted/20" />
            <div className="w-3 h-3 rounded bg-primary/30" />
            <div className="w-3 h-3 rounded bg-primary/50" />
            <div className="w-3 h-3 rounded bg-primary/70" />
            <div className="w-3 h-3 rounded bg-primary" />
            <span className="text-xs text-muted-foreground">More</span>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
