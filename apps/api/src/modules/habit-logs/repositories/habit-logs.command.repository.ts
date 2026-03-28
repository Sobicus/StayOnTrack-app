import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HabitLog } from '../entities/habit-log.entity';

@Injectable()
export class HabitLogsCommandRepository {
  constructor(
    @InjectRepository(HabitLog)
    private readonly logRepository: Repository<HabitLog>,
  ) {}

  /**
   * Create a habit log entity (in memory, not persisted).
   */
  create(data: Partial<HabitLog>): HabitLog {
    return this.logRepository.create(data);
  }

  /**
   * Save a habit log entity (insert or update).
   */
  async save(log: HabitLog): Promise<HabitLog> {
    return this.logRepository.save(log);
  }

  /**
   * Remove a habit log entity.
   */
  async remove(log: HabitLog): Promise<void> {
    await this.logRepository.remove(log);
  }
}
