import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Job } from '../jobs/entites/job.entity';
import { Worker } from '../worker/entities/worker.entity';
import { SystemController } from './system.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Job, Worker])],
  controllers: [SystemController],
})
export class SystemModule {}
