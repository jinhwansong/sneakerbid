import { Module } from '@nestjs/common';
import { ProductSeedService } from './product-seed.service';
import { DatabaseModule } from '@/database/database.module';
import { KicksDBModule } from '@/kicksdb/kicksdb.module';

@Module({
  imports: [DatabaseModule, KicksDBModule],
  providers: [ProductSeedService],
})
export class ProductSeedModule {}
