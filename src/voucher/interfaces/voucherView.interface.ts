import {
  DataTypes,
  Model,
  InferAttributes,
  InferCreationAttributes,
} from 'sequelize';
import { dbAdapter } from 'src/database/database';

const modelDefinition = {
  name: 'voucher_view',
  define: {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
    },
    voucherCode: {
      type: DataTypes.STRING,
    },
    customerId: {
      type: DataTypes.UUID,
    },
    offerId: {
      type: DataTypes.UUID,
    },
    expirattionDate: {
      type: DataTypes.STRING,
    },
    used: {
      type: DataTypes.BOOLEAN,
    },
    usedDate: {
      type: DataTypes.STRING,
    },
    customerName: {
      type: DataTypes.STRING,
    },
    email: {
      type: DataTypes.STRING,
    },
    special_offer: {
      type: DataTypes.STRING,
    },
    discount: {
      type: DataTypes.INTEGER,
    },
  },
};

export interface VoucherViewQueryDto {
  email: string;
  voucherCode: string;
}

export interface IVoucherViewModel
  extends Model<
    InferAttributes<IVoucherViewModel>,
    InferCreationAttributes<IVoucherViewModel>
  > {
  id: string;
  voucherCode: string;
  customerId: string;
  offerId: string;
  expirattionDate: string;
  used: boolean;
  usedDate: string;
  customerName: string;
  email: string;
  special_offer: string;
  discount: number;
}

export const VoucherViewModel = dbAdapter.define<IVoucherViewModel>(
  modelDefinition.name,
  modelDefinition.define,
  {
    underscored: true,
    tableName: 'voucher_view',
    timestamps: false,
  },
);
