import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('user')
export class UserEntity {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  username: string;

  @Column({ name: 'password_hash', type: 'varchar', length: 255 })
  passwordHash: string;

  @Column({ type: 'varchar', length: 20, nullable: true, unique: true })
  phone: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true, unique: true })
  email: string | null;

  @Column({ name: 'student_no', type: 'varchar', length: 50, nullable: true })
  studentNo: string | null;

  @Column({ name: 'real_name', type: 'varchar', length: 50, nullable: true })
  realName: string | null;

  @Column({ type: 'varchar', length: 50 })
  nickname: string;

  @Column({ name: 'avatar_url', type: 'varchar', length: 255, nullable: true })
  avatarUrl: string | null;

  @Column({ name: 'school_name', type: 'varchar', length: 100, nullable: true })
  schoolName: string | null;

  @Column({ name: 'college_name', type: 'varchar', length: 100, nullable: true })
  collegeName: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  grade: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  campus: string | null;

  @Column({ name: 'contact_info', type: 'varchar', length: 100, nullable: true })
  contactInfo: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  bio: string | null;

  @Column({ name: 'credit_score', type: 'int', default: 100 })
  creditScore: number;

  @Column({ name: 'auth_status', type: 'tinyint', default: 0 })
  authStatus: number;

  @Column({ type: 'tinyint', default: 1 })
  status: number;

  @Column({ name: 'last_login_at', type: 'datetime', nullable: true })
  lastLoginAt: Date | null;

  @Column({ name: 'is_deleted', type: 'tinyint', default: 0 })
  isDeleted: number;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime' })
  updatedAt: Date;
}
