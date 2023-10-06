import { SupabaseClient } from "@supabase/supabase-js";
import { Publisher } from "./util/publisher";
import { Database } from "../../alarm-bets-db";
import { dbListener } from "./alarm-deadlines-notifications/db-listener";
import { EvmAddress, NotificationRow } from "./types";
import { PushSubscription } from "web-push";

type DeviceSubscription = {
  deviceId: string;
  subscription: PushSubscription;
  user: EvmAddress;
};

// Listen for changes to notification state, publish changes to listeners
interface NotificationEvents {
  notificationRowAdded: DeviceSubscription;
  notificationRowDeleted: DeviceSubscription;
  notificationRowUpdated: DeviceSubscription;
}

const transformNotificationRow = (row: NotificationRow) => ({
  user: row.user_address as EvmAddress,
  deviceId: row.device_id,
  subscription: row.subscription as unknown as PushSubscription,
});

export class NotificationSubscriptionManager extends Publisher<NotificationEvents> {
  private db: SupabaseClient<Database>;
  userSubscriptions: Record<EvmAddress, DeviceSubscription[]> = {};

  constructor(db: SupabaseClient<Database>) {
    super();
    this.db = db;
  }

  async start() {
    console.log("Starting NotificationSubscriptionManager...");
    await this.initializeSubscriptions();
    this._listenForUpdates();
  }

  async initializeSubscriptions() {
    console.log("Initializing subscriptions...");

    const { data, error } = await this.db
      .from("alarm_notifications")
      .select("*");

    if (error) {
      console.error("Error fetching alarm notifications:", error.message);
      throw new Error(
        "Error fetching alarm notifications from Supabase: " + error
      );
    }

    for (let row of data) {
      const deviceSub = transformNotificationRow(row);
      console.log("Adding device subscription:", deviceSub);
      this._addDeviceSubscription(deviceSub);
      this.publish("notificationRowAdded", deviceSub);
    }
  }

  getNotifiedUsers() {
    return Object.keys(this.userSubscriptions) as EvmAddress[];
  }

  private _listenForUpdates() {
    console.log("Listening for updates...");

    dbListener(this.db, {
      onNotificationRowAdded: (row) => {
        const data = transformNotificationRow(row);
        console.log("Notification row added:", data);
        this._addDeviceSubscription(data);
        this.publish("notificationRowAdded", data);
      },
      onNotificationRowDeleted: (row) => {
        const data = transformNotificationRow(row);
        console.log("Notification row deleted:", data);
        this._removeDeviceSubscription(data);
        this.publish("notificationRowDeleted", data);
      },
      onNotificationRowUpdated: (row) => {
        const data = transformNotificationRow(row);
        console.log("Notification row updated:", data);
        this.publish("notificationRowUpdated", data);
      },
    });
  }

  private _addDeviceSubscription(deviceSub: DeviceSubscription) {
    console.log("Adding device subscription for user:", deviceSub.user);

    const user = deviceSub.user;
    const devices = this.userSubscriptions[user];
    if (!devices) {
      return (this.userSubscriptions[user] = [deviceSub]);
    }

    if (devices.some((d) => d.deviceId === deviceSub.deviceId)) {
      console.warn("Device already exists, ignoring:", deviceSub.deviceId);
      return;
    }

    this.userSubscriptions[user].push(deviceSub);
  }

  private _removeDeviceSubscription(deviceSub: DeviceSubscription) {
    console.log("Removing device subscription:", deviceSub);

    const user = deviceSub.user;
    const devices = this.userSubscriptions[user];
    if (!devices) {
      console.warn("No devices found for user, ignoring:", user);
      return;
    }

    const newDevices = devices.filter((d) => d.deviceId !== deviceSub.deviceId);
    if (newDevices.length === 0) {
      delete this.userSubscriptions[user];
    } else {
      this.userSubscriptions[user] = newDevices;
    }
  }

  private _updateDeviceSubscription(deviceSub: DeviceSubscription) {
    console.log("Updating device subscription:", deviceSub);

    const user = deviceSub.user;
    const devices = this.userSubscriptions[user];
    if (!devices) {
      console.log("No existing devices for user, adding new:", user);
      return this._addDeviceSubscription(deviceSub);
    }

    const newDevices = devices.map((d) =>
      d.deviceId === deviceSub.deviceId ? deviceSub : d
    );
    this.userSubscriptions[user] = newDevices;
  }
}
