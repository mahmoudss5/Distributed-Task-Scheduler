import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '../../../shared/api/axiosInstance';
import type { JobFormData } from '../../../shared/types';

const DEFAULT_PAYLOAD = JSON.stringify({
  to: 'engineer@example.com',
  subject: 'Your report is ready',
  template: 'report-ready',
  data: { reportId: 'rpt_2026_0042' },
}, null, 2);

export const useSubmitJob = () => {
  const queryClient = useQueryClient();

  const [form, setForm] = useState<JobFormData>({
    type: 'Email',
    priority: 'Normal',
    schedule: 'now',
    payload: DEFAULT_PAYLOAD,
  });

  const [payloadError, setPayloadError] = useState<string | null>(null);

  const validatePayload = (): boolean => {
    try {
      JSON.parse(form.payload);
      setPayloadError(null);
      return true;
    } catch {
      setPayloadError('Payload must be valid JSON');
      return false;
    }
  };

  const mutation = useMutation({
    mutationFn: async (data: JobFormData) => {
      const res = await axiosInstance.post('/jobs/create', {
        type: data.type,
        priorityLevel: data.priority.toUpperCase(),
        // We will pass schedule as cron if it's not 'now'
        ...(data.schedule !== 'now' ? { cron: data.schedule } : {}),
        jobPayload: JSON.parse(data.payload),
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
  });

  const handleSubmit = () => {
    if (!validatePayload()) return;
    mutation.mutate(form);
  };

  const updateField = <K extends keyof JobFormData>(key: K, value: JobFormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  return { form, updateField, payloadError, validatePayload, handleSubmit, mutation };
};
