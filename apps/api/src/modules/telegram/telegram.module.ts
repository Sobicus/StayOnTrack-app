import { Module } from '@nestjs/common';
import { TelegramService } from './telegram.service';
import { UsersModule } from '../users/users.module';
import { StatsModule } from '../stats/stats.module';
import { StreaksModule } from '../streaks/streaks.module';

@Module({
  imports: [UsersModule, StatsModule, StreaksModule],
  providers: [TelegramService],
  exports: [TelegramService],
})
export class TelegramModule {}
