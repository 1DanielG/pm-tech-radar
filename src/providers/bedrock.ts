import type { LlmProvider } from "./types.js";

const DEFAULT_MODEL = "us.anthropic.claude-3-5-haiku-20241022";
const DEFAULT_REGION = "us-east-1";

/**
 * AWS Bedrock provider using the Converse API.
 * Uses standard AWS credentials from environment or ~/.aws/credentials.
 */
export class BedrockProvider implements LlmProvider {
  readonly name = "bedrock";
  private model: string;
  private region: string;

  constructor() {
    this.model = process.env["BEDROCK_MODEL"] || DEFAULT_MODEL;
    this.region = process.env["AWS_REGION"] || DEFAULT_REGION;

    // Validate that credentials are available
    const hasKeys = process.env["AWS_ACCESS_KEY_ID"] && process.env["AWS_SECRET_ACCESS_KEY"];
    const hasProfile = process.env["AWS_PROFILE"];
    if (!hasKeys && !hasProfile) {
      console.warn("[bedrock] No AWS credentials found. Set AWS_ACCESS_KEY_ID/AWS_SECRET_ACCESS_KEY or AWS_PROFILE.");
    }
  }

  async call(prompt: string, maxTokens: number): Promise<string> {
    // Dynamic import to avoid requiring the SDK at module load time
    const { BedrockRuntimeClient, ConverseCommand } = await import(
      "@aws-sdk/client-bedrock-runtime"
    );

    const client = new BedrockRuntimeClient({ region: this.region });

    const command = new ConverseCommand({
      modelId: this.model,
      messages: [
        {
          role: "user",
          content: [{ text: prompt }],
        },
      ],
      inferenceConfig: {
        maxTokens,
      },
    });

    const response = await client.send(command);

    // Debug: log response structure if no content found
    const output = response.output;
    if (!output || !("message" in output) || !output.message) {
      console.error("[bedrock] Unexpected response structure:", JSON.stringify(response, null, 2).slice(0, 500));
      throw new Error("Bedrock returned no message in output");
    }

    const contentBlocks = output.message.content;
    if (!contentBlocks || contentBlocks.length === 0) {
      console.error("[bedrock] Empty content blocks:", JSON.stringify(output.message, null, 2).slice(0, 500));
      throw new Error("Bedrock returned empty content");
    }

    const textBlock = contentBlocks.find((block) => "text" in block);
    if (!textBlock || !("text" in textBlock)) {
      console.error("[bedrock] No text block found:", JSON.stringify(contentBlocks, null, 2).slice(0, 500));
      throw new Error("Bedrock returned non-text response");
    }

    return textBlock.text as string;
  }
}
