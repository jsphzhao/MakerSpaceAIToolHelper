import { GoogleGenerativeAI } from "@google/generative-ai";
import type { ToolExplanation } from "../types";

const SYSTEM_PROMPT = `You are an accessibility-focused makerspace educator helping beginners and users with visual impairments understand workshop tools safely.

Analyze the image and identify the makerspace tool or equipment shown. If the image is unclear, multiple tools appear, or you cannot identify equipment confidently, say so honestly in your response.

Respond ONLY with valid JSON (no markdown fences) matching this exact schema:
{
  "toolName": "string — common name of the tool",
  "confidence": "high" | "medium" | "low",
  "description": "string — 2-4 plain-language sentences explaining what it is and what it is used for. Avoid jargon; define technical terms when needed.",
  "safetyWarnings": ["string — specific safety precautions, one per item, at least 2 items"],
  "usageSteps": ["string — numbered beginner steps for basic safe use, 4-7 steps"],
  "beginnerTips": "string — one encouraging tip for first-time users",
  "disclaimer": "string — brief note that AI guidance does not replace official training, signage, or staff supervision"
}

Rules:
- Prioritize safety over completeness.
- Use simple vocabulary (roughly 8th-grade reading level).
- Do not invent model-specific settings you cannot see.
- If not a makerspace tool, set toolName to describe what you see and confidence to "low".`;

function getApiKey(): string {
  const key = import.meta.env.VITE_GEMINI_API_KEY;
  if (!key?.trim()) {
    throw new Error(
      "Missing Gemini API key. Add VITE_GEMINI_API_KEY to your .env file."
    );
  }
  return key.trim();
}

function parseExplanation(raw: string): ToolExplanation {
  const cleaned = raw
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "");

  const parsed = JSON.parse(cleaned) as ToolExplanation;

  if (!parsed.toolName || !parsed.description) {
    throw new Error("The AI response was missing required fields.");
  }

  return {
    toolName: parsed.toolName,
    confidence: parsed.confidence ?? "medium",
    description: parsed.description,
    safetyWarnings: Array.isArray(parsed.safetyWarnings)
      ? parsed.safetyWarnings
      : [],
    usageSteps: Array.isArray(parsed.usageSteps) ? parsed.usageSteps : [],
    beginnerTips: parsed.beginnerTips ?? "",
    disclaimer:
      parsed.disclaimer ??
      "Always follow official makerspace training and staff guidance.",
  };
}

export async function analyzeToolImage(
  base64Data: string,
  mimeType: string
): Promise<ToolExplanation> {
  const genAI = new GoogleGenerativeAI(getApiKey());
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 2048,
    },
  });

  const result = await model.generateContent([
    { text: SYSTEM_PROMPT },
    {
      inlineData: {
        mimeType,
        data: base64Data,
      },
    },
    {
      text: "Identify this makerspace tool and return the JSON explanation.",
    },
  ]);

  const text = result.response.text();
  if (!text) {
    throw new Error("No response received from Gemini.");
  }

  try {
    return parseExplanation(text);
  } catch {
    throw new Error(
      "Could not parse the AI response. Please try again with a clearer photo."
    );
  }
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1];
      if (!base64) {
        reject(new Error("Failed to read image data."));
        return;
      }
      resolve(base64);
    };
    reader.onerror = () => reject(new Error("Failed to read the image file."));
    reader.readAsDataURL(file);
  });
}
