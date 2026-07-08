/**
 * Run once to add Stripe billing columns to the users table:
 *   DATABASE_URL=... npx tsx scripts/migrate-stripe-cols.ts
 */
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

await sql`
  ALTER TABLE users
    ADD COLUMN IF NOT EXISTS stripe_customer_id        text,
    ADD COLUMN IF NOT EXISTS stripe_subscription_id    text,
    ADD COLUMN IF NOT EXISTS subscription_status       text DEFAULT 'inactive',
    ADD COLUMN IF NOT EXISTS subscription_plan         text,
    ADD COLUMN IF NOT EXISTS subscription_current_period_end timestamptz
`;

console.log("✅ Stripe billing columns added to users table.");
