import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import { MessageSessionEntity } from '../messages/entities/message-session.entity';
import { ProductImageEntity } from '../products/entities/product-image.entity';
import { ProductEntity } from '../products/entities/product.entity';
import { UserEntity } from '../users/entities/user.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { TradeOrderEntity } from './entities/trade-order.entity';

const LOCAL_PRODUCT_UPLOAD_BASE_URL = 'http://localhost:3000/uploads/products';

const LOCAL_PRODUCT_IMAGE_MAP: Record<string, string> = {
  '九成新机械键盘': `${LOCAL_PRODUCT_UPLOAD_BASE_URL}/keyboard-1.jpg`,
  '高数教材与笔记整套': `${LOCAL_PRODUCT_UPLOAD_BASE_URL}/book-1.jpg`,
  '宿舍折叠小桌': `${LOCAL_PRODUCT_UPLOAD_BASE_URL}/desk-1.jpg`,
  '羽毛球拍一对': `${LOCAL_PRODUCT_UPLOAD_BASE_URL}/badminton-1.jpg`,
  '九成新小米笔记本 Air': `${LOCAL_PRODUCT_UPLOAD_BASE_URL}/laptop-1.jpg`,
  '二手公路自行车': `${LOCAL_PRODUCT_UPLOAD_BASE_URL}/bike-1.jpg`,
  '宿舍小冰箱': `${LOCAL_PRODUCT_UPLOAD_BASE_URL}/fridge-1.jpg`,
};

