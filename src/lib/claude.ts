import Anthropic from "@anthropic-ai/sdk";

// Roadie AI's LLM backend. Mirrors the resendEnabled/stripeEnabled pattern:
// leave ANTHROPIC_API_KEY unset and Roadie degrades to the deterministic
// templates in src/lib/ai.ts instead of erroring, so the features stay
// demoable without a key. Do NOT set a placeholder value — any non-empty
// string flips aiEnabled true and every Roadie call will fail with a 401.
export const aiEnabled = !!process.env.ANTHROPIC_API_KEY;

export const ROADIE_MODEL = "claude-opus-5";

let _client: Anthropic | null = null;

export function claude(): Anthropic {
  if (!aiEnabled) throw new Error("Roadie AI is not configured (set ANTHROPIC_API_KEY).");
  if (!_client) _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return _client;
}
