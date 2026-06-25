import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';

import { CategoryEntity } from '../categories/entities/category.entity';
import { FavoriteEntity } from '../favorites/entities/favorite.entity';
import { UserEntity } from '../users/entities/user.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { QueryProductsDto } from './dto/query-products.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductImageEntity } from './entities/product-image.entity';
import { ProductEntity } from './entities/product.entity';

type DemoProductPreset = {
  title: string;
  subtitle: string;
  description: string;
  campus: string;
  contactInfo: string;
  imageUrl: string;
  categoryIndex: number;
};

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

const DEMO_PRODUCT_PRESETS: DemoProductPreset[] = [
  {
    title: '九成新小米笔记本 Air',
    subtitle: '上课写作业够用，带原装充电器',
    description: '轻薄便携，电池状态正常，日常办公和课程设计都很顺手，适合校内面交验机。',
    campus: '主校区',
    contactInfo: '站内私信',
    imageUrl: `${LOCAL_PRODUCT_UPLOAD_BASE_URL}/laptop-1.jpg`,
    categoryIndex: 0,
  },
  {
    title: '二手公路自行车',
    subtitle: '宿舍到教学楼代步很方便',
    description: '车况良好，刹车和变速都正常，适合校园短途通勤，价格可小刀。',
    campus: '西校区',
    contactInfo: '电话联系',
    imageUrl: `${LOCAL_PRODUCT_UPLOAD_BASE_URL}/bike-1.jpg`,
    categoryIndex: 3,
  },
  {
    title: '宿舍小冰箱',
    subtitle: '夏天放饮料和水果很实用',
    description: '制冷正常，容量适合宿舍使用，搬宿舍急出，支持到宿舍楼下自提。',
    campus: '东校区',
    contactInfo: '微信联系',
    imageUrl: `${LOCAL_PRODUCT_UPLOAD_BASE_URL}/fridge-1.jpg`,
    categoryIndex: 2,
  },
  {
    title: '考研英语资料整套',
    subtitle: '真题和笔记都有，适合冲刺复习',
    description: '包含单词书、历年真题和整理笔记，整体较新，适合校内同学直接接手。',
    campus: '南校区',
    contactInfo: '站内私信',
    imageUrl: `${LOCAL_PRODUCT_UPLOAD_BASE_URL}/book-1.jpg`,
    categoryIndex: 1,
  },
];

@Injectable()
export class ProductsService implements OnModuleInit {
  constructor(
    @InjectRepository(ProductEntity)
    private readonly productRepository: Repository<ProductEntity>,
    @InjectRepository(ProductImageEntity)
    private readonly productImageRepository: Repository<ProductImageEntity>,
    @InjectRepository(CategoryEntity)
    private readonly categoryRepository: Repository<CategoryEntity>,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(FavoriteEntity)
    private readonly favoriteRepository: Repository<FavoriteEntity>,
  ) {}

  async onModuleInit() {
    const categories = await this.categoryRepository.find({
      where: {
        status: 1,
        isDeleted: 0,
      },
      order: {
        sortOrder: 'ASC',
        id: 'ASC',
      },
    });

    if (categories.length === 0) {
      return;
    }

    const products = await this.productRepository.find({
      where: {
        isDeleted: 0,
      },
      order: {
        id: 'ASC',
      },
    });

    if (products.length > 0) {
      await this.repairBrokenDemoProducts(products, categories);
      return;
    }

    const now = new Date();

    const seededProducts = await this.productRepository.save([
        {
          sellerId: '1',
          categoryId: categories[0].id,
          title: '九成新机械键盘',
          subtitle: '宿舍自用，青轴手感清脆',
          description: '用于课程设计和日常打字，功能正常，带原装数据线。',
          price: '88.00',
          originalPrice: '199.00',
          conditionLevel: 3,
          campus: '主校区',
          tradeMethod: 1,
          contactInfo: '微信联系',
          viewCount: 46,
          favoriteCount: 12,
          status: 1,
          auditStatus: 1,
          publishedAt: now,
        },
        {
          sellerId: '1',
          categoryId: categories[1]?.id ?? categories[0].id,
          title: '高数教材与笔记整套',
          subtitle: '期末复习很实用',
          description: '包含教材、习题册和重点笔记，适合大一同学复习使用。',
          price: '25.00',
          originalPrice: '68.00',
          conditionLevel: 4,
          campus: '东校区',
          tradeMethod: 3,
          contactInfo: '站内私信',
          viewCount: 31,
          favoriteCount: 9,
          status: 1,
          auditStatus: 1,
          publishedAt: now,
        },
        {
          sellerId: '1',
          categoryId: categories[2]?.id ?? categories[0].id,
          title: '宿舍折叠小桌',
          subtitle: '搬宿舍低价出',
          description: '桌面稳固，适合床上学习或放置平板电脑。',
          price: '35.00',
          originalPrice: '79.00',
          conditionLevel: 3,
          campus: '主校区',
          tradeMethod: 1,
          contactInfo: '电话联系',
          viewCount: 22,
          favoriteCount: 5,
          status: 1,
          auditStatus: 1,
          publishedAt: now,
        },
        {
          sellerId: '1',
          categoryId: categories[4]?.id ?? categories[0].id,
          title: '羽毛球拍一对',
          subtitle: '适合新手入门',
          description: '含拍套，可直接约球面交，球拍无开裂。',
          price: '66.00',
          originalPrice: '159.00',
          conditionLevel: 3,
          campus: '南校区',
          tradeMethod: 3,
          contactInfo: '站内消息',
          viewCount: 54,
          favoriteCount: 16,
          status: 1,
          auditStatus: 1,
          publishedAt: now,
        },
      ]);

    await this.productImageRepository.save(
      seededProducts.map((item, index) => ({
        productId: item.id,
        imageUrl: DEMO_PRODUCT_PRESETS[index]?.imageUrl ?? this.getFallbackCoverImage('未分类', item.id),
        sortOrder: 1,
      })),
    );
  }

