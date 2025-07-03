import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';

export interface AdminCredentials {
  email: string;
  password: string;
  accessToken?: string;
  refreshToken?: string;
}

export class AdminTestHelper {
  static readonly ADMIN_CREDENTIALS: AdminCredentials = {
    email: 'admin@entrix.com',
    password: 'Admin123!'
  };

  /**
   * Get admin access token for testing
   */
  static async getAdminToken(app: INestApplication): Promise<string> {
    try {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: this.ADMIN_CREDENTIALS.email,
          password: this.ADMIN_CREDENTIALS.password,
        })
        .expect(200);

      return response.body.access_token;
    } catch (error) {
      console.error('Failed to get admin token:', error.message);
      throw new Error('Admin authentication failed. Please check credentials.');
    }
  }

  /**
   * Get admin authentication headers
   */
  static async getAdminHeaders(app: INestApplication): Promise<{ Authorization: string }> {
    const token = await this.getAdminToken(app);
    return { Authorization: `Bearer ${token}` };
  }

  /**
   * Create a test user with admin privileges
   */
  static async createTestUser(app: INestApplication, email: string): Promise<{
    id: string;
    email: string;
    accessToken: string;
    refreshToken: string;
  }> {
    // First register the user
    const registerDto = {
      email,
      password: 'TestPassword123!',
      firstName: 'Test',
      lastName: 'User',
    };

    await request(app.getHttpServer())
      .post('/auth/register')
      .send(registerDto)
      .expect(201);

    // Then login to get tokens
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: registerDto.email,
        password: registerDto.password,
      })
      .expect(200);

    return {
      id: loginResponse.body.user.id,
      email: loginResponse.body.user.email,
      accessToken: loginResponse.body.access_token,
      refreshToken: loginResponse.body.refresh_token,
    };
  }

  /**
   * Reset admin password (if needed)
   */
  static async resetAdminPassword(app: INestApplication, newPassword: string): Promise<void> {
    // This would require admin privileges or a password reset endpoint
    console.log('Password reset functionality would go here');
    console.log('New password:', newPassword);
  }
} 