import { WorkerService } from './worker.service';

describe('WorkerService', () => {
  let service: WorkerService;

  beforeEach(() => {
    service = new WorkerService(
      { connect: () => undefined } as never,
      undefined as never,
      { save: () => Promise.resolve() } as never,
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
