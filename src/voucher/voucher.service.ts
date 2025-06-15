import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import * as moment from 'moment';
import { Op } from 'sequelize';

import { CustomerModel } from '../customer/interfaces';
import {
  VoucherJobModel,
  VoucherViewModel,
  VouchersModel,
  VoucherViewQueryDto,
} from './interfaces';
import { dbAdapter } from '../database/database';
import { Transaction } from 'sequelize';
import { env } from '../env';
import { LoggerService } from 'src/logger/logger.service';
import { BloomFilterService } from 'src/bloomFilters/bloom.service';

@Injectable()
export class VoucherService {
  constructor(
    private readonly log: LoggerService,
    private readonly bloomFilter: BloomFilterService,
  ) {}

  generateCoupon(maxAttempts = 10): string {
    for (let i = 0; i < maxAttempts; i++) {
      let coupon: any = uuidv4();
      coupon = coupon.split('-').join('');
      if (!this.bloomFilter.has(coupon)) {
        this.bloomFilter.add(coupon);
        return coupon.toUpperCase();
      }
    }

    throw new Error('Failed to generate unique coupon');
  }

  async genreateVoucherForAllCustomer(
    specialOfferId: string,
    expirationDate: string,
  ): Promise<{ status: string }> {
    this.log.info(`initiating job to create voucher for all customer`);
    const t = await dbAdapter.transaction({
      isolationLevel: Transaction.ISOLATION_LEVELS.SERIALIZABLE,
    });
    try {
      const job = await VoucherJobModel.findOne({
        where: {
          jobName: 'voucherForAll',
        },
        transaction: t,
      });

      this.log.info(`job status ${JSON.stringify(job)}`);
      if (job !== null && job.status === 'Active') {
        await t.commit();
        return { status: 'Active' };
      }

      await VoucherJobModel.upsert(
        {
          jobName: 'voucherForAll',
          status: 'Active',
        },
        { transaction: t },
      );

      await t.commit();

      this.processCoupons(specialOfferId, expirationDate);
      this.log.info(`job intilaized  ${JSON.stringify(job)}`);

      return { status: 'success' };
    } catch (error: any) {
      console.log(error);
      t.rollback();
      return {
        status: 'unable to create coupon at this time try aftersometime',
      };
    }
  }

  async processCoupons(specialOfferId: string, expirationDate: string) {
    try {
      const customerCount = await CustomerModel.count();
      this.log.info(
        `total customers for which coupons to be created ${customerCount} and voucher limit is ${env.voucherLimit}`,
      );
      if (customerCount < env.voucherLimit) {
        await this.createVocherForCustomer(
          specialOfferId,
          expirationDate,
          customerCount,
          0,
        );

        return;
      }
      let offset = 0;
      for (let i = 0; i < customerCount; i += env.voucherLimit) {
        this.log.info(
          `creating coupons based on the limits ${env.voucherLimit}`,
        );
        await this.createVocherForCustomer(
          specialOfferId,
          expirationDate,
          env.voucherLimit,
          offset,
        );
        offset += env.voucherLimit;
      }

      await VoucherJobModel.upsert({
        jobName: 'voucherForAll',
        status: 'inActive',
      });
    } catch (error) {
      console.log(error);
    }
  }
  delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async createVocherForCustomer(
    specialOfferId: string,
    expirationDate: string,
    limit: number,
    offset: number,
  ) {
    const t = await dbAdapter.transaction({
      isolationLevel: Transaction.ISOLATION_LEVELS.SERIALIZABLE,
    });
    try {
      this.log.info(`creating coupons from ${offset} to ${offset + limit}`);
      const customers = await CustomerModel.findAll({
        transaction: t,
        limit,
        offset,
      });
      const vouchers = [];
      for (const customer of customers) {
        const voucher = {
          voucherCode: this.generateCoupon(),
          customerId: customer.id,
          offerId: specialOfferId,
          expirattionDate: expirationDate,
        };
        vouchers.push(voucher);
      }

      await VouchersModel.bulkCreate(vouchers, {
        transaction: t,
      });

      await t.commit();

      this.log.info(`created coupons from ${offset} to ${offset + limit}`);
    } catch (error) {
      this.log.error(`failed to create coupons ${error}`);
      await t.rollback();
    }
  }

  async verifyCoupon(couponQuery: VoucherViewQueryDto): Promise<any> {
    const t = await dbAdapter.transaction({
      isolationLevel: Transaction.ISOLATION_LEVELS.SERIALIZABLE,
    });
    const { voucherCode, email } = couponQuery;
    const res = await VoucherViewModel.findOne({
      where: { voucherCode, email, used: false },
      transaction: t,
    });

    if (res !== null && res.used === false) {
      if (res.expirattionDate > moment().format('X')) {
        await VouchersModel.update(
          { used: true, usedDate: moment().format('X') },
          { where: { id: res.id } },
        );
        await t.commit();
        return { discount: res.discount };
      } else {
        await t.commit();
        return `Coupon has expired`;
      }
    }

    await t.commit();
    return 'Coupon is not valid';
  }

  async getCouponByEmail(couponQuery: { email: string }): Promise<any> {
    const { email } = couponQuery;
    const currentTime = moment().format('X');
    const res = await VoucherViewModel.findAll({
      attributes: ['voucherCode', 'special_offer'],
      where: { email, expirattionDate: { [Op.gt]: currentTime }, used: false },
    });

    return res;
  }
}
