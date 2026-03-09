import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ConflictException,
  ExceptionFilter,
  NotFoundException,
} from '@nestjs/common';
import { Response } from 'express';

interface DbError {
  code?: string;
}

@Catch(Error)
export class DatabaseExceptionFilter implements ExceptionFilter {
  catch(exception: Error, host: ArgumentsHost) {
    const err = exception as DbError;
    if (err?.code && /^[23-5][0-9]{4}$/.test(err.code)) {
      const response = host.switchToHttp().getResponse<Response>();
      switch (err.code) {
        case '23505':
          throw new ConflictException('이미 존재하는 데이터입니다.');
        case '23503':
          throw new BadRequestException('참조 무결성 오류입니다.');
        case '23502':
          throw new BadRequestException('필수 값이 누락되었습니다.');
        case '42P01':
          throw new NotFoundException('대상을 찾을 수 없습니다.');
        default:
          return response.status(500).json({ message: 'Database Error' });
      }
    }
    throw exception;
  }
}
