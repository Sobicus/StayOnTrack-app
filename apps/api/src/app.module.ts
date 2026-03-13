import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    // Global config from .env
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

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
        // WARNING: synchronize should be false in production.
        // Use migrations instead: typeorm migration:generate / migration:run
        synchronize: true,
        logging: config.get<string>('NODE_ENV') === 'development',
      }),
    }),

    // Feature modules
    HealthModule,
    AuthModule,
    UsersModule,
  ],
})
export class AppModule {}
