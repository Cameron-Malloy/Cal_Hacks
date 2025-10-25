"use client";

import { DashboardLayout } from "@/components/laserlock/DashboardLayout";
import { Leaderboard } from "@/components/laserlock/Leaderboard";

export default function LeaderboardPage() {
  return (
    <DashboardLayout>
      <Leaderboard />
    </DashboardLayout>
  );
}
