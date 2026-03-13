import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

/**
 * TypeORM CLI DataSource for migrations.
 * Used by: typeorm migration:generate, migration:run, migration:revert
 *
 * This mirrors the config in app.module.ts but is standalone for the CLI.
 */
export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5450', 10),
  username: process.env.DB_USER || 'stayontrack',
  password: process.env.DB_PASS || 'stayontrack_dev_2024',
  database: process.env.DB_NAME || 'stayontrack',
  entities: ['src/modules/**/entities/*.entity.ts'],
  migrations: ['src/migrations/*.ts'],
  synchronize: false,
});
