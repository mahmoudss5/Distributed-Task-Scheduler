import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { JobStatus } from './job-status.enum';
import { JobPriority } from './job-priority.enum';
import { JobPriorityLevel } from './job-priority-level.enum';

@Entity()
export class Job {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('jsonb')
  jobPayload: any;

  @Column()
  type: string;

  @Column()
  priority: number;

  @Column({
    type: 'enum',
    enum: JobPriorityLevel,
    default: JobPriorityLevel.LOW,
  })
  priorityLevel: JobPriorityLevel;

  @Column({ nullable: true })
  workerId: string;

  @Column({
    type: 'enum',
    enum: JobStatus,
    default: JobStatus.PENDING,
  })
  status: JobStatus;

  @Column()
  executeAt: Date;

  @Column()
  userId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  cron?: string;

  @Column({ nullable: true })
  runAt: Date;

  @Column()
  retryCount: number;
}