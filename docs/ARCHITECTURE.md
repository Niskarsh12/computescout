# ComputeScout — System Architecture

> Find the best place on Earth to run your workload.

## 1. System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              CLIENT (Next.js 15)                        │
│  Landing │ Analysis │ Results │ Compute Radar │ Provider Detail         │
└───────────────────────────────┬─────────────────────────────────────────┘
                                │
                    Server Actions / RSC
                                │
┌───────────────────────────────▼─────────────────────────────────────────┐
│                         APPLICATION LAYER                               │
│  analyzeWorkload()  │  getMarketRadar()  │  getProviderDetail()          │
└───────┬─────────────────────┬──────────────────────┬────────────────────┘
        │                     │                      │
        ▼                     ▼                      ▼
┌───────────────┐   ┌─────────────────┐   ┌─────────────────────────────┐
│  Groq Parser  │   │ Recommendation  │   │   Market Data Aggregator    │
│  (parse only) │   │ Engine (pure)   │   │   (ProviderDataSource[])    │
└───────────────┘   └─────────────────┘   └──────────────┬──────────────┘
        │                     ▲                          │
        │                     │                          ▼
        │              WorkloadProfile              ┌─────────────┐
        │              MarketSnapshot               │ Bright Data │
        ▼                                           │ RunPod      │
┌───────────────┐                                   │ Vast.ai     │
│ Groq Narrator │◄── ComputeRecommendation          │ Nebius      │
│ (explain only)│                                   │ Lambda      │
└───────────────┘                                   │ Mock (rest) │
                                                    └─────────────┘
                                │
                                ▼
                    ┌───────────────────────┐
                    │  SQLite (Drizzle)   │
                    │  market_snapshots   │
                    │  analysis_runs      │
                    │  provider_health    │
                    └───────────────────────┘
```

### Design Principles

| Layer | Responsibility | AI Allowed? |
|-------|---------------|-------------|
| **Groq Parser** | NL → structured `WorkloadRequest` | Yes (parsing only) |
| **Bright Data** | Live provider market data | No |
| **Recommendation Engine** | Deterministic scoring & ranking | **Never** |
| **Groq Narrator** | Structured result → human explanation | Yes (narration only) |
| **UI** | Display normalized domain models | No |

---

## 2. Folder Structure

```
computescout/
├── docs/
│   └── ARCHITECTURE.md          # This document
├── drizzle/
│   └── migrations/              # SQL migrations
├── public/
├── src/
│   ├── app/                     # Next.js App Router pages
│   │   ├── layout.tsx
│   │   ├── page.tsx             # Landing
│   │   ├── analyze/
│   │   │   └── page.tsx         # Analysis form
│   │   ├── results/
│   │   │   └── page.tsx         # Recommendation results
│   │   ├── radar/
│   │   │   └── page.tsx         # Global Compute Radar
│   │   └── providers/
│   │       └── [slug]/
│   │           └── page.tsx     # Provider detail
│   ├── actions/                 # Server actions
│   │   ├── analyze.ts
│   │   ├── radar.ts
│   │   └── providers.ts
│   ├── components/
│   │   ├── ui/                  # Shadcn primitives
│   │   ├── layout/              # Header, Footer, Nav
│   │   ├── analysis/            # Workload form
│   │   ├── results/             # Recommendation cards
│   │   ├── radar/               # Market table (TanStack)
│   │   └── providers/           # Provider intelligence
│   ├── domain/                  # Pure domain types & schemas
│   │   ├── provider.ts
│   │   ├── workload.ts
│   │   ├── recommendation.ts
│   │   └── market.ts
│   ├── lib/
│   │   ├── groq/
│   │   │   ├── client.ts
│   │   │   ├── parser.ts        # Step 1: NL parsing
│   │   │   └── narrator.ts      # Step 4: Explanation
│   │   ├── bright-data/
│   │   │   ├── client.ts        # Bright Data HTTP client
│   │   │   ├── types.ts
│   │   │   ├── aggregator.ts    # Orchestrates all sources
│   │   │   └── sources/
│   │   │       ├── base.ts      # ProviderDataSource interface
│   │   │       ├── runpod.ts
│   │   │       ├── vast.ts
│   │   │       ├── nebius.ts
│   │   │       ├── lambda.ts
│   │   │       └── mock.ts      # TensorDock, Crusoe, etc.
│   │   ├── recommendation/
│   │   │   ├── engine.ts        # Main scoring orchestrator
│   │   │   ├── weights.ts       # Priority → weight mapping
│   │   │   └── scorers/
│   │   │       ├── price.ts
│   │   │       ├── availability.ts
│   │   │       ├── reliability.ts
│   │   │       └── region.ts
│   │   ├── db/
│   │   │   ├── index.ts
│   │   │   └── schema.ts
│   │   └── utils.ts
│   └── styles/
│       └── globals.css
├── drizzle.config.ts
├── .env.example
└── package.json
```

---

## 3. Database Schema

SQLite via Drizzle ORM. Used for caching market snapshots and audit trail.

```sql
-- Cached market data from Bright Data aggregation
CREATE TABLE market_snapshots (
  id            TEXT PRIMARY KEY,
  provider_id   TEXT NOT NULL,
  gpu_type      TEXT NOT NULL,
  region        TEXT NOT NULL,
  hourly_price  REAL NOT NULL,
  availability  INTEGER NOT NULL,  -- GPU count available
  health_score  INTEGER NOT NULL,   -- 0-100
  status        TEXT NOT NULL,      -- operational | degraded | outage
  raw_source    TEXT NOT NULL,      -- 'bright_data' | 'mock'
  fetched_at    INTEGER NOT NULL,   -- unix timestamp
  expires_at    INTEGER NOT NULL
);

