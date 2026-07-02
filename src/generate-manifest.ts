import fs from "node:fs";
import path from "node:path";

const DIGESTS_DIR = path.resolve("digests");
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_FEED_ITEMS = 30;

const REPORT_FILES = [
  "pm-digest",
  "architecture-digest",
  "ai-agents-digest",
  "forum-digest",
  "weekly-rollup",
  "monthly-rollup",
];

const REPORT_LABELS: Record<string, string> = {
  "pm-digest": "Product & Program Management Digest",
  "architecture-digest": "Architecture & Technical Scoping Digest",
  "ai-agents-digest": "AI & Agent Ecosystem Digest",
  "forum-digest": "Community & Forum Highlights",
  "weekly-rollup": "Weekly Trend Synthesis",
  "monthly-rollup": "Monthly Strategic Rollup",
};

interface DateEntry {
  date: string;
  reports: string[];
}

interface Manifest {
  generated: string;
  dates: DateEntry[];
}

function toRfc822(dateStr: string): string {
  return new Date(dateStr + "T12:00:00Z").toUTCString();
}

function escapeXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function main() {
  if (!fs.existsSync(DIGESTS_DIR)) {
    fs.mkdirSync(DIGESTS_DIR, { recursive: true });
  }

  // Scan for date directories
  const dirs = fs
    .readdirSync(DIGESTS_DIR)
    .filter((d) => DATE_RE.test(d) && fs.statSync(path.join(DIGESTS_DIR, d)).isDirectory())
    .sort()
    .reverse();

  // Build manifest
  const dates: DateEntry[] = dirs.map((date) => {
    const reports = REPORT_FILES.filter((f) =>
      fs.existsSync(path.join(DIGESTS_DIR, date, `${f}.md`))
    );
    return { date, reports };
  });

  const manifest: Manifest = {
    generated: new Date().toISOString(),
    dates,
  };

  fs.writeFileSync(path.resolve("manifest.json"), JSON.stringify(manifest, null, 2), "utf-8");
  console.log(`[manifest] Updated manifest.json (${dates.length} dates)`);

  // Generate RSS feed
  const pagesUrl = "https://user.github.io/pm-tech-radar"; // Update with your actual URL
  const feedItems = dates
    .flatMap((d) =>
      d.reports.map((r) => ({
        date: d.date,
        report: r,
        title: REPORT_LABELS[r] || r,
        link: `${pagesUrl}/#${d.date}/${r}`,
      }))
    )
    .slice(0, MAX_FEED_ITEMS);

  const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
  <title>PM &amp; Tech Radar</title>
  <link>${pagesUrl}</link>
  <description>Automated weekly research digest for Product Management, Architecture, and Technical Leadership</description>
  <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${feedItems
  .map(
    (item) => `  <item>
    <title>${escapeXml(item.title)} — ${item.date}</title>
    <link>${item.link}</link>
    <pubDate>${toRfc822(item.date)}</pubDate>
    <guid>${item.link}</guid>
  </item>`
  )
  .join("\n")}
</channel>
</rss>`;

  fs.writeFileSync(path.resolve("feed.xml"), rssXml, "utf-8");
  console.log(`[manifest] Updated feed.xml (${feedItems.length} items)`);
}

main();
