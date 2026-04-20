/** 알림 한 건 (백엔드 NotificationDto) */
export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string | null;
  readAt: string | null;
  metadata: { auctionId?: string; finalPrice?: number } | null;
  createdAt: string;
}

/** GET /notifications — TransformInterceptor 후 본문 */
export type NotificationsListResponse = {
  success?: boolean;
  items: NotificationItem[];
  nextCursor: string | null;
};

export type UnreadCountResponse = {
  success?: boolean;
  count: number;
};
