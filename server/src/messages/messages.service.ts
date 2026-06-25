import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import { ProductImageEntity } from '../products/entities/product-image.entity';
import { ProductEntity } from '../products/entities/product.entity';
import { UserEntity } from '../users/entities/user.entity';
import { CreateMessageSessionDto } from './dto/create-message-session.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { MessageEntity } from './entities/message.entity';
import { MessageSessionEntity } from './entities/message-session.entity';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(MessageSessionEntity)
    private readonly sessionRepository: Repository<MessageSessionEntity>,
    @InjectRepository(MessageEntity)
    private readonly messageRepository: Repository<MessageEntity>,
    @InjectRepository(ProductEntity)
    private readonly productRepository: Repository<ProductEntity>,
    @InjectRepository(ProductImageEntity)
    private readonly productImageRepository: Repository<ProductImageEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async getSessions(userId: string) {
    const sessions = await this.sessionRepository.find({
      where: [{ buyerId: userId }, { sellerId: userId }],
      order: {
        lastMessageAt: 'DESC',
        id: 'DESC',
      },
    });

    if (sessions.length === 0) {
      return {
        list: [],
        total: 0,
        unreadTotal: 0,
      };
    }

    const productIds = sessions
      .map((item) => item.productId)
      .filter((item): item is string => Boolean(item));
    const partnerIds = sessions.map((item) => (item.buyerId === userId ? item.sellerId : item.buyerId));

    const [products, users, images] = await Promise.all([
      productIds.length
        ? this.productRepository.find({
            where: {
              id: In(productIds),
              isDeleted: 0,
            },
          })
        : Promise.resolve([]),
      this.userRepository.find({
        where: {
          id: In(partnerIds),
          isDeleted: 0,
        },
      }),
      productIds.length
        ? this.productImageRepository.find({
            where: {
              productId: In(productIds),
            },
          })
        : Promise.resolve([]),
    ]);

    const productMap = new Map(products.map((item) => [item.id, item]));
    const userMap = new Map(users.map((item) => [item.id, item]));
    const imageMap = new Map<string, string[]>();

    images.forEach((item) => {
      const list = imageMap.get(item.productId) ?? [];
      list.push(item.imageUrl);
      imageMap.set(item.productId, list);
    });

    const list = sessions.map((item) => {
      const partnerId = item.buyerId === userId ? item.sellerId : item.buyerId;
      const partner = userMap.get(partnerId);
      const product = item.productId ? productMap.get(item.productId) : null;
      const unreadCount = item.buyerId === userId ? item.buyerUnreadCount : item.sellerUnreadCount;

      return {
        id: item.id,
        productId: item.productId,
        productTitle: product?.title ?? '相关商品已下架',
        productCover: item.productId ? imageMap.get(item.productId)?.[0] ?? null : null,
        productPrice: product ? Number(product.price) : null,
        partner: partner
          ? {
              id: partner.id,
              nickname: partner.nickname,
              avatarUrl: partner.avatarUrl,
              campus: partner.campus,
            }
          : null,
        lastMessage: item.lastMessage,
        lastMessageAt: item.lastMessageAt,
        unreadCount,
      };
    });

    return {
      list,
      total: list.length,
      unreadTotal: list.reduce((sum, item) => sum + item.unreadCount, 0),
    };
  }

  async createSession(userId: string, dto: CreateMessageSessionDto) {
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
      throw new BadRequestException('不能给自己的商品发起会话');
    }

    let session = await this.sessionRepository.findOne({
      where: {
        productId: product.id,
        buyerId: userId,
        sellerId: product.sellerId,
      },
    });

    if (!session) {
      session = await this.sessionRepository.save({
        productId: product.id,
        buyerId: userId,
        sellerId: product.sellerId,
        buyerUnreadCount: 0,
        sellerUnreadCount: 0,
        status: 1,
      });
    }

    await this.appendMessage(session, userId, dto.content);

    return {
      sessionId: session.id,
      message: '已发起会话',
    };
  }

  async getSessionMessages(sessionId: string, userId: string) {
    const session = await this.getUserSession(sessionId, userId);
    const messages = await this.messageRepository.find({
      where: {
        sessionId: session.id,
      },
      order: {
        createdAt: 'ASC',
        id: 'ASC',
      },
    });

    const partnerId = session.buyerId === userId ? session.sellerId : session.buyerId;
    const [partner, product, images] = await Promise.all([
      this.userRepository.findOne({
        where: {
          id: partnerId,
          isDeleted: 0,
        },
      }),
      session.productId
        ? this.productRepository.findOne({
            where: {
              id: session.productId,
              isDeleted: 0,
            },
          })
        : Promise.resolve(null),
      session.productId
        ? this.productImageRepository.find({
            where: {
              productId: session.productId,
            },
            order: {
              sortOrder: 'ASC',
              id: 'ASC',
            },
          })
        : Promise.resolve([]),
    ]);

    const unreadMessages = messages.filter((item) => item.receiverId === userId && item.isRead === 0);

    if (unreadMessages.length > 0) {
      const now = new Date();

      await this.messageRepository.update(
        { id: In(unreadMessages.map((item) => item.id)) },
        {
          isRead: 1,
          readAt: now,
        },
      );

      await this.sessionRepository.update(session.id, {
        buyerUnreadCount: session.buyerId === userId ? 0 : session.buyerUnreadCount,
        sellerUnreadCount: session.sellerId === userId ? 0 : session.sellerUnreadCount,
      });
    }

    return {
      session: {
        id: session.id,
        product: product
          ? {
              id: product.id,
              title: product.title,
              price: Number(product.price),
              campus: product.campus,
              coverImage: images[0]?.imageUrl ?? null,
            }
          : null,
        partner: partner
          ? {
              id: partner.id,
              nickname: partner.nickname,
              avatarUrl: partner.avatarUrl,
              campus: partner.campus,
              schoolName: partner.schoolName,
            }
          : null,
      },
      messages: messages.map((item) => ({
        id: item.id,
        senderId: item.senderId,
        receiverId: item.receiverId,
        content: item.content,
        isRead: item.receiverId === userId ? 1 : item.isRead,
        createdAt: item.createdAt,
      })),
    };
  }

  async sendMessage(sessionId: string, userId: string, dto: SendMessageDto) {
    const session = await this.getUserSession(sessionId, userId);

    await this.appendMessage(session, userId, dto.content);

    return {
      sessionId: session.id,
      message: '消息发送成功',
    };
  }

  private async appendMessage(session: MessageSessionEntity, senderId: string, content: string) {
    const trimmedContent = content.trim();

    if (!trimmedContent) {
      throw new BadRequestException('消息内容不能为空');
    }

    const senderRole = session.buyerId === senderId ? 'buyer' : session.sellerId === senderId ? 'seller' : null;

    if (!senderRole) {
      throw new ForbiddenException('无权在该会话中发送消息');
    }

    const receiverId = senderRole === 'buyer' ? session.sellerId : session.buyerId;
    const created = await this.messageRepository.save({
      sessionId: session.id,
      senderId,
      receiverId,
      productId: session.productId,
      messageType: 1,
      content: trimmedContent,
      isRead: 0,
    });

    await this.sessionRepository.update(session.id, {
      lastMessage: trimmedContent,
      lastMessageAt: created.createdAt,
      buyerUnreadCount: senderRole === 'seller' ? session.buyerUnreadCount + 1 : session.buyerUnreadCount,
      sellerUnreadCount: senderRole === 'buyer' ? session.sellerUnreadCount + 1 : session.sellerUnreadCount,
    });

    return created;
  }

  private async getUserSession(sessionId: string, userId: string) {
    const session = await this.sessionRepository.findOne({
      where: {
        id: sessionId,
      },
    });

    if (!session) {
      throw new NotFoundException('会话不存在');
    }

    if (session.buyerId !== userId && session.sellerId !== userId) {
      throw new ForbiddenException('无权查看该会话');
    }

    return session;
  }
}
