import { useQuery, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '../../../shared/api/axiosInstance';
import type { JobFailure, PaginatedResponse } from '../../../shared/types';

const PAGE_SIZE = 10;

export const useJobFailures = (page: number) => {
  const queryClient = useQueryClient();

  const failuresQuery = useQuery<PaginatedResponse<JobFailure>>({
    queryKey: ['job-failures', page],
    queryFn: async () => {
      const response = await axiosInstance.get<PaginatedResponse<JobFailure>>(
        `/jobs/failures?page=${page}&limit=${PAGE_SIZE}`,
      );
      return response.data;
    },
    staleTime: 0,
    refetchInterval: 5_000,
    refetchIntervalInBackground: true,
  });

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ['job-failures'] });
  };

  return { failuresQuery, refresh, pageSize: PAGE_SIZE };
};
