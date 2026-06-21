export interface HealthStatus {
  status: 'ok';
  timestamp: string;
  uptime: number;
}

export type ServiceCheckStatus = 'ok' | 'error' | 'skipped';

export interface ReadinessStatus {
  status: 'ok' | 'degraded';
  timestamp: string;
  uptime: number;
  checks: {
    database: ServiceCheckStatus;
    redis: ServiceCheckStatus;
  };
}

export interface UserSession {
  id: string;
  name: string;
  email: string;
  role: string;
}
