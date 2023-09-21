import express from "express";
import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";
import { runScheduler } from "./notificationScheduler";
import type { Database } from "../../database";

require("dotenv").config({ path: "../.env" });

if (!process.env.PUBLIC_SUPA_API_URL || !process.env.PUBLIC_SUPA_ANON_KEY) {
  throw new Error("Missing Supabase env variables for notifcation server");
}

export const supabaseClient = createClient<Database>(
  process.env.PUBLIC_SUPA_API_URL,
  process.env.PUBLIC_SUPA_ANON_KEY,
  {
    auth: {
      persistSession: false,
    },
  }
);

if (!process.env.PUBLIC_VAPID_KEY || !process.env.PRIVATE_VAPID_KEY) {
  throw new Error("Missing VAPID env variables for notifcation server");
}

webpush.setVapidDetails(
  "mailto:jaxernst@gmail.com",
  process.env.PUBLIC_VAPID_KEY,
  process.env.PRIVATE_VAPID_KEY
);

const app = express();
const PORT = 3000;

app.get("/", (req, res) => {
  res.send("Hello, TypeScript!");
});

app.listen(PORT, () => {
  runScheduler();
});
