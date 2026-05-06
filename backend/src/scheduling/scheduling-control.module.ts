import { Module } from '@nestjs/common';
import { SchedulerBootstrapHook } from './scheduler-bootstrap.hook';

@Module({
  providers: [SchedulerBootstrapHook],
})
export class SchedulingControlModule {}
