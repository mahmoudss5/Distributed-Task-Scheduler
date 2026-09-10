import { useQuery } from '@tanstack/react-query';
import { useQueryClient } from '@tanstack/react-query';
import axiosInstance from '../../../shared/api/axiosInstance';
import type { Job, Worker, SystemStats } from '../../../shared/types';

// --- Mock data for development (replace with real API) ---
const mockStats: SystemStats = { completed: 25304, running: 0, pending: 184, failed: 23 };
const mockWorkers: Worker[] = [
  { id: '1', host: 'a-worker-#1', status: 'active', lastHeartbeat: new Date().toISOString(), jobsProcessed: 8378, throughput: '7%' },
  { id: '2', host: 'a-worker-#2', status: 'active', lastHeartbeat: new Date().toISOString(), jobsProcessed: 7770, throughput: '1%' },
  { id: '3', host: 'a-worker-#3', status: 'active', lastHeartbeat: new Date().toISOString(), jobsProcessed: 9156, throughput: '' },
  { id: '4', host: 'a-worker-#4', status: 'dead',   lastHeartbeat: new Date().toISOString(), jobsProcessed: 1204, throughput: '' },
];
const mockJobs: Job[] = [
  { id: 'ba4Tbnt', type: 'Email',   priority: 'HIGH',   priorityLevel: 'High',   status: 'PENDING',    executeAt: '', workerId: '-',         createdAt: '', updatedAt: '', retryCount: 0 },
  { id: 'e7f4bfe', type: 'Report',  priority: 'MEDIUM', priorityLevel: 'Normal', status: 'COMPLETED',  executeAt: '', workerId: 'worker-#3', createdAt: '', updatedAt: '', retryCount: 0, executionTime: '3.2 s' },
  { id: '7bb807',  type: 'Webhook', priority: 'LOW',    priorityLevel: 'Low',    status: 'COMPLETED',  executeAt: '', workerId: 'worker-#2', createdAt: '', updatedAt: '', retryCount: 0, executionTime: '348 ms' },
  { id: 'e413bf0', type: 'Email',   priority: 'HIGH',   priorityLevel: 'Critical',status: 'COMPLETED', executeAt: '', workerId: 'worker-#1', createdAt: '', updatedAt: '', retryCount: 0, executionTime: '100 ms' },
  { id: '9b4c7c5', type: 'Report',  priority: 'HIGH',   priorityLevel: 'High',   status: 'COMPLETED',  executeAt: '', workerId: 'worker-#1', createdAt: '', updatedAt: '', retryCount: 0, executionTime: '3.1 s' },
  { id: '2f8a3d1', type: 'Webhook', priority: 'MEDIUM', priorityLevel: 'Normal', status: 'COMPLETED',  executeAt: '', workerId: 'worker-#2', createdAt: '', updatedAt: '', retryCount: 0, executionTime: '100 ms' },
];

export const useOverview = () => {
  const queryClient = useQueryClient();

  const statsQuery = useQuery<SystemStats>({
    queryKey: ['stats'],
    queryFn: async () => {
      try {
        const res = await axiosInstance.get<SystemStats>('/stats');
        return res.data;
      } catch {
        return mockStats; // Fallback to mock during dev
      }
    },
    staleTime: 30_000,
    refetchInterval: 30_000,
  });

  const workersQuery = useQuery<Worker[]>({
    queryKey: ['workers'],
    queryFn: async () => {
      try {
        const res = await axiosInstance.get<Worker[]>('/workers');
        return res.data;
      } catch {
        return mockWorkers;
      }
    },
    staleTime: 15_000,
  });

  const jobsQuery = useQuery<Job[]>({
    queryKey: ['jobs'],
    queryFn: async () => {
      try {
        const res = await axiosInstance.get<{ data: Job[], meta: any }>('/jobs/my?page=1&limit=10');
        return res.data.data;
      } catch {
        return mockJobs;
      }
    },
    staleTime: 0,
  });

  return { statsQuery, workersQuery, jobsQuery, queryClient };
};
