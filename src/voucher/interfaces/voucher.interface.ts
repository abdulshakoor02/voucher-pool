import {
  DataTypes,
  Model,
  InferAttributes,
  InferCreationAttributes,
} from 'sequelize';
import { dbAdapter } from 'src/database/database';

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
      allowNull: false,
    },
    customerId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    offerId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    expirattionDate: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    used: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
    },
    usedDate: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: false,
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

export interface VouchersDto {
  specialOfferId: string;
  expirationDate: string;
}

export interface IVouchersModel
  extends Model<
    InferAttributes<IVouchersModel>,
    InferCreationAttributes<IVouchersModel>
  > {
  // Some fields are optional when calling UserModel.create() or UserModel.build()
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
