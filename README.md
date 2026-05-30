# ComputeScout

**Infrastructure intelligence for AI and ML workloads.**

ComputeScout helps engineering teams find the most cost-effective and reliable place to run GPU workloads. Instead of manually comparing providers, availability, pricing, and regional capacity, ComputeScout analyzes the global compute market and recommends optimal deployment targets using deterministic scoring.

The platform transforms fragmented infrastructure data into actionable intelligence, helping teams make better decisions for inference, training, fine-tuning, and large-scale AI deployments.

Built for the Bright Data AI Agents Hackathon.

## Features

* **Workload Analysis** — Enter workload requirements and receive ranked provider recommendations
* **Global Compute Radar** — Explore real-time market intelligence across GPU providers
* **Provider Intelligence** — Monitor pricing, availability, reliability, and operational health
* **Deterministic Recommendation Engine** — Transparent scoring based on objective infrastructure metrics
* **Market Monitoring** — Aggregate infrastructure intelligence from multiple compute providers

## How It Works

ComputeScout separates interpretation from decision-making.

Natural language models are used to understand workload requirements and explain recommendations. All provider rankings are generated through a deterministic scoring engine, ensuring recommendations remain transparent and reproducible.

```text
User Input
    ↓
Requirement Parser
    ↓
Market Intelligence Layer
    ↓
Recommendation Engine
    ↓
Results & Explanations
```

## Architecture

```text
User Input → Groq Parser → Bright Data Market Data → Recommendation Engine → Groq Narrator → Results
                              ↑                              ↑
                         Parse Only                  Deterministic Ranking
                                                      & Scoring
```

For a detailed system overview, see `docs/ARCHITECTURE.md`.

## Quick Start

```bash
npm install

cp .env.example .env.local

npm run dev
```

Open `http://localhost:3000` to start the application.

## Environment Variables

| Variable                | Description                                              |
| ----------------------- | -------------------------------------------------------- |
| `GROQ_API_KEY`          | Natural language parsing and recommendation explanations |
| `BRIGHT_DATA_API_TOKEN` | Access to live market intelligence                       |
| `BRIGHT_DATA_ZONE`      | Bright Data zone name                                    |
| `USE_MOCK_MARKET_DATA`  | Enable mock market data for development                  |

## Tech Stack

* Next.js 15 (App Router, Server Actions)
* TypeScript
* Tailwind CSS
* TanStack Table
* Groq
* Bright Data
* Drizzle ORM
* SQLite

## Project Structure

```text
src/
├── app/           # Pages and routes
├── actions/       # Server actions
├── components/    # UI components
├── domain/        # Domain models and schemas
└── lib/
    ├── bright-data/      # Market intelligence sources
    ├── recommendation/   # Deterministic scoring engine
    ├── groq/             # Parsing and explanations
    └── db/               # Database schema
```

## License

MIT

