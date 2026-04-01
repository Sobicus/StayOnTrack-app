import { QuestType } from './entities/quest.entity';

export interface QuestDefinition {
  type: QuestType;
  title: string;
  description: string;
}

/**
 * Pool of all available daily quest definitions.
 * Each day, 3 random quests are picked for the user.
 */
export const QUEST_DEFINITIONS: QuestDefinition[] = [
  {
    type: QuestType.LOG_ALL_HABITS,
    title: 'Log all your habits today',
    description: 'Check in on every active habit you have for today.',
  },
  {
    type: QuestType.AVOID_FULLY_ONE,
    title: 'Fully avoid at least one habit',
    description: 'Log at least one habit as fully avoided (0% consumed).',
  },
  {
    type: QuestType.CHECK_IN_BEFORE_NOON,
    title: 'Complete a check-in before noon',
    description: 'Log at least one habit before 12:00 PM.',
  },
  {
    type: QuestType.LOG_3_HABITS,
    title: 'Log at least 3 habits',
    description: 'Check in on at least 3 different habits today.',
  },
];

/**
 * Returns a map of quest type -> definition for fast lookup.
 */
export function getQuestDefinitionMap(): Map<QuestType, QuestDefinition> {
  const map = new Map<QuestType, QuestDefinition>();
  for (const def of QUEST_DEFINITIONS) {
    map.set(def.type, def);
  }
  return map;
}
