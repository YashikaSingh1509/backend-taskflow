import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Project } from '../../projects/entities/project.entity';
import { Task } from '../../tasks/entities/task.entity';
import { Comment } from '../../comments/entities/comment.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ name: 'password_hash', select: false })
  passwordHash: string;

  @Column({ name: 'full_name' })
  fullName: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @OneToMany(() => Project, (p) => p.owner)
  ownedProjects: Project[];

  @OneToMany(() => Task, (t) => t.assignee)
  assignedTasks: Task[];

  @OneToMany(() => Task, (t) => t.reporter)
  reportedTasks: Task[];

  @OneToMany(() => Comment, (c) => c.author)
  comments: Comment[];
}
