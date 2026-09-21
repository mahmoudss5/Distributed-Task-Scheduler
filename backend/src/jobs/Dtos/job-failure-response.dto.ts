import { JobFailure } from '../entites/job-failure.entity';

export interface JobFailureResponse {
  id: string;
  jobId: string;
  attemptNumber: number;
  retryCountBeforeFailure: number;
  permanent: boolean;
  jobType: string;
  workerId?: string;
  errorMessage: string;
  errorName?: string;
  dlqPublished: boolean;
  failedAt: Date;
}

export const toJobFailureResponse = (
  failure: JobFailure,
): JobFailureResponse => ({
  id: failure.id,
  jobId: failure.jobId,
  attemptNumber: failure.attemptNumber,
  retryCountBeforeFailure: failure.retryCountBeforeFailure,
  permanent: failure.permanent,
  jobType: failure.jobType,
  workerId: failure.workerId,
  errorMessage: failure.errorMessage,
  errorName: failure.errorName,
  dlqPublished: failure.dlqPublished,
  failedAt: failure.failedAt,
});