CREATE INDEX idx_snapshots_provider ON market_snapshots(provider_id);
CREATE INDEX idx_snapshots_fetched ON market_snapshots(fetched_at);

-- Provider health history
CREATE TABLE provider_health (
  id            TEXT PRIMARY KEY,
  provider_id   TEXT NOT NULL,
  health_score  INTEGER NOT NULL,
  status        TEXT NOT NULL,
  incidents     TEXT,               -- JSON array
  summary       TEXT,
  recorded_at   INTEGER NOT NULL
);

-- Analysis run audit log
CREATE TABLE analysis_runs (
  id              TEXT PRIMARY KEY,
  workload_json   TEXT NOT NULL,    -- WorkloadProfile JSON
  result_json     TEXT NOT NULL,    -- ComputeRecommendation JSON
  created_at      INTEGER NOT NULL
);
```

**Cache TTL:** 5 minutes for market snapshots (configurable).

---

## 4. Domain Models

### Provider

```typescript
interface Provider {
  id: string;           // 'runpod' | 'vast' | 'nebius' | 'lambda' | ...
  name: string;
  slug: string;
  website: string;
  regions: Region[];
  supportedGpus: GpuType[];
}
```

### ProviderInventory

```typescript
interface ProviderInventory {
  providerId: string;
  gpuType: GpuType;
  region: Region;
  availableCount: number;
  totalCapacity?: number;
  lastUpdated: Date;
}
```

### ProviderHealth

```typescript
interface ProviderHealth {
  providerId: string;
  score: number;          // 0-100
  status: ProviderStatus;
  recentIncidents: Incident[];
  priceTrend: 'up' | 'down' | 'stable';
  availabilityLevel: 'high' | 'medium' | 'low';
  summary: string;
  lastUpdated: Date;
}
```

### WorkloadRequest (raw user input)

```typescript
interface WorkloadRequest {
  rawInput?: string;
  workload: string;
  budget: number;
  deadlineHours: number;
  region: Region;
  priority: Priority;
}
```

### WorkloadProfile (parsed by Groq)

```typescript
interface WorkloadProfile {
  workloadType: WorkloadType;
  model?: string;
  budget: number;
  deadlineHours: number;
  region: Region;
  priority: Priority;
  requiredGpu?: GpuType;
  estimatedGpuHours?: number;
}
```

### ComputeRecommendation

```typescript
interface ComputeRecommendation {
  id: string;
  profile: WorkloadProfile;
  primary: RankedProvider;
  alternatives: RankedProvider[];
  explanation: string;
  analyzedAt: Date;
}

