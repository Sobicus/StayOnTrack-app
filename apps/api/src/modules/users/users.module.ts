import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UsersService } from './services/users.service';
import { UsersController } from './controllers/users.controller';
import { UsersQueryRepository } from './repositories/users.query.repository';
import { UsersCommandRepository } from './repositories/users.command.repository';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UsersController],
  providers: [UsersService, UsersQueryRepository, UsersCommandRepository],
  exports: [UsersService],
})
export class UsersModule {}
