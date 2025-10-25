"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { ProfileMenu } from "./ProfileMenu";
import { Flame } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    // Check if user is logged in
    if (typeof window !== "undefined") {
      const email = localStorage.getItem("userEmail");
      if (!email) {
        router.push("/");
      } else {
        setUserEmail(email);
      }
    }
  }, [router]);

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("userEmail");
    }
    router.push("/");
  };

  const handleNavigateToProfile = () => router.push("/settings");
  const handleNavigateToAchievements = () => router.push("/dashboard");
  const handleNavigateToStats = () => router.push("/report");
  const handleNavigateToSettings = () => router.push("/settings");

  // Extract name from email for display
  const userName = userEmail
    ? userEmail
        .split("@")[0]
        .replace(/[.-]/g, " ")
        .replace(/\b\w/g, (l) => l.toUpperCase())
    : "User";

  const navItems = [
    { label: "Dashboard", path: "/dashboard" },
    { label: "Report", path: "/report" },
    { label: "Leaderboard", path: "/leaderboard" },
    { label: "Challenges", path: "/challenges" },
    { label: "Insights", path: "/insights" },
    { label: "Settings", path: "/settings" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/10">
      {/* Animated Background Particles */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 20 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-primary/30 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.2, 0.6, 0.2],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-card/40 border-b border-primary/20 shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/dashboard" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-[0_0_20px_rgba(167,139,250,0.5)]">
                <span className="text-xl">🔒</span>
              </div>
              <div>
                <h1 className="text-primary">LaserLock</h1>
                <p className="text-xs text-muted-foreground">
                  Focus. Flow. Freedom.
                </p>
              </div>
            </Link>
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30">
                <Flame className="w-5 h-5 text-orange-500" />
                <span className="text-orange-500">4 Days Locked In</span>
              </div>
              <ProfileMenu
                userName={userName}
                userEmail={userEmail}
                onNavigateToProfile={handleNavigateToProfile}
                onNavigateToAchievements={handleNavigateToAchievements}
                onNavigateToStats={handleNavigateToStats}
                onNavigateToSettings={handleNavigateToSettings}
                onLogout={handleLogout}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="sticky top-[73px] z-40 backdrop-blur-xl bg-card/60 border-b border-primary/20">
        <div className="container mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto">
            {navItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className={cn(
                  "px-6 py-3 text-sm font-medium transition-all whitespace-nowrap",
                  pathname === item.path
                    ? "bg-gradient-to-r from-primary/20 to-secondary/20 text-primary border-b-2 border-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-primary/10"
                )}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 relative z-10">
        {children}
      </main>

      {/* Footer */}
      <footer className="backdrop-blur-xl bg-card/40 border-t border-primary/20 mt-16">
        <div className="container mx-auto px-4 py-6 text-center">
          <p className="text-muted-foreground text-sm">
            LaserLock — Focus. Flow. Freedom. Empowering neurodiverse minds to
            thrive.
          </p>
          <p className="text-xs text-muted-foreground/60 mt-2">
            Built with empathy for ADHD and neurodivergent users
          </p>
        </div>
      </footer>
    </div>
  );
}
