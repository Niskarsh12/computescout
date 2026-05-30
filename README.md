# ComputeScout

**Find the best place on Earth to run your workload.**

Infrastructure intelligence for AI/ML teams. ComputeScout monitors the global GPU compute market and recommends optimal providers based on deterministic scoring — not AI guesswork.

Built for the [Bright Data AI Agents Hackathon](https://brightdata.com).

## Features

- **Compute Analysis** — Enter workload requirements, get ranked provider recommendations
- **Global Compute Radar** — Bloomberg-style market intelligence table
- **Provider Intelligence** — Health scores, availability, incidents, and pricing per provider
- **Deterministic Scoring** — Price, availability, reliability, and region weights
- **Bright Data Integration** — Live market data from RunPod, Vast.ai, Nebius, Lambda

## Architecture

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for full system design.

```
User Input → Groq Parser → Bright Data Market Data → Recommendation Engine → Groq Narrator → Results
                              ↑                              ↑
                         (parse only)                  (deterministic)
                                                          (explain only)
```

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Add your API keys to .env.local
# GROQ_API_KEY=your_groq_key
# BRIGHT_DATA_API_TOKEN=your_bright_data_token

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Deploy on Vercel (recommended for demo)

**One deploy — no separate API.** Next.js pages, server actions, and `/api/*` routes all deploy together on Vercel.

1. Push this repo to GitHub
2. Go to [vercel.com/new](https://vercel.com/new) → Import your GitHub repo
3. Add **Environment Variables** (Settings → Environment Variables):

| Variable | Value |
|----------|-------|
| `GROQ_API_KEY` | your Groq key |
| `BRIGHT_DATA_API_TOKEN` | your Bright Data token |
| `BRIGHT_DATA_ZONE` | `web_unlocker1` |
| `USE_MOCK_MARKET_DATA` | `false` |

4. Deploy. Your demo URL will be `https://your-project.vercel.app`

**Note:** Bright Data scraping can take 30–60s on first load. Vercel **Pro** allows 60s function timeout (configured in `vercel.json`). On Hobby (free), if Radar times out, set `USE_MOCK_MARKET_DATA=true` as fallback for the demo.

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GROQ_API_KEY` | Optional | NL parsing & explanation (fallback if missing) |
| `BRIGHT_DATA_API_TOKEN` | Optional | Live market data (mock if missing) |
| `BRIGHT_DATA_ZONE` | Optional | Bright Data zone name |
| `USE_MOCK_MARKET_DATA` | Optional | Force mock data (`true`/`false`) |

## Tech Stack

- Next.js 15 (App Router, Server Actions)
- TypeScript
- Tailwind CSS 4
- TanStack Table
- Groq (parsing & narration only)
- Bright Data (market intelligence)
- Drizzle ORM + SQLite

## Project Structure

```
src/
├── app/           # Pages (Landing, Analyze, Results, Radar, Providers)
├── actions/       # Server actions
├── components/    # UI components
├── domain/        # Domain models & Zod schemas
└── lib/
    ├── bright-data/    # Provider data sources
    ├── recommendation/ # Deterministic scoring engine
    ├── groq/           # NL parser & narrator
    └── db/             # SQLite schema
```

## License

MIT
