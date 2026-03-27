import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from './entities/user.entity';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';

@ApiTags('Users')
@ApiBearerAuth('access-token')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMe(@CurrentUser() user: User): Promise<UserResponseDto> {
    return UserResponseDto.fromEntity(user);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me')
  async updateMe(
    @CurrentUser() user: User,
    @Body() dto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    const updated = await this.usersService.update(user.id, dto);
    return UserResponseDto.fromEntity(updated);
  }

  /**
   * GDPR: Export all user data as JSON.
   */
  @UseGuards(JwtAuthGuard)
  @Get('me/export')
  async exportMyData(
    @CurrentUser() user: User,
  ): Promise<Record<string, unknown>> {
    return this.usersService.exportUserData(user.id);
  }

  @Post('me/telegram-code')
  @UseGuards(JwtAuthGuard)
  async generateTelegramCode(@CurrentUser() user: User) {
    const code = await this.usersService.generateTelegramLinkCode(user.id);
    return { code, expiresIn: 600 };
  }

  @Delete('me/telegram')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async unlinkTelegram(@CurrentUser() user: User) {
    await this.usersService.unlinkTelegram(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('me')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteMe(@CurrentUser() user: User): Promise<void> {
    await this.usersService.deleteAccount(user.id);
  }
}
