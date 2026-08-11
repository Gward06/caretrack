import Groq from "groq-sdk";
import type { Client } from "@shared/schema";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export interface AiTask {
  title: string;
  category: string;
  estimatedMinutes: number;
  rationale: string;
}

export interface AiRecipe {
  name: string;
  benefits: string;
  ingredients: string[];
  instructions: string;
}

export interface AiNutritionPlan {
  overview: string;
  foodsToEmphasize: string[];
  foodsToLimit: string[];
  supplements: Array<{ name: string; benefit: string; note: string }>;
  naturalRemedies: Array<{ name: string; use: string; howTo: string }>;
  recipes: AiRecipe[];
  generatedAt: string;
}

export interface AiCarePlan {
  summary: string;
  goals: string[];
  resources: string[];
  nutrition: AiNutritionPlan;
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

Generate a practical, actionable task list for this shift. Tasks should keep the client engaged, support their health, and go beyond just sitting and watching TV. Include at least one meal or nutrition-related task appropriate for the client's conditions. Focus on activities that improve quality of life.

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
    model: "openai/gpt-oss-120b",
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
 * Generate a nutrition plan with diet advice, supplements, natural remedies, and recipes
 * tailored to the client's medical conditions.
 */
export async function generateNutritionPlan(client: Client): Promise<AiNutritionPlan> {
  const conditions = client.medicalConditions?.join(", ") || "general healthy aging";
  const medications = client.medications?.join(", ") || "none listed";
  const allergies = client.allergies?.join(", ") || "none listed";

  const prompt = `You are a holistic nutritionist and natural health advisor helping a family support their loved one's wellbeing through diet and natural approaches.

Client profile:
- Age: ${client.age || "not specified"}
- Medical conditions: ${conditions}
- Current medications: ${medications}
- Known allergies: ${allergies}

Provide a comprehensive nutrition and natural wellness plan. Be specific to their conditions. Write in plain, warm language a family member can act on.

Return ONLY this JSON structure:
{
  "overview": "2-3 sentence summary of the nutritional approach for this client",
  "foodsToEmphasize": [
    "food or food group with one-sentence explanation of benefit"
  ],
  "foodsToLimit": [
    "food to avoid or reduce with brief reason"
  ],
  "supplements": [
    {
      "name": "supplement name",
      "benefit": "what it helps with for this client",
      "note": "dosage guidance or important caution (e.g. check with doctor if on blood thinners)"
    }
  ],
  "naturalRemedies": [
    {
      "name": "remedy name (herb, spice, practice)",
      "use": "what condition or symptom it addresses",
      "howTo": "simple practical instructions"
    }
  ],
  "recipes": [
    {
      "name": "recipe name",
      "benefits": "one sentence on why this recipe supports the client's health",
      "ingredients": ["ingredient 1", "ingredient 2"],
      "instructions": "brief 2-4 step instructions"
    }
  ]
}

Include:
- 4-6 foods to emphasize
- 3-4 foods to limit
- 3-5 supplements (real, evidence-informed)
- 3-4 natural remedies
- 2-3 simple recipes appropriate for someone with their conditions

Return only the JSON, no other text.`;

  const response = await groq.chat.completions.create({
    model: "openai/gpt-oss-120b",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.5,
    max_tokens: 2048,
  });

  const text = response.choices[0]?.message?.content?.trim() || "{}";
  try {
    const parsed = JSON.parse(text);
    return { ...parsed, generatedAt: new Date().toISOString() };
  } catch {
    return {
      overview: "Nutrition plan will be generated once medical conditions are added to the client profile.",
      foodsToEmphasize: [],
      foodsToLimit: [],
      supplements: [],
      naturalRemedies: [],
      recipes: [],
      generatedAt: new Date().toISOString(),
    };
  }
}

/**
 * Generate a full care plan including wellness goals, resources, and nutrition.
 */
export async function generateCarePlan(client: Client): Promise<AiCarePlan> {
  const conditions = client.medicalConditions?.join(", ") || "general care";
  const medications = client.medications?.join(", ") || "none listed";

  const [goalsResponse, nutrition] = await Promise.all([
    groq.chat.completions.create({
      model: "openai/gpt-oss-120b",
      messages: [{
        role: "user",
        content: `You are a compassionate care advisor helping a family improve their loved one's quality of life at home.

Client profile:
- Age: ${client.age || "not specified"}
- Medical conditions: ${conditions}
- Current medications: ${medications}
- Special instructions: ${client.specialInstructions || "none"}

Provide:
1. A brief, warm summary (2-3 sentences) of the care situation and main focus areas
2. 4-6 specific, actionable goals to improve quality of life
3. 3-5 helpful resources (organizations, websites, or programs) for their conditions

Format as JSON:
{
  "summary": "...",
  "goals": ["...", "..."],
  "resources": ["...", "..."]
}

Write in plain language. Be encouraging. Return only the JSON.`,
      }],
      temperature: 0.5,
      max_tokens: 1024,
    }),
    generateNutritionPlan(client),
  ]);

  const text = goalsResponse.choices[0]?.message?.content?.trim() || "{}";
  try {
    const parsed = JSON.parse(text);
    return {
      ...parsed,
      nutrition,
      generatedAt: new Date().toISOString(),
    };
  } catch {
    return {
      summary: "Care plan generation is available once conditions are added to the client profile.",
      goals: [],
      resources: [],
      nutrition,
      generatedAt: new Date().toISOString(),
    };
  }
}

/**
 * Generate a daily health tip — rotates between general wellness, nutrition, and activity tips.
 */
export async function getDailyHealthTip(conditions: string[]): Promise<string> {
  if (!conditions.length) return "";

  // Rotate tip type by day of week so it doesn't repeat
  const types = ["wellness activity", "dietary tip", "natural remedy or supplement", "mental wellness or social activity"];
  const tipType = types[new Date().getDay() % types.length];

  const prompt = `Give one practical, encouraging ${tipType} for a family caring for someone with: ${conditions.join(", ")}.
Keep it to 2 sentences. Plain language. Specific and actionable. No medical disclaimers. Return only the tip text.`;

  const response = await groq.chat.completions.create({
    model: "openai/gpt-oss-20b",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.8,
    max_tokens: 128,
  });

  return response.choices[0]?.message?.content?.trim() || "";
}
