import Groq from "groq-sdk";
import { WorkloadProfileSchema, type WorkloadProfile } from "@/domain/workload";
import { PrioritySchema, RegionSchema, WorkloadTypeSchema } from "@/domain/provider";

let groqClient: Groq | null = null;

function getGroqClient(): Groq | null {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;
  if (!groqClient) {
    groqClient = new Groq({ apiKey });
  }
  return groqClient;
}

const PARSE_SYSTEM_PROMPT = `You are a workload parser for ComputeScout, an infrastructure intelligence platform.
Parse the user's natural language input into structured JSON.
Return ONLY valid JSON with these fields:
- workloadType: one of "training", "fine_tuning", "inference", "rendering", "general"
- model: optional string (e.g. "llama_70b", "mistral_7b")
- budget: number in USD
- deadlineHours: number
- region: one of "global", "us", "us-east", "us-west", "europe", "eu-west", "asia", "apac"
- priority: one of "cost", "speed", "reliability", "balanced"
- description: brief summary of the workload

Do not include any explanation. JSON only.`;

export async function parseWorkloadInput(
  rawInput: string
): Promise<WorkloadProfile> {
  const client = getGroqClient();

  if (!client) {
    return parseFallback(rawInput);
  }

  try {
    const completion = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: PARSE_SYSTEM_PROMPT },
        { role: "user", content: rawInput },
      ],
      temperature: 0,
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) throw new Error("Empty response");

    const parsed = JSON.parse(content);
    return WorkloadProfileSchema.parse(parsed);
  } catch (error) {
    console.error("Groq parse failed, using fallback:", error);
    return parseFallback(rawInput);
  }
}

function parseFallback(rawInput: string): WorkloadProfile {
  const lower = rawInput.toLowerCase();

  let workloadType: WorkloadProfile["workloadType"] = "general";
  if (lower.includes("fine-tun") || lower.includes("fine tun")) {
    workloadType = "fine_tuning";
  } else if (lower.includes("train")) {
    workloadType = "training";
  } else if (lower.includes("infer")) {
    workloadType = "inference";
  }

  let model: string | undefined;
  if (lower.includes("llama") && lower.includes("70")) model = "llama_70b";
  else if (lower.includes("llama") && lower.includes("8")) model = "llama_8b";
  else if (lower.includes("mistral")) model = "mistral_7b";

  const budgetMatch = rawInput.match(/\$?\s*(\d+(?:,\d{3})*(?:\.\d+)?)/);
  const budget = budgetMatch ? parseFloat(budgetMatch[1].replace(/,/g, "")) : 1000;

  const deadlineMatch = rawInput.match(/(\d+)\s*(?:hours?|hrs?|h\b)/i);
  const deadlineHours = deadlineMatch ? parseInt(deadlineMatch[1]) : 48;

  let region: WorkloadProfile["region"] = "global";
  if (lower.includes("europe") || lower.includes("eu")) region = "europe";
  else if (lower.includes("us") || lower.includes("america")) region = "us";
  else if (lower.includes("asia")) region = "asia";

  let priority: WorkloadProfile["priority"] = "balanced";
  if (lower.includes("cheap") || lower.includes("cost")) priority = "cost";
  else if (lower.includes("fast") || lower.includes("speed")) priority = "speed";
  else if (lower.includes("reliable")) priority = "reliability";

  return WorkloadProfileSchema.parse({
    workloadType,
    model,
    budget,
    deadlineHours,
    region,
    priority,
    description: rawInput,
  });
}

export function parseStructuredInput(fields: {
  workload: string;
  budget: number;
  deadlineHours: number;
  region: string;
  priority: string;
}): WorkloadProfile {
  const lower = fields.workload.toLowerCase();

  let workloadType = WorkloadTypeSchema.parse("general");
  if (lower.includes("fine-tun") || lower.includes("fine tun")) {
    workloadType = "fine_tuning";
  } else if (lower.includes("train")) {
    workloadType = "training";
  } else if (lower.includes("infer")) {
    workloadType = "inference";
  }

  let model: string | undefined;
  if (lower.includes("llama") && lower.includes("70")) model = "llama_70b";
  else if (lower.includes("llama")) model = "llama_8b";

  return WorkloadProfileSchema.parse({
    workloadType,
    model,
    budget: fields.budget,
    deadlineHours: fields.deadlineHours,
    region: RegionSchema.parse(fields.region),
    priority: PrioritySchema.parse(fields.priority),
    description: fields.workload,
  });
}