  async findList(query: QueryProductsDto) {
    const where = {
      status: 1,
      auditStatus: 1,
      isDeleted: 0,
      ...(query.keyword ? { title: Like(`%${query.keyword}%`) } : {}),
      ...(query.categoryId ? { categoryId: String(query.categoryId) } : {}),
      ...(query.campus ? { campus: query.campus } : {}),
    };

    const [products, categories, images] = await Promise.all([
      this.productRepository.find({
        where,
        order: {
          publishedAt: 'DESC',
          id: 'DESC',
        },
      }),
      this.categoryRepository.find(),
      this.productImageRepository.find(),
    ]);

    const categoryMap = new Map(categories.map((item) => [item.id, item.name]));
    const imageMap = new Map<string, string[]>();

    images.forEach((item) => {
      const list = imageMap.get(item.productId) ?? [];
      list.push(item.imageUrl);
      imageMap.set(item.productId, list);
    });

    return {
      list: products.map((item) =>
        this.buildProductSummary(
          item,
          categoryMap.get(item.categoryId) ?? '未分类',
          imageMap.get(item.id)?.[0] ?? null,
        ),
      ),
      total: products.length,
    };
  }

  async findDetail(id: string) {
    const product = await this.productRepository.findOne({
      where: {
        id,
        isDeleted: 0,
      },
    });

    if (!product) {
      throw new NotFoundException('商品不存在');
    }

    const [category, seller, images] = await Promise.all([
      this.categoryRepository.findOne({
        where: {
          id: product.categoryId,
        },
      }),
      this.userRepository.findOne({
        where: {
          id: product.sellerId,
        },
      }),
      this.productImageRepository.find({
        where: {
          productId: product.id,
        },
        order: {
          sortOrder: 'ASC',
          id: 'ASC',
        },
      }),
    ]);

    await this.productRepository.update(product.id, {
      viewCount: product.viewCount + 1,
    });

    const categoryName = category?.name ?? '未分类';
    const localCover = this.getLocalProductImageByTitle(product.title);
    const fallbackCover = localCover ?? this.getFallbackCoverImage(categoryName, product.id);
    const detailImages = images.map((item) => item.imageUrl);
    const mergedImages = localCover
      ? [localCover, ...detailImages.filter((item) => item !== localCover)]
      : detailImages;

    return {
      id: product.id,
      title: this.getSafeText(product.title, `${categoryName}闲置好物`),
      subtitle: this.getSafeOptionalText(product.subtitle, '信息完整，可直接和卖家沟通'),
      description: this.getSafeText(product.description, '卖家暂未补充更多描述，可先通过站内私信了解详情。'),
      price: Number(product.price),
      originalPrice: product.originalPrice ? Number(product.originalPrice) : null,
      conditionLevel: product.conditionLevel,
      campus: this.getSafeOptionalText(product.campus, '校区待定'),
      tradeMethod: product.tradeMethod,
      contactInfo: this.getSafeOptionalText(product.contactInfo, '站内私信'),
      status: product.status,
      viewCount: product.viewCount + 1,
      favoriteCount: product.favoriteCount,
      publishedAt: product.publishedAt,
      categoryName,
      coverImage: images[0]?.imageUrl ?? fallbackCover,
      images: mergedImages.length > 0 ? mergedImages : [fallbackCover],
      seller: seller
        ? {
            id: seller.id,
            nickname: seller.nickname,
            schoolName: seller.schoolName,
            collegeName: seller.collegeName,
            campus: seller.campus,
          }
        : null,
    };
  }

