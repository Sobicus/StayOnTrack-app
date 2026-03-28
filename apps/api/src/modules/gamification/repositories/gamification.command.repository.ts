import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Quest } from '../entities/quest.entity';

@Injectable()
export class GamificationCommandRepository {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Quest)
    private readonly questRepository: Repository<Quest>,
  ) {}

  async createQuest(data: Partial<Quest>): Promise<Quest> {
    const quest = this.questRepository.create(data);
    return this.questRepository.save(quest);
  }

  async saveQuest(quest: Quest): Promise<Quest> {
    return this.questRepository.save(quest);
  }

  async saveUser(user: User): Promise<User> {
    return this.userRepository.save(user);
  }
}
