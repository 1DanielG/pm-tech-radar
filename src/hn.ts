export interface HnItem {
  title: string;
  url: string;
  points: number;
  comments: number;
  date: string;
  hnUrl: string;
}

const HN_SEARCH_URL = "https://hn.algolia.com/api/v1/search";

/**
 * Fetch Hacker News stories matching keywords from the last N days.
 */
export async function fetchHnData(keywords: string[], sinceDays = 7): Promise<HnItem[]> {
  if (keywords.length === 0) return [];

  const since = Math.floor((Date.now() - sinceDays * 86400000) / 1000);
  const allItems: HnItem[] = [];

  // Search in batches to avoid overly long queries
  const batches = chunkKeywords(keywords, 3);

  for (const batch of batches) {
    const query = batch.map((k) => `"${k}"`).join(" OR ");
    const url = `${HN_SEARCH_URL}?query=${encodeURIComponent(query)}&tags=story&numericFilters=created_at_i>${since}&hitsPerPage=20`;

    try {
      const res = await fetch(url);
      if (!res.ok) {
        console.warn(`[hn] Search failed: HTTP ${res.status}`);
        continue;
      }

      const data = (await res.json()) as { hits: Record<string, unknown>[] };

      for (const hit of data.hits || []) {
        allItems.push({
          title: hit["title"] as string,
          url: (hit["url"] as string) || `https://news.ycombinator.com/item?id=${hit["objectID"]}`,
          points: (hit["points"] as number) || 0,
          comments: (hit["num_comments"] as number) || 0,
          date: hit["created_at"] as string,
          hnUrl: `https://news.ycombinator.com/item?id=${hit["objectID"]}`,
        });
      }
    } catch (err) {
      console.warn(`[hn] Fetch error: ${(err as Error).message}`);
    }

    // Be polite
    await sleep(300);
  }

  // Deduplicate by URL
  const seen = new Set<string>();
  const unique = allItems.filter((item) => {
    if (seen.has(item.url)) return false;
    seen.add(item.url);
    return true;
  });

  // Sort by points descending
  unique.sort((a, b) => b.points - a.points);

  console.log(`[hn] Fetched ${unique.length} stories matching ${keywords.length} keywords`);
  return unique.slice(0, 30);
}

function chunkKeywords(keywords: string[], size: number): string[][] {
  const chunks: string[][] = [];
  for (let i = 0; i < keywords.length; i += size) {
    chunks.push(keywords.slice(i, i + size));
  }
  return chunks;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
