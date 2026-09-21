import axiosInstance from './axiosInstance';
import type { PaginatedResponse, Report } from '../types';

export const reportApi = {
  generate: () => axiosInstance.post('/reports/generate'),
  list: (page = 1, limit = 10) =>
    axiosInstance.get<PaginatedResponse<Report>>(`/reports?page=${page}&limit=${limit}`),
  download: (reportId: string) =>
    axiosInstance.get(`/reports/download/${reportId}`, { responseType: 'blob' }),
};
