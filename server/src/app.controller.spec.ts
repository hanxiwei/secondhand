import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('health', () => {
    it('should return project health info', () => {
      expect(appController.getHealth()).toMatchObject({
        status: 'ok',
        project: 'campus-second-hand-platform',
        version: '0.1.0',
      });
    });
  });
});
