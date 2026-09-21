import { useQuery, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '../../../shared/api/axiosInstance';
import type { Job, JobQueueCounts, Worker, SystemStats } from '../../../shared/types';

const LIVE_REFRESH_INTERVAL = 5_000;

export const useOverview = () => {
  const queryClient = useQueryClient();

  const statsQuery = useQuery<SystemStats>({
    queryKey: ['stats'],
    queryFn: async () => {
      const res = await axiosInstance.get<SystemStats>('/stats');
      return res.data;
    },
    staleTime: 0,
    refetchInterval: LIVE_REFRESH_INTERVAL,
    refetchIntervalInBackground: true,
  });

  const workersQuery = useQuery<Worker[]>({
    queryKey: ['workers'],
    queryFn: async () => {
      const res = await axiosInstance.get<Worker[]>('/workers');
      return res.data;
    },
    staleTime: 0,
    refetchInterval: LIVE_REFRESH_INTERVAL,
    refetchIntervalInBackground: true,
  });

  const jobsQuery = useQuery<Job[]>({
    queryKey: ['jobs'],
    queryFn: async () => {
      const res = await axiosInstance.get<{ data: Job[] }>('/jobs/my?page=1&limit=10');
      return res.data.data;
    },
    staleTime: 0,
    refetchInterval: LIVE_REFRESH_INTERVAL,
    refetchIntervalInBackground: true,
  });

  const queueDepthQuery = useQuery<JobQueueCounts>({
    queryKey: ['queue-depth'],
    queryFn: async () => {
      const res = await axiosInstance.get<JobQueueCounts>('/jobs/queue-counts');
      return res.data;
    },
    staleTime: 0,
    refetchInterval: LIVE_REFRESH_INTERVAL,
    refetchIntervalInBackground: true,
  });

  return { statsQuery, workersQuery, jobsQuery, queueDepthQuery, queryClient };
};
