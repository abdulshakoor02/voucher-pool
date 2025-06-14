import { Injectable, OnModuleInit } from '@nestjs/common';
import { dbAdapter } from './database';
import { SpecialOffersModel } from 'src/specialOffers/interfaces';
import { CustomerModel } from 'src/customer/interfaces';
import { VoucherJobModel } from 'src/voucher/interfaces/voucherJob.interface';
import { VouchersModel } from 'src/voucher/interfaces/voucher.interface';

@Injectable()
export class DbService implements OnModuleInit {
  async onModuleInit(): Promise<void> {
    // to do migrations for each table for more control
    await SpecialOffersModel.sync();
    await CustomerModel.sync();
    await VouchersModel.sync();
    await VoucherJobModel.sync();

    await dbAdapter.query(`
 DROP VIEW IF EXISTS voucher_view;
`);
    await dbAdapter.query(`
CREATE OR REPLACE VIEW voucher_view AS
SELECT v.id as id, voucher_code, customer_id, offer_id, expirattion_date, used, used_date, c."name" as customer_name,
so."name" as special_offer, c.id as cust_id ,c.email as email, so.id as special_offer_id, so."discount" as discount FROM vouchers v inner join
customers c on v.customer_id = c.id inner join special_offers so on v.offer_id = so.id;
`);

    return;
  }
}
