import { DatabaseExceptionFilter } from './databaseException.filter';
import { ArgumentsHost } from '@nestjs/common';

describe('DatabaseExceptionFilter', () => {
  let filter: DatabaseExceptionFilter;
  let mockHost: ArgumentsHost;
  let mockResponse: { status: jest.Mock; json: jest.Mock };

  beforeEach(() => {
    filter = new DatabaseExceptionFilter();
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

  it('23505 (unique violation) -> 409', () => {
    const err = Object.assign(new Error('duplicate'), { code: '23505' });
    filter.catch(err, mockHost);
    expect(mockResponse.status).toHaveBeenCalledWith(409);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: '이미 존재하는 데이터입니다.',
    });
  });

  it('23503 (foreign key) -> 400', () => {
    const err = Object.assign(new Error('fk'), { code: '23503' });
    filter.catch(err, mockHost);
    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: '참조 무결성 오류입니다.',
    });
  });

  it('23502 (not null) -> 400', () => {
    const err = Object.assign(new Error('not null'), { code: '23502' });
    filter.catch(err, mockHost);
    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: '필수 값이 누락되었습니다.',
    });
  });

  it('42P01 (undefined table) -> 404', () => {
    const err = Object.assign(new Error('table'), { code: '42P01' });
    filter.catch(err, mockHost);
    expect(mockResponse.status).toHaveBeenCalledWith(404);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: '대상을 찾을 수 없습니다.',
    });
  });

  it('알 수 없는 DB 코드 -> 500', () => {
    const err = Object.assign(new Error('db'), { code: '99999' });
    filter.catch(err, mockHost);
    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({
      message: 'Database Error',
    });
  });

  it('DB 에러 코드가 없으면 예외를 다시 던진다', () => {
    const err = new Error('generic');
    expect(() => filter.catch(err, mockHost)).toThrow(err);
    expect(mockResponse.status).not.toHaveBeenCalled();
  });

  it('5자리 코드가 아니면 예외를 다시 던진다', () => {
    const err = Object.assign(new Error('x'), { code: '1234' });
    expect(() => filter.catch(err, mockHost)).toThrow(err);
    expect(mockResponse.status).not.toHaveBeenCalled();
  });
});
