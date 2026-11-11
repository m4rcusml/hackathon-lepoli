export const scenarioNames = [
  "active-initial",
  "active-with-updates",
  "concurrent-update",
  "restricted-exams",
  "pending-followup",
  "rejected-followup",
  "expired",
  "revoked",
  "temporary-only",
  "empty-portfolio",
  "empty-patient",
  "briefing-unavailable",
  "source-stale",
  "backend-unavailable",
  "invalid-response",
] as const;
export type DemoScenario = (typeof scenarioNames)[number];
