import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';

export class ChallengeNotFoundException extends NotFoundException {
  constructor() {
    super('Challenge not found');
  }
}

export class ChallengeAlreadyJoinedException extends BadRequestException {
  constructor() {
    super('You have already joined this challenge');
  }
}

export class ChallengeForbiddenException extends ForbiddenException {
  constructor() {
    super('You do not have permission to perform this action');
  }
}
