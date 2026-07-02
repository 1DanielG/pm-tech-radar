# 📡 PM & Tech Radar

Automated weekly research digest for Product Management, Architecture, and Technical Leadership.

## How It Works

```
Fetch → Summarize (LLM) → Compare → Save → Publish
```

A GitHub Actions cron job runs weekly (Monday 08:00 UTC):
1. **Fetches** articles from RSS/Atom feeds, GitHub repo activity, and Hacker News
2. **Summarizes** each category using an LLM (OpenRouter/Claude Haiku)
3. **Synthesizes** cross-source trends in a weekly rollup
4. **Publishes** to GitHub Pages with an RSS feed

## Quick Start

```bash
# Install dependencies
pnpm install

# Set your API key
export OPENROUTER_API_KEY="your-key-here"
export GITHUB_TOKEN="your-github-pat"

# Run the pipeline locally
pnpm start

# Update the web UI index
pnpm manifest
```

## Reports Generated

| Report | Content |
|--------|---------|
| `pm-digest.md` | Product & Program Management news |
| `architecture-digest.md` | Architecture, scoping, ADRs |
| `ai-agents-digest.md` | AI/Agent ecosystem updates |
| `forum-digest.md` | HN & community discussions |
| `weekly-rollup.md` | Cross-source trend synthesis |
| `monthly-rollup.md` | Monthly strategic summary |

## Configuration

Edit `config.yml` to add/remove sources:
- RSS/Atom blog feeds
- GitHub repositories to track
- Hacker News filter keywords

## Cost

~$1-2/month (4 weekly + 1 monthly LLM runs using Claude Haiku via OpenRouter).

## Architecture

Inspired by [duanyytop/agents-radar](https://github.com/duanyytop/agents-radar). GitOps model where the Git repo is the database — no external infrastructure needed.

## License

Private project. Not for redistribution.
