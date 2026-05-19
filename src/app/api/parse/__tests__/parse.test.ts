/**
 * Integration tests for the parse API
 * These test the Claude LLM parsing of natural language inputs
 */

import { describe, it, expect, beforeAll } from '@jest/globals';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

describe('Parse API - Sleep Logs', () => {
  it('should parse "slept for 20 minutes 10 minutes ago" correctly', async () => {
    const response = await fetch(`${API_URL}/api/parse`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: 'victoire slept for 20 minutes 10 minutes ago',
        logged_by: 'test',
      }),
    });

    expect(response.ok).toBe(true);
    const result = await response.json();

    expect(result.log.log_type).toBe('sleep');
    expect(result.log.duration_minutes).toBe(20);

    // Check that logged_at is approximately 10 minutes ago
    const loggedAt = new Date(result.log.logged_at);
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    const diff = Math.abs(loggedAt.getTime() - tenMinutesAgo.getTime());
    expect(diff).toBeLessThan(60 * 1000); // Within 1 minute tolerance
  });

  it('should parse "slept for 30 minutes starting 15 minutes ago" correctly', async () => {
    const response = await fetch(`${API_URL}/api/parse`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: 'slept for 30 minutes starting 15 minutes ago',
        logged_by: 'test',
      }),
    });

    expect(response.ok).toBe(true);
    const result = await response.json();

    expect(result.log.log_type).toBe('sleep');
    expect(result.log.duration_minutes).toBe(30);

    // Check that logged_at is approximately 15 minutes ago
    const loggedAt = new Date(result.log.logged_at);
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    const diff = Math.abs(loggedAt.getTime() - fifteenMinutesAgo.getTime());
    expect(diff).toBeLessThan(60 * 1000);
  });

  it('should parse "she slept for 2 hours" correctly (no time ago)', async () => {
    const response = await fetch(`${API_URL}/api/parse`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: 'she slept for 2 hours',
        logged_by: 'test',
      }),
    });

    expect(response.ok).toBe(true);
    const result = await response.json();

    expect(result.log.log_type).toBe('sleep');
    expect(result.log.duration_minutes).toBe(120);

    // logged_at should be approximately now (within 1 minute)
    const loggedAt = new Date(result.log.logged_at);
    const now = new Date();
    const diff = Math.abs(loggedAt.getTime() - now.getTime());
    expect(diff).toBeLessThan(60 * 1000);
  });
});

describe('Parse API - Breastfeed Logs', () => {
  it('should parse "breastfed for 20 minutes left side 10 minutes ago"', async () => {
    const response = await fetch(`${API_URL}/api/parse`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: 'breastfed for 20 minutes left side 10 minutes ago',
        logged_by: 'test',
      }),
    });

    expect(response.ok).toBe(true);
    const result = await response.json();

    expect(result.log.log_type).toBe('breastfeed');
    expect(result.log.duration_minutes).toBe(20);
    expect(result.log.side).toBe('left');

    const loggedAt = new Date(result.log.logged_at);
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    const diff = Math.abs(loggedAt.getTime() - tenMinutesAgo.getTime());
    expect(diff).toBeLessThan(60 * 1000);
  });
});
