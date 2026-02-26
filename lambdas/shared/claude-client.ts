import Anthropic from '@anthropic-ai/sdk';
import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';

const ssm = new SSMClient({});
let anthropicClient: Anthropic | null = null;

async function getApiKey(): Promise<string> {
  const envParam = process.env.ANTHROPIC_API_KEY_PARAM;
  const paramName =
    envParam !== null && envParam !== undefined && envParam !== ''
      ? envParam
      : '/launchpad/anthropic-api-key';
  const result = await ssm.send(
    new GetParameterCommand({
      Name: paramName,
      WithDecryption: true,
    }),
  );
  return result.Parameter!.Value!;
}

export async function getClaudeClient(): Promise<Anthropic> {
  if (!anthropicClient) {
    const apiKey = await getApiKey();
    anthropicClient = new Anthropic({ apiKey });
  }
  return anthropicClient;
}