const FALLBACK_ORDER_IMAGES = [
  `${LOCAL_PRODUCT_UPLOAD_BASE_URL}/keyboard-1.jpg`,
  `${LOCAL_PRODUCT_UPLOAD_BASE_URL}/book-1.jpg`,
  `${LOCAL_PRODUCT_UPLOAD_BASE_URL}/desk-1.jpg`,
  `${LOCAL_PRODUCT_UPLOAD_BASE_URL}/badminton-1.jpg`,
  `${LOCAL_PRODUCT_UPLOAD_BASE_URL}/laptop-1.jpg`,
  `${LOCAL_PRODUCT_UPLOAD_BASE_URL}/bike-1.jpg`,
  `${LOCAL_PRODUCT_UPLOAD_BASE_URL}/fridge-1.jpg`,
];

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(TradeOrderEntity)
    private readonly orderRepository: Repository<TradeOrderEntity>,
    @InjectRepository(ProductEntity)
    private readonly productRepository: Repository<ProductEntity>,
    @InjectRepository(ProductImageEntity)
    private readonly productImageRepository: Repository<ProductImageEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(MessageSessionEntity)
    private readonly sessionRepository: Repository<MessageSessionEntity>,
  ) {}

  async createOrder(userId: string, dto: CreateOrderDto) {
    const product = await this.productRepository.findOne({
      where: {
        id: String(dto.productId),
        isDeleted: 0,
      },
    });

    if (!product) {
      throw new NotFoundException('商品不存在');
    }

    if (product.sellerId === userId) {
      throw new BadRequestException('不能购买自己发布的商品');
    }

    if (product.status !== 1 || product.auditStatus !== 1) {
      throw new BadRequestException('当前商品暂时无法发起购买意向');
    }

    const activeOrder = await this.orderRepository.findOne({
      where: {
        productId: product.id,
        status: In([0, 1]),
      },
    });

    if (activeOrder) {
      throw new BadRequestException('该商品已有进行中的交易，请稍后再试');
    }

    const existedSession = await this.sessionRepository.findOne({
      where: {
        productId: product.id,
        buyerId: userId,
        sellerId: product.sellerId,
      },
    });

    const saved = await this.orderRepository.save({
      orderNo: this.generateOrderNo(),
      productId: product.id,
      buyerId: userId,
      sellerId: product.sellerId,
      sessionId: existedSession?.id ?? null,
      dealPrice: product.price,
      status: 0,
      remark: dto.remark?.trim() || null,
    });

    return {
      id: saved.id,
      message: '已发起购买意向',
    };
  }

  async getMyOrders(userId: string) {
    const orders = await this.orderRepository.find({
      where: [{ buyerId: userId }, { sellerId: userId }],
      order: {
        updatedAt: 'DESC',
        id: 'DESC',
      },
    });

    if (orders.length === 0) {
      return {
        list: [],
        total: 0,
      };
    }

    const productIds = [...new Set(orders.map((item) => item.productId))];
    const userIds = [...new Set(orders.flatMap((item) => [item.buyerId, item.sellerId]))];

    const [products, users, images] = await Promise.all([
      this.productRepository.find({
        where: {
          id: In(productIds),
        },
      }),
      this.userRepository.find({
        where: {
          id: In(userIds),
          isDeleted: 0,
        },
      }),
      this.productImageRepository.find({
        where: {
          productId: In(productIds),
        },
      }),
    ]);

    const productMap = new Map(products.map((item) => [item.id, item]));
    const userMap = new Map(users.map((item) => [item.id, item]));
    const imageMap = new Map<string, string[]>();

    images.forEach((item) => {
      const list = imageMap.get(item.productId) ?? [];
      list.push(item.imageUrl);
      imageMap.set(item.productId, list);
    });

    return {
      list: orders.map((item) => {
        const product = productMap.get(item.productId);
        const isBuyer = item.buyerId === userId;
        const partner = userMap.get(isBuyer ? item.sellerId : item.buyerId);
        const safeTitle = this.getSafeText(product?.title, '校园闲置好物');
        const coverImage =
          imageMap.get(item.productId)?.[0] ??
          this.getLocalProductImageByTitle(product?.title) ??
          this.getFallbackCoverImage(item.productId);

        return {
          id: item.id,
          orderNo: item.orderNo,
          role: isBuyer ? 'buyer' : 'seller',
          status: item.status,
          remark: item.remark,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
          confirmedAt: item.confirmedAt,
          completedAt: item.completedAt,
          canceledAt: item.canceledAt,
          canConfirm: !isBuyer && item.status === 0,
          canCancel: item.status === 0 || item.status === 1,
          canComplete: !isBuyer && item.status === 1,
          product: {
            id: item.productId,
            title: safeTitle,
            coverImage,
            campus: this.getSafeOptionalText(product?.campus, null),
            price: product ? Number(product.price) : Number(item.dealPrice),
            status: product?.status ?? null,
          },
          partner: partner
            ? {
                id: partner.id,
                nickname: this.getSafeText(partner.nickname, '校园同学'),
                campus: this.getSafeOptionalText(partner.campus, null),
              }
            : null,
        };
      }),
      total: orders.length,
    };
  }

  async confirmOrder(orderId: string, userId: string) {
    const order = await this.getOrderOrThrow(orderId);

    if (order.sellerId !== userId) {
      throw new ForbiddenException('只有卖家可以确认交易');
    }

    if (order.status !== 0) {
      throw new BadRequestException('当前订单状态无法确认');
    }

    await this.orderRepository.update(order.id, {
      status: 1,
      confirmedAt: new Date(),
    });

    return {
      id: order.id,
      message: '已确认交易，订单进入交易中',
    };
  }

  async cancelOrder(orderId: string, userId: string) {
    const order = await this.getOrderOrThrow(orderId);

    if (order.buyerId !== userId && order.sellerId !== userId) {
      throw new ForbiddenException('无权取消该订单');
    }

    if (![0, 1].includes(order.status)) {
      throw new BadRequestException('当前订单状态无法取消');
    }

    await this.orderRepository.update(order.id, {
      status: 3,
      canceledAt: new Date(),
    });

    return {
      id: order.id,
      message: '订单已取消',
    };
  }

  async completeOrder(orderId: string, userId: string) {
    const order = await this.getOrderOrThrow(orderId);

    if (order.sellerId !== userId) {
      throw new ForbiddenException('只有卖家可以完成订单');
    }

    if (order.status !== 1) {
      throw new BadRequestException('订单需先确认后才能完成');
    }

    await Promise.all([
      this.orderRepository.update(order.id, {
        status: 2,
        completedAt: new Date(),
      }),
      this.productRepository.update(order.productId, {
        status: 3,
        soldAt: new Date(),
      }),
    ]);

    return {
      id: order.id,
      message: '订单已完成，商品已标记为售出',
    };
  }

  async clearCanceledOrders(userId: string) {
    const canceledOrders = await this.orderRepository.find({
      where: [{ buyerId: userId, status: 3 }, { sellerId: userId, status: 3 }],
    });

    if (canceledOrders.length === 0) {
      return {
        message: '没有可清除的已取消订单',
        count: 0,
      };
    }

    await this.orderRepository.remove(canceledOrders);

    return {
      message: `已清除 ${canceledOrders.length} 条已取消订单`,
      count: canceledOrders.length,
    };
  }

  private async getOrderOrThrow(orderId: string) {
    const order = await this.orderRepository.findOne({
      where: {
        id: orderId,
      },
    });

    if (!order) {
      throw new NotFoundException('订单不存在');
    }

    return order;
  }

  private generateOrderNo() {
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, '0');

    return `OD${Date.now()}${random}`;
  }

  private hasBrokenText(value: string | null | undefined) {
    if (!value) {
      return true;
    }

    const text = value.trim();
    return text.length === 0 || /^[?？\s]+$/.test(text) || /[?？]{3,}/.test(text);
  }

  private getSafeText(value: string | null | undefined, fallback: string) {
    if (!value) {
      return fallback;
    }

    const text = value.trim();
    return text && !this.hasBrokenText(text) ? text : fallback;
  }

  private getSafeOptionalText(value: string | null | undefined, fallback: string | null) {
    if (!value) {
      return fallback;
    }

    const text = value.trim();
    return text && !this.hasBrokenText(text) ? text : fallback;
  }

  private getLocalProductImageByTitle(title: string | null | undefined) {
    const safeTitle = this.getSafeText(title, '');
    return LOCAL_PRODUCT_IMAGE_MAP[safeTitle] ?? null;
  }

  private getFallbackCoverImage(seed: string) {
    const imageIndex = Number(seed) % FALLBACK_ORDER_IMAGES.length;
    return FALLBACK_ORDER_IMAGES[imageIndex];
  }
}
