import fs from "node:fs";
import path from "node:path";
import { callLlm, saveDigest, todayStr, LLM_TOKENS_ROLLUP } from "./report.js";

const DIGESTS_DIR = path.resolve("digests");

/**
 * Monthly rollup: reads all weekly-rollup.md files from the past month
 * and synthesizes them into a strategic monthly summary.
 */
async function main() {
  const dateStr = todayStr();
  const now = new Date();
  const monthAgo = new Date(now);
  monthAgo.setMonth(monthAgo.getMonth() - 1);

  console.log(`[monthly] Generating monthly rollup for ${dateStr}...`);

  // Find all weekly rollups from the past month
  const dirs = fs
    .readdirSync(DIGESTS_DIR)
    .filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d))
    .filter((d) => {
      const dirDate = new Date(d);
      return dirDate >= monthAgo && dirDate <= now;
    })
    .sort();

  const weeklyContents: string[] = [];
  for (const dir of dirs) {
    const rollupPath = path.join(DIGESTS_DIR, dir, "weekly-rollup.md");
    if (fs.existsSync(rollupPath)) {
      const content = fs.readFileSync(rollupPath, "utf-8");
      weeklyContents.push(`### Week of ${dir}\n\n${content.slice(0, 2500)}`);
    }
  }

  if (weeklyContents.length === 0) {
    console.log("[monthly] No weekly rollups found for the past month. Skipping.");
    return;
  }

  const prompt = `You are a strategic advisor compiling a monthly intelligence briefing for a Technical PM leader.

Below are the weekly trend synthesis reports from the past month. Your job:

1. **Month in Review** — The 3-5 most significant developments (not just news, but shifts)
2. **Trajectory** — Where is each trend heading? Accelerating, plateauing, or fading?
3. **Strategic implications** — What should change in how we build, plan, or prioritize?
4. **Next month's watch list** — 2-3 things to track closely in the coming weeks

Be opinionated. Prioritize signal over comprehensiveness. Under 800 words.

---

WEEKLY ROLLUPS (${weeklyContents.length} weeks):

${weeklyContents.join("\n\n---\n\n")}`;

  const summary = await callLlm(prompt, LLM_TOKENS_ROLLUP);
  const content = `# Monthly Strategic Rollup\n\n*${dateStr} — Covering ${dirs[0]} to ${dirs[dirs.length - 1]}*\n\n${summary}\n`;

  saveDigest(dateStr, "monthly-rollup", content);
  console.log(`[monthly] Monthly rollup saved.`);
}

main().catch((err) => {
  console.error("[monthly] Fatal error:", err);
  process.exit(1);
});
