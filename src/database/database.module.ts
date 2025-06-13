import { Module } from '@nestjs/common';
import { DbService } from './database.service';

@Module({
  providers: [DbService],
  exports: [DbService], // Export the service for use in other modules
})
export class DbModule {}
