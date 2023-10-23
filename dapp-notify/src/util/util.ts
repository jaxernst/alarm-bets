import { AlarmStatus } from "@alarm-bets/contracts/lib/types";
import { Alarm, AlarmRow, EvmAddress, NotificationRow } from "../types";
import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "../../../alarm-bets-db";
import { sendNotification, PushSubscription } from "web-push";
import { getTimeUntilNextAlarm } from "./time";
import { supabaseClient } from "../supabaseClient";

export function parseAlarmDays(alarmDays: string) {
  return alarmDays.split(",").map((day) => parseInt(day));
}

export function activeAlarmsFetcher(supabase: SupabaseClient<Database>) {
  return async (user: EvmAddress) => {
    const { data, error } = await supabase
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

export async function allUserNotifications(supabase: SupabaseClient<Database>) {
  const { data } = await supabaseClient.from("alarm_notifications").select("*");
  return data ?? [];
}

export const compactAlarmFormat = (user: EvmAddress, a: AlarmRow): Alarm => {
  const timezoneOffset =
    user === a.player1 ? a.player1_timezone : a.player2_timezone;

  if (!timezoneOffset) throw new Error("Missing timezone offset");

  return {
    alarmId: a.alarm_id,
    alarmTime: a.alarm_time,
    alarmDays: parseAlarmDays(a.alarm_days),
    timezoneOffset,
    submissionWindow: a.submission_window,
  };
};

export const formattedFetchResult = <T extends any>(
  fetcher: (user: EvmAddress) => Promise<AlarmRow[]>,
  transformOutput: (user: EvmAddress, a: AlarmRow) => T
) => {
  return async (user: EvmAddress) => {
    const alarms = await fetcher(user);
    return alarms.map((a) => transformOutput(user, a));
  };
};

export const sendPushNotification = async (
  subscription: PushSubscription,
  alarm: Alarm
) => {
  try {
    await sendNotification(
      subscription,
      JSON.stringify({
        title: "Upcoming Alarm",
        body: "Your alarm submission window is open. Wake up and submit your alarm!",
      })
    );
  } catch (e) {
    console.error("Error sending push notification", e);
    throw e;
  }
};

export const sendNotifications = async (
  devices: NotificationRow[],
  alarm: Alarm
) => {
  for (const device of devices) {
    try {
      await sendPushNotification(
        device.subscription as unknown as PushSubscription,
        alarm
      );
      console.log(
        "Sent notification to",
        device.user_address,
        "on device",
        device.device_id
      );
    } catch (e) {
      console.log(
        "Failed to send notification to",
        device.user_address,
        "on device",
        device.device_id
      );
    }
  }
};

export const timeToNextAlarm = ({
  alarmTime,
  timezoneOffset,
  alarmDays,
}: Alarm) => {
  return getTimeUntilNextAlarm(alarmTime, timezoneOffset, alarmDays);
};

export const getActiveAlarms = formattedFetchResult(
  activeAlarmsFetcher(supabaseClient),
  compactAlarmFormat
);
