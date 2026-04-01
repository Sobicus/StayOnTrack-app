import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('habit_templates')
export class HabitTemplate {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 100 })
  nameEn!: string;

  @Column({ type: 'varchar', length: 100 })
  nameRu!: string;

  @Column({ type: 'int' })
  defaultCalories!: number;

  @Column({ type: 'float' })
  defaultMoney!: number;

  @Column({ type: 'varchar', length: 10 })
  emoji!: string;

  @Column({ type: 'varchar', length: 50 })
  category!: string;

  @Column({ type: 'int', default: 0 })
  sortOrder!: number;
}
