import { SupabaseClient, createClient } from "@supabase/supabase-js";
import webpush from "web-push";
import type { Database } from "../../alarm-bets-db";
import { run } from "./user-alarm-notifications/scheduler";
import { AlarmRow, EvmAddress } from "./types";
import { AlarmStatus } from "@alarm-bets/contracts/lib/types";
import { dbListener } from "./db-listener";

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

run(supabaseClient);

// Reactions
// -> alarms change -> Cancel or start new nofitication schedules
// -> notification change -> Cancel or start new notification schedules

// Flow
// 1. Get mapping of user notifications
// 2. Build notification fetch function (built with current state of notifications)
// 3. For each user, get their alarms
// 4. For each alarm:
//      - build function to get the next due date
//      - build function to reschedule on delivery

// 5. Set that schedule with the time to next deadline, when the notification fires,
// the n

// Return functions to get or fetch notification state
function notificationsFetcher(supabase: SupabaseClient<Database>) {
  // Update notifcation state on db changes
  let notificationState = {};
  dbListener(supabase, {
    onNotificationRowAdded: () => {},
    onNotificationRowDeleted: () => {},
  });

  const getOrFetchNotifications = (user: EvmAddress) => {
    return;
  };

  return {
    allNotifications: async () => {
      const data = await supabaseClient.from("alarm_notifications").select("*");
      notificationState = data;
      return data;
    },
    userNotifications: getOrFetchNotifications,
  };
}

function activeAlarmsFetcher(supabase: SupabaseClient<Database>) {
  return async (user: EvmAddress) => {
    const { data, error } = await supabaseClient
      .from("partner_alarms")
      .select("*")
      .eq("status", AlarmStatus.ACTIVE)
      .or(`player1.eq.${user}, player2.eq.${user}`);

    if (error) {
      throw new Error(
        "Error fetching alarm notifications from Supabase: " + error.details
      );
    }

    return data;
  };
}

const globalTimers: Record<EvmAddress, Record<AlarmId, NodeJS.Timeout>> = {};

const activeAlarms = activeAlarmsFetcher(supabaseClient);
const { allNotifications, userNotifications } =
  notificationsFetcher(supabaseClient);


// Get user notification subscription state
const users: Record<EvmAddress, Notifications> = (await allNotifications()).reduce((notif, acc) => {
  return {
    ...acc,
    [user]
  }
}, [])

// Make record of functions to get the schedule due date
const alarms: Record<EvmAddress, () => Alarm[]>;
const timeToNextDeadlineFetcher: Record<
  EvmAddress,
  Record<AlarmId, () => Promise<number>>
>;

const executors: Record<EvmAddress, Record<AlarmId, () => () => void>>;



scheduleExecutor = (user: EvmAddress) => {
  userNotifications(user)
}


const execute = scheduleExecutor();

const key = "user-alarmId";

const cancelTimer = execute(key, alarmDeadline());
