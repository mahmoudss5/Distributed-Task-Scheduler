import { EmailController } from './email.controller';
import { EmailService } from '../service/email.service';

describe('EmailController', () => {
  let controller: EmailController;

  beforeEach(() => {
    controller = new EmailController({} as EmailService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
