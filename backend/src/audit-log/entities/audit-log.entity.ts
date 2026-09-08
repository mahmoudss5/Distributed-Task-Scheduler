import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';
import { AuditLogAction } from '../enums/audit-log-action.enum';

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: AuditLogAction,
  })
  action: AuditLogAction;

  @Column()
  entityName: string;

  @Column()
  entityId: string;

  @Column({ nullable: true })
  userId: string; // Temporarily nullable until strict auth is added

  @Column('json', { nullable: true })
  details: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;
}
