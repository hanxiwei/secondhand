import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsString({ message: '账号格式不正确' })
  @IsNotEmpty({ message: '请输入账号' })
  account: string;

  @IsString({ message: '密码格式不正确' })
  @MinLength(6, { message: '密码至少需要 6 个字符' })
  password: string;
}
