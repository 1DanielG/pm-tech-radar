import fs from "node:fs";
import path from "node:path";
import { createProvider } from "./providers/index.js";

// Token budgets per report type
export const LLM_TOKENS_DEFAULT = 4096;
export const LLM_TOKENS_ROLLUP = 8192;

// Concurrency control
const MAX_CONCURRENT = 3;
let activeSlots = 0;
const queue: Array<() => void> = [];

function acquireSlot(): Promise<void> {
  if (activeSlots < MAX_CONCURRENT) {
    activeSlots++;
    return Promise.resolve();
  }
  return new Promise((resolve) => queue.push(resolve));
}

function releaseSlot(): void {
  activeSlots--;
  const next = queue.shift();
  if (next) {
    activeSlots++;
    next();
  }
}

function is429(err: unknown): boolean {
  if (err instanceof Error) {
    const msg = err.message.toLowerCase();
    return msg.includes("429") || msg.includes("rate_limit") || msg.includes("too many");
  }
  return false;
}

/**
 * Call the LLM with concurrency limiting and retry logic.
 */
export async function callLlm(prompt: string, maxTokens = LLM_TOKENS_DEFAULT): Promise<string> {
  await acquireSlot();
  try {
    return await callWithRetry(prompt, maxTokens);
  } finally {
    releaseSlot();
  }
}

async function callWithRetry(prompt: string, maxTokens: number, retries = 3): Promise<string> {
  const provider = createProvider();

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await provider.call(prompt, maxTokens);
    } catch (err) {
      if (is429(err) && attempt < retries - 1) {
        const delay = 5000 * Math.pow(2, attempt);
        console.warn(`[llm] Rate limited, retrying in ${delay / 1000}s...`);
        await new Promise((r) => setTimeout(r, delay));
      } else {
        throw err;
      }
    }
  }

  throw new Error("callLlm: exhausted retries");
}

/**
 * Save content to a file in the digests directory.
 */
export function saveDigest(dateStr: string, filename: string, content: string): string {
  const dir = path.resolve("digests", dateStr);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const filePath = path.join(dir, `${filename}.md`);
  fs.writeFileSync(filePath, content, "utf-8");
  console.log(`[save] ${filePath}`);
  return filePath;
}

/**
 * Get today's date string in YYYY-MM-DD format (UTC).
 */
export function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}
