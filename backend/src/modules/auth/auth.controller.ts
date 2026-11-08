import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import {
  type AuthenticatedOfficer,
  CurrentOfficer,
} from '../../common/decorators/current-officer.decorator.js';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard.js';
import { AuthService } from './auth.service.js';
import { LoginOfficerDto, RegisterOfficerDto } from './dto/auth.dto.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterOfficerDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  login(@Body() dto: LoginOfficerDto) {
    return this.authService.login(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getProfile(@CurrentOfficer() officer: AuthenticatedOfficer) {
    return this.authService.getProfile(officer);
  }
}
