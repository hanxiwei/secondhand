import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      project: 'campus-second-hand-platform',
      version: '0.1.0',
    };
  }

  getSystemOverview() {
    return {
      projectName: '校园二手交易平台',
      slogan: '让闲置在校园里更快找到下一位主人',
      currentStage: '前后端基础工程已启动',
      frontend: 'Vue 3 + Vite + TypeScript',
      backend: 'NestJS + TypeScript',
      database: 'MySQL + Redis',
      coreModules: [
        '用户认证',
        '商品管理',
        '搜索筛选',
        '消息沟通',
        '交易状态',
        '后台审核',
      ],
    };
  }
}
