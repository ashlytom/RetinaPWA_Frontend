export interface Assessment {
  grade: number;
  label: string;
  referable: boolean;
  score: number;
  model_agreement: "high" | "typical" | "low" | null;
  uncertainty: number | null;
  details: { fold_scores?: number[]; thresholds?: number[] };
}

export interface PredictionResponse {
  prediction_id: string;
  status: "graded" | "ungradable";
  model: { name: string; version: string };
  assessment: Assessment | null;
  message: string | null;
  preprocessed_preview: string | null;
  limitations: string[];
  disclaimer: string;
  processing_time_ms: number;
  created_at: string;
}
