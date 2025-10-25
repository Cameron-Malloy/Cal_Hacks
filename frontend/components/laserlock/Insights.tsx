import { GlassCard } from "./GlassCard";
import { Brain, TrendingUp, Calendar, Wind } from "lucide-react";
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer } from "recharts";
import { Button } from "../ui/button";
import { motion } from "motion/react";

const consistencyData = [
  { category: "Morning", value: 85 },
  { category: "Afternoon", value: 70 },
  { category: "Evening", value: 55 },
  { category: "Focus", value: 90 },
  { category: "Breaks", value: 75 },
  { category: "Recovery", value: 80 },
];

const insights = [
  {
    icon: Brain,
    title: "Peak Performance Time",
    message: "You focus best at 10 AM. Try scheduling deep work then.",
    color: "text-primary",
  },
  {
    icon: TrendingUp,
    title: "Improving Trend",
    message: "Your focus score increased 23% this week!",
    color: "text-secondary",
  },
  {
    icon: Calendar,
    title: "Consistency Pattern",
    message: "You're most productive on Tuesdays and Thursdays.",
    color: "text-accent",
  },
];

const heatmapWeeks = ["Week 1", "Week 2", "Week 3", "Week 4"];
const heatmapDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function generateHeatmapData() {
  return heatmapWeeks.map(() => 
    heatmapDays.map(() => Math.floor(Math.random() * 100))
  );
}

const heatmapData = generateHeatmapData();

function getHeatColor(value: number) {
  if (value >= 80) return "bg-secondary";
  if (value >= 60) return "bg-primary";
  if (value >= 40) return "bg-accent/50";
  if (value >= 20) return "bg-muted-foreground/30";
  return "bg-muted/20";
}

export function Insights() {
  return (
    <div className="space-y-6">
      {/* AI Insights Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        {insights.map((insight, i) => {
          const Icon = insight.icon;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <GlassCard glow className="h-full">
                <div className="flex items-start gap-3">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center ${insight.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm mb-2 ${insight.color}`}>{insight.title}</p>
                    <p className="text-sm text-muted-foreground">{insight.message}</p>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          );
        })}
      </div>

      {/* Weekly Consistency Radar */}
      <GlassCard glow>
        <h3 className="mb-4 text-primary">Weekly Consistency Analysis</h3>
        <ResponsiveContainer width="100%" height={350}>
          <RadarChart data={consistencyData}>
            <PolarGrid stroke="rgba(167,139,250,0.2)" />
            <PolarAngleAxis dataKey="category" stroke="#94a3b8" />
            <PolarRadiusAxis stroke="#94a3b8" />
            <Radar name="Performance" dataKey="value" stroke="#a78bfa" fill="#a78bfa" fillOpacity={0.6} />
          </RadarChart>
        </ResponsiveContainer>
      </GlassCard>

      {/* App Usage Heat Calendar */}
      <GlassCard>
        <h3 className="mb-4 text-secondary">App Usage Heat Calendar</h3>
        <div className="space-y-2">
          <div className="grid grid-cols-8 gap-2 text-xs text-muted-foreground">
            <div></div>
            {heatmapDays.map((day) => (
              <div key={day} className="text-center">{day}</div>
            ))}
          </div>
          {heatmapData.map((week, weekIndex) => (
            <div key={weekIndex} className="grid grid-cols-8 gap-2">
              <div className="text-xs text-muted-foreground flex items-center">
                {heatmapWeeks[weekIndex]}
              </div>
              {week.map((value, dayIndex) => (
                <div
                  key={dayIndex}
                  className={`aspect-square rounded ${getHeatColor(value)} transition-all hover:scale-110 cursor-pointer`}
                  title={`${value}% productivity`}
                />
              ))}
            </div>
          ))}
        </div>
        <div className="flex items-center justify-end gap-2 mt-4">
          <span className="text-xs text-muted-foreground">Less</span>
          <div className="w-4 h-4 rounded bg-muted/20" />
          <div className="w-4 h-4 rounded bg-muted-foreground/30" />
          <div className="w-4 h-4 rounded bg-accent/50" />
          <div className="w-4 h-4 rounded bg-primary" />
          <div className="w-4 h-4 rounded bg-secondary" />
          <span className="text-xs text-muted-foreground">More</span>
        </div>
      </GlassCard>

      {/* Mindfulness Section */}
      <GlassCard className="bg-gradient-to-br from-accent/20 to-primary/20" glow>
        <div className="flex items-center gap-3 mb-4">
          <Wind className="w-6 h-6 text-accent" />
          <h3 className="text-accent">Mindfulness & Focus Reset</h3>
        </div>
        <p className="text-muted-foreground text-sm mb-6">
          Take a moment to recenter. Deep breathing can improve focus and reduce cognitive load.
        </p>
        
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 p-6 rounded-xl bg-muted/10 text-center">
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center"
            >
              <span className="text-3xl">🫁</span>
            </motion.div>
            <p className="text-sm text-muted-foreground mb-4">
              Breathe in (4s) → Hold (4s) → Breathe out (4s)
            </p>
            <Button className="bg-accent hover:bg-accent/80">
              Start Breathing Exercise
            </Button>
          </div>

          <div className="flex-1 p-6 rounded-xl bg-muted/10 text-center">
            <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-secondary to-primary flex items-center justify-center">
              <span className="text-3xl">⏱️</span>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              5-minute guided focus reset session
            </p>
            <Button variant="outline" className="border-secondary text-secondary">
              Start Focus Reset
            </Button>
          </div>
        </div>
      </GlassCard>

      {/* Weekly Summary */}
      <GlassCard>
        <h3 className="mb-4 text-primary">This Week's Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 rounded-xl bg-muted/10">
            <p className="text-3xl text-primary mb-1">18.5h</p>
            <p className="text-xs text-muted-foreground">Total Focus Time</p>
          </div>
          <div className="text-center p-4 rounded-xl bg-muted/10">
            <p className="text-3xl text-secondary mb-1">88%</p>
            <p className="text-xs text-muted-foreground">Avg Efficiency</p>
          </div>
          <div className="text-center p-4 rounded-xl bg-muted/10">
            <p className="text-3xl text-accent mb-1">23</p>
            <p className="text-xs text-muted-foreground">Sessions</p>
          </div>
          <div className="text-center p-4 rounded-xl bg-muted/10">
            <p className="text-3xl text-primary mb-1">47min</p>
            <p className="text-xs text-muted-foreground">Avg Session</p>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
