export interface Job {
  id: string;
  type: string;
  priority: number;
  priorityLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELED' | 'DEAD';
  executeAt?: string | null;
  workerId?: string | null;
  createdAt: string;
  updatedAt: string;
  retryCount: number;
  jobPayload: Record<string, unknown>;
}

export interface JobFailure {
  id: string;
  jobId: string;
  attemptNumber: number;
  retryCountBeforeFailure: number;
  permanent: boolean;
  jobType: string;
  workerId?: string | null;
  errorMessage: string;
  errorName?: string | null;
  dlqPublished: boolean;
  failedAt: string;
}

export interface Report {
  id: string;
  userId: string;
  fileName: string;
  filePath?: string;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
  };
}

export interface Worker {
  id: string;
  host: string;
  status: 'active' | 'dead';
  lastHeartbeat: string;
  jobsProcessed: number;
}

export interface SystemStats {
  completed: number;
  running: number;
  pending: number;
  failed: number;
}

export interface JobQueueCounts {
  high: number;
  medium: number;
  low: number;
}

export interface JobCreationResponse {
  id: string;
  status: Job['status'];
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
