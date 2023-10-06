import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "../../../alarm-bets-db";
import { AlarmStatus } from "@alarm-bets/contracts/lib/types";

type NotificationRow =
  Database["public"]["Tables"]["alarm_notifications"]["Row"];

type AlarmRow = Database["public"]["Tables"]["partner_alarms"]["Row"];

interface ListenerEvents {
  onNotificationRowAdded?: (row: NotificationRow) => void;
  onNotificationRowDeleted?: (row: NotificationRow) => void;
  onNotificationRowUpdated?: (row: NotificationRow) => void;
  onAlarmActivated?: (row: AlarmRow) => void;
  onAlarmDeactivated?: (row: AlarmRow) => void;
}

// Make params for this funciton
export function dbListener(
  supabaseClient: SupabaseClient<Database>,
  actions: ListenerEvents
) {
  supabaseClient
    .channel("notification-state-update")
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "alarm_notifications",
      },
      (payload) => {
        actions.onNotificationRowAdded?.(payload.new as NotificationRow);
      }
    )
    .on(
      "postgres_changes",
      {
        event: "DELETE",
        schema: "public",
        table: "alarm_notifications",
      },
      (payload) => {
        actions.onNotificationRowDeleted?.(payload.old as NotificationRow);
      }
    )
    .subscribe();

  // Listen for activations and deactions of alarms
  supabaseClient
    .channel("alarm-state-updates")
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "partner_alarms",
      },
      (payload) => {
        const newRow = payload.new as AlarmRow;
        const oldRow = payload.old as AlarmRow;

        if (newRow.status === oldRow.status) return; // Only care about changes to status

        if (newRow.status === AlarmStatus.ACTIVE) {
          actions.onAlarmActivated?.(newRow);
        } else if (oldRow.status === AlarmStatus.ACTIVE) {
          actions.onAlarmDeactivated?.(newRow);
        }
      }
    )
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "partner_alarms",
      },
      (payload) => {
        const newRow = payload.new as AlarmRow;
        if (newRow.status === AlarmStatus.ACTIVE) {
          console.log("Active alarm row created");
          actions.onAlarmActivated?.(newRow);
        }
      }
    )
    .subscribe();
}
