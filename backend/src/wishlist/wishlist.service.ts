import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { RequestUser } from '@/common/decorator/user.decorator';

export interface WishlistToggleResult {
  isWishlisted: boolean;
}

export interface WishlistItem {
  id: string;
  auctionId: string;
  sneakerName: string;
  brand: string;
  imageUrl: string;
  size: string;
  currentPrice: number;
  endTime: Date;
  status: string;
  bidCount: number;
  buyNowPrice: number | null;
}

@Injectable()
export class WishlistService {
  constructor(private readonly prisma: PrismaService) {}

  /** 찜하기 토글 (있으면 해제, 없으면 추가) */
  async toggle(
    auctionId: string,
    user: RequestUser,
  ): Promise<WishlistToggleResult> {
    const existing = await this.prisma.wishlist.findUnique({
      where: { userId_auctionId: { userId: user.id, auctionId } },
    });

    if (existing) {
      await this.prisma.wishlist.delete({
        where: { id: existing.id },
      });
      return { isWishlisted: false };
    }

    const auction = await this.prisma.auction.findUnique({
      where: { id: auctionId },
    });
    if (!auction) {
      throw new NotFoundException('경매를 찾을 수 없습니다.');
    }

    await this.prisma.wishlist.create({
      data: { userId: user.id, auctionId },
    });
    return { isWishlisted: true };
  }

  /** 여러 경매 ID에 대해 찜 여부 맵 반환 (userId, auctionIds) */
  async getWishlistedMap(
    userId: string,
    auctionIds: string[],
  ): Promise<Record<string, boolean>> {
    if (auctionIds.length === 0) return {};
    const entries = await this.prisma.wishlist.findMany({
      where: {
        userId,
        auctionId: { in: auctionIds },
      },
      select: { auctionId: true },
    });
    const set = new Set(entries.map((e) => e.auctionId));
    return Object.fromEntries(auctionIds.map((id) => [id, set.has(id)]));
  }

  /** 내 찜 목록 조회 */
  async getMyWishlist(user: RequestUser): Promise<WishlistItem[]> {
    const entries = await this.prisma.wishlist.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        auction: {
          include: {
            sneaker: true,
            _count: { select: { bids: true } },
          },
        },
      },
    });

    return entries.map((entry) => ({
      id: entry.id,
      auctionId: entry.auctionId,
      sneakerName: entry.auction.sneaker.modelName,
      brand: entry.auction.sneaker.brand,
      imageUrl: entry.auction.sneaker.imageUrl,
      size: entry.auction.size,
      currentPrice: entry.auction.currentPrice,
      endTime: entry.auction.endTime,
      status: entry.auction.status,
      bidCount: entry.auction._count.bids,
      buyNowPrice: entry.auction.buyNowPrice,
    }));
  }
}
