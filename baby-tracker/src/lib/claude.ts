import Anthropic from '@anthropic-ai/sdk';

// Model configuration - using Haiku for cost optimization
// Haiku is 20x cheaper than Sonnet while still accurate for parsing tasks
export const CLAUDE_MODEL = 'claude-haiku-4-5-20251001';
export const MAX_TOKENS = 150; // Reduced from 1024 - we only need ~100 tokens for JSON output

// Lazy-initialized Anthropic client to avoid build-time errors
let _anthropic: Anthropic | null = null;

export function getAnthropicClient(): Anthropic {
  if (!_anthropic) {
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      throw new Error('Missing ANTHROPIC_API_KEY environment variable');
    }

    _anthropic = new Anthropic({ apiKey });
  }

  return _anthropic;
}
