import { SetMetadata } from '@nestjs/common';

export const OPTIONAL_AUTH_KEY = 'optionalAuth';
/** JWT 검증 시도하되, 없거나 실패해도 통과. request.user는 있을 수도 없을 수도 있음 */
export const OptionalAuth = () => SetMetadata(OPTIONAL_AUTH_KEY, true);
