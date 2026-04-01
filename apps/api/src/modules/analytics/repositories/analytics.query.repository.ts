import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AnalyticsEvent } from '../entities/analytics-event.entity';

export interface RetentionCohort {
  registrationDate: string;
  totalUsers: number;
  day1: number;
  day7: number;
  day30: number;
}

export interface EventCount {
  date: string;
  count: number;
}

export interface UserFunnel {
  registered: number;
  createdHabit: number;
  firstCheckin: number;
  day7Active: number;
}

@Injectable()
export class AnalyticsQueryRepository {
  constructor(
    @InjectRepository(AnalyticsEvent)
    private readonly repo: Repository<AnalyticsEvent>,
  ) {}

  async getRetentionCohorts(
    startDate: Date,
    endDate: Date,
  ): Promise<RetentionCohort[]> {
    const result = await this.repo.query(
      `
      WITH registrations AS (
        SELECT
          "userId",
          DATE("createdAt") AS reg_date
        FROM analytics_events
        WHERE "eventType" = 'user_registered'
          AND "createdAt" >= $1
          AND "createdAt" < $2
      ),
      checkins AS (
        SELECT DISTINCT
          "userId",
          DATE("createdAt") AS checkin_date
        FROM analytics_events
        WHERE "eventType" = 'checkin_completed'
      )
      SELECT
        r.reg_date AS "registrationDate",
        COUNT(DISTINCT r."userId") AS "totalUsers",
        COUNT(DISTINCT CASE
          WHEN c1."userId" IS NOT NULL THEN r."userId"
        END) AS "day1",
        COUNT(DISTINCT CASE
          WHEN c7."userId" IS NOT NULL THEN r."userId"
        END) AS "day7",
        COUNT(DISTINCT CASE
          WHEN c30."userId" IS NOT NULL THEN r."userId"
        END) AS "day30"
      FROM registrations r
      LEFT JOIN checkins c1
        ON c1."userId" = r."userId"
        AND c1.checkin_date = r.reg_date + INTERVAL '1 day'
      LEFT JOIN checkins c7
        ON c7."userId" = r."userId"
        AND c7.checkin_date = r.reg_date + INTERVAL '7 days'
      LEFT JOIN checkins c30
        ON c30."userId" = r."userId"
        AND c30.checkin_date = r.reg_date + INTERVAL '30 days'
      GROUP BY r.reg_date
      ORDER BY r.reg_date
      `,
      [startDate, endDate],
    );

    return result.map((row: Record<string, string>) => ({
      registrationDate: row.registrationDate,
      totalUsers: parseInt(row.totalUsers, 10),
      day1: parseInt(row.day1, 10),
      day7: parseInt(row.day7, 10),
      day30: parseInt(row.day30, 10),
    }));
  }

  async getDailyActiveUsers(date: Date): Promise<number> {
    const result = await this.repo.query(
      `
      SELECT COUNT(DISTINCT "userId") AS count
      FROM analytics_events
      WHERE "eventType" = 'checkin_completed'
        AND DATE("createdAt") = $1
      `,
      [date.toISOString().split('T')[0]],
    );

    return parseInt(result[0]?.count, 10) || 0;
  }

  async getEventCounts(
    eventType: string,
    days: number,
  ): Promise<EventCount[]> {
    const result = await this.repo.query(
      `
      SELECT
        DATE("createdAt") AS date,
        COUNT(*) AS count
      FROM analytics_events
      WHERE "eventType" = $1
        AND "createdAt" >= NOW() - ($2 || ' days')::INTERVAL
      GROUP BY DATE("createdAt")
      ORDER BY date
      `,
      [eventType, days],
    );

    return result.map((row: Record<string, string>) => ({
      date: row.date,
      count: parseInt(row.count, 10),
    }));
  }

  async getUserFunnel(): Promise<UserFunnel> {
    const result = await this.repo.query(
      `
      SELECT
        (SELECT COUNT(DISTINCT "userId")
         FROM analytics_events WHERE "eventType" = 'user_registered') AS registered,
        (SELECT COUNT(DISTINCT "userId")
         FROM analytics_events WHERE "eventType" = 'habit_created') AS "createdHabit",
        (SELECT COUNT(DISTINCT "userId")
         FROM analytics_events WHERE "eventType" = 'checkin_completed') AS "firstCheckin",
        (SELECT COUNT(DISTINCT ae."userId")
         FROM analytics_events ae
         INNER JOIN analytics_events reg
           ON reg."userId" = ae."userId"
           AND reg."eventType" = 'user_registered'
         WHERE ae."eventType" = 'checkin_completed'
           AND DATE(ae."createdAt") >= DATE(reg."createdAt") + INTERVAL '7 days'
        ) AS "day7Active"
      `,
    );

    const row = result[0] || {};
    return {
      registered: parseInt(row.registered, 10) || 0,
      createdHabit: parseInt(row.createdHabit, 10) || 0,
      firstCheckin: parseInt(row.firstCheckin, 10) || 0,
      day7Active: parseInt(row.day7Active, 10) || 0,
    };
  }
}
