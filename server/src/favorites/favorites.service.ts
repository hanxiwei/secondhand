import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import { ProductImageEntity } from '../products/entities/product-image.entity';
import { ProductEntity } from '../products/entities/product.entity';
import { FavoriteEntity } from './entities/favorite.entity';

@Injectable()
export class FavoritesService {
  constructor(
    @InjectRepository(FavoriteEntity)
    private readonly favoriteRepository: Repository<FavoriteEntity>,
    @InjectRepository(ProductEntity)
    private readonly productRepository: Repository<ProductEntity>,
    @InjectRepository(ProductImageEntity)
    private readonly productImageRepository: Repository<ProductImageEntity>,
  ) {}

  async addFavorite(userId: string, productId: string) {
    const product = await this.productRepository.findOne({
      where: {
        id: productId,
        isDeleted: 0,
      },
    });

    if (!product) {
      throw new NotFoundException('商品不存在');
    }

    const existed = await this.favoriteRepository.findOne({
      where: {
        userId,
        productId,
      },
    });

    if (existed) {
      throw new BadRequestException('该商品已经收藏过了');
    }

    await this.favoriteRepository.save({
      userId,
      productId,
    });

    await this.productRepository.update(productId, {
      favoriteCount: product.favoriteCount + 1,
    });

    return {
      message: '收藏成功',
    };
  }

  async removeFavorite(userId: string, productId: string) {
    const existed = await this.favoriteRepository.findOne({
      where: {
        userId,
        productId,
      },
    });

    if (!existed) {
      throw new NotFoundException('收藏记录不存在');
    }

    await this.favoriteRepository.delete({
      id: existed.id,
    });

    const product = await this.productRepository.findOne({
      where: {
        id: productId,
      },
    });

    if (product) {
      await this.productRepository.update(productId, {
        favoriteCount: Math.max(product.favoriteCount - 1, 0),
      });
    }

    return {
      message: '已取消收藏',
    };
  }

  async getFavoriteStatus(userId: string, productId: string) {
    const existed = await this.favoriteRepository.findOne({
      where: {
        userId,
        productId,
      },
    });

    return {
      isFavorite: Boolean(existed),
    };
  }

  async getMyFavorites(userId: string) {
    const favorites = await this.favoriteRepository.find({
      where: {
        userId,
      },
      order: {
        id: 'DESC',
      },
    });

    const productIds = favorites.map((item) => item.productId);

    if (productIds.length === 0) {
      return {
        list: [],
        total: 0,
      };
    }

    const [products, images] = await Promise.all([
      this.productRepository.find({
        where: {
          id: In(productIds),
          isDeleted: 0,
        },
      }),
      this.productImageRepository.find(),
    ]);

    const productMap = new Map(products.map((item) => [item.id, item]));
    const imageMap = new Map<string, string[]>();

    images.forEach((item) => {
      const list = imageMap.get(item.productId) ?? [];
      list.push(item.imageUrl);
      imageMap.set(item.productId, list);
    });

    const list = favorites
      .map((favorite) => productMap.get(favorite.productId))
      .filter((item): item is ProductEntity => Boolean(item))
      .map((item) => ({
        id: item.id,
        title: item.title,
        subtitle: item.subtitle,
        price: Number(item.price),
        originalPrice: item.originalPrice ? Number(item.originalPrice) : null,
        campus: item.campus,
        favoriteCount: item.favoriteCount,
        coverImage: imageMap.get(item.id)?.[0] ?? null,
      }));

    return {
      list,
      total: list.length,
    };
  }
}
