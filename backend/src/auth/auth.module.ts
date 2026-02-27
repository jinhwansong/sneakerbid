import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { KakaoStrategy } from '../common/strategy/kakao.strategy';
import { GoogleStrategy } from '../common/strategy/google.strategy';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const privateKey = configService.get<string>('JWT_PRIVATE_KEY');
        const publicKey = configService.get<string>('JWT_PUBLIC_KEY');

        if (!privateKey || !publicKey) {
          throw new Error(
            'JWT_PRIVATE_KEY and JWT_PUBLIC_KEY must be set in .env',
          );
        }

        return {
          // .env 파일의 키는 한 줄로 저장되어 있으므로 줄바꿈 처리
          privateKey: privateKey.replace(/\\n/g, '\n'),
          publicKey: publicKey.replace(/\\n/g, '\n'),
          signOptions: {
            algorithm: 'RS256',
            expiresIn: '15m',
          },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, KakaoStrategy, GoogleStrategy],
  exports: [AuthService],
})
export class AuthModule {}
