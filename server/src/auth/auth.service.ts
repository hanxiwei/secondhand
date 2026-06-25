import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { hashPassword } from '../common/utils/password.util';
import { createAuthToken } from '../common/utils/token.util';
import { UserEntity } from '../users/entities/user.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async login(loginDto: LoginDto) {
    const user = await this.userRepository.findOne({
      where: [{ username: loginDto.account }, { phone: loginDto.account }, { email: loginDto.account }],
    });

    if (!user || user.passwordHash !== hashPassword(loginDto.password)) {
      throw new UnauthorizedException('账号或密码错误');
    }

    await this.userRepository.update(user.id, {
      lastLoginAt: new Date(),
    });

    return {
      token: createAuthToken(user.id, user.username),
      expiresIn: 7200,
      userInfo: {
        id: user.id,
        username: user.username,
        nickname: user.nickname,
        avatarUrl: user.avatarUrl,
        schoolName: user.schoolName,
      },
    };
  }

  async register(registerDto: RegisterDto) {
    const usernameExists = await this.userRepository.findOne({
      where: {
        username: registerDto.username,
      },
    });

    if (usernameExists) {
      throw new BadRequestException('用户名已存在');
    }

    if (registerDto.phone) {
      const phoneExists = await this.userRepository.findOne({
        where: {
          phone: registerDto.phone,
        },
      });

      if (phoneExists) {
        throw new BadRequestException('手机号已存在');
      }
    }

    if (registerDto.email) {
      const emailExists = await this.userRepository.findOne({
        where: {
          email: registerDto.email,
        },
      });

      if (emailExists) {
        throw new BadRequestException('邮箱已存在');
      }
    }

    const user = await this.userRepository.save({
      username: registerDto.username,
      passwordHash: hashPassword(registerDto.password),
      nickname: registerDto.nickname,
      phone: registerDto.phone ?? null,
      email: registerDto.email ?? null,
      schoolName: registerDto.schoolName ?? '校园示例大学',
      collegeName: registerDto.collegeName ?? null,
      grade: registerDto.grade ?? null,
      campus: registerDto.campus ?? '主校区',
      contactInfo: '站内私信',
      authStatus: 0,
      status: 1,
    });

    return {
      token: createAuthToken(user.id, user.username),
      expiresIn: 7200,
      userInfo: {
        id: user.id,
        username: user.username,
        nickname: user.nickname,
        avatarUrl: user.avatarUrl,
        schoolName: user.schoolName,
      },
    };
  }
}
