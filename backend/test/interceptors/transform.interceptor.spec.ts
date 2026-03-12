import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of } from 'rxjs';
import { TransformInterceptor } from '@/common/interceptors/transform.interceptor';

describe('TransformInterceptor', () => {
  let interceptor: TransformInterceptor;
  let mockContext: ExecutionContext;
  let mockHandler: CallHandler;

  beforeEach(() => {
    interceptor = new TransformInterceptor();
    mockHandler = {
      handle: jest.fn(),
    };

    const createContext = (path: string) =>
      ({
        switchToHttp: () => ({
          getRequest: () => ({ path, url: path }),
        }),
      }) as unknown as ExecutionContext;
    mockContext = createContext('/api/test');
  });

  it('객체 데이터 -> success: true와 함께 스프레드', (done) => {
    const data = { item: 'value' };
    (mockHandler.handle as jest.Mock).mockReturnValue(of(data));

    interceptor.intercept(mockContext, mockHandler).subscribe((result) => {
      expect(result).toEqual({ success: true, item: 'value' });
      done();
    });
  });

  it('배열 데이터 -> success: true, data', (done) => {
    const data = [1, 2, 3];
    (mockHandler.handle as jest.Mock).mockReturnValue(of(data));

    interceptor.intercept(mockContext, mockHandler).subscribe((result) => {
      expect(result).toEqual({ success: true, data: [1, 2, 3] });
      done();
    });
  });

  it('null -> success: true, data', (done) => {
    (mockHandler.handle as jest.Mock).mockReturnValue(of(null));

    interceptor.intercept(mockContext, mockHandler).subscribe((result) => {
      expect(result).toEqual({ success: true, data: null });
      done();
    });
  });

  it('/events 경로는 그대로 반환', (done) => {
    const ctx = {
      switchToHttp: () => ({
        getRequest: () => ({
          path: '/events/auction/1',
          url: '/events/auction/1',
        }),
      }),
    } as unknown as ExecutionContext;
    const data = { raw: true };
    (mockHandler.handle as jest.Mock).mockReturnValue(of(data));

    interceptor.intercept(ctx, mockHandler).subscribe((result) => {
      expect(result).toEqual({ raw: true });
      done();
    });
  });
});
