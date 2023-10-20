import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { Database } from "../../alarm-bets-db";

require("dotenv").config({ path: "../.env" });

if (!process.env.PUBLIC_SUPA_API_URL || !process.env.PRIVATE_SUPA_SERVICE_KEY) {
  throw new Error("Missing Supabase env variables for notifcation server");
}

export const supabaseClient = createClient<Database>(
  process.env.PUBLIC_SUPA_API_URL,
  process.env.PRIVATE_SUPA_SERVICE_KEY
);
