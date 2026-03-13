import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { DataSource, Repository, ObjectLiteral } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

interface SeededEntity extends ObjectLiteral {
  id: string;
  title?: string;
  caloriesPerOccurrence?: number;
  pricePerOccurrence?: number;
}

const logger = new Logger('Seed');

dotenv.config();

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5450', 10),
  username: process.env.DB_USER || 'stayontrack',
  password: process.env.DB_PASS || 'stayontrack_dev_2024',
  database: process.env.DB_NAME || 'stayontrack',
  entities: [__dirname + '/../modules/**/entities/*.entity.{ts,js}'],
  synchronize: true,
  logging: false,
});

const habitsData = [
  {
    title: 'Big Mac',
    emoji: '🍔',
    category: 'FASTFOOD',
    caloriesPerOccurrence: 550,
    pricePerOccurrence: 5.5,
    frequencyType: 'DAILY',
  },
  {
    title: 'Cola',
    emoji: '🥤',
    category: 'DRINKS',
    caloriesPerOccurrence: 140,
    pricePerOccurrence: 2.0,
    frequencyType: 'DAILY',
  },
  {
    title: 'Chocolate Bar',
    emoji: '🍫',
    category: 'SWEETS',
    caloriesPerOccurrence: 230,
    pricePerOccurrence: 2.5,
    frequencyType: 'DAILY',
  },
  {
    title: 'Beer',
    emoji: '🍺',
    category: 'ALCOHOL',
    caloriesPerOccurrence: 150,
    pricePerOccurrence: 4.0,
    frequencyType: 'WEEKLY',
    occurrencesPerWeek: 3,
  },
  {
    title: 'French Fries',
    emoji: '🍟',
    category: 'FASTFOOD',
    caloriesPerOccurrence: 365,
    pricePerOccurrence: 2.5,
    frequencyType: 'DAILY',
  },
];

async function createUserWithHabits(
  userRepo: Repository<ObjectLiteral>,
  habitRepo: Repository<ObjectLiteral>,
  userData: {
    email: string;
    username: string;
    password: string;
    weightKg: number;
    heightCm: number;
    goal: string;
    visibility: string;
    locale: string;
    currency: string;
    weekStartDay: string;
    onboardingCompleted: boolean;
  },
) {
  const existingUser = await userRepo.findOne({ where: { email: userData.email } });
  if (existingUser) {
    logger.log(`⚠️  User ${userData.email} already exists, skipping creation.`);
  }

  const passwordHash = await bcrypt.hash(userData.password, 10);
  const user =
    existingUser ||
    (await userRepo.save(
      userRepo.create({
        email: userData.email,
        username: userData.username,
        passwordHash,
        weightKg: userData.weightKg,
        heightCm: userData.heightCm,
        goal: userData.goal,
        visibility: userData.visibility,
        locale: userData.locale,
        currency: userData.currency,
        weekStartDay: userData.weekStartDay,
        onboardingCompleted: userData.onboardingCompleted,
      }),
    ));
  const userId = (user as SeededEntity).id;
  logger.log(`✅ User: ${userData.email} / ${userData.password} (id: ${userId})`);

  // Create habits for this user
  const habits: SeededEntity[] = [];
  for (const hd of habitsData) {
    const existing = await habitRepo.findOne({
      where: { title: hd.title, userId },
    });
    if (existing) {
      habits.push(existing as SeededEntity);
      continue;
    }
    const habit = await habitRepo.save(
      habitRepo.create({ ...hd, userId }),
    );
    habits.push(habit as SeededEntity);
  }
  logger.log(`✅ ${habits.length} habits created for ${userData.username}`);

  return { user, habits };
}