interface RankedProvider {
  provider: Provider;
  score: RecommendationScore;
  estimatedCost: number;
  estimatedCompletionHours: number;
  availableGpus: number;
  savingsVsAws?: number;
}

interface RecommendationScore {
  total: number;          // 0-100
  price: number;
  availability: number;
  reliability: number;
  region: number;
}
```

### MarketSnapshot

```typescript
interface MarketSnapshot {
  entries: MarketEntry[];
  fetchedAt: Date;
  sourceBreakdown: { brightData: number; mock: number };
}

interface MarketEntry {
  provider: Provider;
  gpuType: GpuType;
  region: Region;
  hourlyPrice: number;
  availability: number;
  healthScore: number;
  status: ProviderStatus;
  lastUpdated: Date;
  dataSource: 'bright_data' | 'mock';
}
```

---

## 5. API Design

### Server Actions (primary interface)

| Action | Input | Output |
|--------|-------|--------|
| `parseWorkloadInput(raw: string)` | Natural language string | `WorkloadProfile` |
| `analyzeWorkload(request: WorkloadRequest)` | Form fields or parsed profile | `ComputeRecommendation` |
| `getMarketRadar()` | — | `MarketSnapshot` |
| `getProviderDetail(slug: string)` | Provider slug | `ProviderHealth + MarketEntry[]` |

### Internal Service APIs

```typescript
// lib/bright-data/aggregator.ts
interface MarketDataAggregator {
  fetchMarketSnapshot(): Promise<MarketSnapshot>;
  fetchProviderHealth(providerId: string): Promise<ProviderHealth>;
}

// lib/recommendation/engine.ts
interface RecommendationEngine {
  recommend(profile: WorkloadProfile, market: MarketSnapshot): ComputeRecommendation;
}

// lib/bright-data/sources/base.ts
interface ProviderDataSource {
  readonly providerId: string;
  readonly isLive: boolean;
  getPricing(): Promise<NormalizedPricing[]>;
  getInventory(): Promise<NormalizedInventory[]>;
  getAvailability(): Promise<NormalizedAvailability[]>;
  getStatus(): Promise<NormalizedStatus>;
}
```

### Route Handlers (optional, for external consumers)

```
GET  /api/radar          → MarketSnapshot JSON
POST /api/analyze         → ComputeRecommendation JSON
GET  /api/providers/:slug → Provider detail JSON
```

---

## 6. Bright Data Integration Strategy

### Architecture

```
ProviderDataSource (interface)
    ├── RunPodSource      [LIVE - Bright Data]
    ├── VastSource        [LIVE - Bright Data]
    ├── NebiusSource      [LIVE - Bright Data]
    ├── LambdaSource      [LIVE - Bright Data]
    └── MockSource        [MOCK - TensorDock, Crusoe, CoreWeave, Together]
