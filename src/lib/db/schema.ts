import { sqliteTable, text, integer, real, index } from "drizzle-orm/sqlite-core";

export const marketSnapshots = sqliteTable(
  "market_snapshots",
  {
    id: text("id").primaryKey(),
    providerId: text("provider_id").notNull(),
    gpuType: text("gpu_type").notNull(),
    region: text("region").notNull(),
    hourlyPrice: real("hourly_price").notNull(),
    availability: integer("availability").notNull(),
    healthScore: integer("health_score").notNull(),
    status: text("status").notNull(),
    rawSource: text("raw_source").notNull(),
    fetchedAt: integer("fetched_at", { mode: "timestamp" }).notNull(),
    expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  },
  (table) => [
    index("idx_snapshots_provider").on(table.providerId),
    index("idx_snapshots_fetched").on(table.fetchedAt),
  ]
);

export const providerHealth = sqliteTable("provider_health", {
  id: text("id").primaryKey(),
  providerId: text("provider_id").notNull(),
  healthScore: integer("health_score").notNull(),
  status: text("status").notNull(),
  incidents: text("incidents"),
  summary: text("summary"),
  recordedAt: integer("recorded_at", { mode: "timestamp" }).notNull(),
});

export const analysisRuns = sqliteTable("analysis_runs", {
  id: text("id").primaryKey(),
  workloadJson: text("workload_json").notNull(),
  resultJson: text("result_json").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});
