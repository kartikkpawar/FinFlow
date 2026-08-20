import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";

export const authUserDb = drizzle(process.env.DB_URL!);
