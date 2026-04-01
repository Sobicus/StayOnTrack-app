import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';

@Injectable()
export class UsersCommandRepository {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  create(data: Partial<User>): User {
    return this.usersRepository.create(data);
  }

  async save(user: User): Promise<User> {
    return this.usersRepository.save(user);
  }

  async remove(user: User): Promise<void> {
    await this.usersRepository.remove(user);
  }

  async softDelete(user: User): Promise<void> {
    await this.usersRepository.softRemove(user);
  }
}
