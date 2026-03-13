import { plainToInstance } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString, validateSync } from 'class-validator';

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
