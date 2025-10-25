import { Clock, Eye, Monitor, Zap, TrendingUp, Brain, Flame } from "lucide-react";
import { GlassCard } from "./GlassCard";
import { StatCard } from "./StatCard";
import { Button } from "../ui/button";
import { motion } from "motion/react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";

const attentionData = [
  { time: "0m", focus: 85 },
  { time: "5m", focus: 90 },
  { time: "10m", focus: 75 },
  { time: "15m", focus: 95 },
  { time: "20m", focus: 88 },
  { time: "25m", focus: 92 },
];

const flowData = [
  { day: "Mon", flow: 72 },
  { day: "Tue", flow: 78 },
  { day: "Wed", flow: 85 },
  { day: "Thu", flow: 80 },
  { day: "Fri", flow: 88 },
  { day: "Sat", flow: 90 },
  { day: "Sun", flow: 92 },
];

export function FocusDashboard() {
  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="text-center py-8">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Button
            size="lg"
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
            <span className="relative z-10">Start Focus</span>
          </Button>
        </motion.div>
      </div>

      {/* Live Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Clock} label="Focus Time Today" value="2h 34m" trend="+12%" color="text-primary" />
        <StatCard icon={Eye} label="Look-Away Time" value="18m" trend="-5%" color="text-secondary" />
        <StatCard icon={Monitor} label="Current App" value="Figma" color="text-accent" />
        <StatCard icon={Zap} label="Productivity Mode" value="Deep" color="text-primary" />
      </div>

      {/* Main Content Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Attention Stability Chart */}
        <GlassCard glow>
          <h3 className="mb-4 text-primary">Real-Time Attention Stability</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={attentionData}>
              <defs>
                <linearGradient id="focusGradient" x1="0" y1="0" x2="0" y2="1">
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
              <Area type="monotone" dataKey="focus" stroke="#a78bfa" fillOpacity={1} fill="url(#focusGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        </GlassCard>

        {/* Focus Flow Index */}
        <GlassCard glow>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-secondary">Focus Flow Index</h3>
            <Brain className="w-5 h-5 text-secondary" />
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={flowData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(34,211,238,0.1)" />
              <XAxis dataKey="day" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(15, 23, 42, 0.9)",
                  border: "1px solid rgba(34,211,238,0.3)",
                  borderRadius: "8px",
                }}
              />
              <Line type="monotone" dataKey="flow" stroke="#22d3ee" strokeWidth={3} dot={{ fill: "#22d3ee", r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </GlassCard>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <GlassCard>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <TrendingUp className="w-8 h-8 text-white" />
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Cognitive Load</p>
              <p className="text-2xl text-primary">Medium</p>
              <p className="text-xs text-secondary">Optimal range</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-secondary to-primary flex items-center justify-center">
              <Flame className="w-8 h-8 text-white" />
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Current Streak</p>
              <p className="text-2xl text-secondary">4 Days</p>
              <p className="text-xs text-primary">Keep it up!</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="bg-gradient-to-br from-accent/20 to-primary/20">
          <div className="space-y-2">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/30 flex items-center justify-center flex-shrink-0">
                <span className="text-lg">🤖</span>
              </div>
              <div className="flex-1">
                <p className="text-xs text-primary mb-1">Locky AI Coach</p>
                <p className="text-sm">"You're 3 min away from a new record! 🎯"</p>
              </div>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
