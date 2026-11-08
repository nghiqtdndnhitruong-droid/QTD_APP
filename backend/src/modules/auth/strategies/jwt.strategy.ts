import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthenticatedOfficer } from '../../../common/decorators/current-officer.decorator.js';
import { PrismaService } from '../../../prisma/prisma.service.js';

export interface JwtPayload {
  sub: string;
  username: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:
        configService.get<string>('JWT_SECRET') ?? 'your-super-secret-jwt-key',
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedOfficer> {
    const officer = await this.prisma.creditOfficer.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        username: true,
        fullName: true,
        idType: true,
        idNumber: true,
        issuingAuthority: true,
        issueDate: true,
        gender: true,
        birthYear: true,
      },
    });

    if (!officer) {
      throw new UnauthorizedException('Tài khoản cán bộ không tồn tại hoặc đã bị khóa');
    }

    return officer;
  }
}
