import { Global, Module } from '@nestjs/common';
import { KicksDBService } from './kicksdb.service';

@Global()
@Module({
  providers: [KicksDBService],
  exports: [KicksDBService],
})
export class KicksDBModule {}
