import { Injectable } from '@nestjs/common';
import { PrismaService, UserByIdResult } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string): Promise<UserByIdResult> {
    return this.prisma.findUserById(id);
  }
}
