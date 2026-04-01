import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HabitLog } from '../../habit-logs/entities/habit-log.entity';
import { User } from '../../users/entities/user.entity';

@Injectable()
export class StreaksCommandRepository {
  constructor(
    @InjectRepository(HabitLog)
    private readonly logRepository: Repository<HabitLog>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Save a user entity.
   */
  async saveUser(user: User): Promise<User> {
    return this.userRepository.save(user);
  }

  /**
   * Create a habit log entity (in memory, not persisted).
   */
  createLog(data: Partial<HabitLog>): HabitLog {
    return this.logRepository.create(data);
  }

  /**
   * Save one or more habit log entities.
   */
  async saveLogs(logs: HabitLog[]): Promise<HabitLog[]> {
    return this.logRepository.save(logs);
  }
}
