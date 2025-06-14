import {
  DataTypes,
  Model,
  InferAttributes,
  InferCreationAttributes,
} from 'sequelize';
import { dbAdapter } from 'src/database/database';

const modelDefinition = {
  name: 'voucherJob',
  define: {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    jobName: {
      type: DataTypes.STRING,
      unique: true,
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
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

export interface VoucherJobDto {
  jobName: string;
  status: string;
}

export interface IVoucherJobModel
  extends Model<
    InferAttributes<IVoucherJobModel>,
    InferCreationAttributes<IVoucherJobModel>
  > {
  // Some fields are optional when calling UserModel.create() or UserModel.build()
  id: string;
  jobName: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date;
}

export const VoucherJobModel = dbAdapter.define<IVoucherJobModel>(
  modelDefinition.name,
  modelDefinition.define,
  {
    underscored: true,
    timestamps: true,
  },
);
