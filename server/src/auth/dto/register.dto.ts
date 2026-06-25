import { IsEmail, IsNotEmpty, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class RegisterDto {
  @IsString({ message: '用户名格式不正确' })
  @IsNotEmpty({ message: '请输入用户名' })
  @MinLength(3, { message: '用户名至少需要 3 个字符' })
  @MaxLength(50, { message: '用户名不能超过 50 个字符' })
  username: string;

  @IsString({ message: '密码格式不正确' })
  @MinLength(6, { message: '密码至少需要 6 个字符' })
  password: string;

  @IsString({ message: '昵称格式不正确' })
  @IsNotEmpty({ message: '请输入昵称' })
  @MaxLength(50, { message: '昵称不能超过 50 个字符' })
  nickname: string;

  @IsOptional()
  @IsString({ message: '手机号格式不正确' })
  @Matches(/^1\d{10}$/, { message: '手机号格式不正确' })
  phone?: string;

  @IsOptional()
  @IsEmail({}, { message: '邮箱格式不正确' })
  email?: string;

  @IsOptional()
  @IsString({ message: '学校名称格式不正确' })
  @MaxLength(100, { message: '学校名称不能超过 100 个字符' })
  schoolName?: string;

  @IsOptional()
  @IsString({ message: '学院名称格式不正确' })
  @MaxLength(100, { message: '学院名称不能超过 100 个字符' })
  collegeName?: string;

  @IsOptional()
  @IsString({ message: '年级格式不正确' })
  @MaxLength(20, { message: '年级不能超过 20 个字符' })
  grade?: string;

  @IsOptional()
  @IsString({ message: '校区格式不正确' })
  @MaxLength(50, { message: '校区不能超过 50 个字符' })
  campus?: string;
}
