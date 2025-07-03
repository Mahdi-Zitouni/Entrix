import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLog } from './audit-log.entity';
import { UserSession } from './user-session.entity';
import { LoginAttempt } from './login-attempt.entity';
import { SecurityEvent } from './security-event.entity';
import { MfaToken } from './mfa-token.entity';
import { RateLimiting } from './rate-limiting.entity';
import { SecurityPolicy } from './security-policy.entity';
import { AuditLogService } from './audit-log.service';
import { UserSessionService } from './user-session.service';
import { LoginAttemptService } from './login-attempt.service';
import { SecurityEventService } from './security-event.service';
import { MfaTokenService } from './mfa-token.service';
import { RateLimitingService } from './rate-limiting.service';
import { SecurityPolicyService } from './security-policy.service';
import { AuditLogController } from './audit-log.controller';
import { UserSessionController } from './user-session.controller';
import { LoginAttemptController } from './login-attempt.controller';
import { SecurityEventController } from './security-event.controller';
import { MfaTokenController } from './mfa-token.controller';
import { RateLimitingController } from './rate-limiting.controller';
import { SecurityPolicyController } from './security-policy.controller';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AuditLog,
      UserSession,
      LoginAttempt,
      SecurityEvent,
      MfaToken,
      RateLimiting,
      SecurityPolicy,
    ]),
    NotificationsModule,
  ],
  providers: [
    AuditLogService,
    UserSessionService,
    LoginAttemptService,
    SecurityEventService,
    MfaTokenService,
    RateLimitingService,
    SecurityPolicyService,
  ],
  controllers: [
    AuditLogController,
    UserSessionController,
    LoginAttemptController,
    SecurityEventController,
    MfaTokenController,
    RateLimitingController,
    SecurityPolicyController,
  ],
  exports: [
    AuditLogService,
    UserSessionService,
    LoginAttemptService,
    SecurityEventService,
    MfaTokenService,
    RateLimitingService,
    SecurityPolicyService,
  ],
})
export class SecurityModule {}
