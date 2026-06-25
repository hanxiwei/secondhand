import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Param,
  Patch,
  Query,
  Req,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { AuthGuard } from '../auth/guards/auth.guard';
import { CreateProductDto } from './dto/create-product.dto';
import { QueryProductsDto } from './dto/query-products.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { UpdateProductStatusDto } from './dto/update-product-status.dto';
import { ProductsService } from './products.service';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  findList(@Query() query: QueryProductsDto) {
    return this.productsService.findList(query);
  }

  @UseGuards(AuthGuard)
  @Post('upload/images')
  @UseInterceptors(
    FilesInterceptor('files', 5, {
      storage: diskStorage({
        destination: join(process.cwd(), 'uploads', 'products'),
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
        fileSize: 5 * 1024 * 1024,
      },
    }),
  )
  uploadImages(
    @UploadedFiles() files: Array<{ filename: string }>,
    @Req() request: { protocol: string; get(name: string): string | undefined },
  ) {
    const host = request.get('host');

    if (!host) {
      throw new BadRequestException('无法识别当前服务地址');
    }

    return {
      urls: files.map((file) => `${request.protocol}://${host}/uploads/products/${file.filename}`),
    };
  }

  @Get(':id')
  findDetail(@Param('id') id: string) {
    return this.productsService.findDetail(id);
  }

  @UseGuards(AuthGuard)
  @Post()
  create(
    @Body() createProductDto: CreateProductDto,
    @CurrentUser() user: { userId: string },
  ) {
    return this.productsService.create(createProductDto, user.userId);
  }

  @UseGuards(AuthGuard)
  @Get(':id/manage')
  getManageDetail(@Param('id') id: string, @CurrentUser() user: { userId: string }) {
    return this.productsService.getManageDetail(id, user.userId);
  }

  @UseGuards(AuthGuard)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
    @CurrentUser() user: { userId: string },
  ) {
    return this.productsService.update(id, updateProductDto, user.userId);
  }

  @UseGuards(AuthGuard)
  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() updateProductStatusDto: UpdateProductStatusDto,
    @CurrentUser() user: { userId: string },
  ) {
    return this.productsService.updateStatus(id, updateProductStatusDto.status, user.userId);
  }

  @UseGuards(AuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: { userId: string }) {
    return this.productsService.remove(id, user.userId);
  }
}
