import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class QueryProductsDto {
  @IsOptional()
  @IsString({ message: '搜索关键词格式不正确' })
  keyword?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: '商品分类格式不正确' })
  @Min(1, { message: '商品分类参数不正确' })
  categoryId?: number;

  @IsOptional()
  @IsString({ message: '校区格式不正确' })
  campus?: string;
}
