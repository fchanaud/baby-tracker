/**
 * Test suite for nappy logging with stool type
 * Verifies that dirty and both nappies save correctly with poo_consistency
 */

import { supabase } from '@/lib/supabase';

describe('Nappy Logging', () => {
  // Clean up test logs after each test
  afterEach(async () => {
    await supabase
      .from('logs')
      .delete()
      .eq('logged_by', 'test-user');
  });

  test('should save dirty nappy with stool type', async () => {
    const response = await fetch('http://localhost:3000/api/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        logged_by: 'test-user',
        log_type: 'nappy',
        nappy_type: 'poo',
        poo_consistency: 'normal',
        logged_at: new Date().toISOString(),
      }),
    });

    expect(response.ok).toBe(true);
    const result = await response.json();
    expect(result.success).toBe(true);
    expect(result.log).toMatchObject({
      log_type: 'nappy',
      nappy_type: 'poo',
      poo_consistency: 'normal',
      logged_by: 'test-user',
    });

    // Verify in database
    const { data, error } = await supabase
      .from('logs')
      .select('*')
      .eq('id', result.log.id)
      .single();

    expect(error).toBeNull();
    expect(data).toMatchObject({
      log_type: 'nappy',
      nappy_type: 'poo',
      poo_consistency: 'normal',
      logged_by: 'test-user',
    });
  });

  test('should save both nappy with stool type', async () => {
    const response = await fetch('http://localhost:3000/api/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        logged_by: 'test-user',
        log_type: 'nappy',
        nappy_type: 'both',
        poo_consistency: 'soft',
        logged_at: new Date().toISOString(),
      }),
    });

    expect(response.ok).toBe(true);
    const result = await response.json();
    expect(result.success).toBe(true);
    expect(result.log).toMatchObject({
      log_type: 'nappy',
      nappy_type: 'both',
      poo_consistency: 'soft',
      logged_by: 'test-user',
    });

    // Verify in database
    const { data, error } = await supabase
      .from('logs')
      .select('*')
      .eq('id', result.log.id)
      .single();

    expect(error).toBeNull();
    expect(data).toMatchObject({
      log_type: 'nappy',
      nappy_type: 'both',
      poo_consistency: 'soft',
      logged_by: 'test-user',
    });
  });

  test('should save wet nappy without stool type', async () => {
    const response = await fetch('http://localhost:3000/api/logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        logged_by: 'test-user',
        log_type: 'nappy',
        nappy_type: 'wet',
        logged_at: new Date().toISOString(),
      }),
    });

    expect(response.ok).toBe(true);
    const result = await response.json();
    expect(result.success).toBe(true);
    expect(result.log).toMatchObject({
      log_type: 'nappy',
      nappy_type: 'wet',
      logged_by: 'test-user',
    });
    expect(result.log.poo_consistency).toBeNull();
  });
});
