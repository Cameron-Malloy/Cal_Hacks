"use client";

import { DashboardLayout } from "@/components/laserlock/DashboardLayout";
import { SessionReport } from "@/components/laserlock/SessionReport";

export default function ReportPage() {
  return (
    <DashboardLayout>
      <SessionReport />
    </DashboardLayout>
  );
}
