import type { FeedItem } from "./rss.js";
import type { GitHubItem } from "./github.js";
import type { HnItem } from "./hn.js";

/**
 * Build a prompt to summarize RSS feed items for a given category.
 */
export function buildFeedSummaryPrompt(items: FeedItem[], categoryName: string): string {
  if (items.length === 0) return "";

  const itemsText = items
    .map((item, i) => {
      return `${i + 1}. [${item.source}] "${item.title}" (${item.date || "no date"})\n   ${item.description || "No description"}`;
    })
    .join("\n\n");

  return `You are a senior technical product manager who monitors industry developments.

Summarize the following ${categoryName} articles from the past week. For each notable item:
- State the key insight or announcement (1-2 sentences)
- Explain why it matters for a Technical PM / architect (1 sentence)

Skip items that are trivial announcements, minor updates, or marketing fluff.

Group your summary by theme if patterns emerge. End with a "Signal" section noting any trend that appears across multiple sources.

FORMAT: Markdown with ## headings. Keep total output under 800 words.

---

ARTICLES (${items.length} items):

${itemsText}`;
}

/**
 * Build a prompt to summarize GitHub repo activity.
 */
export function buildRepoSummaryPrompt(items: GitHubItem[], categoryName: string): string {
  if (items.length === 0) return "";

  const itemsText = items
    .slice(0, 25)
    .map((item, i) => {
      const labels = item.labels.length > 0 ? ` [${item.labels.join(", ")}]` : "";
      return `${i + 1}. [${item.repo}] ${item.type.toUpperCase()}: "${item.title}"${labels} by @${item.author} (${item.comments} comments)\n   ${item.body.slice(0, 200)}`;
    })
    .join("\n\n");

  return `You are a senior engineer tracking open-source ecosystem developments.

Summarize the notable GitHub activity in ${categoryName} repos from the past week:
- Highlight significant releases, breaking changes, or new features
- Note active discussions or issues with high community engagement
- Skip routine maintenance PRs, typo fixes, and bot activity

FORMAT: Markdown with ## headings per repo (only repos with notable activity). Keep under 600 words.

---

ACTIVITY (showing top ${Math.min(items.length, 25)} of ${items.length}):

${itemsText}`;
}

/**
 * Build a prompt to summarize Hacker News discussions.
 */
export function buildHnSummaryPrompt(items: HnItem[]): string {
  if (items.length === 0) return "";

  const itemsText = items
    .slice(0, 20)
    .map((item, i) => {
      return `${i + 1}. "${item.title}" (${item.points} pts, ${item.comments} comments)\n   ${item.url}`;
    })
    .join("\n\n");

  return `You are a senior technical leader scanning community discussions for signals.

From the following Hacker News stories, identify:
- Emerging debates or shifts in thinking about product management, architecture, or AI
- Contrarian takes that challenge mainstream views
- Practical advice or tools that got strong community validation

Skip: self-promotion, job posts, show-HN projects with <10 points.

FORMAT: Markdown. 3-5 bullet points, each with the story title linked and a 1-2 sentence takeaway. End with one "Community sentiment" line. Keep under 400 words.

---

STORIES (${items.length} items):

${itemsText}`;
}

/**
 * Build a prompt for the weekly cross-source comparison/trend synthesis.
 */
export function buildWeeklyRollupPrompt(reportContents: Record<string, string>, dateStr: string): string {
  const sections = Object.entries(reportContents)
    .map(([name, content]) => `## ${name}\n\n${content.slice(0, 2000)}`)
    .join("\n\n---\n\n");

  return `You are a strategic advisor synthesizing weekly intelligence for a Technical PM leader.

Below are this week's (${dateStr}) individual category digests. Your job:

1. **Cross-cutting trends** — What themes appear across 2+ categories? (2-3 trends max)
2. **So what?** — For each trend, state the implication for product/architecture decisions
3. **Action items** — 2-3 concrete things to investigate, try, or discuss with the team
4. **Weak signals** — Anything that seems early but could be important in 3-6 months

FORMAT: Markdown with ## headings for each section above. Be opinionated and specific. No filler. Under 600 words.

---

THIS WEEK'S DIGESTS:

${sections}`;
}
