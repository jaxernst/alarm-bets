import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";
import type { Database } from "../../alarm-bets-db";
import { NotificationSubscriptionManager } from "./NotificationSubscriptionManager";
import { ActiveAlarmStateManager } from "./alarm-deadlines-notifications/AlarmStateManager";
import { AlarmNotificationManager } from "./alarm-deadlines-notifications/AlarmNotificationManager";

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

const notificationManager = new NotificationSubscriptionManager(supabaseClient);
const alarmStateManager = new ActiveAlarmStateManager(
  supabaseClient,
  notificationManager
);

const alarmPushNotifier = new AlarmNotificationManager(
  alarmStateManager,
  notificationManager
);

alarmPushNotifier.run();

setTimeout(() => {}, 1 << 30);
