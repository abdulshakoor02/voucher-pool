import { IsEmail, IsNotEmpty } from 'class-validator';
import {
  DataTypes,
  Model,
  InferAttributes,
  InferCreationAttributes,
} from 'sequelize';
import { dbAdapter } from 'src/database/database';
import { LoggerService } from 'src/logger/logger.service';

const log = new LoggerService();

const modelDefinition = {
  name: 'customer',
  define: {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
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

export class CustomerDto {
  @IsNotEmpty()
  name: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;
}

export interface ICustomerModel
  extends Model<
    InferAttributes<ICustomerModel>,
    InferCreationAttributes<ICustomerModel>
  > {
  // Some fields are optional when calling UserModel.create() or UserModel.build()
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date;
}

export const CustomerModel = dbAdapter.define<ICustomerModel>(
  modelDefinition.name,
  modelDefinition.define,
  {
    underscored: true,
    timestamps: true,
  },
);

CustomerModel.addHook('beforeCreate', (instance: ICustomerModel) => {
  log.info(`creating customer with data ${JSON.stringify(instance.toJSON())}`);
});

CustomerModel.addHook('afterCreate', (instance: ICustomerModel) => {
  log.info(`customer created ${JSON.stringify(instance.toJSON())}`);
});

CustomerModel.addHook('beforeUpdate', (instance: ICustomerModel) => {
  log.info(`updating customer with ${JSON.stringify(instance.toJSON())}`);
});

CustomerModel.addHook('afterUpdate', (instance: ICustomerModel) => {
  log.info(`customer updated ${JSON.stringify(instance.toJSON())}`);
});

CustomerModel.addHook('beforeDestroy', (instance: ICustomerModel) => {
  log.warn(`deleteing customer ${JSON.stringify(instance.toJSON())}`);
});
