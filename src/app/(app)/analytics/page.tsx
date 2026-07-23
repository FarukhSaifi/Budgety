"use client";

import { Suspense } from "react";

import { AnalyticsScreen } from "@components/screens/analytics/AnalyticsScreen";

export default function AnalyticsPage() {
  return (
    <Suspense fallback={null}>
      <AnalyticsScreen />
    </Suspense>
  );
}
