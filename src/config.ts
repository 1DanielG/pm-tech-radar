import fs from "node:fs";
import path from "node:path";
import yaml from "js-yaml";

export interface FeedConfig {
  id: string;
  name: string;
  url: string;
  category: string;
  type?: "rss" | "sitemap";
  prefixes?: string[];
}

export interface RepoConfig {
  id: string;
  repo: string;
  name: string;
  category: string;
}

export interface CategoryConfig {
  id: string;
  name: string;
  report_file: string;
}

export interface RadarConfig {
  feeds: FeedConfig[];
  github_repos: RepoConfig[];
  hn_keywords: string[];
  categories: CategoryConfig[];
}

interface RawConfig {
  feeds?: unknown[];
  github_repos?: unknown[];
  hn_keywords?: unknown[];
  categories?: unknown[];
}

const CONFIG_PATH = path.resolve("config.yml");

export function loadConfig(): RadarConfig {
  if (!fs.existsSync(CONFIG_PATH)) {
    console.warn("[config] config.yml not found, using defaults");
    return { feeds: [], github_repos: [], hn_keywords: [], categories: [] };
  }

  const raw = yaml.load(fs.readFileSync(CONFIG_PATH, "utf-8")) as RawConfig;

  return {
    feeds: (raw.feeds || []) as FeedConfig[],
    github_repos: (raw.github_repos || []) as RepoConfig[],
    hn_keywords: (raw.hn_keywords || []) as string[],
    categories: (raw.categories || []) as CategoryConfig[],
  };
}
