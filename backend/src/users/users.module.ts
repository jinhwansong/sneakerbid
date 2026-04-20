import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { JwtStrategy } from '../common/strategy/jwt.strategy';
import { ReviewsModule } from '@/reviews/reviews.module';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    ReviewsModule,
  ],
  controllers: [UsersController],
  providers: [UsersService, JwtStrategy],
  exports: [UsersService],
})
export class UsersModule {}
