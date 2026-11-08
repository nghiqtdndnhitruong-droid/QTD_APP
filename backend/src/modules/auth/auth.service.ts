import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthenticatedOfficer } from '../../common/decorators/current-officer.decorator.js';
import {
  buildPersonIdentityFields,
  hashPassword,
  verifyPassword,
} from '../../common/helpers/index.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { LoginOfficerDto, RegisterOfficerDto } from './dto/auth.dto.js';
import { JwtPayload } from './strategies/jwt.strategy.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterOfficerDto) {
    const username = dto.username.trim();
    const idNumber = dto.idNumber.trim();

    const [existingByUsername, existingByIdNumber] = await Promise.all([
      this.prisma.creditOfficer.findUnique({
        where: { username },
        select: { id: true },
      }),
      this.prisma.creditOfficer.findUnique({
        where: { idNumber },
        select: { id: true, fullName: true },
      }),
    ]);

    if (existingByUsername) {
      throw new ConflictException(
        `Tên đăng nhập "${username}" đã tồn tại trong hệ thống`,
      );
    }

    if (existingByIdNumber) {
      throw new ConflictException(
        `Số giấy tờ "${idNumber}" đã được đăng ký cho cán bộ "${existingByIdNumber.fullName}"`,
      );
    }

    const identity = buildPersonIdentityFields(
      {
        idType: dto.idType,
        idNumber,
        issueDate: dto.issueDate,
      },
      'cán bộ tín dụng',
    );

    const passwordHash = hashPassword(dto.password);

    const officer = await this.prisma.creditOfficer.create({
      data: {
        username,
        passwordHash,
        fullName: dto.fullName.trim(),
        idType: identity.idType,
        idNumber: identity.idNumber,
        issuingAuthority: identity.issuingAuthority,
        issueDate: identity.issueDate,
        gender: identity.gender,
        birthYear: identity.birthYear,
      },
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
        createdAt: true,
      },
    });

    const payload: JwtPayload = { sub: officer.id, username: officer.username };
    const accessToken = await this.jwtService.signAsync(payload);

    return {
      accessToken,
      officer,
    };
  }

  async login(dto: LoginOfficerDto) {
    const username = dto.username.trim();
    const officer = await this.prisma.creditOfficer.findUnique({
      where: { username },
    });

    if (!officer || !verifyPassword(dto.password, officer.passwordHash)) {
      throw new UnauthorizedException(
        'Tên đăng nhập hoặc mật khẩu không chính xác',
      );
    }

    const payload: JwtPayload = { sub: officer.id, username: officer.username };
    const accessToken = await this.jwtService.signAsync(payload);

    const { passwordHash: _omitted, ...officerProfile } = officer;

    return {
      accessToken,
      officer: officerProfile,
    };
  }

  getProfile(officer: AuthenticatedOfficer) {
    return officer;
  }
}
