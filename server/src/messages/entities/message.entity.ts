import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('message')
export class MessageEntity {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ name: 'session_id', type: 'bigint', nullable: true })
  sessionId: string | null;

  @Column({ name: 'sender_id', type: 'bigint', nullable: true })
  senderId: string | null;

  @Column({ name: 'receiver_id', type: 'bigint' })
  receiverId: string;

  @Column({ name: 'product_id', type: 'bigint', nullable: true })
  productId: string | null;

  @Column({ name: 'message_type', type: 'tinyint', default: 1 })
  messageType: number;

  @Column({ type: 'text' })
  content: string;

  @Column({ name: 'is_read', type: 'tinyint', default: 0 })
  isRead: number;

  @Column({ name: 'read_at', type: 'datetime', nullable: true })
  readAt: Date | null;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt: Date;
}
