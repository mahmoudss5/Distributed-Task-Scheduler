export interface Job {
  id: string;
  type: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  priorityLevel: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELED' | 'DEAD';
  executeAt: string;
  workerId?: string;
  createdAt: string;
  updatedAt: string;
  retryCount: number;
  data?: Record<string, unknown>;
  executionTime?: string;
}

export interface Worker {
  id: string;
  host: string;
  status: 'active' | 'dead';
  lastHeartbeat: string;
  jobsProcessed?: number;
  throughput?: string;
}

export interface SystemStats {
  completed: number;
  running: number;
  pending: number;
  failed: number;
}

export interface QueueItem {
  level: 'Critical' | 'High' | 'Normal' | 'Low';
  current: number;
  total: number;
  color: string;
}

export interface JobFormData {
  type: 'sendEmail' | 'generateReport';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  schedule: 'now' | 'later' | 'recurring';
  payload: string;
}

export type ThemeMode = 'dark' | 'light';

export interface WebSocketMessage {
  event: string;
  payload?: any;
}