  async create(createProductDto: CreateProductDto, userId: string) {
    const seller = await this.userRepository.findOne({
      where: {
        id: userId,
      },
    });

    if (!seller) {
      throw new NotFoundException('当前登录用户不存在');
    }

    const category = await this.categoryRepository.findOne({
      where: {
        id: String(createProductDto.categoryId),
        status: 1,
        isDeleted: 0,
      },
    });

    if (!category) {
      throw new NotFoundException('分类不存在');
    }

    const saved = await this.productRepository.save({
      sellerId: seller.id,
      categoryId: category.id,
      title: createProductDto.title,
      subtitle: createProductDto.subtitle ?? null,
      description: createProductDto.description,
      price: createProductDto.price.toFixed(2),
      originalPrice:
        typeof createProductDto.originalPrice === 'number'
          ? createProductDto.originalPrice.toFixed(2)
          : null,
      conditionLevel: createProductDto.conditionLevel,
      campus: createProductDto.campus ?? seller.campus ?? '主校区',
      tradeMethod: createProductDto.tradeMethod,
      contactInfo: createProductDto.contactInfo ?? '站内私信',
      viewCount: 0,
      favoriteCount: 0,
      status: 1,
      auditStatus: 1,
      publishedAt: new Date(),
    });

    if (createProductDto.imageUrls?.length) {
      await this.productImageRepository.save(
        createProductDto.imageUrls.map((imageUrl, index) => ({
          productId: saved.id,
          imageUrl,
          sortOrder: index + 1,
        })),
      );
    }

    return {
      id: saved.id,
      message: '商品发布成功',
    };
  }

  async getManageDetail(id: string, userId: string) {
    const product = await this.findOwnedProduct(id, userId);
    const images = await this.productImageRepository.find({
      where: {
        productId: product.id,
      },
      order: {
        sortOrder: 'ASC',
        id: 'ASC',
      },
    });

    return {
      id: product.id,
      categoryId: Number(product.categoryId),
      title: product.title,
      subtitle: product.subtitle,
      description: product.description,
      price: Number(product.price),
      originalPrice: product.originalPrice ? Number(product.originalPrice) : null,
      conditionLevel: product.conditionLevel,
      campus: product.campus,
      tradeMethod: product.tradeMethod,
      contactInfo: product.contactInfo,
      status: product.status,
      imageUrls: images.map((item) => item.imageUrl),
    };
  }

  async update(id: string, updateProductDto: UpdateProductDto, userId: string) {
    const product = await this.findOwnedProduct(id, userId);
    const nextCategoryId =
      typeof updateProductDto.categoryId === 'number'
        ? String(updateProductDto.categoryId)
        : product.categoryId;

    if (typeof updateProductDto.categoryId === 'number') {
      const category = await this.categoryRepository.findOne({
        where: {
          id: nextCategoryId,
          status: 1,
          isDeleted: 0,
        },
      });

      if (!category) {
        throw new NotFoundException('分类不存在');
      }
    }

    if (
      typeof updateProductDto.originalPrice === 'number' &&
      typeof updateProductDto.price === 'number' &&
      updateProductDto.originalPrice > 0 &&
      updateProductDto.originalPrice < updateProductDto.price
    ) {
      throw new BadRequestException('原价不能低于当前售价');
    }

    await this.productRepository.update(product.id, {
      categoryId: nextCategoryId,
      title: updateProductDto.title ?? product.title,
      subtitle: updateProductDto.subtitle ?? product.subtitle,
      description: updateProductDto.description ?? product.description,
      price:
        typeof updateProductDto.price === 'number'
          ? updateProductDto.price.toFixed(2)
          : product.price,
      originalPrice:
        typeof updateProductDto.originalPrice === 'number'
          ? updateProductDto.originalPrice > 0
            ? updateProductDto.originalPrice.toFixed(2)
            : null
          : product.originalPrice,
      conditionLevel: updateProductDto.conditionLevel ?? product.conditionLevel,
      campus: updateProductDto.campus ?? product.campus,
      tradeMethod: updateProductDto.tradeMethod ?? product.tradeMethod,
      contactInfo: updateProductDto.contactInfo ?? product.contactInfo,
    });

    if (updateProductDto.imageUrls) {
      await this.productImageRepository.delete({
        productId: product.id,
      });

      if (updateProductDto.imageUrls.length > 0) {
        await this.productImageRepository.save(
          updateProductDto.imageUrls.map((imageUrl, index) => ({
            productId: product.id,
            imageUrl,
            sortOrder: index + 1,
          })),
        );
      }
    }

    return {
      id: product.id,
      message: '商品信息已更新',
    };
  }

