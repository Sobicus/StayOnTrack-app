import { plainToInstance } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString, validateSync } from 'class-validator';

/**
 * Validate critical env vars BEFORE NestFactory.create().
 * Crashes the process with a clear message if anything required is missing.
 */
export function validateRequiredEnv(): void {
  const required: Record<string, string> = {
    JWT_SECRET: 'JWT signing key for access tokens',
    JWT_REFRESH_SECRET: 'JWT signing key for refresh tokens',
    DB_HOST: 'PostgreSQL host',
    DB_PORT: 'PostgreSQL port',
    DB_USER: 'PostgreSQL username',
    DB_PASS: 'PostgreSQL password',
    DB_NAME: 'PostgreSQL database name',
  };

  const optional: Record<string, string> = {
    GMAIL_USER: 'Gmail address for sending emails',
    GMAIL_APP_PASSWORD: 'Gmail app password',
    GOOGLE_CLIENT_ID: 'Google OAuth client ID',
    GOOGLE_CLIENT_SECRET: 'Google OAuth client secret',
    TELEGRAM_BOT_TOKEN: 'Telegram bot token',
    VAPID_PUBLIC_KEY: 'Web Push VAPID public key',
    VAPID_PRIVATE_KEY: 'Web Push VAPID private key',
  };

  const missing: string[] = [];

  for (const [key, description] of Object.entries(required)) {
    if (!process.env[key] || process.env[key]!.trim() === '') {
      missing.push(`  ${key} — ${description}`);
    }
  }

  if (missing.length > 0) {
    console.error('\n========================================');
    console.error('  FATAL: Missing required environment variables');
    console.error('========================================\n');
    console.error(missing.join('\n'));
    console.error('\nCopy .env.example to .env and fill in all required values.\n');
    process.exit(1);
  }

  // Warn about optional vars
  const warnings: string[] = [];
  for (const [key, description] of Object.entries(optional)) {
    if (!process.env[key]) {
      warnings.push(`  ${key} — ${description} (feature will be disabled)`);
    }
  }

  if (warnings.length > 0) {
    console.warn('\nOptional environment variables not set:');
    console.warn(warnings.join('\n'));
    console.warn('');
  }
}

export enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

export class EnvironmentVariables {
  @IsEnum(Environment)
  @IsOptional()
  NODE_ENV: Environment = Environment.Development;

  @IsNumber()
  @IsOptional()
  PORT: number = 4800;

  // Database
  @IsString()
  @IsOptional()
  DB_HOST: string = 'localhost';

  @IsNumber()
  @IsOptional()
  DB_PORT: number = 5450;

  @IsString()
  @IsOptional()
  DB_USER: string = 'stayontrack';

  @IsString()
  @IsOptional()
  DB_PASS: string = 'stayontrack_dev_2024';

  @IsString()
  @IsOptional()
  DB_NAME: string = 'stayontrack';

  // JWT — required in production, optional in dev (has defaults)
  @IsString()
  @IsOptional()
  JWT_SECRET?: string;

  @IsString()
  @IsOptional()
  JWT_REFRESH_SECRET?: string;

  // CORS
  @IsString()
  @IsOptional()
  CORS_ORIGIN?: string;

  // Email (Resend)
  @IsString()
  @IsOptional()
  RESEND_API_KEY?: string;

  @IsString()
  @IsOptional()
  EMAIL_FROM?: string;
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(
      `Environment validation failed:\n${errors.map((e) => Object.values(e.constraints || {}).join(', ')).join('\n')}`,
    );
  }

  // In production, JWT secrets must be set explicitly
  if (validatedConfig.NODE_ENV === Environment.Production) {
    if (!validatedConfig.JWT_SECRET) {
      throw new Error('JWT_SECRET is required in production environment');
    }
    if (!validatedConfig.JWT_REFRESH_SECRET) {
      throw new Error('JWT_REFRESH_SECRET is required in production environment');
    }
  }

  return validatedConfig;
}
