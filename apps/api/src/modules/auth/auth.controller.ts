import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req,
  Res,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthGuard } from '@nestjs/passport';
import { AuthService, AuthResponse } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { UserResponseDto } from '../users/dto/user-response.dto';
import { ApiRegister } from './swagger/register.swagger';
import { ApiLogin } from './swagger/login.swagger';
import { ApiRefresh } from './swagger/refresh.swagger';
import { ApiLogout } from './swagger/logout.swagger';
import { ApiForgotPassword } from './swagger/forgot-password.swagger';
import { ApiResetPassword } from './swagger/reset-password.swagger';
import { ApiVerifyEmail } from './swagger/verify-email.swagger';
import { ApiResendVerification } from './swagger/resend-verification.swagger';
import { ApiTelegramAuth } from './swagger/telegram-auth.swagger';
import { ApiGoogleAuth, ApiGoogleCallback } from './swagger/google-auth.swagger';
import { ApiGetMe } from './swagger/get-me.swagger';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @Throttle({ default: { ttl: 60000, limit: 3 } })
  @ApiRegister()
  async register(@Body() dto: RegisterDto): Promise<AuthResponse> {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @ApiLogin()
  async login(@Body() dto: LoginDto): Promise<AuthResponse> {
    return this.authService.login(dto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @ApiRefresh()
  async refresh(
    @Body('refreshToken') refreshToken: string,
  ): Promise<AuthResponse> {
    return this.authService.refresh(refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiLogout()
  async logout(@CurrentUser() user: User): Promise<void> {
    await this.authService.revokeRefreshToken(user.id);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 300000, limit: 1 } })
  @ApiForgotPassword()
  async forgotPassword(@Body() dto: ForgotPasswordDto): Promise<{ message: string }> {
    await this.authService.forgotPassword(dto.email);
    return { message: 'If an account with that email exists, a reset link has been sent.' };
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @ApiResetPassword()
  async resetPassword(@Body() dto: ResetPasswordDto): Promise<{ message: string }> {
    await this.authService.resetPassword(dto.token, dto.newPassword);
    return { message: 'Password has been reset successfully.' };
  }

  @Post('verify-email')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiVerifyEmail()
  async verifyEmail(
    @CurrentUser() user: User,
    @Body() body: { code: string },
  ): Promise<{ verified: boolean }> {
    return this.authService.verifyEmail(user.id, body.code);
  }

  @Post('resend-verification')
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { ttl: 60000, limit: 1 } })
  @HttpCode(HttpStatus.OK)
  @ApiResendVerification()
  async resendVerification(
    @CurrentUser() user: User,
  ): Promise<{ sent: boolean }> {
    return this.authService.resendVerification(user.id);
  }

  @Post('telegram')
  @HttpCode(HttpStatus.OK)
  @ApiTelegramAuth()
  async telegramAuth(@Body() body: { initData: string }) {
    return this.authService.telegramAuth(body.initData);
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  @ApiGoogleAuth()
  async googleAuth() {
    // Guard redirects to Google
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  @ApiGoogleCallback()
  async googleCallback(@Req() req: any, @Res() res: any) {
    const tokens = await this.authService.googleLogin(req.user);
    const frontendUrl =
      process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:4801';
    res.redirect(
      `${frontendUrl}/auth/google/callback?token=${tokens.accessToken}&refreshToken=${tokens.refreshToken}`,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiGetMe()
  async getMe(@CurrentUser() user: User): Promise<UserResponseDto> {
    return UserResponseDto.fromEntity(user);
  }
}
