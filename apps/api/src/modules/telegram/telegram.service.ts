import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Telegraf } from 'telegraf';
import { UsersService } from '../users/users.service';
import { StatsService } from '../stats/stats.service';
import { StreaksService } from '../streaks/streaks.service';

@Injectable()
export class TelegramService implements OnModuleInit {
  private bot: Telegraf | null = null;
  private readonly logger = new Logger(TelegramService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
    private readonly statsService: StatsService,
    private readonly streaksService: StreaksService,
  ) {}

  async onModuleInit() {
    const token = this.configService.get<string>('TELEGRAM_BOT_TOKEN');
    if (!token) {
      this.logger.warn('TELEGRAM_BOT_TOKEN not set — Telegram bot disabled');
      return;
    }

    this.bot = new Telegraf(token);
    this.setupCommands();

    this.bot.launch().catch((err) => {
      this.logger.error('Failed to launch Telegram bot', err.message);
    });

    this.logger.log('Telegram bot started');
  }

  private setupCommands() {
    if (!this.bot) return;

    this.bot.command('start', (ctx) => {
      ctx.reply(
        '👋 Welcome to StayOnTrack Bot!\n\n' +
        'To link your account, go to Settings in the app and get a link code, then use:\n' +
        '/link <code>\n\n' +
        'Available commands:\n' +
        '/stats — Today\'s saved calories & money\n' +
        '/streak — Your current streak\n' +
        '/help — Show this message',
      );
    });

    this.bot.command('help', (ctx) => {
      ctx.reply(
        '📋 StayOnTrack Bot Commands:\n\n' +
        '/link <code> — Link your account\n' +
        '/stats — Today\'s stats\n' +
        '/streak — Current streak\n' +
        '/help — Show this message',
      );
    });

    this.bot.command('link', async (ctx) => {
      const code = ctx.message.text.split(' ')[1];
      if (!code || code.length !== 6) {
        return ctx.reply('❌ Please provide a 6-digit code: /link 123456');
      }

      const chatId = ctx.chat.id.toString();
      const user = await this.usersService.findByTelegramLinkCode(code);

      if (!user) {
        return ctx.reply('❌ Invalid or expired code. Please generate a new one in the app.');
      }

      await this.usersService.update(user.id, {
        telegramChatId: chatId,
        telegramLinked: true,
        telegramLinkCode: null,
        telegramLinkCodeExpiresAt: null,
      });

      return ctx.reply(`✅ Account linked! Welcome, ${user.username}! 🎉\n\nUse /stats to see your progress.`);
    });

    this.bot.command('stats', async (ctx) => {
      const chatId = ctx.chat.id.toString();
      const user = await this.usersService.findByTelegramChatId(chatId);

      if (!user) {
        return ctx.reply('❌ Account not linked. Use /link <code> first.');
      }

      try {
        const stats = await this.statsService.getLiveStats(user);
        const todayWeight = stats.todayCalories / 7700;
        const msg = [
          `📊 Today's Stats for ${user.username}:`,
          '',
          `🔥 Calories saved: ${stats.todayCalories.toLocaleString()} kcal`,
          `💰 Money saved: €${stats.todayMoney.toFixed(2)}`,
          `⚖️ Weight avoided: ${todayWeight.toFixed(3)} kg`,
          '',
          `📈 All-time total: ${stats.pastCalories.toLocaleString()} kcal`,
        ].join('\n');
        return ctx.reply(msg);
      } catch {
        return ctx.reply('📊 No stats available yet. Start checking in!');
      }
    });

    this.bot.command('streak', async (ctx) => {
      const chatId = ctx.chat.id.toString();
      const user = await this.usersService.findByTelegramChatId(chatId);

      if (!user) {
        return ctx.reply('❌ Account not linked. Use /link <code> first.');
      }

      try {
        const streak = await this.streaksService.getStreak(user.id);
        const fire = streak.currentStreak > 0 ? '🔥' : '❄️';
        const msg = [
          `${fire} Streak: ${streak.currentStreak} days`,
          `🏆 Best streak: ${streak.bestStreak} days`,
          `🛡️ Shields remaining: ${streak.streakShieldsRemaining}`,
        ].join('\n');
        return ctx.reply(msg);
      } catch {
        return ctx.reply('No streak data yet.');
      }
    });
  }

  /**
   * Send a message to a user's Telegram chat.
   */
  async sendMessage(chatId: string, message: string): Promise<void> {
    if (!this.bot) return;
    try {
      await this.bot.telegram.sendMessage(chatId, message);
    } catch (err: any) {
      this.logger.error(`Failed to send Telegram message to ${chatId}`, err.message);
    }
  }
}
