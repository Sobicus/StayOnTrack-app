import { UnauthorizedException, BadRequestException } from '@nestjs/common';

export class InvalidTokenException extends UnauthorizedException {
  constructor() {
    super('Invalid or expired token');
  }
}

export class EmailNotVerifiedException extends UnauthorizedException {
  constructor() {
    super('Please verify your email before logging in');
  }
}
