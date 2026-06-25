import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CategoryEntity } from './entities/category.entity';

type CategoryTreeItem = {
  id: string;
  name: string;
  parentId: string;
  children: Array<{ id: string; name: string; parentId: string }>;
};

@Injectable()
export class CategoriesService implements OnModuleInit {
  constructor(
    @InjectRepository(CategoryEntity)
    private readonly categoryRepository: Repository<CategoryEntity>,
  ) {}

  async onModuleInit() {
    const count = await this.categoryRepository.count();

    if (count > 0) {
      return;
    }

    await this.categoryRepository.save([
      { name: '数码产品', parentId: '0', sortOrder: 1 },
      { name: '学习用品', parentId: '0', sortOrder: 2 },
      { name: '宿舍闲置', parentId: '0', sortOrder: 3 },
      { name: '服饰鞋帽', parentId: '0', sortOrder: 4 },
      { name: '体育器材', parentId: '0', sortOrder: 5 },
    ]);
  }

  async findTree(): Promise<CategoryTreeItem[]> {
    const categories = await this.categoryRepository.find({
      where: {
        status: 1,
        isDeleted: 0,
      },
      order: {
        sortOrder: 'ASC',
        id: 'ASC',
      },
    });

    const rootItems = categories.filter((item) => item.parentId === '0');

    return rootItems.map((root) => ({
      id: root.id,
      name: root.name,
      parentId: root.parentId,
      children: categories
        .filter((item) => item.parentId === root.id)
        .map((item) => ({
          id: item.id,
          name: item.name,
          parentId: item.parentId,
        })),
    }));
  }
}
