import { Type } from 'class-transformer';
import { IsInt, Max, Min } from 'class-validator';

export class UpdateProductStatusDto {
  @Type(() => Number)
  @IsInt({ message: '商品状态格式不正确' })
  @Min(0, { message: '商品状态参数不正确' })
  @Max(1, { message: '商品状态参数不正确' })
  status: number;
}
