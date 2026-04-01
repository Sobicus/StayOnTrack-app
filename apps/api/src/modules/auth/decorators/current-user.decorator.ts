import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from '../../users/entities/user.entity';

/** Typed representation of the request after JWT authentication. */
interface AuthenticatedRequest {
  user: User;
}

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): User => {
    // request.user is populated by JwtStrategy.validate() before any guarded
    // route executes.  We use a local AuthenticatedRequest interface rather
    // than casting to avoid depending on ambient Express type augmentation.
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    return request.user;
  },
);
