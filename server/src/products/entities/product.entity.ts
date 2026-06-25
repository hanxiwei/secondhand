import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('product')
export class ProductEntity {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ name: 'seller_id', type: 'bigint' })
  sellerId: string;

  @Column({ name: 'category_id', type: 'bigint' })
  categoryId: string;

  @Column({ type: 'varchar', length: 120 })
  title: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  subtitle: string | null;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  price: string;

  @Column({ name: 'original_price', type: 'decimal', precision: 10, scale: 2, nullable: true })
  originalPrice: string | null;

  @Column({ name: 'condition_level', type: 'tinyint', default: 5 })
  conditionLevel: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  campus: string | null;

  @Column({ name: 'trade_method', type: 'tinyint', default: 1 })
  tradeMethod: number;

  @Column({ name: 'contact_info', type: 'varchar', length: 100, nullable: true })
  contactInfo: string | null;

  @Column({ name: 'view_count', type: 'int', default: 0 })
  viewCount: number;

  @Column({ name: 'favorite_count', type: 'int', default: 0 })
  favoriteCount: number;

  @Column({ type: 'tinyint', default: 0 })
  status: number;

  @Column({ name: 'audit_status', type: 'tinyint', default: 0 })
  auditStatus: number;

  @Column({ name: 'reject_reason', type: 'varchar', length: 255, nullable: true })
  rejectReason: string | null;

  @Column({ name: 'published_at', type: 'datetime', nullable: true })
  publishedAt: Date | null;

  @Column({ name: 'sold_at', type: 'datetime', nullable: true })
  soldAt: Date | null;

  @Column({ name: 'is_deleted', type: 'tinyint', default: 0 })
  isDeleted: number;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime' })
  updatedAt: Date;
}
