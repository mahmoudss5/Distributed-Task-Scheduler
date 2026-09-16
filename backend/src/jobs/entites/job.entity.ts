import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { JobType } from './job.type.enum';
import { JobStatus } from './job-status.enum';
import { JobPriorityLevel } from './job-priority-level.enum';

@Entity()
export class Job {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('json')
  jobPayload: any;

  @Column(
    {
      type: 'enum',
      enum: JobType,
    }
  )
  type: JobType;

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

  @Column({ type: 'datetime', nullable: true })
  executeAt?: Date;

  @Column()
  userId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  cron?: string;

  @Column({ type: 'datetime', nullable: true })
  runAt?: Date;

  @Column({ default: 3 })
  retryCount: number;

  @Column({ default: 0 })
  attemptCount: number;

  @Column({ default: false })
  isCanceled: boolean;

  @Column({ nullable: true })
  canceledAt?: Date;
}
