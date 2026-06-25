import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class SendMessageDto {
  @IsString({ message: '消息内容格式不正确' })
  @IsNotEmpty({ message: '请输入消息内容' })
  @MaxLength(500, { message: '消息内容不能超过 500 个字' })
  content: string;
}
