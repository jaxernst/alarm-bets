import { runAlarmDeadlineNotificationSchedule } from "./alarm-deadlines-notifications/scheduler";
import { supabaseClient } from "./setup";

runAlarmDeadlineNotificationSchedule(supabaseClient);
