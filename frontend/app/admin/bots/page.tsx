'use client';

import { useAdminBots, useAdminSetBotEnabled } from '@/hooks/query/useAdminBots';
import { Button } from '@/components/common/Button';
import { Bot, Power, PowerOff, Info } from 'lucide-react';
import {
  AdminQueryState,
  AdminBotsSkeleton,
} from '@/components/skeleton/AdminSkeleton';
import { getBotTypeInfo } from '@/lib/constants/bot';

export default function AdminBotsPage() {
  const { data: bots, isLoading, isError } = useAdminBots();
  const setEnabled = useAdminSetBotEnabled();

  return (
    <AdminQueryState
      isLoading={isLoading}
      isError={isError || !bots}
      errorMessage="봇 목록을 불러오는데 실패했습니다."
      renderLoading={() => <AdminBotsSkeleton />}
    >
      {bots && (
      <div>
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-black text-text-main tracking-tight">
          봇 관리
        </h1>
        <p className="mt-1 text-text-sub font-medium">
          봇 활성화/비활성화를 토글할 수 있습니다. 모든 봇은 자동 입찰 후 낙찰 시
          경매를 재등록합니다.
        </p>
      </div>

      <div className="space-y-3">
        {bots.length === 0 ? (
          <div className="py-16 text-center text-text-muted">
            등록된 봇이 없습니다.
          </div>
        ) : (
          bots.map((bot) => {
            const typeInfo = getBotTypeInfo(bot.type);
            const brands =
              bot.favoriteBrands && bot.favoriteBrands.length > 0
                ? bot.favoriteBrands.join(', ')
                : '전체';
            const activityEnd =
              bot.activityEndHour != null
                ? `${String(bot.activityEndHour).padStart(2, '0')}:00`
                : null;
            return (
            <div
              key={bot.id}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 rounded-2xl bg-bg-card dark:bg-bg-card border border-border-main"
            >
              <div className="flex items-start gap-4 min-w-0">
                <div className="p-2.5 rounded-xl bg-bg-sub shrink-0">
                  <Bot size={20} className="text-text-sub" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-text-main">
                    {typeInfo.label}
                  </p>
                  <div className="mt-2 flex items-start gap-2 text-sm text-text-sub">
                    <Info size={14} className="shrink-0 mt-0.5 text-text-muted" />
                    <span>{typeInfo.description}</span>
                  </div>
                  <p className="mt-2 text-sm text-text-muted">
                    선호 브랜드: {brands}
                    {activityEnd != null && (
                      <span className="ml-2">· 활동 ~{activityEnd}</span>
                    )}
                  </p>
                </div>
              </div>
              <Button
                variant={bot.enabled !== false ? 'primary' : 'outline'}
                size="sm"
                disabled={setEnabled.isPending}
                onClick={() =>
                  setEnabled.mutate({
                    botId: bot.id,
                    enabled: bot.enabled === false,
                  })
                }
              >
                {bot.enabled !== false ? (
                  <>
                    <Power size={14} className="mr-1.5" />
                    ON
                  </>
                ) : (
                  <>
                    <PowerOff size={14} className="mr-1.5" />
                    OFF
                  </>
                )}
              </Button>
            </div>
            );
          })
        )}
      </div>
    </div>
      )}
    </AdminQueryState>
  );
}
