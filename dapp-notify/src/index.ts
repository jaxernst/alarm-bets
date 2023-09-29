import { runAlarmDeadlineNotificationSchedule } from "./alarm-deadlines/scheduler";
import { supabaseClient } from "./setup";

runAlarmDeadlineNotificationSchedule(supabaseClient);