async function createCheckInLogs(
  habitLogRepo: Repository<ObjectLiteral>,
  userId: string,
  habits: SeededEntity[],
  days: number,
) {
  const today = new Date();
  let logsCreated = 0;

  for (let dayOffset = days; dayOffset >= 1; dayOffset--) {
    const date = new Date(today);
    date.setDate(date.getDate() - dayOffset);
    const dateStr = date.toISOString().split('T')[0];

    for (const habit of habits) {
      // Skip some randomly for realism
      if (Math.random() < 0.15) continue;

      const existing = await habitLogRepo.findOne({
        where: {
          date: dateStr,
          habitId: habit.id,
          userId,
        },
      });
      if (existing) continue;

      // 70% AVOIDED, 20% PARTIAL, 10% CONSUMED
      const rand = Math.random();
      let status: string;
      let portionRatio: number;
      if (rand < 0.7) {
        status = 'AVOIDED';
        portionRatio = 0;
      } else if (rand < 0.9) {
        status = 'PARTIAL';
        portionRatio = 0.5;
      } else {
        status = 'CONSUMED';
        portionRatio = 1;
      }

      const savedCalories = (habit.caloriesPerOccurrence ?? 0) * (1 - portionRatio);
      const savedMoney = (habit.pricePerOccurrence ?? 0) * (1 - portionRatio);

      await habitLogRepo.save(
        habitLogRepo.create({
          date: dateStr,
          status,
          portionRatio,
          savedCalories,
          savedMoney,
          habitId: habit.id,
          userId,
        }),
      );
      logsCreated++;
    }
  }
  return logsCreated;
}

