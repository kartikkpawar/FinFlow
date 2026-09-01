import { config } from "dotenv";
import { drizzle } from "drizzle-orm/node-postgres";
import { resolve } from "node:path";

config({ path: resolve(process.cwd(), ".env") });
config({ path: resolve(process.cwd(), "../.env") });

export const db = drizzle(process.env.MERCHANTS_DB_URL!);
