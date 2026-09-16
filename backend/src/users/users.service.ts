import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { EmailService } from '../email/service/email.service';
import { RedisService } from '../redis/redis.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { PaginatedResponse } from '../common/dto/pagination.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly emailService: EmailService,
    private readonly redisService: RedisService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const existingUser = await this.userRepository.findOne({ where: { email: createUserDto.email } });
    if (existingUser) {
      throw new BadRequestException('User with this email already exists');
    }
    const user = this.userRepository.create(createUserDto);
    return this.userRepository.save(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async forgotPassword(email: string): Promise<void> {
    const user = await this.findByEmail(email);
    if (user) {
      await this.emailService.sendOtp(email);
    }
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<void> {
    const { email, otp, newPassword } = resetPasswordDto;
    const storedOtp = await this.redisService.get(`otp:${email}`);
    
    if (!storedOtp || storedOtp !== otp) {
      const attemptsKey = `otp-attempts:${email}`;
      const attempts = await this.redisService.increment(attemptsKey);
      if (attempts === 1) await this.redisService.expire(attemptsKey, 5 * 60);
      if (attempts > 5) {
        throw new BadRequestException('Too many invalid OTP attempts');
      }
      throw new BadRequestException('Invalid or expired OTP');
    }

    const user = await this.findByEmail(email);
    if (!user) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    user.password = newPassword;
    await this.userRepository.save(user);
    await this.redisService.del(`otp:${email}`);
    await this.redisService.del(`otp-attempts:${email}`);
  }

  async getAllUsers(page: number, limit: number): Promise<PaginatedResponse<UserResponseDto>> {
    const skip = (page - 1) * limit;
    const [data, total] = await this.userRepository.findAndCount({
      take: limit,
      skip: skip,
    });
    
    const mappedData = data.map(user => this.convertToDto(user));
    
    return {
      data: mappedData,
      meta: {
        total,
        page,
        limit,
      },
    };
  }

  convertToDto(user: User): UserResponseDto {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }


}
