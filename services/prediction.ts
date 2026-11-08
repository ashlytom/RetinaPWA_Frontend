import type { PredictionResponse } from "@/types/prediction";

import { authFetch } from "./api";

export async function analyzeImage(file: File): Promise<PredictionResponse> {
  const body = new FormData();
  body.append("file", file);

  const res = await authFetch("/predictions/analyze", { method: "POST", body });
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
