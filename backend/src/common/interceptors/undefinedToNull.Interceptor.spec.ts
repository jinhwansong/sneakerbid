import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of } from 'rxjs';
import { UndefinedToNullInterceptor } from './undefinedToNull.Interceptor';

describe('UndefinedToNullInterceptor', () => {
  let interceptor: UndefinedToNullInterceptor;
  let mockContext: ExecutionContext;
  let mockHandler: CallHandler;

  beforeEach(() => {
    interceptor = new UndefinedToNullInterceptor();
    mockContext = {} as ExecutionContext;
    mockHandler = { handle: jest.fn() };
  });

  it('undefined -> null', (done) => {
    (mockHandler.handle as jest.Mock).mockReturnValue(of(undefined));

    const result = interceptor.intercept(mockContext, mockHandler);
    const obs = result instanceof Promise ? null : result;
    obs!.subscribe((r: unknown) => {
      expect(r).toBeNull();
      done();
    });
  });

  it('null -> null', (done) => {
    (mockHandler.handle as jest.Mock).mockReturnValue(of(null));

    const result = interceptor.intercept(mockContext, mockHandler);
    const obs = result instanceof Promise ? null : result;
    obs!.subscribe((r: unknown) => {
      expect(r).toBeNull();
      done();
    });
  });

  it('다른 값은 그대로', (done) => {
    const data = { foo: 'bar' };
    (mockHandler.handle as jest.Mock).mockReturnValue(of(data));

    const result = interceptor.intercept(mockContext, mockHandler);
    const obs = result instanceof Promise ? null : result;
    obs!.subscribe((r: unknown) => {
      expect(r).toEqual(data);
      done();
    });
  });
});
