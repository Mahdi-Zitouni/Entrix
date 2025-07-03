import { 
  Injectable, 
  UnauthorizedException, 
  BadRequestException, 
  ConflictException,
  NotFoundException
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { RegisterDto, ResetPasswordDto } from './dto/auth.dto';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { UserProfile } from '../users/user-profile.entity';
import { AuditLog } from '../security/audit-log.entity';
import { LoginAttempt } from '../security/login-attempt.entity';
import { MfaToken } from '../security/mfa-token.entity';
import { NotificationService } from '../notifications/notification.service';
import { UserSessionService } from '../security/user-session.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private notificationService: NotificationService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(UserProfile)
    private userProfileRepository: Repository<UserProfile>,
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
    @InjectRepository(LoginAttempt)
    private loginAttemptRepository: Repository<LoginAttempt>,
    @InjectRepository(MfaToken)
    private mfaTokenRepository: Repository<MfaToken>,
    private userSessionService: UserSessionService,
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (user && (await bcrypt.compare(password, user.password))) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(email: string, password: string, req?: any) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      await this.logLoginAttempt(email, 'FAILED', 'User not found');
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      await this.logLoginAttempt(email, 'FAILED', 'Account inactive');
      throw new UnauthorizedException('Account is inactive');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      await this.logLoginAttempt(email, 'FAILED', 'Invalid password');
      throw new UnauthorizedException('Invalid credentials');
    }

    // Update last login
    await this.userRepository.update(user.id, { lastLogin: new Date() });

    const roles = await this.usersService.getUserRoleCodes(user.id);
    const payload = { sub: user.id, email: user.email, roles };
    
    const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
    const refreshToken = this.jwtService.sign({ sub: user.id }, { expiresIn: '7d' });

    await this.logLoginAttempt(email, 'SUCCESS', 'Login successful');

    // --- Create user session record ---
    try {
      await this.userSessionService.create({
        userId: user.id,
        sessionToken: accessToken,
        refreshToken: refreshToken,
        ipAddress: req?.ip || req?.headers?.['x-forwarded-for'] || '127.0.0.1',
        userAgent: req?.headers?.['user-agent'] || 'Unknown',
        isMobile: false,
        isActive: true,
        lastActivity: new Date(),
        expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 min
      });
    } catch (err) {
      console.error('Failed to create user session record:', err);
    }
    // --- End session record ---

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: { 
        id: user.id, 
        email: user.email, 
        firstName: user.firstName,
        lastName: user.lastName,
        roles,
        emailVerified: undefined,
        phoneVerified: undefined
      },
    };
  }

  async register(registerDto: RegisterDto) {
    const existingUser = await this.usersService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 12);
    const verificationToken = uuidv4();

    // Use UsersService to create user properly
    const user = await this.usersService.create({
      email: registerDto.email,
      firstName: registerDto.firstName,
      lastName: registerDto.lastName,
      phone: registerDto.phone,
      password: hashedPassword,
      isActive: true,
      emailVerified: undefined,
      phoneVerified: undefined,
    });

    // Create user profile
    await this.userProfileRepository.save({
      userId: user.id,
      notifications: true,
      newsletter: false,
      language: 'fr',
      country: 'TN',
    });

    // Send verification email
    await this.notificationService.sendEmailVerification(user.email, verificationToken);

    // Log registration
    await this.auditLogRepository.save({
      userId: user.id,
      action: 'USER_REGISTERED',
      entityType: 'USER',
      entityId: user.id,
      metadata: { email: user.email },
      ipAddress: process.env.POSTGRES_HOST || process.env.DB_HOST || '127.0.0.1', // Use DB host IP if available
      userAgent: 'Unknown', // Should be passed from controller
    });

    return {
      message: 'Registration successful. Please check your email to verify your account.',
      userId: user.id,
    };
  }

  async forgotPassword(email: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      // Don't reveal if user exists
      return { message: 'If an account with this email exists, a password reset link has been sent.' };
    }

    const resetToken = uuidv4();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Store reset token (you might want to create a separate table for this)
    await this.mfaTokenRepository.save({
      userId: user.id,
      token: resetToken,
      method: 'PASSWORD_RESET',
      expiresAt,
      isUsed: false,
    });

    // Send reset email
    await this.notificationService.sendPasswordReset(user.email, resetToken);

    return { message: 'If an account with this email exists, a password reset link has been sent.' };
  }

  async resetPassword(token: string, newPassword: string) {
    const resetToken = await this.mfaTokenRepository.findOne({
      where: { token, method: 'PASSWORD_RESET', isUsed: false },
    });

    if (!resetToken || resetToken.expiresAt < new Date()) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await this.userRepository.update(resetToken.userId, { password: hashedPassword });
    await this.mfaTokenRepository.update(resetToken.id, { isUsed: true });

    // Log password reset
    await this.auditLogRepository.save({
      userId: resetToken.userId,
      action: 'PASSWORD_RESET',
      entityType: 'USER',
      entityId: resetToken.userId,
      metadata: { method: 'email_token' },
      ipAddress: process.env.POSTGRES_HOST || process.env.DB_HOST || '127.0.0.1', // Use DB host IP if available
      userAgent: 'Unknown',
    });

    return { message: 'Password reset successful' };
  }

  async verifyEmail(token: string) {
    const verificationToken = await this.mfaTokenRepository.findOne({
      where: { token, method: 'EMAIL_VERIFICATION', isUsed: false },
      relations: ['user'],
    });

    if (!verificationToken || verificationToken.expiresAt < new Date()) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    await this.userRepository.update(verificationToken.userId, { 
      emailVerified: new Date() 
    });
    await this.mfaTokenRepository.update(verificationToken.id, { isUsed: true });

    // Log email verification
    await this.auditLogRepository.save({
      userId: verificationToken.userId,
      action: 'EMAIL_VERIFIED',
      entityType: 'USER',
      entityId: verificationToken.userId,
      metadata: { method: 'email_token' },
      ipAddress: process.env.POSTGRES_HOST || process.env.DB_HOST || '127.0.0.1', // Use DB host IP if available
      userAgent: 'Unknown',
    });

    return { message: 'Email verified successfully' };
  }

  async resendVerification(email: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.emailVerified) {
      throw new BadRequestException('Email is already verified');
    }

    const verificationToken = uuidv4();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await this.mfaTokenRepository.save({
      userId: user.id,
      token: verificationToken,
      method: 'EMAIL_VERIFICATION',
      expiresAt,
      isUsed: false,
    });

    await this.notificationService.sendEmailVerification(user.email, verificationToken);

    return { message: 'Verification email sent' };
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken);
      const user = await this.usersService.findOne(payload.sub);
      
      if (!user || !user.isActive) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const roles = await this.usersService.getUserRoleCodes(user.id);
      const newPayload = { sub: user.id, email: user.email, roles };
      
      const newAccessToken = this.jwtService.sign(newPayload, { expiresIn: '15m' });
      const newRefreshToken = this.jwtService.sign({ sub: user.id }, { expiresIn: '7d' });

      return {
        access_token: newAccessToken,
        refresh_token: newRefreshToken,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.usersService.findOne(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      throw new BadRequestException('Current password is incorrect');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await this.userRepository.update(userId, { password: hashedPassword });

    // Log password change
    await this.auditLogRepository.save({
      userId,
      action: 'PASSWORD_CHANGED',
      entityType: 'USER',
      entityId: userId,
      metadata: { method: 'authenticated_change' },
      ipAddress: process.env.POSTGRES_HOST || process.env.DB_HOST || '127.0.0.1', // Use DB host IP if available
      userAgent: 'Unknown',
    });

    return { message: 'Password changed successfully' };
  }

  async logout(userId: string) {
    // In a real implementation, you might want to blacklist the token
    // For now, we'll just log the logout
    await this.auditLogRepository.save({
      userId,
      action: 'USER_LOGOUT',
      entityType: 'USER',
      entityId: userId,
      metadata: { method: 'manual_logout' },
      ipAddress: process.env.POSTGRES_HOST || process.env.DB_HOST || '127.0.0.1', // Use DB host IP if available
      userAgent: 'Unknown',
    });

    return { message: 'Logout successful' };
  }

  async getProfile(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['profile', 'userRoles', 'userRoles.role', 'userGroups', 'userGroups.group'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const roles = await this.usersService.getUserRoleCodes(userId);
    const groups = user.userGroups?.map(ug => ug.group.code) || [];

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      avatar: user.avatar,
      isActive: user.isActive,
      emailVerified: undefined,
      phoneVerified: undefined,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
      roles,
      groups,
      profile: user.profile,
    };
  }

  async setupMFA(userId: string) {
    const user = await this.usersService.findOne(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Generate MFA setup token
    const setupToken = uuidv4();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await this.mfaTokenRepository.save({
      userId,
      token: setupToken,
      method: 'MFA_SETUP',
      expiresAt,
      isUsed: false,
    });

    return {
      setupToken,
      expiresAt,
      message: 'MFA setup initiated. Use the token to complete setup.',
    };
  }

  async verifyMFA(userId: string, code: string) {
    const mfaToken = await this.mfaTokenRepository.findOne({
      where: { userId, method: 'MFA_SETUP', isUsed: false },
    });

    if (!mfaToken || mfaToken.expiresAt < new Date()) {
      throw new BadRequestException('MFA setup expired or invalid');
    }

    // In real implementation, verify the TOTP code
    // For now, we'll just check if the code matches the secret
    if (code === mfaToken.token) {
      await this.mfaTokenRepository.update(mfaToken.id, { isUsed: true });
      
      // Update user to enable MFA
      await this.userRepository.update(userId, { 
        // Add MFA fields to user entity if needed
      });

      await this.auditLogRepository.save({
        userId,
        action: 'MFA_ENABLED',
        entityType: 'USER',
        entityId: userId,
        metadata: { method: 'totp' },
        ipAddress: process.env.POSTGRES_HOST || process.env.DB_HOST || '127.0.0.1', // Use DB host IP if available
        userAgent: 'Unknown',
      });

      return { message: 'MFA enabled successfully' };
    }

    throw new BadRequestException('Invalid MFA code');
  }

  async disableMFA(userId: string, password: string) {
    const user = await this.usersService.findOne(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new BadRequestException('Password is incorrect');
    }

    // Disable MFA for user
    await this.userRepository.update(userId, {
      // Remove MFA fields
    });

    await this.auditLogRepository.save({
      userId,
      action: 'MFA_DISABLED',
      entityType: 'USER',
      entityId: userId,
      metadata: { method: 'password_verification' },
      ipAddress: process.env.POSTGRES_HOST || process.env.DB_HOST || '127.0.0.1', // Use DB host IP if available
      userAgent: 'Unknown',
    });

    return { message: 'MFA disabled successfully' };
  }

  private async logLoginAttempt(email: string, status: 'SUCCESS' | 'FAILED', reason: string) {
    await this.loginAttemptRepository.save({
      email,
      status,
      reason,
      ipAddress: process.env.POSTGRES_HOST || process.env.DB_HOST || '127.0.0.1', // Use DB host IP if available
      userAgent: 'Unknown', // Should be passed from controller
      attemptedAt: new Date(),
    });
  }
}
