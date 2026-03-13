import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Habit } from './entities/habit.entity';
import { HabitsService } from './habits.service';
import { HabitsController } from './habits.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Habit])],
  controllers: [HabitsController],
  providers: [HabitsService],
  exports: [HabitsService],
})
export class HabitsModule {}
