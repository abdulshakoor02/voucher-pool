import { Sequelize } from 'sequelize';
import { env } from '../env';

export const dbAdapter = new Sequelize(
  env.database.dbName,
  env.database.dbUser,
  env.database.dbPassword,
  {
    logging: true,
    port: env.database.dbPort,
    host: env.database.host,
    dialect: 'postgres',
    pool: {
      max: env.database.max || 5,
      min: env.database.min || 0,
      idle: env.database.idle || 10000,
    },
  },
);
