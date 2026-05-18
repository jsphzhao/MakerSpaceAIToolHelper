export type ConfidenceLevel = "high" | "medium" | "low";

export interface ToolExplanation {
  toolName: string;
  confidence: ConfidenceLevel;
  description: string;
  safetyWarnings: string[];
  usageSteps: string[];
  beginnerTips: string;
  disclaimer: string;
}

export interface AnalysisState {
  status: "idle" | "loading" | "success" | "error";
  error?: string;
  result?: ToolExplanation;
  imagePreview?: string;
  fileName?: string;
}
