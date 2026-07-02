import { XMLParser } from "fast-xml-parser";
import type { FeedConfig } from "./config.js";

export interface FeedItem {
  title: string;
  url: string;
  date: string;
  description: string;
  source: string;
  category: string;
}

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  htmlEntities: true,
  processEntities: false,
});

/**
 * Fetch and parse an RSS/Atom feed, returning items from the last N days.
 */
export async function fetchFeed(feed: FeedConfig, sinceDays = 7): Promise<FeedItem[]> {
  const since = new Date();
  since.setDate(since.getDate() - sinceDays);

  try {
    const res = await fetch(feed.url, {
      headers: { "User-Agent": "pm-tech-radar/0.1 (research digest bot)" },
    });

    if (!res.ok) {
      console.warn(`[rss] ${feed.id}: HTTP ${res.status}`);
      return [];
    }

    const xml = await res.text();
    const parsed = parser.parse(xml);

    // Handle RSS 2.0
    if (parsed.rss?.channel?.item) {
      return parseRssItems(parsed.rss.channel.item, feed, since);
    }

    // Handle Atom
    if (parsed.feed?.entry) {
      return parseAtomEntries(parsed.feed.entry, feed, since);
    }

    console.warn(`[rss] ${feed.id}: unrecognized feed format`);
    return [];
  } catch (err) {
    console.warn(`[rss] ${feed.id}: fetch error — ${(err as Error).message}`);
    return [];
  }
}

function parseRssItems(items: unknown[], feed: FeedConfig, since: Date): FeedItem[] {
  if (!Array.isArray(items)) items = [items];

  return (items as Record<string, string>[])
    .filter((item) => {
      const pubDate = item["pubDate"] || item["dc:date"];
      if (!pubDate) return true; // include if no date
      return new Date(pubDate) >= since;
    })
    .slice(0, 20)
    .map((item) => ({
      title: item["title"] || "Untitled",
      url: item["link"] || "",
      date: item["pubDate"] || item["dc:date"] || "",
      description: stripHtml(item["description"] || "").slice(0, 500),
      source: feed.name,
      category: feed.category,
    }));
}

function parseAtomEntries(entries: unknown[], feed: FeedConfig, since: Date): FeedItem[] {
  if (!Array.isArray(entries)) entries = [entries];

  return (entries as Record<string, unknown>[])
    .filter((entry) => {
      const updated = (entry["updated"] || entry["published"]) as string | undefined;
      if (!updated) return true;
      return new Date(updated) >= since;
    })
    .slice(0, 20)
    .map((entry) => {
      const link = entry["link"];
      let url = "";
      if (typeof link === "string") url = link;
      else if (link && typeof link === "object") url = (link as Record<string, string>)["@_href"] || "";

      return {
        title: (entry["title"] as string) || "Untitled",
        url,
        date: ((entry["updated"] || entry["published"]) as string) || "",
        description: stripHtml(((entry["summary"] || entry["content"]) as string) || "").slice(0, 500),
        source: feed.name,
        category: feed.category,
      };
    });
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

/**
 * Fetch all configured feeds in parallel.
 * Skips feeds marked as type: sitemap (handled separately in future).
 */
export async function fetchAllFeeds(feeds: FeedConfig[], sinceDays = 7): Promise<FeedItem[]> {
  const rssFeeds = feeds.filter((f) => f.type !== "sitemap");
  const results = await Promise.all(rssFeeds.map((f) => fetchFeed(f, sinceDays)));
  const items = results.flat();
  console.log(`[rss] Fetched ${items.length} items from ${rssFeeds.length} feeds`);
  return items;
}
