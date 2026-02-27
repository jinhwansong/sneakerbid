import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ConflictException,
  ExceptionFilter,
  NotFoundException,
} from '@nestjs/common';
import { Response } from 'express';
import { Prisma } from '@prisma/client';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();

    switch (exception.code) {
      case 'P2002':
        throw new ConflictException('이미 존재하는 데이터입니다.');
      case 'P2025':
        throw new NotFoundException('대상을 찾을 수 없습니다.');
      case 'P2003':
        throw new BadRequestException('참조 무결성 오류입니다.');
      case 'P2014':
        throw new BadRequestException('필수 관계가 충족되지 않았습니다.');
      default:
        response.status(500).json({ message: 'Database Error' });
    }
  }
}
