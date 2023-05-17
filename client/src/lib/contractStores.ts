import { account } from "./chainClient";
import { derived, writable, type Readable, get } from "svelte/store";
import { getUserAlarmsByType, type AlarmBaseInfo, type AlarmFunctions } from "./alarmHelpers";
import { transactions } from "./transactions";
import type { EvmAddress } from "../types";

export const hub = writable<EvmAddress>(
  "0x5fbdb2315678afecb367f032d93f642f64180aa3"
);

// Will add listeners to update alarm state and alarm fields after transactions
export const userAlarms = derived(
  [account, hub, transactions],
  ([$user, $hub, _], set) => {
    if (!$user?.address) return set({});

    getUserAlarmsByType($hub, $user.address, "PartnerAlarmClock")
      .then((alarms) => {
        if (alarms && Object.keys(alarms).length > 0) return set(alarms);
        set({});
      })
      .catch((e) => console.log("Could not fetch alarms", e));
  }
) as Readable<Record<number, AlarmBaseInfo>>;

function MakeAlarmConstantsCache() {
  const cache = new Map()

  const getOrQuery = (key: AlarmFunctions, alarmAddress: EvmAddress) => {
    if (cache.has(alarmAddress)) {
      return cache.get(alarmAddress)[key]

  return (alarmAddress: EvmAddress) => {
    return {
      alarmTime: getOrQuery("alarmTime", alarmAddress),
    }
  }

}
