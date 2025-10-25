import { GlassCard } from "./GlassCard";
import { Progress } from "../ui/progress";
import { Badge } from "../ui/badge";
import { Target, Zap, Trophy, Gift, Award, Star } from "lucide-react";
import { motion } from "motion/react";
import { Button } from "../ui/button";

const dailyChallenges = [
  { id: 1, title: "Morning Momentum", description: "Complete 30min focus before 10 AM", xp: 150, progress: 75, icon: Zap },
  { id: 2, title: "Distraction Destroyer", description: "Maintain 90%+ focus for 1 hour", xp: 200, progress: 45, icon: Target },
  { id: 3, title: "Break Master", description: "Take 3 mindful breaks today", xp: 100, progress: 66, icon: Star },
];

const weeklyChallenges = [
  { id: 4, title: "Week Warrior", description: "Accumulate 20 hours of focus", xp: 1000, progress: 60, icon: Trophy },
  { id: 5, title: "Consistency King", description: "Log focus sessions 7 days in a row", xp: 750, progress: 57, icon: Award },
];

const badges = [
  { name: "Early Bird", icon: "🌅", unlocked: true, rarity: "Common" },
  { name: "Night Owl", icon: "🦉", unlocked: true, rarity: "Common" },
  { name: "Flow State", icon: "🌊", unlocked: true, rarity: "Rare" },
  { name: "Laser Focus", icon: "🎯", unlocked: true, rarity: "Epic" },
  { name: "Zen Master", icon: "🧘", unlocked: false, rarity: "Legendary" },
  { name: "Diamond Mind", icon: "💎", unlocked: false, rarity: "Legendary" },
  { name: "Time Bender", icon: "⏰", unlocked: false, rarity: "Epic" },
  { name: "Focus Titan", icon: "⚡", unlocked: false, rarity: "Mythic" },
];

const rewards = [
  { name: "Cyberpunk Theme", cost: 500, type: "theme", icon: "🎨" },
  { name: "Glow Icons Pack", cost: 300, type: "icons", icon: "✨" },
  { name: "2x XP Boost (1h)", cost: 750, type: "boost", icon: "🚀" },
  { name: "Custom AI Voice", cost: 1000, type: "feature", icon: "🎤" },
];

function getRarityColor(rarity: string) {
  switch (rarity) {
    case "Common": return "text-gray-400";
    case "Rare": return "text-blue-400";
    case "Epic": return "text-purple-400";
    case "Legendary": return "text-yellow-400";
    case "Mythic": return "text-red-400";
    default: return "text-gray-400";
  }
}

export function Challenges() {
  return (
    <div className="space-y-6">
      {/* Daily Challenges */}
      <GlassCard glow>
        <h3 className="mb-4 text-primary flex items-center gap-2">
          <Target className="w-5 h-5" />
          Daily Challenges
        </h3>
        <div className="space-y-4">
          {dailyChallenges.map((challenge) => {
            const Icon = challenge.icon;
            return (
              <div key={challenge.id} className="p-4 rounded-xl bg-muted/10">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-foreground">{challenge.title}</p>
                    <p className="text-sm text-muted-foreground">{challenge.description}</p>
                  </div>
                  <Badge variant="outline" className="border-secondary text-secondary">
                    +{challenge.xp} XP
                  </Badge>
                </div>
                <Progress value={challenge.progress} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">{challenge.progress}% Complete</p>
              </div>
            );
          })}
        </div>
      </GlassCard>

      {/* Weekly Challenges */}
      <GlassCard>
        <h3 className="mb-4 text-secondary flex items-center gap-2">
          <Trophy className="w-5 h-5" />
          Weekly Challenges
        </h3>
        <div className="space-y-4">
          {weeklyChallenges.map((challenge) => {
            const Icon = challenge.icon;
            return (
              <div key={challenge.id} className="p-4 rounded-xl bg-muted/10">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-secondary/20 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-secondary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-foreground">{challenge.title}</p>
                    <p className="text-sm text-muted-foreground">{challenge.description}</p>
                  </div>
                  <Badge variant="outline" className="border-accent text-accent">
                    +{challenge.xp} XP
                  </Badge>
                </div>
                <Progress value={challenge.progress} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">{challenge.progress}% Complete</p>
              </div>
            );
          })}
        </div>
      </GlassCard>

      {/* Achievement Badges */}
      <GlassCard>
        <h3 className="mb-4 text-accent flex items-center gap-2">
          <Award className="w-5 h-5" />
          Achievement Badges
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {badges.map((badge, i) => (
            <motion.div
              key={i}
              whileHover={{ scale: badge.unlocked ? 1.05 : 1 }}
              className={`
                p-4 rounded-xl text-center transition-all
                ${
                  badge.unlocked
                    ? "bg-gradient-to-br from-primary/20 to-secondary/20 border border-primary/30"
                    : "bg-muted/10 opacity-50 grayscale"
                }
              `}
            >
              <div className="text-4xl mb-2">{badge.icon}</div>
              <p className="text-sm mb-1">{badge.name}</p>
              <p className={`text-xs ${getRarityColor(badge.rarity)}`}>{badge.rarity}</p>
            </motion.div>
          ))}
        </div>
      </GlassCard>

      {/* Focus Forest */}
      <GlassCard className="bg-gradient-to-br from-green-900/20 to-primary/20">
        <h3 className="mb-4 text-primary">Focus Forest 🌳</h3>
        <p className="text-muted-foreground text-sm mb-4">
          Your forest grows with every streak day. Keep focusing to build a thriving ecosystem!
        </p>
        <div className="flex items-end justify-center gap-2 h-32 mb-4">
          {[1, 2, 3, 4].map((day) => (
            <motion.div
              key={day}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: day * 0.1 }}
              className="text-5xl"
            >
              🌲
            </motion.div>
          ))}
          <div className="text-5xl opacity-30">🌱</div>
          <div className="text-5xl opacity-30">🌱</div>
          <div className="text-5xl opacity-30">🌱</div>
        </div>
        <p className="text-center text-sm text-secondary">Day 4 of 7 - Keep going!</p>
      </GlassCard>

      {/* Rewards Marketplace */}
      <GlassCard glow>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-primary flex items-center gap-2">
            <Gift className="w-5 h-5" />
            Rewards Marketplace
          </h3>
          <Badge className="bg-gradient-to-r from-primary to-secondary text-white">
            2,450 Points
          </Badge>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {rewards.map((reward, i) => (
            <div key={i} className="p-4 rounded-xl bg-muted/10 flex items-center gap-4">
              <div className="text-3xl">{reward.icon}</div>
              <div className="flex-1">
                <p className="text-foreground">{reward.name}</p>
                <p className="text-xs text-muted-foreground capitalize">{reward.type}</p>
              </div>
              <Button size="sm" variant="outline" className="border-primary text-primary">
                {reward.cost} pts
              </Button>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
