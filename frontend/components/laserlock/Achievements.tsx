import { GlassCard } from "./GlassCard";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Trophy, Lock, Star, Flame, Zap, Award, Target, Brain, Crown, Sparkles } from "lucide-react";
import { motion } from "motion/react";

const unlockedAchievements = [
  {
    id: 1,
    name: "Early Bird",
    description: "Complete 10 morning focus sessions",
    icon: "🌅",
    rarity: "Common",
    xp: 100,
    unlockedDate: "Oct 15, 2024",
    progress: 100,
  },
  {
    id: 2,
    name: "Night Owl",
    description: "Focus for 5 hours after 8 PM",
    icon: "🦉",
    rarity: "Common",
    xp: 100,
    unlockedDate: "Oct 18, 2024",
    progress: 100,
  },
  {
    id: 3,
    name: "Flow State",
    description: "Maintain 95%+ focus for 2 hours",
    icon: "🌊",
    rarity: "Rare",
    xp: 250,
    unlockedDate: "Oct 20, 2024",
    progress: 100,
  },
  {
    id: 4,
    name: "Laser Focus",
    description: "Complete 50 distraction-free sessions",
    icon: "🎯",
    rarity: "Epic",
    xp: 500,
    unlockedDate: "Oct 22, 2024",
    progress: 100,
  },
  {
    id: 5,
    name: "Week Warrior",
    description: "Focus every day for a week",
    icon: "⚔️",
    rarity: "Rare",
    xp: 300,
    unlockedDate: "Oct 21, 2024",
    progress: 100,
  },
  {
    id: 6,
    name: "Century Club",
    description: "Accumulate 100 hours of total focus",
    icon: "💯",
    rarity: "Epic",
    xp: 750,
    unlockedDate: "Oct 23, 2024",
    progress: 100,
  },
];

const lockedAchievements = [
  {
    id: 7,
    name: "Zen Master",
    description: "Complete 100 mindfulness sessions",
    icon: "🧘",
    rarity: "Legendary",
    xp: 1000,
    progress: 45,
    current: 45,
    target: 100,
  },
  {
    id: 8,
    name: "Diamond Mind",
    description: "Reach a 30-day streak",
    icon: "💎",
    rarity: "Legendary",
    xp: 1500,
    progress: 13,
    current: 4,
    target: 30,
  },
  {
    id: 9,
    name: "Time Bender",
    description: "Focus for 1000 total hours",
    icon: "⏰",
    rarity: "Epic",
    xp: 2000,
    progress: 15,
    current: 156,
    target: 1000,
  },
  {
    id: 10,
    name: "Focus Titan",
    description: "Reach Level 50",
    icon: "⚡",
    rarity: "Mythic",
    xp: 5000,
    progress: 56,
    current: 28,
    target: 50,
  },
];

const milestones = [
  { level: 30, reward: "Exclusive Nebula Theme", completed: false },
  { level: 40, reward: "AI Voice Customization", completed: false },
  { level: 50, reward: "Legendary Badge Bundle", completed: false },
  { level: 25, reward: "Premium Icon Pack", completed: true },
  { level: 20, reward: "Focus Forest Expansion", completed: true },
];

function getRarityColor(rarity: string) {
  switch (rarity) {
    case "Common":
      return { text: "text-gray-400", bg: "bg-gray-400/20", border: "border-gray-400/30" };
    case "Rare":
      return { text: "text-blue-400", bg: "bg-blue-400/20", border: "border-blue-400/30" };
    case "Epic":
      return { text: "text-purple-400", bg: "bg-purple-400/20", border: "border-purple-400/30" };
    case "Legendary":
      return { text: "text-yellow-400", bg: "bg-yellow-400/20", border: "border-yellow-400/30" };
    case "Mythic":
      return { text: "text-red-400", bg: "bg-red-400/20", border: "border-red-400/30" };
    default:
      return { text: "text-gray-400", bg: "bg-gray-400/20", border: "border-gray-400/30" };
  }
}

