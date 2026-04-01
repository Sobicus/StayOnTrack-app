import { IsNumber, IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TelegramWidgetDto {
  @ApiProperty({ description: 'Telegram user ID' })
  @IsNumber()
  id!: number;

  @ApiProperty({ description: 'First name' })
  @IsString()
  first_name!: string;

  @ApiPropertyOptional({ description: 'Last name' })
  @IsOptional()
  @IsString()
  last_name?: string;

  @ApiPropertyOptional({ description: 'Telegram username' })
  @IsOptional()
  @IsString()
  username?: string;

  @ApiPropertyOptional({ description: 'Profile photo URL' })
  @IsOptional()
  @IsString()
  photo_url?: string;

  @ApiProperty({ description: 'Unix timestamp of authorization' })
  @IsNumber()
  auth_date!: number;

  @ApiProperty({ description: 'HMAC-SHA256 hash for verification' })
  @IsString()
  hash!: string;
}
