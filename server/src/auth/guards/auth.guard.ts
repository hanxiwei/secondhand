import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { parseAuthToken } from '../../common/utils/token.util';
import { UserEntity } from '../../users/entities/user.entity';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const authorization = request.headers.authorization as string | undefined;

    if (!authorization?.startsWith('Bearer ')) {
      throw new UnauthorizedException('未登录或登录信息已失效');
    }

    const token = authorization.slice(7);
    const payload = parseAuthToken(token);

    if (!payload) {
      throw new UnauthorizedException('无效的登录凭证');
    }

    const user = await this.userRepository.findOne({
      where: {
        id: payload.userId,
        status: 1,
        isDeleted: 0,
      },
    });

    if (!user) {
      throw new UnauthorizedException('用户不存在或已被禁用');
    }

    request.user = {
      userId: user.id,
      username: user.username,
    };

    return true;
  }
}
