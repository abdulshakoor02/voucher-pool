import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

import { CustomerModel } from '../customer/interfaces';
import { VoucherJobModel } from './interfaces/voucherJob.interface';
import { VouchersModel } from './interfaces/voucher.interface';
import { dbAdapter } from '../database/database';
import { Transaction } from 'sequelize';
import { env } from '../env';

@Injectable()
export class VoucherService {
  generateCoupon(): string {
    let coupon: any = uuidv4();
    coupon = coupon.split('-').join('');
    return coupon.toUpperCase();
  }

  async genreateVoucherForAllCustomer(
    specialOfferId: string,
    expirationDate: string,
  ): Promise<{ status: string }> {
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
      console.log(customerCount);
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
  }
}
