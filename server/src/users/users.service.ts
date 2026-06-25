import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { FavoriteEntity } from '../favorites/entities/favorite.entity';
import { ProductEntity } from '../products/entities/product.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UserEntity } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(ProductEntity)
    private readonly productRepository: Repository<ProductEntity>,
    @InjectRepository(FavoriteEntity)
    private readonly favoriteRepository: Repository<FavoriteEntity>,
  ) {}

  async getCurrentUser(userId: string) {
    const user = await this.userRepository.findOne({
      where: {
        id: userId,
        isDeleted: 0,
      },
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    return {
      id: user.id,
      username: user.username,
      nickname: user.nickname,
      avatarUrl: user.avatarUrl,
      phone: user.phone,
      email: user.email,
      schoolName: user.schoolName,
      collegeName: user.collegeName,
      grade: user.grade,
      campus: user.campus,
      contactInfo: user.contactInfo,
      bio: user.bio,
      creditScore: user.creditScore,
      authStatus: user.authStatus,
      createdAt: user.createdAt,
    };
  }

  async getMyProducts(userId: string) {
    const products = await this.productRepository.find({
      where: {
        sellerId: userId,
        isDeleted: 0,
      },
      order: {
        publishedAt: 'DESC',
        id: 'DESC',
      },
    });

    return {
      list: products.map((item) => ({
        id: item.id,
        title: item.title,
        subtitle: item.subtitle,
        price: Number(item.price),
        originalPrice: item.originalPrice ? Number(item.originalPrice) : null,
        status: item.status,
        auditStatus: item.auditStatus,
        campus: item.campus,
        viewCount: item.viewCount,
        favoriteCount: item.favoriteCount,
        publishedAt: item.publishedAt,
      })),
      total: products.length,
    };
  }

  async getMySummary(userId: string) {
    const [productCount, favoriteCount] = await Promise.all([
      this.productRepository.count({
        where: {
          sellerId: userId,
          isDeleted: 0,
        },
      }),
      this.favoriteRepository.count({
        where: {
          userId,
        },
      }),
    ]);

    return {
      productCount,
      favoriteCount,
    };
  }

  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto) {
    const user = await this.userRepository.findOne({
      where: {
        id: userId,
        isDeleted: 0,
      },
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    const nickname = this.normalizeNullableText(updateProfileDto.nickname);
    const phone = this.normalizeNullableText(updateProfileDto.phone);
    const email = this.normalizeNullableText(updateProfileDto.email);
    const schoolName = this.normalizeNullableText(updateProfileDto.schoolName);
    const collegeName = this.normalizeNullableText(updateProfileDto.collegeName);
    const grade = this.normalizeNullableText(updateProfileDto.grade);
    const campus = this.normalizeNullableText(updateProfileDto.campus);
    const contactInfo = this.normalizeNullableText(updateProfileDto.contactInfo);
    const bio = this.normalizeNullableText(updateProfileDto.bio);

    if (updateProfileDto.nickname !== undefined && nickname === null) {
      throw new BadRequestException('昵称不能为空');
    }

    if (phone && phone !== user.phone) {
      const existedPhone = await this.userRepository.findOne({
        where: {
          phone,
        },
      });

      if (existedPhone && existedPhone.id !== userId) {
        throw new BadRequestException('手机号已被其他账号使用');
      }
    }

    if (email && email !== user.email) {
      const existedEmail = await this.userRepository.findOne({
        where: {
          email,
        },
      });

      if (existedEmail && existedEmail.id !== userId) {
        throw new BadRequestException('邮箱已被其他账号使用');
      }
    }

    await this.userRepository.update(user.id, {
      nickname: nickname === null ? user.nickname : nickname,
      phone: phone,
      email: email,
      schoolName,
      collegeName,
      grade,
      campus,
      contactInfo,
      bio,
    });

    return {
      message: '个人资料已更新',
      user: await this.getCurrentUser(userId),
    };
  }

  async updateAvatar(userId: string, avatarUrl: string) {
    const user = await this.userRepository.findOne({
      where: {
        id: userId,
        isDeleted: 0,
      },
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    await this.userRepository.update(user.id, {
      avatarUrl,
    });

    return {
      message: '头像已更新',
      user: await this.getCurrentUser(userId),
    };
  }

  private normalizeNullableText(value: string | undefined) {
    if (value === undefined) {
      return null;
    }

    const normalized = value.trim();
    return normalized.length > 0 ? normalized : null;
  }
}
