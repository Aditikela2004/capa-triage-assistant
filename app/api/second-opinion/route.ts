import { NextResponse } from "next/server";

// Optional AI second opinion using the Gemini API free tier.
// Works only when GEMINI_API_KEY is set on the server. The key never reaches the browser.
// The rules engine in lib/triage.ts is the primary result; this route only adds a comment
// that a human reviewer can accept or ignore.

export const runtime = "nodejs";

const DEFAULT_MODEL = "gemini-3.1-flash-lite";

const SYSTEM = [
  "You assist a quality reviewer in a concept demo using synthetic data only.",
  "You are given a deviation report and a rules-based triage result.",
  "Reply in under 120 words, plain text, no markdown.",
  "State whether you agree with the severity and category, name at most two things the rules may have missed,",
  "and list at most two questions the reviewer should ask the reporter.",
  "Do not give regulatory or legal advice. Do not invent facts that are not in the report.",
].join(" ");

interface GeminiPart {
  text?: string;
  thought?: boolean;
}

interface GeminiResponse {
  candidates?: { content?: { parts?: GeminiPart[] }; finishReason?: string }[];
  promptFeedback?: { blockReason?: string };
}

export async function POST(req: Request) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return NextResponse.json(
      { error: "AI second opinion is not configured. Set GEMINI_API_KEY on the server to enable it." },
      { status: 503 }
    );
  }

  let body: { input?: Record<string, string>; result?: { severity?: string; category?: string; summary?: string } };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const input = body.input ?? {};
  const result = body.result ?? {};
  const userContent = [
    `Title: ${String(input.title ?? "").slice(0, 200)}`,
    `Description: ${String(input.description ?? "").slice(0, 2000)}`,
    `Area: ${String(input.area ?? "").slice(0, 200)}`,
    `Immediate action: ${String(input.immediateAction ?? "").slice(0, 500)}`,
    `Impact assessment: ${String(input.impactAssessment ?? "").slice(0, 500)}`,
    `Rules-based result: ${String(result.severity ?? "")} / ${String(result.category ?? "")}. ${String(result.summary ?? "")}`,
  ].join("\n");

  const model = process.env.GEMINI_MODEL || DEFAULT_MODEL;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-goog-api-key": key,
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM }] },
        contents: [{ role: "user", parts: [{ text: userContent }] }],
        generationConfig: { maxOutputTokens: 400, temperature: 0.3 },
      }),
    });

    if (res.status === 429) {
      return NextResponse.json(
        { error: "The free AI quota is used up for now. The rules-based result above is unaffected. Try again later." },
        { status: 429 }
      );
    }
    if (!res.ok) {
      return NextResponse.json({ error: `The AI service returned status ${res.status}.` }, { status: 502 });
    }

    const data = (await res.json()) as GeminiResponse;
    if (data.promptFeedback?.blockReason) {
      return NextResponse.json({ error: "The AI service declined to comment on this input." }, { status: 422 });
    }
    const parts = data.candidates?.[0]?.content?.parts ?? [];
    const text = parts
      .filter((p) => p.thought !== true && typeof p.text === "string")
      .map((p) => p.text as string)
      .join("\n")
      .trim();

    return NextResponse.json({ opinion: text || "No comment returned." });
  } catch {
    return NextResponse.json({ error: "Could not reach the AI service." }, { status: 502 });
  }
}
