import { test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { POST } from "../app/api/second-opinion/route";

const realFetch = globalThis.fetch;
const realKey = process.env.GEMINI_API_KEY;
const realModel = process.env.GEMINI_MODEL;

function request(body: unknown, raw = false) {
  return new Request("http://localhost/api/second-opinion", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: raw ? (body as string) : JSON.stringify(body),
  });
}

const payload = {
  input: { title: "t", description: "d", area: "a", immediateAction: "i", impactAssessment: "x" },
  result: { severity: "Major", category: "Equipment", summary: "s" },
};

beforeEach(() => {
  delete process.env.GEMINI_MODEL;
});

afterEach(() => {
  globalThis.fetch = realFetch;
  if (realKey === undefined) delete process.env.GEMINI_API_KEY;
  else process.env.GEMINI_API_KEY = realKey;
  if (realModel === undefined) delete process.env.GEMINI_MODEL;
  else process.env.GEMINI_MODEL = realModel;
});

test("returns 503 when no key is configured", async () => {
  delete process.env.GEMINI_API_KEY;
  const res = await POST(request(payload));
  assert.equal(res.status, 503);
});

test("returns 400 on invalid JSON when key is set", async () => {
  process.env.GEMINI_API_KEY = "test-key";
  const res = await POST(request("not json", true));
  assert.equal(res.status, 400);
});

test("sends key in header, not in URL, and uses the default model", async () => {
  process.env.GEMINI_API_KEY = "test-key";
  let seenUrl = "";
  let seenHeaders: Record<string, string> = {};
  globalThis.fetch = (async (url: string, init?: RequestInit) => {
    seenUrl = String(url);
    seenHeaders = init?.headers as Record<string, string>;
    return new Response(
      JSON.stringify({ candidates: [{ content: { parts: [{ text: "Agree with Major." }] } }] }),
      { status: 200 }
    );
  }) as typeof fetch;

  const res = await POST(request(payload));
  const data = await res.json();
  assert.equal(res.status, 200);
  assert.equal(data.opinion, "Agree with Major.");
  assert.ok(seenUrl.includes("models/gemini-3.1-flash-lite:generateContent"));
  assert.ok(!seenUrl.includes("test-key"));
  assert.equal(seenHeaders["x-goog-api-key"], "test-key");
});

test("ignores thought parts in the response", async () => {
  process.env.GEMINI_API_KEY = "test-key";
  globalThis.fetch = (async () =>
    new Response(
      JSON.stringify({
        candidates: [{ content: { parts: [{ text: "internal", thought: true }, { text: "Visible comment." }] } }],
      }),
      { status: 200 }
    )) as typeof fetch;
  const res = await POST(request(payload));
  const data = await res.json();
  assert.equal(data.opinion, "Visible comment.");
});

test("maps provider 429 to a friendly quota message", async () => {
  process.env.GEMINI_API_KEY = "test-key";
  globalThis.fetch = (async () => new Response("{}", { status: 429 })) as typeof fetch;
  const res = await POST(request(payload));
  const data = await res.json();
  assert.equal(res.status, 429);
  assert.ok(String(data.error).includes("quota"));
});

test("maps other provider errors to 502", async () => {
  process.env.GEMINI_API_KEY = "test-key";
  globalThis.fetch = (async () => new Response("{}", { status: 500 })) as typeof fetch;
  const res = await POST(request(payload));
  assert.equal(res.status, 502);
});

test("handles a blocked prompt", async () => {
  process.env.GEMINI_API_KEY = "test-key";
  globalThis.fetch = (async () =>
    new Response(JSON.stringify({ promptFeedback: { blockReason: "SAFETY" } }), { status: 200 })) as typeof fetch;
  const res = await POST(request(payload));
  assert.equal(res.status, 422);
});

test("honors GEMINI_MODEL override", async () => {
  process.env.GEMINI_API_KEY = "test-key";
  process.env.GEMINI_MODEL = "custom-model";
  let seenUrl = "";
  globalThis.fetch = (async (url: string) => {
    seenUrl = String(url);
    return new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: "ok" }] } }] }), { status: 200 });
  }) as typeof fetch;
  await POST(request(payload));
  assert.ok(seenUrl.includes("models/custom-model:generateContent"));
});
