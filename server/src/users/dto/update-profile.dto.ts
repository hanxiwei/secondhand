import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString({ message: '昵称格式不正确' })
  @MaxLength(50, { message: '昵称不能超过 50 个字符' })
  nickname?: string;

  @IsOptional()
  @IsString({ message: '手机号格式不正确' })
  @MaxLength(20, { message: '手机号不能超过 20 个字符' })
  phone?: string;

  @IsOptional()
  @IsString({ message: '邮箱格式不正确' })
  @MaxLength(100, { message: '邮箱不能超过 100 个字符' })
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

  @IsOptional()
  @IsString({ message: '联系方式格式不正确' })
  @MaxLength(100, { message: '联系方式不能超过 100 个字符' })
  contactInfo?: string;

  @IsOptional()
  @IsString({ message: '个人简介格式不正确' })
  @MaxLength(255, { message: '个人简介不能超过 255 个字符' })
  bio?: string;
}
