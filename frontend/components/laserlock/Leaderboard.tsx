"use client";

import { useState, useEffect } from "react";
import { GlassCard } from "./GlassCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Trophy, Medal, Award, TrendingUp, Flame, UserPlus } from "lucide-react";
import { Button } from "../ui/button";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { subscribeToFriendsLeaderboard, getFriendsLeaderboard } from "@/lib/firestore";
import { motion } from "motion/react";

interface UserProfile {
  uid: string;
  name: string;
  email: string;
  level: number;
  xp: number;
  totalFocusTime: number;
  currentStreak: number;
  longestStreak: number;
}

interface LeaderboardEntry extends UserProfile {
  rank: number;
  isCurrentUser?: boolean;
}

const comparisonData = [
  { week: "W1", you: 120, top: 2100 },
  { week: "W2", you: 180, top: 2250 },
  { week: "W3", you: 240, top: 2400 },
  { week: "W4", you: 300, top: 2847 },
];

const socialFeed = [
  { user: "Lebron James", action: "just hit a 2000 score!", time: "2m ago" },
  { user: "Kendrick Lamar", action: "achieved 30-day streak 🔥", time: "15m ago" },
  { user: "Shah Rukh Khan", action: "unlocked Diamond Badge", time: "1h ago" },
  { user: "Deep Work", action: "reached Level 50!", time: "2h ago" },
];

function getRankIcon(rank: number) {
  if (rank === 1) return <Trophy className="w-5 h-5 text-yellow-400" />;
  if (rank === 2) return <Medal className="w-5 h-5 text-gray-300" />;
  if (rank === 3) return <Award className="w-5 h-5 text-amber-600" />;
  return <span className="text-muted-foreground">#{rank}</span>;
}

export function Leaderboard() {
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [friendsLeaderboardData, setFriendsLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [friendsLoading, setFriendsLoading] = useState(true);
  const [firebaseError, setFirebaseError] = useState<string | null>(null);
  const currentUserId = "cammal"; // Updated to cammal as specified

  // Global leaderboard
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    
    try {
      const usersRef = collection(db, "users");
      const q = query(usersRef, orderBy("totalFocusTime", "desc"), limit(20));

      unsubscribe = onSnapshot(q, 
        (snapshot) => {
          const users: LeaderboardEntry[] = [];
          let rank = 1;
          
          snapshot.forEach((doc) => {
            const data = doc.data() as UserProfile;
            users.push({
              ...data,
              rank,
              isCurrentUser: data.uid === currentUserId,
            });
            rank++;
          });

          setLeaderboardData(users);
          setLoading(false);
        },
        (error) => {
          console.error("Firebase connection error:", error);
          setLoading(false);
          setFirebaseError("Unable to connect to the database. Make sure the backend is running.");
        }
      );
    } catch (error) {
      console.error("Error setting up global leaderboard:", error);
      setLoading(false);
      setFirebaseError("Failed to load leaderboard.");
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [currentUserId]);

  // Friends leaderboard - real-time subscription
  useEffect(() => {
    // Skip if user ID is invalid
    if (!currentUserId || currentUserId.trim() === "") {
      console.warn("Invalid user ID for friends leaderboard:", currentUserId);
      setFriendsLoading(false);
      return () => {};
    }

    try {
      const unsubscribe = subscribeToFriendsLeaderboard(currentUserId, (friends: UserProfile[]) => {
        const usersWithRank: LeaderboardEntry[] = friends.map((friend: UserProfile, index: number) => ({
          ...friend,
          rank: index + 1,
          isCurrentUser: friend.uid === currentUserId,
        }));
        
        setFriendsLeaderboardData(usersWithRank);
        setFriendsLoading(false);
        setFirebaseError(null); // Clear any previous errors
      });

      return () => {
        if (unsubscribe) unsubscribe();
      };
    } catch (error) {
      console.error("Error setting up friends leaderboard:", error);
      setFriendsLoading(false);
      setFirebaseError("Failed to load friends leaderboard. Please check your connection.");
      // Return empty cleanup function
      return () => {};
    }
  }, [currentUserId]);

  // Helper function to render leaderboard entries
  const renderLeaderboardEntries = (users: LeaderboardEntry[]) => {
    if (users.length === 0) {
      return (
        <p className="text-center text-muted-foreground py-8">
          No friends found. Connect with friends to see their rankings!
        </p>
      );
    }

    return users.map((user) => (
      <div
        key={user.uid}
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
            {user.name.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <p className={user.isCurrentUser ? "text-primary font-semibold" : ""}>
            {user.name}
          </p>
          <p className="text-xs text-muted-foreground">Level {user.level}</p>
        </div>
        <div className="text-right">
          <p className="text-lg text-secondary font-semibold">
            {Math.floor(user.totalFocusTime / 60)}h {user.totalFocusTime % 60}m
          </p>
          <div className="flex items-center gap-1 text-xs text-muted-foreground justify-end">
            <Flame className="w-3 h-3 text-orange-500" />
            <span>{user.currentStreak} day streak</span>
          </div>
        </div>
      </div>
    ));
  };

  // Show error if Firebase connection fails
  if (firebaseError && !loading) {
    return (
      <div className="space-y-6">
        <GlassCard glow>
          <div className="text-center py-8 space-y-3">
            <p className="text-destructive font-semibold">{firebaseError}</p>
            <p className="text-muted-foreground text-sm">Please start your backend server to view the leaderboard.</p>
            <Button 
              variant="outline"
              onClick={() => window.location.reload()}
            >
              Retry
            </Button>
          </div>
        </GlassCard>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <GlassCard glow>
          <div className="text-center py-8">
            <p className="text-muted-foreground">Loading leaderboard...</p>
          </div>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <GlassCard glow>
        <Tabs defaultValue="global" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6 bg-muted/20">
            <TabsTrigger value="friends">Friends</TabsTrigger>
            <TabsTrigger value="global">Global</TabsTrigger>
            <TabsTrigger value="teams">Teams</TabsTrigger>
          </TabsList>

          <TabsContent value="friends" className="space-y-4">
            {firebaseError ? (
              <div className="text-center py-8">
                <p className="text-destructive mb-2">{firebaseError}</p>
                <p className="text-muted-foreground text-sm">You can still view the global leaderboard.</p>
              </div>
            ) : friendsLoading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Loading friends leaderboard...</p>
              </div>
            ) : (
              renderLeaderboardEntries(friendsLeaderboardData)
            )}
          </TabsContent>

          <TabsContent value="global" className="space-y-4">
            {renderLeaderboardEntries(leaderboardData)}
          </TabsContent>

          <TabsContent value="teams">
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <p className="text-center text-muted-foreground">
                Join or create a team to compete together!
              </p>
              <Button 
                variant="outline" 
                className="bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 border-primary/30 text-primary hover:from-primary/20 hover:via-secondary/20 hover:to-accent/20 hover:border-primary/50 transition-all"
              >
                <UserPlus className="w-4 h-4" />
                Add teammates
              </Button>
            </div>
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
