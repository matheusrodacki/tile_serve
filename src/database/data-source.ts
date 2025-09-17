import 'dotenv/config';
import { DataSource, DataSourceOptions } from 'typeorm';

const sslEnabled = process.env.DB_SSL === 'true';

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: parseInt(process.env.DB_PORT ?? '5432', 10),
  username: process.env.DB_USER ?? 'postgres',
  password: process.env.DB_PASSWORD ?? 'postgres',
  database: process.env.DB_NAME ?? 'tile_server',
  entities: ['src/**/*.entity.ts'],
  migrations: ['src/database/migrations/*.ts'],
  synchronize: false,
  ssl: sslEnabled
    ? {
        rejectUnauthorized: false,
      }
    : undefined,
};

const dataSource = new DataSource(dataSourceOptions);

export default dataSource;
