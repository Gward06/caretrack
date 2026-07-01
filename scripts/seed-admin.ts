/**
 * Run once after first deployment to create the admin account:
 *   DATABASE_URL=... npx tsx scripts/seed-admin.ts
 */
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { users } from "../shared/schema.js";
import bcrypt from "bcrypt";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

const password = process.env.ADMIN_PASSWORD || "ChangeMe123!";
const hashed = await bcrypt.hash(password, 12);

await db.insert(users).values({
  username: "admin",
  password: hashed,
  name: "George Ward",
  email: "admin@care-chain.com",
  role: "admin",
  isActive: true,
}).onConflictDoNothing();

console.log(`Admin user created. Username: admin  Password: ${password}`);
console.log("Change the password immediately after first login.");
