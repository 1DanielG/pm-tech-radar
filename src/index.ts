import { loadConfig } from "./config.js";
import { fetchAllFeeds } from "./rss.js";
import { fetchAllRepos } from "./github.js";
import { fetchHnData } from "./hn.js";
import { buildFeedSummaryPrompt, buildRepoSummaryPrompt, buildHnSummaryPrompt, buildWeeklyRollupPrompt } from "./prompts.js";
import { callLlm, saveDigest, todayStr, LLM_TOKENS_DEFAULT } from "./report.js";

async function main() {
  const config = loadConfig();
  const dateStr = todayStr();
  console.log(`\n[radar] Starting PM & Tech Radar — ${dateStr}\n`);

  // === Phase 1: Fetch ===
  console.log("[phase] 1/4 — Fetching data...");
  const [feedItems, githubItems, hnItems] = await Promise.all([
    fetchAllFeeds(config.feeds, 7),
    fetchAllRepos(config.github_repos, 7),
    fetchHnData(config.hn_keywords, 7),
  ]);

  // === Phase 2: Summarize per category ===
  console.log("[phase] 2/4 — Generating summaries...");
  const reportContents: Record<string, string> = {};

  for (const category of config.categories) {
    const catFeeds = feedItems.filter((f) => f.category === category.id);
    const catRepos = githubItems.filter((g) => g.category === category.id);

    let content = `# ${category.name} — Weekly Digest\n\n*${dateStr}*\n\n`;

    // Feed summary
    if (catFeeds.length > 0) {
      const prompt = buildFeedSummaryPrompt(catFeeds, category.name);
      const summary = await callLlm(prompt, LLM_TOKENS_DEFAULT);
      content += `## Articles & Blogs\n\n${summary}\n\n`;
    }

    // Repo summary
    if (catRepos.length > 0) {
      const prompt = buildRepoSummaryPrompt(catRepos, category.name);
      const summary = await callLlm(prompt, LLM_TOKENS_DEFAULT);
      content += `## Open Source Activity\n\n${summary}\n\n`;
    }

    // Skip empty reports
    if (catFeeds.length === 0 && catRepos.length === 0) {
      content += "*No notable activity this week.*\n";
    }

    reportContents[category.name] = content;
    saveDigest(dateStr, category.report_file, content);
  }

  // HN/Forum digest
  if (hnItems.length > 0) {
    const prompt = buildHnSummaryPrompt(hnItems);
    const hnContent = `# Community & Forum Highlights — Weekly Digest\n\n*${dateStr}*\n\n${await callLlm(prompt, LLM_TOKENS_DEFAULT)}\n`;
    reportContents["Community & Forum"] = hnContent;
    saveDigest(dateStr, "forum-digest", hnContent);
  }

  // === Phase 3: Compare (Weekly Rollup) ===
  console.log("[phase] 3/4 — Cross-source trend synthesis...");
  const rollupPrompt = buildWeeklyRollupPrompt(reportContents, dateStr);
  const rollupContent = `# Weekly Rollup — Cross-Source Trends\n\n*${dateStr}*\n\n${await callLlm(rollupPrompt, LLM_TOKENS_DEFAULT)}\n`;
  saveDigest(dateStr, "weekly-rollup", rollupContent);

  // === Phase 4: Done ===
  console.log("[phase] 4/4 — Complete!");
  console.log(`\n[radar] Reports saved to digests/${dateStr}/`);
  console.log("[radar] Run 'pnpm manifest' to update the web UI index.\n");
}

main().catch((err) => {
  console.error("[radar] Fatal error:", err);
  process.exit(1);
});
