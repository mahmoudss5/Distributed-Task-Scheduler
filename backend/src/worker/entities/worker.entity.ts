import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Worker {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  host: string;

  @Column({ default: 'active' })
  status: string;

  @Column()
  lastHeartbeat: Date;
}
