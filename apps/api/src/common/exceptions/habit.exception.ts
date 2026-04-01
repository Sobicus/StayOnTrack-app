import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';

export class HabitNotFoundException extends NotFoundException {
  constructor(habitId: string) {
    super(`Habit ${habitId} not found`);
  }
}

export class HabitNotOwnedException extends ForbiddenException {
  constructor() {
    super('You do not own this habit');
  }
}

export class HabitLimitReachedException extends BadRequestException {
  constructor() {
    super('Daily check-in limit reached for this habit');
  }
}
