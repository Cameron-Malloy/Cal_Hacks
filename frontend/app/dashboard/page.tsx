"use client";

import { DashboardLayout } from "@/components/laserlock/DashboardLayout";
import { FocusDashboard } from "@/components/laserlock/FocusDashboard";

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <FocusDashboard />
    </DashboardLayout>
  );
}
