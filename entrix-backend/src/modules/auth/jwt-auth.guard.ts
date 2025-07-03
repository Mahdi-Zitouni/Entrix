import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any, info: any, context: any) {
    console.error('🔑 JWT AUTH GUARD DEBUG:');
    console.error('  - Error:', err);
    console.error('  - User:', user);
    console.error('  - Info:', info);
    if (err || !user) {
      console.error('  ❌ Access denied by JwtAuthGuard');
    }
    return super.handleRequest(err, user, info, context);
  }
} 