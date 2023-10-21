import { SupabaseClient } from "@supabase/supabase-js";
import webpush from "web-push";
import type { Database } from "../../alarm-bets-db";
import { dbListener } from "./db-listener";
import { mainLoop as alarmNotificationLoop } from "./user-alarm-notifications/main";
import { SchedulerEvent } from "./user-alarm-notifications/events";
import { supabaseClient } from "./supabaseClient";
import { allUserNotifications } from "./util/util";

require("dotenv").config({ path: "../.env" });

if (!process.env.PUBLIC_VAPID_KEY || !process.env.PRIVATE_VAPID_KEY) {
  throw new Error("Missing VAPID env variables for notifcation server");
}

webpush.setVapidDetails(
  "mailto:jaxernst@gmail.com",
  process.env.PUBLIC_VAPID_KEY,
  process.env.PRIVATE_VAPID_KEY
);

function AlarmNotificationEventSource(supabase: SupabaseClient<Database>) {
  const queue: SchedulerEvent[] = [];

  (async function initQueue() {
    const notifications = await allUserNotifications(supabase);
    notifications.forEach((n) =>
      queue.push({ name: "notificationAdded", data: n })
    );
  })();

  dbListener(supabase, {
    onNotificationRowAdded: (row) =>
      queue.push({ name: "notificationAdded", data: row }),
    onNotificationRowDeleted: (row) =>
      queue.push({ name: "notificationDeleted", data: row }),
    onNotificationRowUpdated: (row) =>
      queue.push({ name: "notificationUpdated", data: row }),
    onAlarmActivated: (row) =>
      queue.push({ name: "alarmActivated", data: row }),
    onAlarmDeactivated: (row) =>
      queue.push({ name: "alarmDeactivated", data: row }),
  });

  return () => queue.shift();
}

(function startSchedulers() {
  alarmNotificationLoop(AlarmNotificationEventSource(supabaseClient), {});
})();
