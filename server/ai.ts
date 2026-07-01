import Groq from "groq-sdk";
import type { Client } from "@shared/schema";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export interface AiTask {
  title: string;
  category: string;
  estimatedMinutes: number;
  rationale: string;
}

export interface AiCarePlan {
  summary: string;
  goals: string[];
  resources: string[];
  generatedAt: string;
}

/**
 * Generate a shift task list for a caregiver based on the client's conditions.
 */
export async function generateShiftTasks(client: Client, shiftDurationMinutes = 240): Promise<AiTask[]> {
  const conditions = client.medicalConditions?.join(", ") || "general elderly care";
  const medications = client.medications?.join(", ") || "none listed";
  const specialInstructions = client.specialInstructions || "none";

  const prompt = `You are a professional care coordinator. A caregiver is starting a ${shiftDurationMinutes}-minute home care shift with a client who has the following profile:

Medical conditions: ${conditions}
Current medications: ${medications}
Special instructions: ${specialInstructions}
Client age: ${client.age || "not specified"}

Generate a practical, actionable task list for this shift. Tasks should keep the client engaged, support their health, and go beyond just sitting and watching TV. Focus on activities that improve quality of life given their conditions.

Return a JSON array of tasks with this exact structure:
[
  {
    "title": "short task name",
    "category": "one of: personal_care | exercise | medication | meal | cognitive | social | safety | housekeeping",
    "estimatedMinutes": number,
    "rationale": "one sentence explaining why this helps the client"
  }
]

Generate 6-10 tasks. Total estimated time should roughly match the shift duration. Return only the JSON array, no other text.`;

  const response = await groq.chat.completions.create({
    model: "llama3-70b-8192",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.4,
    max_tokens: 1024,
  });

  const text = response.choices[0]?.message?.content?.trim() || "[]";
  try {
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Generate an AI care plan with health improvement suggestions for a client and their family.
 */
export async function generateCarePlan(client: Client): Promise<AiCarePlan> {
  const conditions = client.medicalConditions?.join(", ") || "general care";
  const medications = client.medications?.join(", ") || "none listed";

  const prompt = `You are a compassionate care advisor helping a family understand how to improve their loved one's quality of life at home.

Client profile:
- Age: ${client.age || "not specified"}
- Medical conditions: ${conditions}
- Current medications: ${medications}
- Special instructions: ${client.specialInstructions || "none"}

Please provide:
1. A brief, warm summary (2-3 sentences) of the client's care situation and what to focus on
2. 4-6 specific, actionable goals to improve their quality of life
3. 3-5 helpful resources (organizations, websites, or programs) relevant to their conditions

Format as JSON:
{
  "summary": "...",
  "goals": ["...", "..."],
  "resources": ["...", "..."]
}

Write in plain language a family member can understand. Be encouraging. Return only the JSON.`;

  const response = await groq.chat.completions.create({
    model: "llama3-70b-8192",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.5,
    max_tokens: 1024,
  });

  const text = response.choices[0]?.message?.content?.trim() || "{}";
  try {
    const parsed = JSON.parse(text);
    return { ...parsed, generatedAt: new Date().toISOString() };
  } catch {
    return {
      summary: "Care plan generation is available once conditions are added to the client profile.",
      goals: [],
      resources: [],
      generatedAt: new Date().toISOString(),
    };
  }
}

/**
 * Generate a health tip for a specific condition — used for the family portal dashboard.
 */
export async function getDailyHealthTip(conditions: string[]): Promise<string> {
  if (!conditions.length) return "";

  const prompt = `Give one practical, encouraging daily tip for a family caring for someone with: ${conditions.join(", ")}.
Keep it to 2 sentences. Plain language. No medical disclaimers. Return only the tip text.`;

  const response = await groq.chat.completions.create({
    model: "llama3-8b-8192",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.7,
    max_tokens: 128,
  });

  return response.choices[0]?.message?.content?.trim() || "";
}
