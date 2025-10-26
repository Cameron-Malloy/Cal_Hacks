"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // Auto-login as demo user and redirect to dashboard
    if (typeof window !== "undefined") {
      localStorage.setItem("userEmail", "demo@laserlock.com");
      localStorage.setItem("userId", "demo-user");
      localStorage.setItem("userName", "Demo User");
    }
    
    // Immediate redirect to dashboard
    router.push("/dashboard");
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/10 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-secondary shadow-[0_0_40px_rgba(167,139,250,0.6)] mb-4">
          <span className="text-4xl">🔒</span>
        </div>
        <h1 className="text-4xl mb-2 bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent">
          LaserLock
        </h1>
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}
