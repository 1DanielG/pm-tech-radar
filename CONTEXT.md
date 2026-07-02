# PM & Tech Radar — Project Context

*Created: 2026-07-02*

---

## Purpose

An automated weekly research digest that tracks Product Management, Program Management, Technical Scoping, Architecture Design, and Technical Forum discussions. Fetches from curated sources, summarizes with an LLM, identifies cross-source trends, and publishes to a GitHub Pages web UI.

Architecture inspired by [duanyytop/agents-radar](https://github.com/duanyytop/agents-radar) — a GitOps pipeline where the repo IS the database.

---

## Pipeline

```
Fetch → Summarize (LLM) → Compare → Save → Publish
```

| Phase | What happens |
|-------|-------------|
| **Fetch** | Parallel calls to GitHub API (repos), RSS feeds (blogs), HN Algolia API (filtered) |
| **Summarize** | LLM generates per-source digests (key takeaways, relevance to PM/Tech) |
| **Compare** | LLM identifies cross-source trends and connections |
| **Save** | Markdown files in `digests/YYYY-MM-DD/`, manifest.json updated |
| **Publish** | GitHub Pages SPA reads manifest + Markdown, RSS feed generated |

---

## Sources (MVP — V1)

### RSS/Blog Feeds
| Source | URL | Category |
|--------|-----|----------|
| Lenny's Newsletter | https://www.lennysnewsletter.com/feed | Product Management |
| SVPG (Marty Cagan) | https://www.svpg.com/feed/ | Product Management |
| Anthropic Blog | https://www.anthropic.com/sitemap.xml | AI/Agents |
| AWS Architecture Blog | https://aws.amazon.com/blogs/architecture/feed/ | Architecture Design |
| Martin Fowler | https://martinfowler.com/feed.atom | Architecture/Engineering |
| InfoQ Architecture | https://feed.infoq.com/architecture-design/ | Architecture Design |

### GitHub Repos (Issues/PRs/Releases)
| Repo | Why |
|------|-----|
| `microsoft/tinytroupe` | Synthetic personas — core to my survey pilot |
| `langchain-ai/langgraph` | Agent orchestration framework I use |
| `anthropics/claude-code` | My primary coding agent |
| `joelparkerhenderson/architecture-decision-record` | ADR patterns for technical scoping |
| `productboard/productboard-public` | PM tooling trends |

### Hacker News (Filtered)
Keywords: "product management", "technical architecture", "system design", "AI agent", "program management", "tech lead", "ADR", "synthetic data"

---

## Reports Generated (per run)

| Report | Content |
|--------|---------|
| `pm-digest.md` | Product & Program Management news |
| `architecture-digest.md` | Architecture, scoping, ADRs |
| `ai-agents-digest.md` | AI/Agent ecosystem updates |
| `forum-digest.md` | HN & community discussions |
| `weekly-rollup.md` | Cross-source trend synthesis (weekly only) |

---

## Schedule

| Frequency | When | What |
|-----------|------|------|
| Weekly | Monday 08:00 UTC | Full pipeline: fetch + summarize + compare |
| Monthly | 1st of month | Rollup of weekly reports into strategic trends |

Starting weekly (not daily) to keep noise low and costs minimal.

---

## Tech Stack

| Component | Choice | Reason |
|-----------|--------|--------|
| Language | TypeScript | Match agents-radar for easy reference |
| Runtime | Node.js 20 + tsx | No build step needed |
| LLM | AWS Bedrock (Claude Sonnet) | Same credentials as synthetic-survey-pilot |
| CI/CD | GitHub Actions | Free for public repos |
| Web UI | Single-file SPA (index.html) | Zero dependencies, GitHub Pages |
| Package manager | npm | Available everywhere |
| Testing | Vitest | Lightweight, fast |

---

## LLM Provider Design

Pluggable provider interface (same pattern as agents-radar):

```
src/providers/
├── types.ts              ← LlmProvider interface
├── bedrock.ts            ← Default (same creds as synthetic-survey-pilot)
├── openrouter.ts         ← Fallback (cheapest pay-per-token)
├── openai.ts             ← Fallback
├── index.ts              ← Factory: createProvider()
```

Env var `LLM_PROVIDER` selects provider. Default: `bedrock`.

Rate limiting: concurrency limiter (max 3) + exponential backoff on 429s.

---

## Distribution (MVP)

**V1: GitHub Pages only**
- Static SPA at `https://<user>.github.io/pm-tech-radar/`
- manifest.json as index
- feed.xml (RSS 2.0) for feed readers

**V2 (later):**
- Telegram bot notifications
- MCP server (Cloudflare Worker) for querying from Kiro

---

## Folder Structure

```
pm-tech-radar/
├── .github/
│   └── workflows/
│       ├── weekly-digest.yml     ← Main pipeline (Monday cron)
│       └── monthly-rollup.yml   ← Monthly synthesis
├── src/
│   ├── index.ts                 ← Main orchestrator
│   ├── config.ts                ← Load config.yml
│   ├── github.ts                ← GitHub API fetcher
│   ├── rss.ts                   ← RSS/Atom feed fetcher
│   ├── hn.ts                    ← Hacker News fetcher
│   ├── prompts.ts               ← Prompt templates
│   ├── report.ts                ← LLM call wrapper + file saver
│   ├── report-builders.ts       ← Markdown assembly
│   ├── rollup.ts                ← Weekly/monthly aggregation
│   ├── generate-manifest.ts     ← Manifest + RSS generator
│   └── providers/
│       ├── types.ts
│       ├── openrouter.ts
│       ├── openai.ts
│       └── index.ts
├── digests/                     ← Generated reports (Git-committed)
│   └── .gitkeep
├── config.yml                   ← Source configuration
├── index.html                   ← Web UI (GitHub Pages)
├── manifest.json                ← Report index
├── feed.xml                     ← RSS feed
├── package.json
├── tsconfig.json
├── vitest.config.ts
├── CONTEXT.md                   ← This file
└── README.md
```

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GITHUB_TOKEN` | Yes | GitHub API access (auto-provided in Actions) |
| `AWS_ACCESS_KEY_ID` | Yes (for Bedrock) | AWS IAM credentials |
| `AWS_SECRET_ACCESS_KEY` | Yes (for Bedrock) | AWS IAM credentials |
| `AWS_REGION` | No | Default: `us-east-1` |
| `BEDROCK_MODEL` | No | Default: `us.anthropic.claude-sonnet-4-20250514` |
| `LLM_PROVIDER` | No | Default: `bedrock`. Options: `bedrock`, `openrouter`, `openai` |
| `OPENROUTER_API_KEY` | If using openrouter | Fallback LLM provider |

---

## Cost Estimate

| Item | Monthly cost |
|------|-------------|
| GitHub Actions | Free (public repo) |
| OpenRouter (4 weekly runs + 1 monthly) | ~$1-2 |
| GitHub Pages hosting | Free |
| **Total** | **~$1-2/month** |

---

## MVP Milestones

| # | Milestone | Deliverable |
|---|-----------|-------------|
| 1 | Project scaffolding | package.json, tsconfig, folder structure, config.yml |
| 2 | RSS fetcher | Fetch + parse RSS/Atom feeds, return structured items |
| 3 | GitHub fetcher | Fetch recent issues/PRs/releases for configured repos |
| 4 | HN fetcher | Fetch + filter HN stories by keywords |
| 5 | LLM provider | OpenRouter provider + factory + retry logic |
| 6 | Summarizer | Per-source LLM summaries |
| 7 | Report builder | Assemble Markdown reports |
| 8 | Manifest generator | Scan digests/ → manifest.json + feed.xml |
| 9 | Web UI | Single-file SPA reading manifest + Markdown |
| 10 | GitHub Actions | Weekly cron workflow |
| 11 | First live run | End-to-end: sources → digest → published |

---

## Key Design Decisions

1. **Weekly, not daily** — Less noise, higher signal. Can switch to daily later.
2. **English only** — No bilingual complexity.
3. **Git = database** — No external DB. Reports are Markdown files committed to the repo.
4. **Cheap LLM** — Haiku/4o-mini for daily summaries. Use stronger model only for monthly rollups.
5. **Start with 6 sources** — Expand gradually. Quality over quantity.
6. **No auth on web UI** — Public. If needed later, switch repo to private + org Pages.
