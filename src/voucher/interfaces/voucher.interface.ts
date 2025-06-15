import { IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import {
  DataTypes,
  Model,
  InferAttributes,
  InferCreationAttributes,
} from 'sequelize';
import { CustomerModel } from 'src/customer/interfaces';
import { dbAdapter } from 'src/database/database';
import { SpecialOffersModel } from 'src/specialOffers/interfaces';

const modelDefinition = {
  name: 'vouchers',
  define: {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    voucherCode: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
    },
    customerId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'customers',
        key: 'id',
      },
    },
    offerId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'special_offers',
        key: 'id',
      },
    },
    expirattionDate: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    used: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    usedDate: {
      type: DataTypes.STRING,
    },
    createdAt: {
      type: DataTypes.DATE,
      field: 'created_at',
    },
    updatedAt: {
      type: DataTypes.DATE,
      field: 'updated_at',
    },
    deletedAt: {
      type: DataTypes.DATE,
      field: 'deleted_at',
    },
  },
};

export class VouchersDto {
  @ApiProperty({
    description: 'The ID of the special offer to link the voucher to',
    example: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
  })
  @IsNotEmpty()
  specialOfferId: string;

  @ApiProperty({
    description: 'The expiration date of the voucher',
    example: '2024-12-31',
  })
  @IsNotEmpty()
  expirationDate: string;
}

export interface IVouchersModel
  extends Model<
    InferAttributes<IVouchersModel>,
    InferCreationAttributes<IVouchersModel>
  > {
  id: string;
  voucherCode: string;
  customerId: string;
  offerId: string;
  expirattionDate: string;
  used: boolean;
  usedDate: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date;
}

export const VouchersModel = dbAdapter.define<IVouchersModel>(
  modelDefinition.name,
  modelDefinition.define,
  {
    underscored: true,
    timestamps: true,
  },
);

VouchersModel.belongsTo(CustomerModel, { foreignKey: 'customerId' });
VouchersModel.belongsTo(SpecialOffersModel, { foreignKey: 'offerId' });
