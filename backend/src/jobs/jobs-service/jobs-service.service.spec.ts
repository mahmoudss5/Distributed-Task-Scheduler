import { Test, TestingModule } from '@nestjs/testing';
import { JobsServiceService } from './jobs-service.service';

describe('JobsServiceService', () => {
  let service: JobsServiceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [JobsServiceService],
    }).compile();

    service = module.get<JobsServiceService>(JobsServiceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
