import {
  HttpException,
  HttpStatus,
  BadRequestException,
  ArgumentsHost,
} from '@nestjs/common';
import { HttpExceptionFilter } from '@/common/filters/httpException.filter';

describe('HttpExceptionFilter', () => {
  let filter: HttpExceptionFilter;
  let mockHost: ArgumentsHost;
  let mockResponse: { status: jest.Mock; json: jest.Mock };

  beforeEach(() => {
    filter = new HttpExceptionFilter();
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockHost = {
      switchToHttp: jest.fn().mockReturnValue({
        getResponse: () => mockResponse,
      }),
    } as unknown as ArgumentsHost;
  });

  it('문자열 메시지 -> success: false, code, data', () => {
    const ex = new HttpException('잘못된 요청', HttpStatus.BAD_REQUEST);
    filter.catch(ex, mockHost);
    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      code: 400,
      data: '잘못된 요청',
    });
  });

  it('객체 메시지 -> message 추출', () => {
    const ex = new BadRequestException('유효성 검사 실패');
    filter.catch(ex, mockHost);
    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      code: 400,
      data: '유효성 검사 실패',
    });
  });

  it('배열 메시지 (class-validator) -> data에 배열', () => {
    const ex = new HttpException(
      { message: ['err1', 'err2'] },
      HttpStatus.BAD_REQUEST,
    );
    filter.catch(ex, mockHost);
    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      code: 400,
      data: ['err1', 'err2'],
    });
  });
});
