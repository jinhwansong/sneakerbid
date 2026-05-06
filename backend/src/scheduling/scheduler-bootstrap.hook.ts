import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';

/**
 * DISABLE_SCHEDULING=true 이면 부팅 후 등록된 모든 Cron·Interval·Timeout을 중지.
 * 로컬/스테이징에서만 사용. 운영 미설정 시 스케줄은 정상 동작.
 */
@Injectable()
export class SchedulerBootstrapHook implements OnApplicationBootstrap {
  private readonly logger = new Logger(SchedulerBootstrapHook.name);

  constructor(
    private readonly registry: SchedulerRegistry,
    private readonly config: ConfigService,
  ) {}

  onApplicationBootstrap(): void {
    const raw = this.config.get<string>('DISABLE_SCHEDULING');
    if (raw?.toLowerCase() !== 'true') return;

    const cronJobs = this.registry.getCronJobs();
    for (const name of [...cronJobs.keys()]) {
      this.registry.deleteCronJob(name);
    }

    for (const name of [...this.registry.getIntervals()]) {
      this.registry.deleteInterval(name);
    }

    for (const name of [...this.registry.getTimeouts()]) {
      this.registry.deleteTimeout(name);
    }

    this.logger.warn(
      `스케줄러 비활성화됨 (DISABLE_SCHEDULING=true). Cron ${cronJobs.size}건·Interval/Timeout 정리.`,
    );
  }
}
