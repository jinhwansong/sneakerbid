import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { OrderRepository } from '@/database/repositories/order.repository';
import { ReviewRepository } from '@/database/repositories/review.repository';
import type { RequestUser } from '@/common/decorator/user.decorator';
import { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class ReviewsService {
  constructor(
    private readonly orderRepo: OrderRepository,
    private readonly reviewRepo: ReviewRepository,
  ) {}

  async createForOrder(orderId: string, user: RequestUser, dto: CreateReviewDto) {
    const ctx = await this.orderRepo.findForReview(orderId);
    if (!ctx) {
      throw new BadRequestException('주문을 찾을 수 없습니다.');
    }
    if (ctx.status !== 'PAID') {
      throw new BadRequestException(
        '결제 완료된 주문에만 리뷰를 작성할 수 있습니다.',
      );
    }

    let targetUserId: string;
    if (user.id === ctx.buyerUserId) {
      targetUserId = ctx.sellerUserId;
    } else if (user.id === ctx.sellerUserId) {
      targetUserId = ctx.buyerUserId;
    } else {
      throw new ForbiddenException('이 주문의 거래 당사자만 리뷰를 작성할 수 있습니다.');
    }

    const existing = await this.reviewRepo.findByOrderAndAuthor(
      orderId,
      user.id,
    );
    if (existing) {
      throw new ConflictException('이미 이 주문에 리뷰를 작성했습니다.');
    }

    const id = randomUUID();
    await this.reviewRepo.insert({
      id,
      orderId,
      authorUserId: user.id,
      targetUserId,
      rating: dto.rating,
      comment: dto.comment?.trim() || null,
    });

    return { id, orderId, targetUserId, rating: dto.rating };
  }

  async listPublicForUser(userId: string) {
    const { avg, count } = await this.reviewRepo.averageRatingForUser(userId);
    const items = await this.reviewRepo.listByTargetUserId(userId, 50);
    return {
      averageRating: count > 0 ? Math.round(avg * 10) / 10 : null,
      count,
      items: items.map((r) => ({
        id: r.id,
        orderId: r.orderId,
        rating: r.rating,
        comment: r.comment,
        createdAt: r.createdAt.toISOString(),
      })),
    };
  }
}
