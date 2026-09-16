import { IsOptional, IsEnum, IsObject, IsDateString, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { JobPriorityLevel } from '../entites/job-priority-level.enum';
import { JobType } from '../entites/job.type.enum';

export class CreateJobDto {
  @IsEnum(JobType)
  type: JobType;

  @IsObject()
  jobPayload: any;

  @IsOptional()
  @IsEnum(JobPriorityLevel)
  priorityLevel?: JobPriorityLevel;

  @IsOptional()
  @IsString()
  cron?: string;

  @IsOptional()
  @IsDateString()
  @Type(() => Date)
  executeAt?: Date;
}
