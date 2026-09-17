import { JobsServiceService } from './jobs-service.service';

describe('JobsServiceService', () => {
  let service: JobsServiceService;

  beforeEach(() => {
    service = new JobsServiceService(
      undefined as never,
      undefined as never,
      undefined as never,
      undefined as never,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