```

### Bright Data Client

Uses Bright Data Web Scraper API / Scraping Browser to fetch:

| Provider | Target URL | Data Extracted |
|----------|-----------|----------------|
| RunPod | runpod.io/pricing | GPU types, hourly rates, availability |
| Vast.ai | vast.ai | Marketplace listings, spot prices |
| Nebius | nebius.com/cloud | H100/A100 pricing, regions |
| Lambda | lambdalabs.com/service/gpu-cloud | Instance pricing, availability |

### Normalization Pipeline

```
Raw HTML/JSON → Provider-specific parser → Normalized schema → MarketSnapshot
```

**Rule:** UI never sees provider-specific shapes. All data passes through `NormalizedMarketEntry` before aggregation.

### Fallback Strategy

1. If `BRIGHT_DATA_API_TOKEN` missing → all sources use mock
2. If single provider fetch fails → use cached DB snapshot or mock for that provider
3. `USE_MOCK_MARKET_DATA=true` → force mock for demo reliability

### Adding a New Provider

1. Create `src/lib/bright-data/sources/newprovider.ts` implementing `ProviderDataSource`
2. Register in `aggregator.ts`
3. Add provider metadata to `src/domain/provider.ts`
4. No UI changes required

---

## 7. Recommendation Engine Design

### Deterministic Scoring (NO LLM)

```typescript
finalScore = (
  priceScore      * wPrice +
  availabilityScore * wAvailability +
  reliabilityScore  * wReliability +
  regionScore       * wRegion
) / (wPrice + wAvailability + wReliability + wRegion)
```

### Weight Profiles by Priority

| Priority | Price | Availability | Reliability | Region |
|----------|-------|--------------|-------------|--------|
| Cost | 0.45 | 0.20 | 0.15 | 0.20 |
| Speed | 0.15 | 0.45 | 0.20 | 0.20 |
| Reliability | 0.15 | 0.20 | 0.45 | 0.20 |
| Balanced | 0.25 | 0.25 | 0.25 | 0.25 |

### Individual Scorers

**Price Score (0-100):** Inverse of hourly cost relative to budget. Lower cost → higher score.

```
priceScore = max(0, 100 - (estimatedCost / budget) * 100)
```

**Availability Score (0-100):** Based on GPU count matching workload requirements.

```
availabilityScore = min(100, (availableGpus / requiredGpus) * 100)
```

**Reliability Score (0-100):** Direct from provider health score + status penalty.

```
reliabilityScore = healthScore - (status === 'degraded' ? 15 : status === 'outage' ? 50 : 0)
```

**Region Score (0-100):** 100 if exact match, 70 if same continent, 30 otherwise.

### Cost & Time Estimation

```
estimatedCost = hourlyPrice × estimatedGpuHours × gpuCount
estimatedCompletionHours = estimatedGpuHours / parallelFactor
savingsVsAws = awsEquivalentCost - estimatedCost
```

### Filtering

Providers excluded if:
- Estimated cost > budget × 1.1
- Estimated completion > deadline
- Status === 'outage'
- Zero availability for required GPU type

---

## 8. UI Wireframes

### Landing Page

```
┌──────────────────────────────────────────────────────────────┐
│  ComputeScout                              Radar  Providers  │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│              Find the best place on Earth                    │
│              to run your workload.                           │
│                                                              │
│         ┌────────────────────────────────────────┐           │
│         │ Fine-tune Llama 70B in Europe...       │           │
│         └────────────────────────────────────────┘           │
│                                                              │
│                    [ Analyze Workload ]                      │
│                                                              │
│         ─────────── or configure manually ───────────        │
│                                                              │
│    Workload          Budget         Deadline                 │
│    [___________]     [$1000]        [48 hours]               │
│                                                              │
│    Region            Priority                                │
│    [Europe ▼]        [Balanced ▼]                            │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### Results Page

```
┌──────────────────────────────────────────────────────────────┐
│  ← Back                                                      │
├──────────────────────────────────────────────────────────────┤
│  RECOMMENDATION                                              │
│                                                              │
│  Nebius                                    Score: 92         │
│  ─────────────────────────────────────────────────           │
│  Estimated Cost     $742                                     │
│  Completion         ~36 hours                                │
│  Reliability        92                                       │
│  Availability       16 H100s                                 │
│  Savings vs AWS     $1,130                                   │
│                                                              │
│  Nebius provides the best balance of reliability,            │
│  availability, and cost for fine-tuning Llama 70B...         │
│                                                              │
│  ALTERNATIVES                                                │
│  ┌──────────┬───────┬────────┬──────────┬─────────┐          │
│  │ Provider │ Score │ Cost   │ Avail.   │ Region  │          │
│  ├──────────┼───────┼────────┼──────────┼─────────┤          │
│  │ RunPod   │ 84    │ $689   │ 24 A100  │ EU      │          │
│  │ Lambda   │ 80    │ $812   │ 8 H100   │ US      │          │
│  └──────────┴───────┴────────┴──────────┴─────────┘          │
└──────────────────────────────────────────────────────────────┘
```

