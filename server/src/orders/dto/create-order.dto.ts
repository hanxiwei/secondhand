import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateOrderDto {
  @Type(() => Number)
  @IsInt({ message: '商品编号格式不正确' })
  @Min(1, { message: '请选择正确的商品' })
  productId: number;

  @IsOptional()
  @IsString({ message: '备注内容格式不正确' })
  @MaxLength(255, { message: '备注内容不能超过 255 个字' })
  remark?: string;
}
