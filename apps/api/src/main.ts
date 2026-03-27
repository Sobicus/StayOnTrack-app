import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { DataSource } from 'typeorm';
import * as express from 'express';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { SanitizePipe } from './common/pipes/sanitize.pipe';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create(AppModule);

  // Security headers
  app.use(helmet());

  // Request size limits
  app.use(express.json({ limit: '10kb' }));
  app.use(express.urlencoded({ limit: '10kb', extended: true }));

  // Global exception filter — safe error responses, no stack trace leaks
  app.useGlobalFilters(new AllExceptionsFilter());

  // Global API prefix
  app.setGlobalPrefix('api/v1');

  // Global pipes: sanitize first, then validate
  app.useGlobalPipes(
    new SanitizePipe(),
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // CORS — restrict to frontend origin
  app.enableCors({
    origin: process.env.CORS_ORIGIN
      ? process.env.CORS_ORIGIN.split(',')
      : ['http://localhost:4801'],
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  });

  // Swagger / OpenAPI documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle('StayOnTrack API')
    .setDescription('Behavior change app — track what you avoided, not what you consumed.')
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'access-token',
    )
    .addTag('Auth', 'Registration, login, token refresh, password reset')
    .addTag('Users', 'User profile management')
    .addTag('Habits', 'Habit CRUD operations')
    .addTag('Check-ins', 'Daily habit check-in logs')
    .addTag('Stats', 'Cumulative & live statistics')
    .addTag('Streaks', 'Streak tracking & shields')
    .addTag('Achievements', 'Achievement unlocking & tracking')
    .addTag('Friends', 'Friend requests & leaderboard')
    .addTag('Challenges', 'Challenges between friends')
    .addTag('Activities', 'Effort equivalent activities')
    .addTag('Health', 'Health check endpoint')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 4800;
  await app.listen(port);

  // Seed habit templates
  const dataSource = app.get(DataSource);
  const { seedHabitTemplates } = await import('./modules/habits/seed/habit-templates.seed');
  await seedHabitTemplates(dataSource).catch(e => console.warn('Template seed skipped:', e.message));

  logger.log(`StayOnTrack API running on http://localhost:${port}`);
  logger.log(`API Docs: http://localhost:${port}/api/docs`);
  logger.log(`Health check: http://localhost:${port}/api/v1/health`);
}

bootstrap();