  async updateStatus(id: string, status: number, userId: string) {
    const product = await this.findOwnedProduct(id, userId);

    if (product.status === status) {
      return {
        id: product.id,
        message: status === 1 ? '商品已处于上架状态' : '商品已处于下架状态',
      };
    }

    await this.productRepository.update(product.id, {
      status,
      publishedAt: status === 1 ? new Date() : product.publishedAt,
    });

    return {
      id: product.id,
      message: status === 1 ? '商品已重新上架' : '商品已下架',
    };
  }

  async remove(id: string, userId: string) {
    const product = await this.findOwnedProduct(id, userId);

    await Promise.all([
      this.productRepository.update(product.id, {
        isDeleted: 1,
        status: 0,
      }),
      this.productImageRepository.delete({
        productId: product.id,
      }),
      this.favoriteRepository.delete({
        productId: product.id,
      }),
    ]);

    return {
      id: product.id,
      message: '商品已删除',
    };
  }

  async getFavoriteProductIds(userId: string) {
    const favorites = await this.favoriteRepository.find({
      where: {
        userId,
      },
    });

    return favorites.map((item) => item.productId);
  }

  private async findOwnedProduct(productId: string, userId: string) {
    const product = await this.productRepository.findOne({
      where: {
        id: productId,
        isDeleted: 0,
      },
    });

    if (!product) {
      throw new NotFoundException('商品不存在');
    }

    if (product.sellerId !== userId) {
      throw new ForbiddenException('无权操作该商品');
    }

    return product;
  }

  private async repairBrokenDemoProducts(products: ProductEntity[], categories: CategoryEntity[]) {
    const brokenProducts = products.filter((item) => this.hasBrokenDisplayContent(item));

    if (brokenProducts.length === 0) {
      return;
    }

    await Promise.all(
      brokenProducts.map((item, index) => {
        const preset = DEMO_PRODUCT_PRESETS[index % DEMO_PRODUCT_PRESETS.length];
        const fallbackCategory = categories[preset.categoryIndex]?.id ?? categories[0].id;

        return this.productRepository.update(item.id, {
          title: preset.title,
          subtitle: preset.subtitle,
          description: preset.description,
          campus: preset.campus,
          contactInfo: this.hasBrokenText(item.contactInfo) ? preset.contactInfo : item.contactInfo,
          categoryId: item.categoryId || fallbackCategory,
        });
      }),
    );
  }

  private buildProductSummary(item: ProductEntity, categoryName: string, coverImage: string | null) {
    const localCover = this.getLocalProductImageByTitle(item.title);

    return {
      id: item.id,
      title: this.getSafeText(item.title, `${categoryName}闲置好物`),
      subtitle: this.getSafeOptionalText(item.subtitle, '信息完整，可直接和卖家沟通'),
      description: this.getSafeText(item.description, '卖家暂未补充更多描述，可先通过站内私信了解详情。'),
      price: Number(item.price),
      originalPrice: item.originalPrice ? Number(item.originalPrice) : null,
      conditionLevel: item.conditionLevel,
      campus: this.getSafeOptionalText(item.campus, '校区待定'),
      tradeMethod: item.tradeMethod,
      viewCount: item.viewCount,
      favoriteCount: item.favoriteCount,
      publishedAt: item.publishedAt,
      categoryName,
      coverImage: localCover ?? coverImage ?? this.getFallbackCoverImage(categoryName, item.id),
    };
  }

  private hasBrokenDisplayContent(item: ProductEntity) {
    return [item.title, item.subtitle, item.description, item.campus].some((value) =>
      this.hasBrokenText(value),
    );
  }

  private hasBrokenText(value: string | null | undefined) {
    if (!value) {
      return false;
    }

    const text = value.trim();

    return text.length > 0 && (/^[?？\s]+$/.test(text) || /[?？]{3,}/.test(text));
  }

  private getSafeText(value: string | null | undefined, fallback: string) {
    if (!value) {
      return fallback;
    }

    const text = value.trim();
    return text && !this.hasBrokenText(text) ? text : fallback;
  }

  private getSafeOptionalText(value: string | null | undefined, fallback: string) {
    return this.getSafeText(value, fallback);
  }

  private getLocalProductImageByTitle(title: string | null | undefined) {
    const safeTitle = this.getSafeText(title, '');
    return LOCAL_PRODUCT_IMAGE_MAP[safeTitle] ?? null;
  }

  private getFallbackCoverImage(categoryName: string, seed: string) {
    const fallbackImages = DEMO_PRODUCT_PRESETS.map((item) => item.imageUrl);
    const imageIndex = Number(seed) % fallbackImages.length;
    return fallbackImages[imageIndex];
  }
}
