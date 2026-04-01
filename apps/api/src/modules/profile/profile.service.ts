import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { UsersService } from '../users/services/users.service';
import { StatsService } from '../stats/services/stats.service';
import { StreaksService } from '../streaks/services/streaks.service';
import { FriendsService } from '../friends/services/friends.service';
import { AchievementsService } from '../achievements/services/achievements.service';
import { ChallengesService } from '../challenges/services/challenges.service';
import { ProfileVisibility } from '../users/entities/user.entity';

export interface PublicProfileDto {
  username: string;
  joinedAt: string;
  daysTracking: number;
  profileFrame: string | null;
  streak?: { current: number; best: number };
  stats?: { calories: number; money: number; weightKg: number };
  achievements?: { total: number; unlocked: number; topEmojis: string[] };
  activeChallengesCount?: number;
}

@Injectable()
export class ProfileService {
  constructor(
    private readonly usersService: UsersService,
    private readonly statsService: StatsService,
    private readonly streaksService: StreaksService,
    private readonly friendsService: FriendsService,
    private readonly achievementsService: AchievementsService,
    private readonly challengesService: ChallengesService,
  ) {}

  async getPublicProfile(username: string, requestingUserId?: string): Promise<PublicProfileDto> {
    const target = await this.usersService.findByUsername(username);
    if (!target) throw new NotFoundException('User not found');

    // Privacy check
    if (target.visibility === ProfileVisibility.PRIVATE) {
      if (!requestingUserId || requestingUserId !== target.id) {
        throw new ForbiddenException('This profile is private');
      }
    }

    if (target.visibility === ProfileVisibility.FRIENDS) {
      if (!requestingUserId) throw new ForbiddenException('Login to view this profile');
      if (requestingUserId !== target.id) {
        const areFriends = await this.friendsService.areFriends(requestingUserId, target.id);
        if (!areFriends) throw new ForbiddenException('This profile is only visible to friends');
      }
    }

    const joinedAt = target.createdAt.toISOString();
    const daysTracking = Math.floor((Date.now() - target.createdAt.getTime()) / 86400000);

    const profile: PublicProfileDto = {
      username: target.username,
      joinedAt,
      daysTracking,
      profileFrame: target.profileFrame ?? null,
    };

    // Load sections in parallel based on toggles
    const [streak, stats, achievements, challengeCount] = await Promise.all([
      target.showStreak ? this.streaksService.getStreak(target.id).catch(() => null) : null,
      target.showStats ? this.statsService.getUserStats(target.id).catch(() => null) : null,
      target.showAchievements ? this.achievementsService.getUserAchievements(target.id).catch(() => null) : null,
      target.showActiveChallenges ? this.challengesService.getChallengeCount(target.id).catch(() => 0) : null,
    ]);

    if (streak) {
      profile.streak = { current: streak.currentStreak, best: streak.bestStreak };
    }
    if (stats) {
      profile.stats = {
        calories: stats.totalSavedCalories,
        money: stats.totalSavedMoney,
        weightKg: stats.potentialWeightAvoidedKg,
      };
    }
    if (achievements) {
      const topEmojis = achievements.achievements
        .filter(a => a.unlocked)
        .slice(0, 3)
        .map(a => a.emoji);
      profile.achievements = {
        total: achievements.total,
        unlocked: achievements.unlocked,
        topEmojis,
      };
    }
    if (challengeCount !== null) {
      profile.activeChallengesCount = challengeCount;
    }

    return profile;
  }
}
