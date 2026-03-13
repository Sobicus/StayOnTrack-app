import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create(AppModule);

  // Global API prefix
  app.setGlobalPrefix('api/v1');

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // CORS
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // TODO: Swagger setup
  // import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
  // const config = new DocumentBuilder()
  //   .setTitle('StayOnTrack API')
  //   .setDescription('Behavior change app - track what you avoided')
  //   .setVersion('1.0')
  //   .addBearerAuth()
  //   .build();
  // const document = SwaggerModule.createDocument(app, config);
  // SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 4800;
  await app.listen(port);

  logger.log(`StayOnTrack API running on http://localhost:${port}`);
  logger.log(`Health check: http://localhost:${port}/api/v1/health`);
  logger.log(`Auth: http://localhost:${port}/api/v1/auth`);
}

bootstrap();
