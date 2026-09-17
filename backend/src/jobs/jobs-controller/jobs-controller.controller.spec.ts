import { JobsControllerController } from './jobs-controller.controller';
import { JobsServiceService } from '../jobs-service/jobs-service.service';

describe('JobsControllerController', () => {
  let controller: JobsControllerController;

  beforeEach(() => {
    controller = new JobsControllerController({} as JobsServiceService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
