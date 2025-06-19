import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findOneByUsername(username: string): Promise<User | null> {
    if (!username) {
      throw new Error('Username must be provided');
    }

    return this.prisma.user.findFirst({ where: { username } });
  }

  async findOneByEmail(email: string): Promise<User | null> {
    if (!email) {
      throw new Error('Email must be provided');
    }
    return this.prisma.user.findUnique({ where: { email } });
  }

  async create(data: {
    username: string;
    email: string;
    password: string;
  }): Promise<User> {
    return this.prisma.user.create({ data });
  }
}
