import { EmailService } from './email.service';

describe('EmailService', () => {
  let service: EmailService;

  beforeEach(() => {
    service = new EmailService(
      { getOrThrow: () => 'test@example.com' } as never,
      undefined as never,
      undefined as never,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
