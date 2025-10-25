import { GlassCard } from "./GlassCard";
import { Button } from "../ui/button";
import { Share2, Save, Trophy } from "lucide-react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";

const productivityData = [
  { name: "Productive", value: 75, color: "#22d3ee" },
  { name: "Unproductive", value: 15, color: "#ef4444" },
  { name: "Neutral", value: 10, color: "#94a3b8" },
];

const appTimeData = [
  { app: "Figma", time: 85 },
  { app: "VS Code", time: 65 },
  { app: "Slack", time: 25 },
  { app: "Chrome", time: 45 },
  { app: "Notion", time: 30 },
];

const focusTimelineData = [
  { time: "9:00", focus: 20, distraction: 0 },
  { time: "9:30", focus: 80, distraction: 0 },
  { time: "10:00", focus: 90, distraction: 0 },
  { time: "10:30", focus: 40, distraction: 1 },
  { time: "11:00", focus: 95, distraction: 0 },
  { time: "11:30", focus: 85, distraction: 0 },
  { time: "12:00", focus: 30, distraction: 1 },
];

export function SessionReport() {
  return (
    <div className="space-y-6">
      {/* Score Header */}
      <GlassCard className="text-center bg-gradient-to-br from-primary/20 via-accent/20 to-secondary/20" glow>
        <div className="py-8">
          <p className="text-muted-foreground mb-2">Session Focus Score</p>
          <div className="text-7xl bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent mb-4">
            1847
          </div>
          <div className="flex items-center justify-center gap-2">
            <div className="px-4 py-2 rounded-full bg-secondary/20 text-secondary">
              A+ Performance
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Charts Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Pie Chart - Time Distribution */}
        <GlassCard>
          <h3 className="mb-4 text-primary">Time Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={productivityData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {productivityData.map((entry, index) => (
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

        {/* Bar Chart - Time per App */}
        <GlassCard>
          <h3 className="mb-4 text-secondary">Time Per Application</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={appTimeData}>
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
        </GlassCard>

        {/* Line Chart - Focus Timeline */}
        <GlassCard className="md:col-span-2">
          <h3 className="mb-4 text-accent">Focus Timeline (Distractions & Recoveries)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={focusTimelineData}>
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
              <Line type="monotone" dataKey="focus" stroke="#8b5cf6" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </GlassCard>
      </div>

      {/* Highlights */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <GlassCard className="text-center">
          <p className="text-muted-foreground text-sm mb-2">Longest Streak</p>
          <p className="text-3xl text-primary">47 min</p>
        </GlassCard>
        <GlassCard className="text-center">
          <p className="text-muted-foreground text-sm mb-2">Break Efficiency</p>
          <p className="text-3xl text-secondary">92%</p>
        </GlassCard>
        <GlassCard className="text-center">
          <p className="text-muted-foreground text-sm mb-2">Trigger Count</p>
          <p className="text-3xl text-accent">2</p>
        </GlassCard>
        <GlassCard className="text-center">
          <p className="text-muted-foreground text-sm mb-2">Total Minutes</p>
          <p className="text-3xl text-primary">154</p>
        </GlassCard>
      </div>

      {/* Heatmap Placeholder */}
      <GlassCard>
        <h3 className="mb-4 text-secondary">Eye Activity Intensity Heatmap</h3>
        <div className="grid grid-cols-8 gap-2">
          {Array.from({ length: 64 }).map((_, i) => {
            const intensity = Math.random();
            const bgColor =
              intensity > 0.7
                ? "bg-secondary"
                : intensity > 0.4
                ? "bg-primary"
                : intensity > 0.2
                ? "bg-accent/50"
                : "bg-muted";
            return <div key={i} className={`aspect-square rounded ${bgColor}`} />;
          })}
        </div>
      </GlassCard>

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
