import axiosInstance from './axiosInstance';

export const reportApi = {
  generate: () => axiosInstance.post('/reports/generate'),
  download: (reportId: string) =>
    axiosInstance.get(`/reports/download/${reportId}`, { responseType: 'blob' }),
};
