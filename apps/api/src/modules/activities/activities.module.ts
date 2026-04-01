import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Activity } from './entities/activity.entity';
import { ActivitiesService } from './services/activities.service';
import { ActivitiesController } from './controllers/activities.controller';
import { ActivitiesQueryRepository } from './repositories/activities.query.repository';
import { ActivitiesCommandRepository } from './repositories/activities.command.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Activity])],
  controllers: [ActivitiesController],
  providers: [ActivitiesService, ActivitiesQueryRepository, ActivitiesCommandRepository],
  exports: [ActivitiesService],
})
export class ActivitiesModule {}
