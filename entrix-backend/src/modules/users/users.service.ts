import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Role } from './role.entity';
import { UserRole, MembershipStatus } from './user-role.entity';
import { UserGroup } from './user-group.entity';
import { MoreThanOrEqual } from 'typeorm';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(UserRole)
    private readonly userRoleRepository: Repository<UserRole>,
    @InjectRepository(UserGroup)
    private readonly userGroupRepository: Repository<UserGroup>,
  ) {}

  async findAll(filters?: any): Promise<{ data: User[]; total: number; page: number; limit: number }> {
    const qb = this.userRepository.createQueryBuilder('user')
      .leftJoinAndSelect('user.profile', 'profile')
      .leftJoinAndSelect('user.userRoles', 'userRoles')
      .leftJoinAndSelect('user.userGroups', 'userGroups')
      .orderBy('user.createdAt', 'DESC');
    
    if (filters?.role) {
      qb.andWhere('userRoles.role.code = :role', { role: filters.role });
    }
    if (filters?.group) {
      qb.andWhere('userGroups.group.name = :group', { group: filters.group });
    }
    if (filters?.status) {
      qb.andWhere('user.isActive = :status', { status: filters.status === 'active' });
    }
    if (filters?.from) {
      qb.andWhere('user.createdAt >= :from', { from: filters.from });
    }
    if (filters?.to) {
      qb.andWhere('user.createdAt <= :to', { to: filters.to });
    }
    
    const total = await qb.getCount();
    
    if (filters?.page && filters?.limit) {
      qb.skip((filters.page - 1) * filters.limit).take(filters.limit);
    }
    
    const data = await qb.getMany();
    
    return {
      data,
      total,
      page: filters?.page || 1,
      limit: filters?.limit || 20,
    };
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['profile', 'userRoles', 'userGroups'],
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async create(createUserDto: CreateUserDto, createdBy?: string): Promise<User> {
    const user = this.userRepository.create(createUserDto);
    const savedUser = await this.userRepository.save(user);
    // Always assign USER role via UserRole join entity
    const userRole = await this.roleRepository.findOne({
      where: { code: 'USER' },
    });
    if (userRole) {
      const join = this.userRoleRepository.create({
        user: savedUser,
        role: userRole,
        status: MembershipStatus.ACTIVE,
      });
      await this.userRoleRepository.save(join);
    }
    return this.findOne(savedUser.id);
  }

  async update(id: string, updateUserDto: UpdateUserDto, updatedBy?: string): Promise<User> {
    const user = await this.findOne(id);
    Object.assign(user, updateUserDto);
    return this.userRepository.save(user);
  }

  async remove(id: string, removedBy?: string): Promise<void> {
    const user = await this.findOne(id);
    await this.userRepository.remove(user);
  }

  async findByEmail(email: string) {
    return this.userRepository.findOne({ where: { email } });
  }

  // Add methods to assign/remove roles and groups
  async assignRole(
    userId: string,
    roleId: string,
    status: MembershipStatus = MembershipStatus.ACTIVE,
    assignedBy?: string,
  ) {
    const user = await this.findOne(userId);
    const role = await this.roleRepository.findOne({ where: { id: roleId } });
    if (!role) throw new NotFoundException('Role not found');
    const join = this.userRoleRepository.create({ user, role, status });
    return this.userRoleRepository.save(join);
  }

  async removeRole(userId: string, roleId: string, removedBy?: string) {
    await this.userRoleRepository.delete({
      user: { id: userId },
      role: { id: roleId },
    });
  }

  async assignGroup(
    userId: string,
    groupId: string,
    status: MembershipStatus = MembershipStatus.ACTIVE,
    assignedBy?: string,
  ) {
    const user = await this.findOne(userId);
    const group = await this.userGroupRepository.manager.findOne('Group', {
      where: { id: groupId },
    });
    if (!group) throw new NotFoundException('Group not found');
    const join = this.userGroupRepository.create({ user, group, status });
    return this.userGroupRepository.save(join);
  }

  async removeGroup(userId: string, groupId: string, removedBy?: string) {
    await this.userGroupRepository.delete({
      user: { id: userId },
      group: { id: groupId },
    });
  }

  // Advanced user search/segmentation
  async findByQuery(query: {
    email?: string;
    name?: string;
    role?: string;
    group?: string;
    status?: string;
    from?: Date;
    to?: Date;
  }): Promise<User[]> {
    const qb = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.userRoles', 'userRole')
      .leftJoinAndSelect('user.userGroups', 'userGroup');
    if (query.email)
      qb.andWhere('user.email ILIKE :email', { email: `%${query.email}%` });
    if (query.name)
      qb.andWhere('user.name ILIKE :name', { name: `%${query.name}%` });
    if (query.role)
      qb.andWhere('userRole.roleId = :role', { role: query.role });
    if (query.group)
      qb.andWhere('userGroup.groupId = :group', { group: query.group });
    if (query.status)
      qb.andWhere('user.status = :status', { status: query.status });
    if (query.from)
      qb.andWhere('user.createdAt >= :from', { from: query.from });
    if (query.to) qb.andWhere('user.createdAt <= :to', { to: query.to });
    qb.orderBy('user.createdAt', 'DESC');
    return qb.getMany();
  }

  // GDPR: Export user data
  async exportUserData(id: string) {
    const user = await this.findOne(id);
    // Profile
    const profile = user.profile;
    // Roles
    const roles = await this.userRoleRepository.find({ where: { user: { id } }, relations: ['role'] });
    // Groups
    const groups = await this.userGroupRepository.find({ where: { user: { id } }, relations: ['group'] });

    // Notification preferences
    const notificationPrefRepo = this.userRepository.manager.getRepository('NotificationPreference');
    const notificationPreferences = await notificationPrefRepo.find({ where: { userId: id } });

    // Tickets
    const ticketRepo = this.userRepository.manager.getRepository('Ticket');
    const tickets = await ticketRepo.find({ where: { userId: id } });

    // Orders (with items)
    const orderRepo = this.userRepository.manager.getRepository('Order');
    const orders = await orderRepo.find({ where: { userId: id }, relations: ['items'] });

    // Refunds
    const refundRepo = this.userRepository.manager.getRepository('Refund');
    const refunds = await refundRepo.find({ where: { userId: id } });

    // Audit logs
    const auditLogRepo = this.userRepository.manager.getRepository('AuditLog');
    const auditLogs = await auditLogRepo.find({ where: { userId: id } });

    // Event participation (if user is a participant)
    const eventParticipantRepo = this.userRepository.manager.getRepository('EventParticipant');
    const eventParticipants = await eventParticipantRepo.find({ where: { participantId: id } });

    return {
      user,
      profile,
      roles,
      groups,
      notificationPreferences,
      tickets,
      orders,
      refunds,
      auditLogs,
      eventParticipants,
    };
  }

  // GDPR: Delete user data
  async deleteUserData(id: string) {
    // Optionally anonymize or fully delete
    await this.remove(id);
    return { message: 'User data deleted (GDPR)' };
  }

  // Get all role codes for a user
  async getUserRoleCodes(userId: string): Promise<string[]> {
    const userRoles = await this.userRoleRepository.find({
      where: { user: { id: userId }, status: MembershipStatus.ACTIVE },
      relations: ['role'],
    });
    return userRoles.map(ur => ur.role.code);
  }

  // Bulk create users
  async bulkCreate(createUserDtos: CreateUserDto[], createdBy?: string): Promise<User[]> {
    const users = [];
    for (const dto of createUserDtos) {
      const user = await this.create(dto, createdBy);
      users.push(user);
    }
    return users;
  }

  async getProfile(userId: string) {
    const user = await this.findOne(userId);
    return user.profile;
  }

  async updateProfile(userId: string, update: Partial<any>, updatedBy?: string) {
    const user = await this.findOne(userId);
    if (!user.profile) throw new NotFoundException('User profile not found');
    Object.assign(user.profile, update);
    await this.userRepository.manager.getRepository('UserProfile').save(user.profile);
    return user.profile;
  }

  // Alias for controller compatibility
  async updateUserProfile(userId: string, update: Partial<any>, updatedBy?: string) {
    return this.updateProfile(userId, update);
  }

  // --- Controller contract stubs below ---

  async getCurrentUser(userId: string) {
    return this.findOne(userId);
  }

  async getCurrentUserProfile(userId: string) {
    return this.getProfile(userId);
  }

  async getCurrentUserActivity(userId: string, filters?: any) {
    const user = await this.findOne(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Get user activity from audit logs
    const auditLogRepo = this.userRepository.manager.getRepository('AuditLog');
    const queryBuilder = auditLogRepo.createQueryBuilder('log')
      .where('log.userId = :userId', { userId })
      .orderBy('log.createdAt', 'DESC');

    if (filters?.action) {
      queryBuilder.andWhere('log.action = :action', { action: filters.action });
    }
    if (filters?.from) {
      queryBuilder.andWhere('log.createdAt >= :from', { from: filters.from });
    }
    if (filters?.to) {
      queryBuilder.andWhere('log.createdAt <= :to', { to: filters.to });
    }

    const activity = await queryBuilder.getMany();
    return { userId, activity };
  }

  async getCurrentUserPreferences(userId: string) {
    const user = await this.findOne(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Get notification preferences
    const notificationPrefRepo = this.userRepository.manager.getRepository('NotificationPreference');
    const notificationPreferences = await notificationPrefRepo.findOne({ where: { userId } });

    // Get user profile preferences
    const profile = user.profile || {};

    return {
      userId,
      preferences: {
        notification: notificationPreferences || {},
        profile: profile,
        privacy: {
          showEmail: true, // Default to true since we don't have this property
          showPhone: true, // Default to true since we don't have this property
          showLocation: true, // Default to true since we don't have this property
        },
      },
    };
  }

  async getCurrentUserTickets(userId: string, filters?: any) {
    const user = await this.findOne(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const ticketRepo = this.userRepository.manager.getRepository('Ticket');
    const queryBuilder = ticketRepo.createQueryBuilder('ticket')
      .leftJoinAndSelect('ticket.event', 'event')
      .where('ticket.userId = :userId', { userId })
      .orderBy('ticket.createdAt', 'DESC');

    if (filters?.status) {
      queryBuilder.andWhere('ticket.status = :status', { status: filters.status });
    }
    if (filters?.eventId) {
      queryBuilder.andWhere('ticket.event.id = :eventId', { eventId: filters.eventId });
    }

    const tickets = await queryBuilder.getMany();
    return { userId, tickets };
  }

  async getCurrentUserEvents(userId: string, type?: string) {
    const user = await this.findOne(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Get events where user has tickets
    const ticketRepo = this.userRepository.manager.getRepository('Ticket');
    const tickets = await ticketRepo.find({
      where: { userId },
      relations: ['event'],
    });

    // Get events where user is a participant
    const eventParticipantRepo = this.userRepository.manager.getRepository('EventParticipant');
    const participants = await eventParticipantRepo.find({
      where: { participantId: userId },
      relations: ['event'],
    });

    let events = [];
    if (type === 'tickets' || !type) {
      events.push(...tickets.map(t => ({ ...t.event, type: 'ticket' })));
    }
    if (type === 'participant' || !type) {
      events.push(...participants.map(p => ({ ...p.event, type: 'participant' })));
    }

    return { userId, events, type };
  }

  async getUserProfile(id: string) {
    return this.getProfile(id);
  }

  async getUserActivity(id: string, filters?: any) {
    return this.getCurrentUserActivity(id, filters);
  }

  async getUserTickets(id: string, status?: string) {
    const filters = status ? { status } : undefined;
    return this.getCurrentUserTickets(id, filters);
  }

  async getUserEvents(id: string, type?: string) {
    return this.getCurrentUserEvents(id, type);
  }

  async uploadAvatar(userId: string, file: any) {
    const user = await this.findOne(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // In a real implementation, you would upload the file to cloud storage
    const avatarUrl = `https://storage.example.com/avatars/${userId}/${file.originalname}`;
    
    // Update user avatar
    user.avatar = avatarUrl;
    user.updatedAt = new Date();

    await this.userRepository.save(user);

    return { userId, avatarUrl };
  }

  async verifyUserEmail(id: string, requestedBy?: string) {
    const user = await this.findOne(id);
    if (!user) {
      throw new Error('User not found');
    }

    user.emailVerified = new Date();
    user.updatedAt = new Date();

    await this.userRepository.save(user);

    return { id, verified: true, requestedBy };
  }

  async verifyUserPhone(id: string, requestedBy?: string) {
    const user = await this.findOne(id);
    if (!user) {
      throw new Error('User not found');
    }

    user.phoneVerified = new Date();
    user.updatedAt = new Date();

    await this.userRepository.save(user);

    return { id, verified: true, requestedBy };
  }

  async sendVerificationEmail(id: string, requestedBy?: string) {
    const user = await this.findOne(id);
    if (!user) {
      throw new Error('User not found');
    }

    // In a real implementation, you would send an email with verification link
    // For now, just return success
    return { id, sent: true, requestedBy };
  }

  async sendVerificationSms(id: string, requestedBy?: string) {
    const user = await this.findOne(id);
    if (!user) {
      throw new Error('User not found');
    }

    // In a real implementation, you would send an SMS with verification code
    // For now, just return success
    return { id, sent: true, requestedBy };
  }

  async updateCurrentUserProfile(userId: string, profileData: any) {
    return this.updateProfile(userId, profileData);
  }

  async updateCurrentUserPreferences(userId: string, preferences: any) {
    const user = await this.findOne(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Update notification preferences
    if (preferences.notification) {
      const notificationPrefRepo = this.userRepository.manager.getRepository('NotificationPreference');
      let notificationPref = await notificationPrefRepo.findOne({ where: { userId } });
      
      if (!notificationPref) {
        notificationPref = notificationPrefRepo.create({
          userId,
          ...preferences.notification,
        });
      } else {
        Object.assign(notificationPref, preferences.notification);
      }
      
      await notificationPrefRepo.save(notificationPref);
    }

    // Update profile preferences
    if (preferences.profile) {
      await this.updateProfile(userId, preferences.profile);
    }

    return { userId, preferences, updated: true };
  }

  async updateUserStatus(id: string, isActive: boolean, reason?: string, updatedBy?: string) {
    const user = await this.findOne(id);
    if (!user) {
      throw new Error('User not found');
    }

    user.isActive = isActive;
    user.updatedAt = new Date();

    await this.userRepository.save(user);

    return { id, isActive, reason, updatedBy };
  }

  async bulkImport(records: any[], importedBy?: string) {
    const results = [];
    let successCount = 0;
    let errorCount = 0;

    for (const record of records) {
      try {
        const user = await this.create(record, importedBy);
        results.push({ success: true, user });
        successCount++;
      } catch (error) {
        results.push({ success: false, error: error.message, record });
        errorCount++;
      }
    }

    return {
      imported: successCount,
      errors: errorCount,
      total: records.length,
      results,
    };
  }

  async getUserRoles(id: string) {
    return this.getUserRoleCodes(id);
  }

  async getAuditLogs(id: string) {
    const user = await this.findOne(id);
    if (!user) {
      throw new Error('User not found');
    }

    const auditLogRepo = this.userRepository.manager.getRepository('AuditLog');
    const logs = await auditLogRepo.find({
      where: { userId: id },
      order: { createdAt: 'DESC' },
    });

    return { id, logs };
  }

  async getAnalyticsOverview(filters?: any) {
    const totalUsers = await this.userRepository.count();
    const activeUsers = await this.userRepository.count({ where: { isActive: true } });
    
    // Calculate new users in the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const newUsers = await this.userRepository.count({
      where: {
        createdAt: MoreThanOrEqual(thirtyDaysAgo),
      },
    });

    return {
      totalUsers,
      activeUsers,
      newUsers,
      inactiveUsers: totalUsers - activeUsers,
    };
  }

  async getRegistrationAnalytics(period: string, filters?: any) {
    const periodStart = this.getPeriodStart(period);
    
    const registrations = await this.userRepository
      .createQueryBuilder('user')
      .select([
        'DATE(user.createdAt) as date',
        'COUNT(*) as count'
      ])
      .where('user.createdAt >= :periodStart', { periodStart })
      .groupBy('DATE(user.createdAt)')
      .orderBy('date', 'ASC')
      .getRawMany();

    return {
      period,
      totalRegistrations: registrations.reduce((sum, r) => sum + parseInt(r.count), 0),
      dailyRegistrations: registrations.map(r => ({
        date: r.date,
        count: parseInt(r.count),
      })),
    };
  }

  async getActivityAnalytics(filters?: any) {
    // Get users who have been active in the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const auditLogRepo = this.userRepository.manager.getRepository('AuditLog');
    const activeUsers = await auditLogRepo
      .createQueryBuilder('log')
      .select('DISTINCT log.userId', 'userId')
      .where('log.createdAt >= :thirtyDaysAgo', { thirtyDaysAgo })
      .getRawMany();

    return {
      activeUsers: activeUsers.length,
      period: '30 days',
    };
  }

  private getPeriodStart(period: string): Date {
    const now = new Date();
    switch (period) {
      case 'week':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case 'month':
        return new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      case 'quarter':
        return new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
      case 'year':
        return new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
      default:
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days
    }
  }
}