export function Achievements() {
  const totalAchievements = unlockedAchievements.length + lockedAchievements.length;
  const totalXP = unlockedAchievements.reduce((sum, a) => sum + a.xp, 0);

  return (
    <div className="space-y-6">
      {/* Stats Header */}
      <div className="grid md:grid-cols-4 gap-4">
        <GlassCard className="text-center bg-gradient-to-br from-primary/20 to-secondary/20">
          <Trophy className="w-8 h-8 text-primary mx-auto mb-2" />
          <p className="text-3xl text-primary mb-1">{unlockedAchievements.length}</p>
          <p className="text-xs text-muted-foreground">Unlocked</p>
        </GlassCard>
        <GlassCard className="text-center">
          <Lock className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-3xl text-muted-foreground mb-1">{lockedAchievements.length}</p>
          <p className="text-xs text-muted-foreground">Locked</p>
        </GlassCard>
        <GlassCard className="text-center">
          <Star className="w-8 h-8 text-secondary mx-auto mb-2" />
          <p className="text-3xl text-secondary mb-1">{totalXP}</p>
          <p className="text-xs text-muted-foreground">Total XP</p>
        </GlassCard>
        <GlassCard className="text-center">
          <Target className="w-8 h-8 text-accent mx-auto mb-2" />
          <p className="text-3xl text-accent mb-1">{Math.round((unlockedAchievements.length / totalAchievements) * 100)}%</p>
          <p className="text-xs text-muted-foreground">Completion</p>
        </GlassCard>
      </div>

      {/* Main Achievements */}
      <GlassCard glow>
        <Tabs defaultValue="unlocked">
          <TabsList className="grid w-full grid-cols-2 mb-6 bg-muted/20">
            <TabsTrigger value="unlocked">
              Unlocked ({unlockedAchievements.length})
            </TabsTrigger>
            <TabsTrigger value="locked">
              Locked ({lockedAchievements.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="unlocked" className="space-y-3">
            {unlockedAchievements.map((achievement, i) => {
              const colors = getRarityColor(achievement.rarity);
              return (
                <motion.div
                  key={achievement.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`p-4 rounded-xl border ${colors.bg} ${colors.border}`}
                >
                  <div className="flex items-start gap-4">
                    <div className="text-5xl">{achievement.icon}</div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-1">
                        <div>
                          <h4 className={colors.text}>{achievement.name}</h4>
                          <p className="text-sm text-muted-foreground">{achievement.description}</p>
                        </div>
                        <Badge className={`${colors.bg} ${colors.text} border-0`}>
                          +{achievement.xp} XP
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className={`text-xs ${colors.border} ${colors.text}`}>
                          {achievement.rarity}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          Unlocked {achievement.unlockedDate}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </TabsContent>

          <TabsContent value="locked" className="space-y-3">
            {lockedAchievements.map((achievement, i) => {
              const colors = getRarityColor(achievement.rarity);
              return (
                <motion.div
                  key={achievement.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="p-4 rounded-xl bg-muted/10 border border-muted/30 relative overflow-hidden"
                >
                  <div className="flex items-start gap-4">
                    <div className="text-5xl opacity-50 grayscale">{achievement.icon}</div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="text-muted-foreground">{achievement.name}</h4>
                          <p className="text-sm text-muted-foreground/70">{achievement.description}</p>
                        </div>
                        <Badge variant="outline" className="border-muted text-muted-foreground">
                          +{achievement.xp} XP
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">
                            {achievement.current} / {achievement.target}
                          </span>
                          <span className={colors.text}>{achievement.progress}%</span>
                        </div>
                        <Progress value={achievement.progress} className="h-2" />
                        <Badge variant="outline" className={`text-xs ${colors.border} ${colors.text}`}>
                          {achievement.rarity}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </TabsContent>
        </Tabs>
      </GlassCard>

      {/* Level Milestones */}
      <GlassCard>
        <h3 className="mb-4 text-primary flex items-center gap-2">
          <Crown className="w-5 h-5" />
          Level Milestones
        </h3>
        <div className="space-y-3">
          {milestones.map((milestone, i) => (
            <div
              key={i}
              className={`p-4 rounded-xl flex items-center justify-between ${
                milestone.completed
                  ? "bg-primary/10 border border-primary/30"
                  : "bg-muted/10 border border-muted/30"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    milestone.completed
                      ? "bg-gradient-to-br from-primary to-secondary text-white"
                      : "bg-muted/20 text-muted-foreground"
                  }`}
                >
                  {milestone.completed ? (
                    <Sparkles className="w-6 h-6" />
                  ) : (
                    <span>{milestone.level}</span>
                  )}
                </div>
                <div>
                  <p className={milestone.completed ? "text-primary" : "text-muted-foreground"}>
                    Level {milestone.level}
                  </p>
                  <p className="text-sm text-muted-foreground">{milestone.reward}</p>
                </div>
              </div>
              {milestone.completed ? (
                <Badge className="bg-secondary/20 text-secondary border-0">Claimed</Badge>
              ) : (
                <Badge variant="outline" className="border-muted text-muted-foreground">
                  Locked
                </Badge>
              )}
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
