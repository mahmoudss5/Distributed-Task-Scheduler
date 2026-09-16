import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

/**
 * A durable record of every failed execution attempt.
 *
 * Permanent failures are also published to Kafka, but the database record is
 * the source of truth for investigation and replay when Kafka is unavailable.
 */
@Entity('job_failure')
export class JobFailure {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  jobId: string;

  @Column()
  attemptNumber: number;

  @Column()
  retryCountBeforeFailure: number;

  @Column({ default: false })
  permanent: boolean;

  @Column()
  jobType: string;

  @Column()
  userId: string;

  @Column({ nullable: true })
  workerId?: string;

  @Column('json')
  jobPayload: any;

  @Column('text')
  errorMessage: string;

  @Column({ nullable: true, length: 255 })
  errorName?: string;

  @Column('text', { nullable: true })
  errorStack?: string;

  @Column({ nullable: true })
  dlqTopic?: string;

  @Column({ default: false })
  dlqPublished: boolean;

  @Column({ type: 'datetime', nullable: true })
  dlqPublishedAt?: Date;

  @CreateDateColumn()
  failedAt: Date;
}
