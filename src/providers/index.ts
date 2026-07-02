import type { LlmProvider, ProviderFactory, ProviderName } from "./types.js";
import { OpenRouterProvider } from "./openrouter.js";
import { OpenAIProvider } from "./openai.js";
import { BedrockProvider } from "./bedrock.js";

const PROVIDERS: Record<ProviderName, ProviderFactory> = {
  bedrock: () => new BedrockProvider(),
  openrouter: () => new OpenRouterProvider(),
  openai: () => new OpenAIProvider(),
};

const VALID_NAMES = Object.keys(PROVIDERS) as ProviderName[];

let _cached: LlmProvider | null = null;

/**
 * Create (or return cached) LLM provider based on LLM_PROVIDER env var.
 * Default: openrouter
 */
export function createProvider(name?: ProviderName): LlmProvider {
  if (_cached) return _cached;

  const providerName = name || (process.env["LLM_PROVIDER"] as ProviderName) || "bedrock";

  if (!VALID_NAMES.includes(providerName)) {
    throw new Error(`Invalid LLM_PROVIDER: "${providerName}". Valid: ${VALID_NAMES.join(", ")}`);
  }

  const provider = PROVIDERS[providerName]();
  console.log(`[llm] Provider: ${provider.name}`);
  _cached = provider;
  return provider;
}

/** Reset cached provider (for testing) */
export function resetProvider(): void {
  _cached = null;
}
