import { AlarmStatus } from "@alarm-bets/contracts/lib/types";
import { supabaseClient } from "../.";
import { EvmAddress } from "../types";

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
