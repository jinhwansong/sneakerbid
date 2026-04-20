import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { TerminusModule } from '@nestjs/terminus';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthController } from './health/health.controller';
import { validate } from './common/config/env.validation';
import { LoggerMiddleware } from './common/middlewares/logger.middelware';
import { JwtAuthGuard } from './common/guard/jwt.guard';
import { RolesGuard } from './common/guard/roles.guard';
import { UndefinedToNullInterceptor } from './common/interceptors/undefinedToNull.Interceptor';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { HttpExceptionFilter } from './common/filters/httpException.filter';
import { DatabaseModule } from './database/database.module';
import { DatabaseExceptionFilter } from './common/filters/databaseException.filter';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { RedisModule } from './redis/redis.module';
import { ScheduleModule } from '@nestjs/schedule';
import { AuctionsModule } from './auctions/auctions.module';
import { EventsModule } from './events/events.module';
import { BotsModule } from './bots/bots.module';
import { OrdersModule } from './orders/orders.module';
import { WalletModule } from './wallet/wallet.module';
import { WishlistModule } from './wishlist/wishlist.module';
import { UploadModule } from './upload/upload.module';
import { AdminModule } from './admin/admin.module';
import { ProductSeedModule } from './product-seed/product-seed.module';
import { RetentionModule } from './retention/retention.module';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      // dotenv 전역사용
      isGlobal: true,
      envFilePath: ['.env.local', '.env', 'backend/.env'],
      // 환경변수 검증
      validate,
      // ConfigService 값 캐싱
      cache: true,
    }),

    // Rate Limiting (요청 횟수 제한 → 봇/무한요청/입찰스팸 방지)
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          ttl: config.get<number>('THROTTLE_TTL', 60),
          limit: config.get<number>('THROTTLE_LIMIT', 100),
        },
      ],
    }),
    // Health Check
    TerminusModule,
    DatabaseModule,
    RedisModule,
    UsersModule,
    AuthModule,
    AuctionsModule,
    EventsModule,
    ScheduleModule.forRoot(),
    BotsModule,
    OrdersModule,
    WalletModule,
    WishlistModule,
    UploadModule,
    AdminModule,
    ProductSeedModule,
    RetentionModule,
    NotificationsModule,
  ],
  controllers: [AppController, HealthController],
  providers: [
    AppService,
    // JWT 인증 (모든 요청 기본 로그인 필요)
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    // 권한 검사 (ADMIN 등 역할 체크)
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },

    // Rate Limit Guard (과도한 요청 차단)
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    // undefined → null 변환 (프론트에서 JSON 파싱 안정성)
    {
      provide: APP_INTERCEPTOR,
      useClass: UndefinedToNullInterceptor,
    },

    // 응답 형식 통일
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },

    // 모든 HttpException 응답 포맷 통일
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    {
      provide: APP_FILTER,
      useClass: DatabaseExceptionFilter,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