async function seed() {
  logger.log('🌱 Seeding database...\n');
  await dataSource.initialize();

  const userRepo = dataSource.getRepository('User');
  const habitRepo = dataSource.getRepository('Habit');
  const habitLogRepo = dataSource.getRepository('HabitLog');
  const activityRepo = dataSource.getRepository('ActivityEquivalent');
  const friendRequestRepo = dataSource.getRepository('FriendRequest');
  const friendshipRepo = dataSource.getRepository('Friendship');
  const challengeRepo = dataSource.getRepository('Challenge');
  const challengeParticipantRepo = dataSource.getRepository('ChallengeParticipant');

  // 1. Create demo user
  const { user: demoUser, habits: demoHabits } = await createUserWithHabits(
    userRepo,
    habitRepo,
    {
      email: 'demo@stayontrack.app',
      username: 'demo_user',
      password: 'demo1234',
      weightKg: 80,
      heightCm: 175,
      goal: 'Stop eating junk food',
      visibility: 'FRIENDS',
      locale: 'en',
      currency: 'EUR',
      weekStartDay: 'monday',
      onboardingCompleted: true,
    },
  );

  // 2. Create test user (for friend/challenge testing)
  const { user: testUser, habits: testHabits } = await createUserWithHabits(
    userRepo,
    habitRepo,
    {
      email: 'test@stayontrack.app',
      username: 'test_user',
      password: 'test1234',
      weightKg: 70,
      heightCm: 168,
      goal: 'Cut down on sugar',
      visibility: 'FRIENDS',
      locale: 'en',
      currency: 'EUR',
      weekStartDay: 'monday',
      onboardingCompleted: true,
    },
  );

  // 3. Create check-in logs for both users (past 7 days)
  const demoLogsCreated = await createCheckInLogs(
    habitLogRepo,
    (demoUser as SeededEntity).id,
    demoHabits,
    7,
  );
  logger.log(`✅ ${demoLogsCreated} check-in logs created for demo_user (7 days)`);

  const testLogsCreated = await createCheckInLogs(
    habitLogRepo,
    (testUser as SeededEntity).id,
    testHabits,
    7,
  );
  logger.log(`✅ ${testLogsCreated} check-in logs created for test_user (7 days)`);

  // 4. Seed activity equivalents
  const activities = [
    { slug: 'running', name: 'Running', met: 9.8, unit: 'min', caloriesPerUnit: 11.5 },
    { slug: 'walking', name: 'Walking', met: 3.5, unit: 'min', caloriesPerUnit: 4.1 },
    { slug: 'cycling', name: 'Cycling', met: 7.5, unit: 'min', caloriesPerUnit: 8.8 },
    { slug: 'swimming', name: 'Swimming', met: 8.0, unit: 'min', caloriesPerUnit: 9.4 },
    { slug: 'yoga', name: 'Yoga', met: 3.0, unit: 'min', caloriesPerUnit: 3.5 },
    { slug: 'jump-rope', name: 'Jump Rope', met: 12.3, unit: 'min', caloriesPerUnit: 14.4 },
    { slug: 'push-ups', name: 'Push-ups', met: 3.8, unit: 'reps', caloriesPerUnit: 0.5 },
    { slug: 'planking', name: 'Planking', met: 3.8, unit: 'min', caloriesPerUnit: 4.5 },
  ];

  let activitiesCreated = 0;
  for (const act of activities) {
    const existing = await activityRepo.findOne({ where: { slug: act.slug } });
    if (existing) continue;
    await activityRepo.save(activityRepo.create(act));
    activitiesCreated++;
  }
  logger.log(`✅ ${activitiesCreated} activities seeded`);

  // 5. Create friend request from demo_user to test_user
  const demoId = (demoUser as SeededEntity).id;
  const testId = (testUser as SeededEntity).id;

  const existingFriendRequest = await friendRequestRepo.findOne({
    where: { fromUserId: demoId, toUserId: testId },
  });
  if (!existingFriendRequest) {
    await friendRequestRepo.save(
      friendRequestRepo.create({
        fromUserId: demoId,
        toUserId: testId,
        status: 'ACCEPTED',
      }),
    );
    logger.log('✅ Friend request created (demo_user -> test_user, ACCEPTED)');
  } else {
    logger.log('⚠️  Friend request already exists, skipping.');
  }

  // 6. Create friendship records (bidirectional)
  const existingFriendship = await friendshipRepo.findOne({
    where: { userId: demoId, friendId: testId },
  });
  if (!existingFriendship) {
    await friendshipRepo.save(
      friendshipRepo.create({ userId: demoId, friendId: testId }),
    );
    await friendshipRepo.save(
      friendshipRepo.create({ userId: testId, friendId: demoId }),
    );
    logger.log('✅ Friendship created (bidirectional)');
  } else {
    logger.log('⚠️  Friendship already exists, skipping.');
  }

  // 7. Create a challenge between demo_user and test_user
  const existingChallenge = await challengeRepo.findOne({
    where: { creatorUserId: demoId, title: '7-Day No Junk Food Challenge' },
  });
  if (!existingChallenge) {
    const today = new Date();
    const startDate = today.toISOString().split('T')[0];
    const endDateObj = new Date(today);
    endDateObj.setDate(endDateObj.getDate() + 7);
    const endDate = endDateObj.toISOString().split('T')[0];

    const challenge = await challengeRepo.save(
      challengeRepo.create({
        creatorUserId: demoId,
        title: '7-Day No Junk Food Challenge',
        description: 'Who can avoid the most junk food calories in a week?',
        type: 'CALORIES',
        targetValue: 5000,
        startDate,
        endDate,
        status: 'ACTIVE',
      }),
    );
    const savedChallenge = challenge as SeededEntity;
    logger.log(`✅ Challenge created: "${savedChallenge.title}" (id: ${savedChallenge.id})`);

    // Add both users as participants
    await challengeParticipantRepo.save(
      challengeParticipantRepo.create({
        challengeId: savedChallenge.id,
        userId: demoId,
        status: 'ACCEPTED',
        currentValue: 0,
      }),
    );
    await challengeParticipantRepo.save(
      challengeParticipantRepo.create({
        challengeId: savedChallenge.id,
        userId: testId,
        status: 'ACCEPTED',
        currentValue: 0,
      }),
    );
    logger.log('✅ Both users added as challenge participants');
  } else {
    logger.log('⚠️  Challenge already exists, skipping.');
  }

  logger.log('\n🎉 Seed complete!');
  logger.log('   Login 1: demo@stayontrack.app / demo1234');
  logger.log('   Login 2: test@stayontrack.app / test1234\n');

  await dataSource.destroy();
}

seed().catch((err) => {
  logger.error('❌ Seed failed:', err);
  process.exit(1);
});
