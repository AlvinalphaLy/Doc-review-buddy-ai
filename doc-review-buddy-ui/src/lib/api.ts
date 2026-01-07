const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8787";

export async function createDoc(): Promise<{ docId: string }> {
  const res = await fetch(`${API_BASE}/doc/create`, { method: "POST" });
  if (!res.ok) throw new Error("Failed to create doc");
  return res.json();
}

export async function sendText(
  docId: string,
  text: string
): Promise<{ ok: true }> {
  const res = await fetch(`${API_BASE}/doc/${docId}/text`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) throw new Error("Failed to send text");
  return res.json();
}

export async function runReview(
  docId: string
): Promise<{ ok: true; findingsCount: number; riskScore: number }> {
  const res = await fetch(`${API_BASE}/doc/${docId}/run`, { method: "POST" });
  if (!res.ok) throw new Error("Failed to run review");
  return res.json();
}

export async function getResults(docId: string) {
  const res = await fetch(`${API_BASE}/doc/${docId}/results`);
  if (!res.ok) throw new Error("Failed to fetch results");
  return res.json();
}
