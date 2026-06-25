import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsString, MaxLength, Min } from 'class-validator';

export class CreateMessageSessionDto {
  @Type(() => Number)
  @IsInt({ message: '商品编号格式不正确' })
  @Min(1, { message: '请选择正确的商品' })
  productId: number;

  @IsString({ message: '消息内容格式不正确' })
  @IsNotEmpty({ message: '请输入消息内容' })
  @MaxLength(500, { message: '消息内容不能超过 500 个字' })
  content: string;
}