### Compute Radar (Bloomberg-style table)

```
┌──────────────────────────────────────────────────────────────┐
│  GLOBAL COMPUTE RADAR                    Last updated: 12s ago │
├──────────┬────────┬─────────┬──────┬────────┬────────┬────────┤
│ Provider │ GPU    │ Region  │ Avail│ Price  │ Health │ Source │
├──────────┼────────┼─────────┼──────┼────────┼────────┼────────┤
│ Nebius   │ H100   │ EU-WEST │ 16   │ $2.40  │ 92 ●   │ live   │
│ RunPod   │ A100   │ EU      │ 24   │ $1.89  │ 87 ●   │ live   │
│ Vast.ai  │ RTX4090│ GLOBAL  │ 142  │ $0.34  │ 78 ●   │ live   │
│ Lambda   │ H100   │ US-WEST │ 8    │ $2.99  │ 91 ●   │ live   │
│ Crusoe   │ H100   │ US      │ 12   │ $2.10  │ 85 ○   │ mock   │
└──────────┴────────┴─────────┴──────┴────────┴────────┴────────┘
```

### Provider Detail

```
┌──────────────────────────────────────────────────────────────┐
│  Nebius                                                      │
├──────────────────────────────────────────────────────────────┤
│  Health: 92    Availability: High    Trend: Stable           │
│                                                              │
│  RECENT INCIDENTS                                            │
│  None in the last 30 days                                      │
│                                                              │
│  MARKET SUMMARY                                              │
│  Stable inventory and strong availability in Europe.         │
│  H100 pricing competitive at $2.40/hr.                       │
│                                                              │
│  CURRENT INVENTORY                                           │
│  [same table format as radar, filtered to provider]          │
└──────────────────────────────────────────────────────────────┘
```

---

## 9. Development Plan

### Phase 1 — Foundation (Day 1)
- [x] Architecture & domain models
- [ ] Next.js scaffold + design system
- [ ] Domain types with Zod schemas
- [ ] SQLite schema + Drizzle setup

### Phase 2 — Core Engine (Day 1-2)
- [ ] ProviderDataSource interface + mock sources
- [ ] Bright Data client + 4 live sources
- [ ] Market data aggregator with caching
- [ ] Recommendation engine (deterministic)
- [ ] Groq parser + narrator

### Phase 3 — UI (Day 2)
- [ ] Landing + Analysis pages
- [ ] Results page
- [ ] Compute Radar (TanStack Table)
- [ ] Provider detail page
- [ ] Layout + navigation

### Phase 4 — Polish (Day 3)
- [ ] Demo script validation (Llama 70B scenario)
- [ ] Error handling + loading states
- [ ] Environment configuration
- [ ] README with setup instructions

### Future Phases (NOT in MVP)
- Phase 2: Availability Alerts
- Phase 3: Compute Procurement
- Phase 4: Cost Optimization
- Phase 5: Compute Routing
- Phase 6: Agent ComputeOS

---

## Environment Variables

```env
GROQ_API_KEY=              # Required for NL parsing & explanation
BRIGHT_DATA_API_TOKEN=     # Required for live market data
BRIGHT_DATA_ZONE=          # Bright Data zone name
USE_MOCK_MARKET_DATA=false # Force mock for demos
```

## Demo Script Validation

Input: Fine-tune Llama 70B, $1000, 48h, Europe, Balanced

Expected output:
- Primary: Nebius (~$742, score 92)
- Alternatives: RunPod (84), Lambda (80)
- Radar shows live + mock providers
- Explanation generated by Groq narrator
