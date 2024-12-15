import { config } from "dotenv";
import { drizzle } from 'drizzle-orm/neon-http';
import { neon, neonConfig } from '@neondatabase/serverless';
import * as schema from './schema';

config({ path: ".env.local" }); // or .env.local

neonConfig.fetchConnectionCache = true;

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

export { db };
export type DbClient = typeof db;
