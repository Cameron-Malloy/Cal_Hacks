"use client";

import { useState, useEffect } from "react";
import { GlassCard } from "./GlassCard";
import { Progress } from "../ui/progress";
import { Badge } from "../ui/badge";
import { Target, Zap, Trophy, Award, Star, Flame } from "lucide-react";
import { motion } from "motion/react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";

interface Challenge {
  id: string;
  title: string;
  description: string;
  xp: number;
  progress: number;
  icon: any;
  target: number;
  current: number;
}

export function Challenges() {
  const [dailyChallenges, setDailyChallenges] = useState<Challenge[]>([]);
  const [weeklyChallenges, setWeeklyChallenges] = useState<Challenge[]>([]);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [loading, setLoading] = useState(true);
  const userId = "demo-user";

  useEffect(() => {
    const fetchChallenges = async () => {
      try {
        // Get user data for streak
        const userRef = collection(db, "users");
        const userQuery = query(userRef, where("uid", "==", userId));
        const userSnap = await getDocs(userQuery);
        
        let streak = 0;
        if (!userSnap.empty) {
          const userData = userSnap.docs[0].data();
          streak = userData.currentStreak || 0;
        }
        setCurrentStreak(streak);

        // Get all sessions for today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const sessionsRef = collection(db, "users", userId, "sessions");
        const sessionsSnap = await getDocs(sessionsRef);

        let todayFocusMinutes = 0;
        let todayDistractionsCount = 0;
        let highestFocusScore = 0;
        let totalSessions = 0;

        sessionsSnap.forEach((doc) => {
          const sessionData = doc.data();
          const sessionTime = sessionData.start_time?.toDate?.() || new Date(sessionData.start_time);
          
          if (sessionTime >= today) {
            todayFocusMinutes += (sessionData.session_duration_seconds || 0) / 60;
            todayDistractionsCount += sessionData.total_events || 0;
            
            // Calculate focus score for this session
            if (sessionData.session_duration_seconds > 0) {
              const distractionTime = sessionData.total_distraction_time_seconds || 0;
              const focusScore = ((sessionData.session_duration_seconds - distractionTime) / sessionData.session_duration_seconds) * 100;
              highestFocusScore = Math.max(highestFocusScore, focusScore);
            }
          }
          totalSessions++;
        });

        // Create daily challenges based on real data
        const daily: Challenge[] = [
          {
            id: "1",
            title: "Morning Momentum",
            description: "Complete 30min focus session today",
            xp: 150,
            target: 30,
            current: Math.min(todayFocusMinutes, 30),
            progress: Math.min((todayFocusMinutes / 30) * 100, 100),
            icon: Zap
          },
          {
            id: "2",
            title: "Distraction Destroyer",
            description: "Maintain 90%+ focus score in a session",
            xp: 200,
            target: 90,
            current: Math.round(highestFocusScore),
            progress: Math.min((highestFocusScore / 90) * 100, 100),
            icon: Target
          },
          {
            id: "3",
            title: "Low Distraction Day",
            description: "Keep distractions under 10 today",
            xp: 100,
            target: 10,
            current: todayDistractionsCount,
            progress: todayDistractionsCount <= 10 ? 100 : Math.max(0, 100 - (todayDistractionsCount - 10) * 10),
            icon: Star
          },
        ];

        // Get week's data for weekly challenges
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        
        let weekFocusHours = 0;
        sessionsSnap.forEach((doc) => {
          const sessionData = doc.data();
          const sessionTime = sessionData.start_time?.toDate?.() || new Date(sessionData.start_time);
          
          if (sessionTime >= weekAgo) {
            weekFocusHours += (sessionData.session_duration_seconds || 0) / 3600;
          }
        });

        const weekly: Challenge[] = [
          {
            id: "4",
            title: "Week Warrior",
            description: "Accumulate 5 hours of focus this week",
            xp: 1000,
            target: 5,
            current: Math.round(weekFocusHours * 10) / 10,
            progress: Math.min((weekFocusHours / 5) * 100, 100),
            icon: Trophy
          },
          {
            id: "5",
            title: "Consistency Master",
            description: "Build a 7-day streak",
            xp: 750,
            target: 7,
            current: streak,
            progress: Math.min((streak / 7) * 100, 100),
            icon: Award
          },
        ];

        setDailyChallenges(daily);
        setWeeklyChallenges(weekly);

      } catch (error) {
        console.error("Error fetching challenges:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchChallenges();
  }, [userId]);

  // Determine badges based on real progress
  const badges = [
    { name: "First Session", icon: "🎯", unlocked: dailyChallenges.length > 0, rarity: "Common" },
    { name: "Focus Starter", icon: "⚡", unlocked: dailyChallenges.find(c => c.id === "1")?.progress === 100, rarity: "Common" },
    { name: "Distraction Warrior", icon: "🛡️", unlocked: dailyChallenges.find(c => c.id === "2")?.progress === 100, rarity: "Rare" },
    { name: "Streak Master", icon: "🔥", unlocked: currentStreak >= 3, rarity: "Epic" },
    { name: "Week Champion", icon: "🏆", unlocked: weeklyChallenges.find(c => c.id === "4")?.progress === 100, rarity: "Epic" },
    { name: "Consistency King", icon: "👑", unlocked: currentStreak >= 7, rarity: "Legendary" },
    { name: "Focus Titan", icon: "💎", unlocked: false, rarity: "Legendary" },
    { name: "Zen Master", icon: "🧘", unlocked: false, rarity: "Mythic" },
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

  if (loading) {
    return (
      <div className="space-y-6">
        <GlassCard className="text-center py-12">
          <p className="text-muted-foreground">Loading challenges...</p>
        </GlassCard>
      </div>
    );
  }

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
            const isComplete = challenge.progress >= 100;
            return (
              <div key={challenge.id} className={`p-4 rounded-xl ${isComplete ? 'bg-primary/10 border border-primary/30' : 'bg-muted/10'}`}>
                <div className="flex items-start gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isComplete ? 'bg-primary/30' : 'bg-primary/20'}`}>
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-foreground">{challenge.title}</p>
                    <p className="text-sm text-muted-foreground">{challenge.description}</p>
                    <p className="text-xs text-accent mt-1">
                      {challenge.current} / {challenge.target} {challenge.id === "4" ? "hours" : challenge.id === "5" ? "days" : challenge.id === "1" ? "min" : challenge.id === "2" ? "%" : "distractions"}
                    </p>
                  </div>
                  <Badge variant="outline" className={`${isComplete ? 'border-secondary bg-secondary/20 text-secondary' : 'border-secondary text-secondary'}`}>
                    {isComplete ? "✓ " : ""}+{challenge.xp} XP
                  </Badge>
                </div>
                <Progress value={challenge.progress} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">{Math.round(challenge.progress)}% Complete</p>
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
            const isComplete = challenge.progress >= 100;
            return (
              <div key={challenge.id} className={`p-4 rounded-xl ${isComplete ? 'bg-secondary/10 border border-secondary/30' : 'bg-muted/10'}`}>
                <div className="flex items-start gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isComplete ? 'bg-secondary/30' : 'bg-secondary/20'}`}>
                    <Icon className="w-5 h-5 text-secondary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-foreground">{challenge.title}</p>
                    <p className="text-sm text-muted-foreground">{challenge.description}</p>
                    <p className="text-xs text-accent mt-1">
                      {challenge.current} / {challenge.target} {challenge.id === "4" ? "hours" : "days"}
                    </p>
                  </div>
                  <Badge variant="outline" className={`${isComplete ? 'border-accent bg-accent/20 text-accent' : 'border-accent text-accent'}`}>
                    {isComplete ? "✓ " : ""}+{challenge.xp} XP
                  </Badge>
                </div>
                <Progress value={challenge.progress} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">{Math.round(challenge.progress)}% Complete</p>
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

      {/* Focus Streak */}
      <GlassCard className="bg-gradient-to-br from-orange-900/20 to-primary/20">
        <h3 className="mb-4 text-primary flex items-center gap-2">
          <Flame className="w-5 h-5 text-orange-500" />
          Focus Streak
        </h3>
        <p className="text-muted-foreground text-sm mb-4">
          Keep your streak alive by completing at least one focus session each day!
        </p>
        <div className="flex items-end justify-center gap-2 h-32 mb-4">
          {Array.from({ length: Math.min(currentStreak, 7) }).map((_, day) => (
            <motion.div
              key={day}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: day * 0.1 }}
              className="text-5xl"
            >
              🔥
            </motion.div>
          ))}
          {Array.from({ length: Math.max(0, 7 - currentStreak) }).map((_, day) => (
            <div key={`empty-${day}`} className="text-5xl opacity-30">⚪</div>
          ))}
        </div>
        <p className="text-center text-sm text-secondary">
          {currentStreak === 0 ? "Start your streak today!" :
           currentStreak >= 7 ? "🎉 Amazing 7-day streak!" :
           `Day ${currentStreak} of 7 - Keep going!`}
        </p>
      </GlassCard>
    </div>
  );
}
