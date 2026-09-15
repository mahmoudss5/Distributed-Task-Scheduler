import { IsString, IsOptional, IsEnum, IsObject, IsDateString } from 'class-validator';
import { JobPriorityLevel } from '../entites/job-priority-level.enum';
import { JobType } from '../entites/job.type.enum';

export class CreateJobDto {
  @IsString()
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
  executeAt?: Date;
}
