import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { Response } from 'express';

interface DbError {
  code?: string;
}

@Catch(Error)
export class DatabaseExceptionFilter implements ExceptionFilter {
  catch(exception: Error, host: ArgumentsHost) {
    const err = exception as DbError;
    if (err?.code && /^[A-Za-z0-9]{5}$/.test(err.code)) {
      const response = host.switchToHttp().getResponse<Response>();
      switch (err.code) {
        case '23505':
          return response.status(409).json({ message: '이미 존재하는 데이터입니다.' });
        case '23503':
          return response.status(400).json({ message: '참조 무결성 오류입니다.' });
        case '23502':
          return response.status(400).json({ message: '필수 값이 누락되었습니다.' });
        case '42P01':
          return response.status(404).json({ message: '대상을 찾을 수 없습니다.' });
        default:
          return response.status(500).json({ message: 'Database Error' });
      }
    }
    throw exception;
  }
}
