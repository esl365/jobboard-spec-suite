import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Req,
  UseGuards,
  Headers,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({
    status: 201,
    description: 'User successfully registered',
    type: AuthResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid input data' })
  @ApiConflictResponse({ description: 'User with this email already exists' })
  async register(@Body() registerDto: RegisterDto, @Req() req: Request): Promise<AuthResponseDto> {
    const userAgent = req.headers['user-agent'] || 'unknown';
    const ipAddress = (req.ip || req.socket.remoteAddress || 'unknown') as string;

    return this.authService.register(registerDto, userAgent, ipAddress);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    type: AuthResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Invalid email or password' })
  async login(@Body() loginDto: LoginDto, @Req() req: Request): Promise<AuthResponseDto> {
    const userAgent = req.headers['user-agent'] || 'unknown';
    const ipAddress = (req.ip || req.socket.remoteAddress || 'unknown') as string;

    return this.authService.login(loginDto, userAgent, ipAddress);
  }

  @Post('refresh')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({
    status: 200,
    description: 'Token refreshed successfully',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async refresh(@Req() req: any): Promise<AuthResponseDto> {
    const user = req.user;
    const userAgent = req.headers['user-agent'] || 'unknown';
    const ipAddress = (req.ip || req.socket.remoteAddress || 'unknown') as string;

    // Extract deviceId from JWT payload (stored in user object by JwtStrategy)
    const deviceId = user.deviceId || '';

    return this.authService.refresh(user.id.toString(), deviceId, userAgent, ipAddress);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout and invalidate token' })
  @ApiResponse({
    status: 200,
    description: 'Logout successful',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async logout(
    @Req() req: any,
    @Headers('authorization') authorization: string,
  ): Promise<{ message: string }> {
    const user = req.user;
    const deviceId = user.deviceId || '';

    // Extract token from Authorization header (format: "Bearer <token>")
    const token = authorization?.replace('Bearer ', '') || '';

    await this.authService.logout(user.id.toString(), deviceId, token);

    return { message: 'Logout successful' };
  }
}
