import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProductDto {
  @Type(() => Number)
  @IsInt({ message: '商品分类格式不正确' })
  @Min(1, { message: '请选择正确的商品分类' })
  categoryId: number;

  @IsString({ message: '商品标题格式不正确' })
  @IsNotEmpty({ message: '请填写商品标题' })
  @MaxLength(120, { message: '商品标题不能超过 120 个字' })
  title: string;

  @IsOptional()
  @IsString({ message: '商品副标题格式不正确' })
  @MaxLength(255, { message: '商品副标题不能超过 255 个字' })
  subtitle?: string;

  @IsString({ message: '商品描述格式不正确' })
  @IsNotEmpty({ message: '请填写商品描述' })
  description: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 }, { message: '价格格式不正确' })
  @Min(0.01, { message: '价格必须大于 0.01' })
  price: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 }, { message: '原价格式不正确' })
  @Min(0, { message: '原价不能小于 0' })
  originalPrice?: number;

  @Type(() => Number)
  @IsInt({ message: '成色格式不正确' })
  @Min(1, { message: '请选择正确的成色' })
  conditionLevel: number;

  @IsOptional()
  @IsString({ message: '校区格式不正确' })
  @MaxLength(50, { message: '校区名称不能超过 50 个字' })
  campus?: string;

  @Type(() => Number)
  @IsInt({ message: '交易方式格式不正确' })
  @Min(1, { message: '请选择正确的交易方式' })
  tradeMethod: number;

  @IsOptional()
  @IsString({ message: '联系方式格式不正确' })
  @MaxLength(100, { message: '联系方式不能超过 100 个字' })
  contactInfo?: string;

  @IsOptional()
  @IsArray({ message: '商品图片格式不正确' })
  @ArrayMaxSize(5, { message: '商品图片最多上传 5 张' })
  @IsUrl({ require_tld: false }, { each: true, message: '商品图片地址格式不正确，请重新上传图片' })
  imageUrls?: string[];
}
