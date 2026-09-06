import { Test, TestingModule } from '@nestjs/testing';
import { JobsControllerController } from './jobs-controller.controller';

describe('JobsControllerController', () => {
  let controller: JobsControllerController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [JobsControllerController],
    }).compile();

    controller = module.get<JobsControllerController>(JobsControllerController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
