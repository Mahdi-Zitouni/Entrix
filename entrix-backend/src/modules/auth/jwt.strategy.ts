import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

interface JwtPayload {
  sub: string;
  email: string;
  roles: string[];
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    console.error('🔑 JWT STRATEGY CONSTRUCTOR: Instantiating JwtStrategy');
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'supersecret',
    });
  }

  validate(payload: JwtPayload) {
    console.error(
      '🔑 JWT STRATEGY VALIDATE: called with payload =',
      JSON.stringify(payload),
    );
    const user = {
      userId: payload.sub,
      email: payload.email,
      roles: payload.roles,
    };
    console.error(
      '🔑 JWT STRATEGY VALIDATE: returning user =',
      JSON.stringify(user),
    );
    return user;
  }
}
