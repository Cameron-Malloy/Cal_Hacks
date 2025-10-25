"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Login } from "@/components/laserlock/Login";

export default function HomePage() {
  const router = useRouter();

  const handleLogin = (email: string) => {
    // Store user email in localStorage for now (mock authentication)
    if (typeof window !== "undefined") {
      localStorage.setItem("userEmail", email);
    }
    // Redirect to dashboard
    router.push("/dashboard");
  };

  return <Login onLogin={handleLogin} />;
}
