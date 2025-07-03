import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from '../users/users.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { SecurityModule } from '../security/security.module';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { User } from '../users/user.entity';
import { UserProfile } from '../users/user-profile.entity';
import { AuditLog } from '../security/audit-log.entity';
import { LoginAttempt } from '../security/login-attempt.entity';
import { MfaToken } from '../security/mfa-token.entity';

@Module({
  imports: [
    UsersModule,
    NotificationsModule,
    SecurityModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'supersecret',
      signOptions: { expiresIn: '7d' },
    }),
    TypeOrmModule.forFeature([
      User,
      UserProfile,
      AuditLog,
      LoginAttempt,
      MfaToken,
    ]),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService, JwtStrategy],
})
export class AuthModule {}
