import {
  Injectable,
  CanActivate,
  ExecutionContext,
  BadRequestException,
} from '@nestjs/common';
import { RateLimitingService } from './rate-limiting.service';

interface RateLimitRequest {
  user?: { id: string };
  ip?: string;
  route?: { path: string };
}

// Add custom TooManyRequestsException if not available
class TooManyRequestsException extends BadRequestException {
  constructor(message = 'Too Many Requests') {
    super(message);
    this.name = 'TooManyRequestsException';
  }
}

@Injectable()
export class RateLimitingGuard implements CanActivate {
  constructor(private readonly rateLimitingService: RateLimitingService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RateLimitRequest>();
    const userId = request.user?.id;
    const ipAddress = request.ip;
    const endpoint = request.route?.path;
    // Use userId if available, otherwise IP
    const key = userId || ipAddress;
    if (!key) return true;
    // Check rate limit (pseudo-logic, should be replaced with actual logic)
    const allLimits = await this.rateLimitingService.findAll();
    const recent = allLimits.find(
      (lim) =>
        lim.identifier === key && lim.endpoint === endpoint && !lim.isBlocked,
    );
    if (recent && recent.requestCount >= 10) {
      // Use TooManyRequestsException for rate limiting
      throw new TooManyRequestsException('Rate limit exceeded');
    }
    // Optionally, increment request count here
    return true;
  }
}
