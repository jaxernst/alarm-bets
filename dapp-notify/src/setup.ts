import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";
import type { Database } from "../../alarm-bets-db";

require("dotenv").config({ path: "../.env" });

if (!process.env.PUBLIC_SUPA_API_URL || !process.env.PRIVATE_SUPA_SERVICE_KEY) {
  throw new Error("Missing Supabase env variables for notifcation server");
}

export const supabaseClient = createClient<Database>(
  process.env.PUBLIC_SUPA_API_URL,
  process.env.PRIVATE_SUPA_SERVICE_KEY
);

if (!process.env.PUBLIC_VAPID_KEY || !process.env.PRIVATE_VAPID_KEY) {
  throw new Error("Missing VAPID env variables for notifcation server");
}

webpush.setVapidDetails(
  "mailto:jaxernst@gmail.com",
  process.env.PUBLIC_VAPID_KEY,
  process.env.PRIVATE_VAPID_KEY
);
