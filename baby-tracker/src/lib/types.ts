// Core log types
export type LogType = 'breastfeed' | 'bottle' | 'sleep' | 'nappy' | 'note';
export type ParsedLogType = LogType | 'invalid';
export type Side = 'left' | 'right' | 'both';
export type NappyType = 'wet' | 'poo' | 'both';
export type PooConsistency = 'liquid' | 'normal' | 'soft';

// Database log entry
export interface Log {
  id: string;
  created_at: string;
  logged_at: string;
  logged_by: string;
  log_type: LogType;

  // Feed-specific
  side?: Side;
  duration_minutes?: number;
  amount_ml?: number;

  // Nappy-specific
  nappy_type?: NappyType;
  poo_consistency?: PooConsistency;

  // Note-specific
  note?: string;

  // Parser confidence
  needs_review: boolean;
}

// NLP parser output
export interface ParsedLog {
  log_type: ParsedLogType;
  side?: Side;
  duration_minutes?: number;
  amount_ml?: number;
  nappy_type?: NappyType;
  poo_consistency?: PooConsistency;
  note?: string;
  logged_at?: string; // ISO 8601 timestamp
  needs_review?: boolean;
}

// Alert types
export type AlertType = 'no_feed' | 'short_feed' | 'low_nappy_count' | 'side_imbalance' | 'urgent';
export type AlertSeverity = 'warning' | 'info';

export interface Alert {
  type: AlertType;
  message: string;
  severity: AlertSeverity;
}

// Dashboard metrics
export interface DashboardMetrics {
  feedsToday: number;
  totalSleepMinutes: number;
  nappiesToday: number;
  minutesSinceLastFeed: number | null;
}
