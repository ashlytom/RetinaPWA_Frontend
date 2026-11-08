import type { PredictionResponse } from "@/types/prediction";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";

export async function analyzeImage(file: File): Promise<PredictionResponse> {
  const body = new FormData();
  body.append("file", file);

  let res: Response;
  try {
    res = await fetch(`${API_URL}/predictions/analyze`, { method: "POST", body });
  } catch {
    throw new Error("Could not reach the analysis service. Check your connection and try again.");
  }
  if (!res.ok) {
    let detail = `Request failed (${res.status})`;
    try {
      const j = await res.json();
      if (typeof j.detail === "string") detail = j.detail;
    } catch {
      /* keep default message */
    }
    throw new Error(detail);
  }
  return res.json();
}
