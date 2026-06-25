import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthGuard } from '../auth/guards/auth.guard';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UsersService } from './users.service';

@UseGuards(AuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  getCurrentUser(@CurrentUser() user: { userId: string }) {
    return this.usersService.getCurrentUser(user.userId);
  }

  @Get('me/products')
  getMyProducts(@CurrentUser() user: { userId: string }) {
    return this.usersService.getMyProducts(user.userId);
  }

  @Get('me/summary')
  getMySummary(@CurrentUser() user: { userId: string }) {
    return this.usersService.getMySummary(user.userId);
  }

  @Patch('me')
  updateProfile(@CurrentUser() user: { userId: string }, @Body() updateProfileDto: UpdateProfileDto) {
    return this.usersService.updateProfile(user.userId, updateProfileDto);
  }

  @Post('me/avatar')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: join(process.cwd(), 'uploads', 'avatars'),
        filename: (_request, file, callback) => {
          const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          callback(null, `${uniqueSuffix}${extname(file.originalname || '')}`);
        },
      }),
      fileFilter: (_request, file, callback) => {
        if (!file.mimetype.startsWith('image/')) {
          callback(new BadRequestException('只能上传图片文件'), false);
          return;
        }

        callback(null, true);
      },
      limits: {
        fileSize: 3 * 1024 * 1024,
      },
    }),
  )
  uploadAvatar(
    @CurrentUser() user: { userId: string },
    @UploadedFile() file: { filename: string } | undefined,
    @Req() request: { protocol: string; get(name: string): string | undefined },
  ) {
    if (!file) {
      throw new BadRequestException('请先选择头像图片');
    }

    const host = request.get('host');

    if (!host) {
      throw new BadRequestException('无法识别当前服务地址');
    }

    return this.usersService.updateAvatar(
      user.userId,
      `${request.protocol}://${host}/uploads/avatars/${file.filename}`,
    );
  }
}
