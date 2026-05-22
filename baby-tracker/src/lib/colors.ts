/**
 * Design System Colors
 * Soft pastels for emotional warmth, inspired by Babee.ai
 */

export const colors = {
  // Activity-specific colors
  feed: {
    50: '#FFE4E4',  // background
    500: '#FF6B9D', // accent/border
  },
  sleep: {
    50: '#E4E4FF',
    500: '#6B5FFF',
  },
  nappy: {
    50: '#FFF9E4',
    500: '#FFB800',
  },
  weight: {
    50: '#E4FFE4',
    500: '#00D084',
  },
  note: {
    50: '#E4F4FF',
    500: '#0088FF',
  },

  // Neutrals
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    500: '#6B7280',
    900: '#111827',
  },

  // Functional
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
} as const;

/**
 * Map log types to their colors
 */
export const activityColors: Record<string, { bg: string; accent: string }> = {
  breastfeed: { bg: colors.feed[50], accent: colors.feed[500] },
  bottle: { bg: colors.feed[50], accent: colors.feed[500] },
  sleep: { bg: colors.sleep[50], accent: colors.sleep[500] },
  nappy: { bg: colors.nappy[50], accent: colors.nappy[500] },
  weight: { bg: colors.weight[50], accent: colors.weight[500] },
  note: { bg: colors.note[50], accent: colors.note[500] },
};

/**
 * Get activity color by log type
 */
export function getActivityColor(logType: string): { bg: string; accent: string } {
  return activityColors[logType] || activityColors.note;
}
