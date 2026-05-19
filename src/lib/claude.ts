import Anthropic from '@anthropic-ai/sdk';

const apiKey = process.env.ANTHROPIC_API_KEY;

if (!apiKey) {
  throw new Error('Missing ANTHROPIC_API_KEY environment variable');
}

// Singleton Anthropic client
export const anthropic = new Anthropic({
  apiKey,
});

// Model configuration
export const CLAUDE_MODEL = 'claude-sonnet-4-20250514';
export const MAX_TOKENS = 1024;
