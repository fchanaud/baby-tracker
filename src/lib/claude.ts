import Anthropic from '@anthropic-ai/sdk';

// Model configuration
export const CLAUDE_MODEL = 'claude-sonnet-4-20250514';
export const MAX_TOKENS = 1024;

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
