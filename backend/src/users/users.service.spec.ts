import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(() => {
    service = new UsersService(
      undefined as never,
      undefined as never,
      undefined as never,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
