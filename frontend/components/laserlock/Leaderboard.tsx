import { GlassCard } from "./GlassCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Trophy, Medal, Award, TrendingUp, Flame } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Avatar, AvatarFallback } from "../ui/avatar";

const leaderboardData = [
  { rank: 1, username: "FocusNinja", score: 2847, level: 42, streak: 15 },
  { rank: 2, username: "ZenMaster", score: 2654, level: 38, streak: 12 },
  { rank: 3, username: "LaserEyes", score: 2521, level: 35, streak: 10 },
  { rank: 4, username: "You (Alex)", score: 1847, level: 28, streak: 4, isCurrentUser: true },
  { rank: 5, username: "FlowState", score: 1723, level: 26, streak: 8 },
  { rank: 6, username: "DeepWork", score: 1658, level: 24, streak: 6 },
  { rank: 7, username: "Mindful", score: 1542, level: 22, streak: 7 },
];

const comparisonData = [
  { week: "W1", you: 1200, top: 2100 },
  { week: "W2", you: 1350, top: 2250 },
  { week: "W3", you: 1580, top: 2400 },
  { week: "W4", you: 1847, top: 2847 },
];

const socialFeed = [
  { user: "Pranav", action: "just hit a 2000 score!", time: "2m ago" },
  { user: "Sarah", action: "achieved 30-day streak 🔥", time: "15m ago" },
  { user: "Mike", action: "unlocked Diamond Badge", time: "1h ago" },
  { user: "Emma", action: "reached Level 50!", time: "2h ago" },
];

function getRankIcon(rank: number) {
  if (rank === 1) return <Trophy className="w-5 h-5 text-yellow-400" />;
  if (rank === 2) return <Medal className="w-5 h-5 text-gray-300" />;
  if (rank === 3) return <Award className="w-5 h-5 text-amber-600" />;
  return <span className="text-muted-foreground">#{rank}</span>;
}

export function Leaderboard() {
  return (
    <div className="space-y-6">
      <GlassCard glow>
        <Tabs defaultValue="global" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6 bg-muted/20">
            <TabsTrigger value="friends">Friends</TabsTrigger>
            <TabsTrigger value="global">Global</TabsTrigger>
            <TabsTrigger value="teams">Teams</TabsTrigger>
          </TabsList>

          <TabsContent value="friends">
            <p className="text-center text-muted-foreground py-8">
              Connect with friends to see their rankings!
            </p>
          </TabsContent>

          <TabsContent value="global" className="space-y-4">
            {leaderboardData.map((user) => (
              <div
                key={user.rank}
                className={`
                  flex items-center gap-4 p-4 rounded-xl transition-all
                  ${
                    user.isCurrentUser
                      ? "bg-gradient-to-r from-primary/20 to-secondary/20 border border-primary/40"
                      : "bg-muted/10 hover:bg-muted/20"
                  }
                `}
              >
                <div className="w-12 flex items-center justify-center">
                  {getRankIcon(user.rank)}
                </div>
                <Avatar className="w-10 h-10">
                  <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white">
                    {user.username.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className={user.isCurrentUser ? "text-primary" : ""}>{user.username}</p>
                  <p className="text-xs text-muted-foreground">Level {user.level}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg text-secondary">{user.score}</p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Flame className="w-3 h-3 text-orange-500" />
                    <span>{user.streak}</span>
                  </div>
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="teams">
            <p className="text-center text-muted-foreground py-8">
              Join or create a team to compete together!
            </p>
          </TabsContent>
        </Tabs>
      </GlassCard>

      {/* Comparison Chart */}
      <GlassCard>
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-primary" />
          <h3 className="text-primary">Your Progress vs Top Users</h3>
        </div>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={comparisonData}>
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
            <Line type="monotone" dataKey="you" stroke="#22d3ee" strokeWidth={3} name="You" />
            <Line type="monotone" dataKey="top" stroke="#a78bfa" strokeWidth={3} strokeDasharray="5 5" name="Top User" />
          </LineChart>
        </ResponsiveContainer>
      </GlassCard>

      {/* Social Feed */}
      <GlassCard>
        <h3 className="mb-4 text-accent">Community Activity</h3>
        <div className="space-y-3">
          {socialFeed.map((item, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/10">
              <Avatar className="w-8 h-8">
                <AvatarFallback className="bg-accent/30 text-accent text-xs">
                  {item.user.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="text-sm">
                  <span className="text-primary">{item.user}</span>{" "}
                  <span className="text-muted-foreground">{item.action}</span>
                </p>
                <p className="text-xs text-muted-foreground">{item.time}</p>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
