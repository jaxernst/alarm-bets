import { AlarmStatus } from "@alarm-bets/contracts/lib/types";
import { supabaseClient } from "../.";
import { AlarmRow, EvmAddress } from "../types";

export function parseAlarmDays(alarmDays: string) {
  return alarmDays.split(",").map((day) => parseInt(day));
}

export async function getActiveAlarms(user: EvmAddress) {
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
}

export const formatAlarm = <T extends boolean>(
  alarm: AlarmRow,
  timezoneRequired = true
) => {
  if (timezoneRequired && !alarm.player1_timezone && !alarm.player2_timezone) {
    throw new Error("Missing timezone for alarm");
  }

  return {
    id: alarm.alarm_id,
    player1: alarm.player1 as EvmAddress,
    player2: alarm.player2 as EvmAddress,
    time: alarm.alarm_time,
    days: parseAlarmDays(alarm.alarm_days),
    p1Timezone: alarm.player1_timezone,
    p2Timezone: alarm.player2_timezone,
    submissionWindow: alarm.submission_window,
  };
};
