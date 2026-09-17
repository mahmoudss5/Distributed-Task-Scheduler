import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    service = new AuthService(undefined as never, undefined as never);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
