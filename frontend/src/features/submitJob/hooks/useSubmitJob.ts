import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axiosInstance from '../../../shared/api/axiosInstance';
import type { JobCreationResponse, JobFormData } from '../../../shared/types';

const DEFAULT_PAYLOAD = JSON.stringify({
  to: 'engineer@example.com',
  subject: 'Your report is ready',
  body: '<p>Your report is ready.</p>',
}, null, 2);

export const useSubmitJob = () => {
  const queryClient = useQueryClient();

  const [form, setForm] = useState<JobFormData>({
    type: 'sendEmail',
    priority: 'LOW',
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
      const schedule = data.schedule === 'later'
        ? { executeAt: new Date(Date.now() + 5 * 60 * 1000).toISOString() }
        : data.schedule === 'recurring'
          ? { cron: '*/5 * * * *' }
          : {};
      const res = await axiosInstance.post<JobCreationResponse>('/jobs/create', {
        type: data.type,
        priorityLevel: data.priority,
        ...schedule,
        jobPayload: JSON.parse(data.payload),
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
      queryClient.invalidateQueries({ queryKey: ['queue-depth'] });
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
