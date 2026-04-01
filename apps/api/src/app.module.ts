import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { validate } from './config/env.validation';
import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { HabitsModule } from './modules/habits/habits.module';
import { HabitLogsModule } from './modules/habit-logs/habit-logs.module';
import { ActivitiesModule } from './modules/activities/activities.module';
import { StatsModule } from './modules/stats/stats.module';
import { StreaksModule } from './modules/streaks/streaks.module';
import { AchievementsModule } from './modules/achievements/achievements.module';
import { FriendsModule } from './modules/friends/friends.module';
import { ChallengesModule } from './modules/challenges/challenges.module';
import { GamificationModule } from './modules/gamification/gamification.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { TelegramModule } from './modules/telegram/telegram.module';
import { AuditModule } from './modules/audit/audit.module';
import { ProfileModule } from './modules/profile/profile.module';
import { RequestLoggerMiddleware } from './common/middleware/request-logger.middleware';
import { EmailModule } from './common/email/email.module';

@Module({
  imports: [
    // Global config from .env with validation
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validate,
    }),

    // Rate limiting — 100 requests per 60 seconds globally
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60000,
        limit: 100,
      },
    ]),

    // Database connection
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres' as const,
        host: config.get<string>('DB_HOST', 'localhost'),
        port: config.get<number>('DB_PORT', 5450),
        username: config.get<string>('DB_USER', 'stayontrack'),
        password: config.get<string>('DB_PASS', 'stayontrack_dev_2024'),
        database: config.get<string>('DB_NAME', 'stayontrack'),
        autoLoadEntities: true,
        // synchronize: true only in development — use migrations in production
        synchronize: config.get<string>('NODE_ENV') !== 'production',
        // In production, run migrations on startup
        migrationsRun: config.get<string>('NODE_ENV') === 'production',
        migrations: [__dirname + '/migrations/*{.ts,.js}'],
        logging: config.get<string>('NODE_ENV') === 'production' ? ['error'] : ['error', 'warn'],
        maxQueryExecutionTime: 1000,
        extra: {
          max: 20,
          idleTimeoutMillis: 30000,
        },
      }),
    }),

    // Global modules
    EmailModule,

    // Feature modules
    HealthModule,
    AuthModule,
    UsersModule,
    HabitsModule,
    HabitLogsModule,
    ActivitiesModule,
    StatsModule,
    StreaksModule,
    AchievementsModule,
    FriendsModule,
    ChallengesModule,
    ProfileModule,
    GamificationModule,
    NotificationsModule,
    AnalyticsModule,
    TelegramModule,
    AuditModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggerMiddleware).forRoutes('*');
  }
}
