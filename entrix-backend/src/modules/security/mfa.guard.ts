import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { MfaTokenService } from './mfa-token.service';

interface AuthRequest {
  user?: { id: string };
  session?: { id: string };
}

@Injectable()
export class MfaGuard implements CanActivate {
  constructor(
    private readonly mfaTokenService: MfaTokenService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthRequest>();
    const user = request.user;
    const sessionId = request.session?.id;
    if (!user || !sessionId) {
      throw new UnauthorizedException('User or session not found');
    }
    // Check if MFA is required for this endpoint (could use custom decorator/metadata)
    // For now, always require MFA for endpoints using this guard
    const mfaToken = await this.mfaTokenService.findOneByUserAndSession(
      user.id,
      sessionId,
    );
    if (
      !mfaToken ||
      typeof mfaToken !== 'object' ||
      !('verified' in mfaToken) ||
      !(mfaToken as { verified: boolean }).verified
    ) {
      throw new UnauthorizedException('MFA required');
    }
    return true;
  }
}
