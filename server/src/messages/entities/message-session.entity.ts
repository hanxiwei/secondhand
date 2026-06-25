import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('message_session')
export class MessageSessionEntity {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ name: 'product_id', type: 'bigint', nullable: true })
  productId: string | null;

  @Column({ name: 'buyer_id', type: 'bigint' })
  buyerId: string;

  @Column({ name: 'seller_id', type: 'bigint' })
  sellerId: string;

  @Column({ name: 'last_message', type: 'varchar', length: 500, nullable: true })
  lastMessage: string | null;

  @Column({ name: 'last_message_at', type: 'datetime', nullable: true })
  lastMessageAt: Date | null;

  @Column({ name: 'buyer_unread_count', type: 'int', default: 0 })
  buyerUnreadCount: number;

  @Column({ name: 'seller_unread_count', type: 'int', default: 0 })
  sellerUnreadCount: number;

  @Column({ type: 'tinyint', default: 1 })
  status: number;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime' })
  updatedAt: Date;
}
