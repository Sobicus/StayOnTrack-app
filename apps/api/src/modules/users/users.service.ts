import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async findById(id: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { username } });
  }

  async create(data: {
    email: string;
    passwordHash: string;
    username: string;
  }): Promise<User> {
    // Check email uniqueness
    const existingEmail = await this.findByEmail(data.email);
    if (existingEmail) {
      throw new ConflictException('Email is already registered');
    }

    // Check username uniqueness
    const existingUsername = await this.findByUsername(data.username);
    if (existingUsername) {
      throw new ConflictException('Username is already taken');
    }

    const user = this.usersRepository.create(data);
    return this.usersRepository.save(user);
  }

  async update(id: string, data: Partial<User>): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // If updating username, check uniqueness
    if (data.username && data.username !== user.username) {
      const existingUsername = await this.findByUsername(data.username);
      if (existingUsername) {
        throw new ConflictException('Username is already taken');
      }
    }

    Object.assign(user, data);
    return this.usersRepository.save(user);
  }
}
