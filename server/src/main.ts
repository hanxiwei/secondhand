import { mkdirSync } from 'fs';
import { join } from 'path';

import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  ValidationError,
  ValidationPipe,
} from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from './app.module';

function getHttpErrorLabel(status: number) {
  switch (status) {
    case HttpStatus.BAD_REQUEST:
      return '请求参数错误';
    case HttpStatus.UNAUTHORIZED:
      return '未登录或登录已失效';
    case HttpStatus.FORBIDDEN:
      return '无权执行当前操作';
    case HttpStatus.NOT_FOUND:
      return '请求的内容不存在';
    case HttpStatus.CONFLICT:
      return '数据冲突';
    default:
      return '请求失败';
  }
}

@Catch(HttpException)
class HttpExceptionTransformFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const context = host.switchToHttp();
    const response = context.getResponse();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();
    const errorLabel = getHttpErrorLabel(status);

    if (typeof exceptionResponse === 'string') {
      response.status(status).json({
        statusCode: status,
        message: exceptionResponse,
        error: errorLabel,
      });
      return;
    }

    if (typeof exceptionResponse === 'object' && exceptionResponse) {
      response.status(status).json({
        ...exceptionResponse,
        statusCode: status,
        error: errorLabel,
      });
      return;
    }

    response.status(status).json({
      statusCode: status,
      message: '请求失败，请稍后重试',
      error: errorLabel,
    });
  }
}

function collectValidationMessages(errors: ValidationError[]) {
  return errors.flatMap((error) => {
    const currentMessages = error.constraints ? Object.values(error.constraints) : [];
    const childMessages = error.children?.length ? collectValidationMessages(error.children) : [];

    return [...currentMessages, ...childMessages];
  });
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const uploadsPath = join(process.cwd(), 'uploads');
  const productUploadsPath = join(uploadsPath, 'products');
  const avatarUploadsPath = join(uploadsPath, 'avatars');

  mkdirSync(uploadsPath, { recursive: true });
  mkdirSync(productUploadsPath, { recursive: true });
  mkdirSync(avatarUploadsPath, { recursive: true });

  app.enableCors({
    origin: [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:5175',
      'http://localhost:5180',
      'http://localhost:5190',
    ],
    credentials: true,
  });
  app.useStaticAssets(uploadsPath, {
    prefix: '/uploads',
  });
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      exceptionFactory: (errors) => {
        const messages = collectValidationMessages(errors);

        throw new BadRequestException({
          message: messages.length > 0 ? messages.join('；') : '提交信息有误，请检查后重试',
          errors: messages,
          error: '请求参数错误',
        });
      },
    }),
  );
  app.useGlobalFilters(new HttpExceptionTransformFilter());

  const swaggerConfig = new DocumentBuilder()
    .setTitle('校园二手交易平台 API')
    .setDescription('校园二手交易平台第一版接口文档')
    .setVersion('0.1.0')
    .build();
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, swaggerDocument);

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
