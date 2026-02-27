import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import type { Request } from 'express';
import { map } from 'rxjs/operators';

@Injectable()
export class TransformInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    const request = context.switchToHttp().getRequest<Request>();
    const path = request?.path ?? request?.url ?? '';
    if (String(path).startsWith('/events')) {
      return next.handle();
    }
    return next.handle().pipe(
      map((data: unknown) => {
        if (data !== null && typeof data === 'object' && !Array.isArray(data)) {
          return { success: true, ...data };
        }
        return { success: true, data };
      }),
    );
  }
}
