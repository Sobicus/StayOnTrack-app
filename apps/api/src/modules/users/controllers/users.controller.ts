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
import { ApiTags } from '@nestjs/swagger';
import { UsersService } from '../services/users.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { User } from '../entities/user.entity';
import { UpdateUserDto } from '../dto/update-user.dto';
import { UserResponseDto } from '../dto/user-response.dto';
import { ApiGetMe } from '../swagger/get-me.swagger';
import { ApiUpdateMe } from '../swagger/update-me.swagger';
import { ApiExportMyData } from '../swagger/export-my-data.swagger';
import { ApiGenerateTelegramCode } from '../swagger/telegram-code.swagger';
import { ApiUnlinkTelegram } from '../swagger/unlink-telegram.swagger';
import { ApiDeleteMe } from '../swagger/delete-me.swagger';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiGetMe()
  async getMe(@CurrentUser() user: User): Promise<UserResponseDto> {
    return UserResponseDto.fromEntity(user);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me')
  @ApiUpdateMe()
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
  @ApiExportMyData()
  async exportMyData(
    @CurrentUser() user: User,
  ): Promise<Record<string, unknown>> {
    return this.usersService.exportUserData(user.id);
  }

  @Post('me/telegram-code')
  @UseGuards(JwtAuthGuard)
  @ApiGenerateTelegramCode()
  async generateTelegramCode(@CurrentUser() user: User) {
    const code = await this.usersService.generateTelegramLinkCode(user.id);
    return { code, expiresIn: 600 };
  }

  @Delete('me/telegram')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiUnlinkTelegram()
  async unlinkTelegram(@CurrentUser() user: User) {
    await this.usersService.unlinkTelegram(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('me')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiDeleteMe()
  async deleteMe(@CurrentUser() user: User): Promise<void> {
    await this.usersService.deleteAccount(user.id);
  }
}
