// Entry point for weekly rollup (triggered by cron or manual)
// In V1, the main pipeline already generates a weekly rollup on each run.
// This file exists for future separation of daily vs weekly cadence.

console.log("[weekly] Weekly rollup is generated as part of the main pipeline in V1.");
console.log("[weekly] Run 'pnpm start' to generate all reports including the rollup.");
