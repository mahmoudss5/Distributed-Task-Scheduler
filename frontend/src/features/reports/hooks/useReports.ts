import { useQuery, useQueryClient } from '@tanstack/react-query';
import { reportApi } from '../../../shared/api/reportApi';
import type { PaginatedResponse, Report } from '../../../shared/types';

export const REPORTS_PAGE_SIZE = 10;

export const useReports = (page: number) => {
  const queryClient = useQueryClient();

  const reportsQuery = useQuery<PaginatedResponse<Report>>({
    queryKey: ['reports', page],
    queryFn: async () => {
      const response = await reportApi.list(page, REPORTS_PAGE_SIZE);
      return response.data;
    },
    staleTime: 0,
    refetchInterval: 5_000,
    refetchIntervalInBackground: true,
  });

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ['reports'] });
  };

  return { reportsQuery, refresh };
};
