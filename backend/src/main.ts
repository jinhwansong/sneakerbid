import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import helmet from 'helmet';
import { join } from 'path';
import { AppModule } from './app.module';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { UndefinedToNullInterceptor } from './common/interceptors/undefinedToNull.Interceptor';
import { HttpExceptionFilter } from './common/filters/httpException.filter';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // 업로드된 이미지 정적 서빙
  app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/uploads/' });

  // 프록시/로드밸런서 뒤에서 동작할 때 클라이언트 IP 등을 올바르게 인식하도록 설정
  app.set('trust proxy', 1);

  app.use((cookieParser as () => ReturnType<typeof cookieParser>)());

  // CORS: 프론트 도메인에서 API 호출 허용
  app.enableCors({
    origin: [process.env.FRONTEND_URL],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Set-Cookie', 'Cookie'],
  });

  // 요청 바디 검증: DTO 기준 화이트리스트, 타입 자동 변환
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // DTO에 정의되지 않은 값은 거름
      forbidNonWhitelisted: true, // 잘못된 값 들어오면 에러
      transform: true, // string -> number 변환 자동
      transformOptions: {
        enableImplicitConversion: true, // DTO에서 타입만 지정해도 변환
      },
    }),
  );

  // Helmet: HTTP 보안 헤더 설정
  app.use(
    helmet({
      crossOriginResourcePolicy: false,
    }),
  );

  // 전역 예외 필터: HttpException을 일관된 JSON 형식으로 응답
  app.useGlobalFilters(new HttpExceptionFilter());

  // compression: 응답 본문을 gzip 등으로 압축해 전송 (대역폭 절감)
  app.use(compression());

  // 전역 인터셉터: 응답 포맷 통일, undefined → null 변환
  app.useGlobalInterceptors(
    new UndefinedToNullInterceptor(),
    new TransformInterceptor(),
  );

  // Swagger 문서
  const config = new DocumentBuilder()
    .setTitle(process.env.APP_NAME)
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT Bearer Token',
      },
      'access-token',
    )
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = process.env.PORT || 5432;
  await app.listen(port);

  // 개발 시 Webpack HMR: 코드 변경 시 앱 재시작 없이 핫 리로드
  const hotModule = module as {
    hot?: {
      accept: () => void;
      dispose: (callback: () => void) => void;
    };
  };
  if (hotModule.hot) {
    hotModule.hot.accept();
    hotModule.hot.dispose(() => {
      void app.close();
    });
  }
}

void bootstrap();
