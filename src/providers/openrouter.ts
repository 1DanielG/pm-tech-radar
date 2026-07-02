import OpenAI from "openai";
import type { LlmProvider } from "./types.js";

const DEFAULT_MODEL = "anthropic/claude-3.5-haiku";

export class OpenRouterProvider implements LlmProvider {
  readonly name = "openrouter";
  private client: OpenAI;
  private model: string;

  constructor() {
    const apiKey = process.env["OPENROUTER_API_KEY"];
    if (!apiKey) throw new Error("OPENROUTER_API_KEY is required");

    this.model = process.env["OPENROUTER_MODEL"] || DEFAULT_MODEL;
    this.client = new OpenAI({
      apiKey,
      baseURL: "https://openrouter.ai/api/v1",
    });
  }

  async call(prompt: string, maxTokens: number): Promise<string> {
    const response = await this.client.chat.completions.create({
      model: this.model,
      max_completion_tokens: maxTokens,
      messages: [{ role: "user", content: prompt }],
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error("OpenRouter returned empty response");
    return content;
  }
}
