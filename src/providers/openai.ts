import OpenAI from "openai";
import type { LlmProvider } from "./types.js";

const DEFAULT_MODEL = "gpt-4o-mini";

export class OpenAIProvider implements LlmProvider {
  readonly name = "openai";
  private client: OpenAI;
  private model: string;

  constructor() {
    const apiKey = process.env["OPENAI_API_KEY"];
    if (!apiKey) throw new Error("OPENAI_API_KEY is required");

    this.model = process.env["OPENAI_MODEL"] || DEFAULT_MODEL;
    this.client = new OpenAI({
      apiKey,
      baseURL: process.env["OPENAI_BASE_URL"] || undefined,
    });
  }

  async call(prompt: string, maxTokens: number): Promise<string> {
    const response = await this.client.chat.completions.create({
      model: this.model,
      max_completion_tokens: maxTokens,
      messages: [{ role: "user", content: prompt }],
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error("OpenAI returned empty response");
    return content;
  }
}
