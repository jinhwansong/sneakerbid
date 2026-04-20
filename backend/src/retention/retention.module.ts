import { Module } from '@nestjs/common';
import { DatabaseModule } from '@/database/database.module';
import { DataRetentionService } from './data-retention.service';

@Module({
  imports: [DatabaseModule],
  providers: [DataRetentionService],
})
export class RetentionModule {}
