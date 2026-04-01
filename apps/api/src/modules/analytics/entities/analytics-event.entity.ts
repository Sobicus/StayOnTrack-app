import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('analytics_events')
@Index(['eventType', 'createdAt'])
@Index(['userId', 'eventType'])
export class AnalyticsEvent {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', nullable: true })
  userId!: string | null;

  @Column({ type: 'varchar', length: 100 })
  eventType!: string;

  @Column({ type: 'jsonb', nullable: true })
  eventData!: Record<string, unknown> | null;

  @CreateDateColumn()
  createdAt!: Date;
}
