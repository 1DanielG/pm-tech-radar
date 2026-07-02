/**
 * Pluggable LLM provider interface.
 * All providers must implement this contract.
 */
export interface LlmProvider {
  readonly name: string;
  call(prompt: string, maxTokens: number): Promise<string>;
}

export type ProviderFactory = () => LlmProvider;

export type ProviderName = "bedrock" | "openrouter" | "openai";
