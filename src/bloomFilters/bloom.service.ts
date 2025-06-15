// src/bloom/bloom-filter.service.ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import { BloomFilter } from 'bloom-filters';
import { LoggerService } from 'src/logger/logger.service';
import { VouchersModel } from 'src/voucher/interfaces';

@Injectable()
export class BloomFilterService implements OnModuleInit {
  constructor(private readonly log: LoggerService) {}
  private filter: BloomFilter;

  async onModuleInit() {
    const estimatedItems = 1000000;
    const falsePositiveRate = 0.01;

    this.filter = BloomFilter.create(estimatedItems, falsePositiveRate);

    const existingCodes = await VouchersModel.findAll();

    for (const code of existingCodes) {
      this.filter.add(code.voucherCode);
    }

    this.log.info(
      `✅ Bloom filter loaded with ${existingCodes.length} entries`,
    );
  }

  add(code: string) {
    this.filter.add(code);
  }

  has(code: string): boolean {
    return this.filter.has(code);
  }
}
