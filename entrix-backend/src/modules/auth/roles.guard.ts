import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }
    const { user } = context.switchToHttp().getRequest();
    
    console.error('🔍 ROLES GUARD DEBUG:');
    console.error('  - Required roles:', requiredRoles);
    console.error('  - User object:', JSON.stringify(user, null, 2));
    console.error('  - User roles:', user?.roles);
    console.error('  - User roles type:', typeof user?.roles);
    console.error('  - User roles is array:', Array.isArray(user?.roles));
    
    if (!user || !user.roles) {
      console.error('  ❌ Access denied: No user or no roles');
      return false;
    }
    
    const hasRole = requiredRoles.some((role) => user.roles.includes(role));
    console.error('  - Has required role:', hasRole);
    console.error('  - Role check details:', requiredRoles.map(role => `${role}: ${user.roles.includes(role)}`));
    
    return hasRole;
  }
} 