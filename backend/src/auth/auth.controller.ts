import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RateLimit } from '../common/decorators/rate-limit.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @RateLimit({ limit: 10, windowSeconds: 60, keyPrefix: 'auth-login' })
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }
}
