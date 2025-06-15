import { IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import {
  DataTypes,
  Model,
  InferAttributes,
  InferCreationAttributes,
} from 'sequelize';
import { dbAdapter } from 'src/database/database';

const modelDefinition = {
  name: 'specialOffers',
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
    discount: {
      type: DataTypes.INTEGER,
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

export class SpecialOffersDto {
  @ApiProperty({
    description: 'The name of the special offer',
    example: 'Summer Discount',
  })
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'The discount percentage for the special offer',
    example: 10,
  })
  @IsNotEmpty()
  discount: number;
}

export interface ISpecialOffersModel
  extends Model<
    InferAttributes<ISpecialOffersModel>,
    InferCreationAttributes<ISpecialOffersModel>
  > {
  // Some fields are optional when calling UserModel.create() or UserModel.build()
  id: string;
  name: string;
  discount: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date;
}

export const SpecialOffersModel = dbAdapter.define<ISpecialOffersModel>(
  modelDefinition.name,
  modelDefinition.define,
  {
    underscored: true,
    timestamps: true,
  },
);
