/**
 * Timeline positioning and calculation utilities
 * For duration bar chart visualization
 */

/**
 * Calculate horizontal position (%) based on time of day
 * Maps time to percentage across 24-hour span
 *
 * @param loggedAt - ISO timestamp string
 * @returns Percentage (0-100) representing position in 24h timeline
 */
export function getBarPosition(loggedAt: string): number {
  const date = new Date(loggedAt);
  const hour = date.getHours();
  const minute = date.getMinutes();
  const totalMinutes = hour * 60 + minute;
  const dayMinutes = 24 * 60; // 1440 minutes in a day

  return (totalMinutes / dayMinutes) * 100;
}

/**
 * Calculate bar height (%) based on duration
 *
 * @param durationMinutes - Activity duration in minutes
 * @param maxDuration - Maximum duration for Y-axis scale (default 120 min)
 * @returns Percentage (0-100) representing bar height
 */
export function getBarHeight(durationMinutes: number | null, maxDuration: number = 120): number {
  if (!durationMinutes) return 0;
  const clamped = Math.min(durationMinutes, maxDuration);
  return (clamped / maxDuration) * 100;
}

/**
 * Calculate maximum duration from logs for auto-scaling Y-axis
 * Rounds up to next 20-minute increment
 *
 * @param logs - Array of logs
 * @returns Maximum duration rounded to nearest 20min, minimum 120
 */
export function calculateMaxDuration(logs: Array<{ duration_minutes: number | null }>): number {
  const durations = logs
    .map(log => log.duration_minutes || 0)
    .filter(d => d > 0);

  if (durations.length === 0) return 120;

  const max = Math.max(...durations);
  const roundedMax = Math.ceil(max / 20) * 20; // Round up to next 20

  return Math.max(roundedMax, 120); // Minimum 120 (2 hours)
}

/**
 * Generate Y-axis labels
 *
 * @param maxDuration - Maximum duration for Y-axis
 * @returns Array of label values (e.g., [0, 20, 40, 60, 80, 100, 120])
 */
export function generateYAxisLabels(maxDuration: number): number[] {
  const step = 20; // 20-minute increments
  const labels: number[] = [];

  for (let i = 0; i <= maxDuration; i += step) {
    labels.push(i);
  }

  return labels;
}

/**
 * Generate X-axis time labels
 *
 * @param interval - Hours between labels (default 3)
 * @returns Array of time strings (e.g., ['00:00', '03:00', '06:00', ...])
 */
export function generateXAxisLabels(interval: number = 3): string[] {
  const labels: string[] = [];

  for (let hour = 0; hour < 24; hour += interval) {
    const hourStr = hour.toString().padStart(2, '0');
    labels.push(`${hourStr}:00`);
  }

  return labels;
}

/**
 * Format duration for display
 *
 * @param minutes - Duration in minutes
 * @returns Formatted string (e.g., "2h 15m" or "45m")
 */
export function formatDuration(minutes: number | null): string {
  if (!minutes) return '-';

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours > 0) {
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }

  return `${mins}m`;
}

/**
 * Format time for display
 *
 * @param timestamp - ISO timestamp
 * @returns Formatted time string (e.g., "2:30 PM")
 */
export function formatTime(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

/**
 * Calculate relative time ago
 *
 * @param timestamp - ISO timestamp
 * @returns Relative time string (e.g., "2h 15m ago")
 */
export function getRelativeTime(timestamp: string): string {
  const now = new Date();
  const then = new Date(timestamp);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));

  if (diffMins < 60) {
    return `${diffMins}m ago`;
  }

  const hours = Math.floor(diffMins / 60);
  const minutes = diffMins % 60;

  if (hours < 24) {
    return minutes > 0 ? `${hours}h ${minutes}m ago` : `${hours}h ago`;
  }

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

/**
 * Check if date is today
 *
 * @param date - Date to check
 * @returns True if date is today
 */
export function isToday(date: Date): boolean {
  const today = new Date();
  return date.getDate() === today.getDate() &&
         date.getMonth() === today.getMonth() &&
         date.getFullYear() === today.getFullYear();
}

/**
 * Format date for display
 *
 * @param date - Date object
 * @returns Formatted string (e.g., "TODAY" or "May 22, 2026")
 */
export function formatDate(date: Date): string {
  if (isToday(date)) {
    return 'TODAY';
  }

  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
}
