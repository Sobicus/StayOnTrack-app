import { NotFoundException, ConflictException, UnauthorizedException } from '@nestjs/common';

export class UserNotFoundException extends NotFoundException {
  constructor() {
    super('User not found');
  }
}

export class EmailAlreadyExistsException extends ConflictException {
  constructor() {
    super('Email already in use');
  }
}

export class UsernameAlreadyExistsException extends ConflictException {
  constructor() {
    super('Username already taken');
  }
}

export class InvalidCredentialsException extends UnauthorizedException {
  constructor() {
    super('Invalid email or password');
  }
}
