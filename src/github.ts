import type { RepoConfig } from "./config.js";

export interface GitHubItem {
  title: string;
  url: string;
  type: "issue" | "pr" | "release";
  date: string;
  author: string;
  labels: string[];
  comments: number;
  body: string;
  repo: string;
  category: string;
}

const GITHUB_TOKEN = process.env["GITHUB_TOKEN"] || "";

async function githubGet(url: string): Promise<unknown> {
  const res = await fetch(url, {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: GITHUB_TOKEN ? `Bearer ${GITHUB_TOKEN}` : "",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });

  if (!res.ok) {
    console.warn(`[github] ${url}: HTTP ${res.status}`);
    return [];
  }

  return res.json();
}

/**
 * Fetch recent issues and PRs for a repo (last N days).
 */
export async function fetchRepoActivity(repo: RepoConfig, sinceDays = 7): Promise<GitHubItem[]> {
  const since = new Date();
  since.setDate(since.getDate() - sinceDays);
  const sinceStr = since.toISOString();

  const [issues, releases] = await Promise.all([
    fetchIssuesAndPRs(repo, sinceStr),
    fetchReleases(repo, since),
  ]);

  return [...issues, ...releases];
}

async function fetchIssuesAndPRs(repo: RepoConfig, since: string): Promise<GitHubItem[]> {
  const url = `https://api.github.com/repos/${repo.repo}/issues?state=all&since=${since}&per_page=30&sort=updated`;
  const data = (await githubGet(url)) as Record<string, unknown>[];

  if (!Array.isArray(data)) return [];

  return data.map((item) => ({
    title: item["title"] as string,
    url: item["html_url"] as string,
    type: item["pull_request"] ? ("pr" as const) : ("issue" as const),
    date: item["updated_at"] as string,
    author: (item["user"] as Record<string, string>)?.["login"] || "unknown",
    labels: ((item["labels"] as Record<string, string>[]) || []).map((l) => l["name"] || "").filter(Boolean),
    comments: (item["comments"] as number) || 0,
    body: ((item["body"] as string) || "").slice(0, 300),
    repo: repo.name,
    category: repo.category,
  }));
}

async function fetchReleases(repo: RepoConfig, since: Date): Promise<GitHubItem[]> {
  const url = `https://api.github.com/repos/${repo.repo}/releases?per_page=5`;
  const data = (await githubGet(url)) as Record<string, unknown>[];

  if (!Array.isArray(data)) return [];

  return data
    .filter((r) => new Date(r["published_at"] as string) >= since)
    .map((r) => ({
      title: `Release: ${r["name"] || r["tag_name"]}`,
      url: r["html_url"] as string,
      type: "release" as const,
      date: r["published_at"] as string,
      author: (r["author"] as Record<string, string>)?.["login"] || "unknown",
      labels: [],
      comments: 0,
      body: ((r["body"] as string) || "").slice(0, 500),
      repo: repo.name,
      category: repo.category,
    }));
}

/**
 * Fetch all configured repos in parallel.
 */
export async function fetchAllRepos(repos: RepoConfig[], sinceDays = 7): Promise<GitHubItem[]> {
  const results = await Promise.all(repos.map((r) => fetchRepoActivity(r, sinceDays)));
  const items = results.flat();
  console.log(`[github] Fetched ${items.length} items from ${repos.length} repos`);
  return items;
}
