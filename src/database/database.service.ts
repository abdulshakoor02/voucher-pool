import { Injectable, OnModuleInit } from '@nestjs/common';
import { dbAdapter } from './database';

@Injectable()
export class DbService implements OnModuleInit {
  async onModuleInit(): Promise<void> {
    await dbAdapter.sync();

    return;
  }
}
