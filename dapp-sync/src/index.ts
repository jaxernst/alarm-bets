import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../alarm-bets-db";
import { createPublicClient, getAbiItem, http, webSocket } from "viem";
import { optimism, optimismGoerli } from "viem/chains";
import { EvmAddress, alarmTypeVals, queryAlarmCreationEvents } from "./helpers";
import { hubDeployments } from "@alarm-bets/contracts/lib/deployments";
import PartnerAlarmClock from "@alarm-bets/contracts/lib/abi/PartnerAlarmClock";
import { AlarmStatus } from "@alarm-bets/contracts/lib/types";
import AlarmBetsHub from "@alarm-bets/contracts/lib/abi/AlarmBetsHub";

require("dotenv").config({ path: "../.env" });

type RowSchema = Database["public"]["Tables"]["partner_alarms"]["Row"];

// Every 50 seconds received, update dapp-sync status in db
const BLOCK_SYNC_INTERVAL = 60;

const chainName: "optimismGoerli" | "optimism" = "optimismGoerli";

const chains = {
  optimismGoerli: optimismGoerli,
  optimismMainnet: optimism,
};

const hubAddress = hubDeployments[chains[chainName].id];

if (!hubAddress) {
  throw new Error(`Missing hub address for chain ${chainName}`);
}

if (!process.env.ALCHEMY_OP_GOERLI_KEY || !process.env.ALCHEMY_OP_MAINNET_KEY) {
  throw new Error("Missing Alchemy API key");
}

const alchemyEndpoints = {
  optimismGoerli: {
    http: `https://opt-goerli.g.alchemy.com/v2/${process.env.ALCHEMY_OP_GOERLI_KEY}`,
    ws: `wss://opt-goerli.g.alchemy.com/v2/${process.env.ALCHEMY_OP_MAINNET_KEY}`,
  },
  optimism: {
    http: `https://opt-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
    ws: `wss://opt-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
  },
};

if (!process.env.PUBLIC_SUPA_API_URL || !process.env.PRIVATE_SUPA_SERVICE_KEY) {
  throw new Error("Missing Supabase env variables for notifcation server");
}

export const supabaseClient = createClient<Database>(
  process.env.PUBLIC_SUPA_API_URL,
  process.env.PRIVATE_SUPA_SERVICE_KEY,
  {
    auth: {
      persistSession: false,
    },
  }
);

export const viemClient = createPublicClient({
  chain: chains[chainName],
  transport: http(alchemyEndpoints[chainName].http),
});

/**
 * To start the sync process, we will query the RPC for all partner alarm creation
 * events. For each creation event that we don't have an id saved, we will query for the
 * alarm constants and store those in the db
 *
 * After these alarms have been backfilled, we will start watching for new alarms
 *
 * Occassionally, we will save the last received block number to the db to pick up from
 * after a restart
 *
 * TODO: we need to handle the case where alarm state variables (only status rn) change while
 * dapp-sync is down. We need to updates statuses by querying events from the last saved block
 */

const alarmConstantsMulticallArgs = (alarmAddr: EvmAddress) => {
  const _multicallArgs = { address: alarmAddr, abi: PartnerAlarmClock };
  return {
    contracts: [
      { ..._multicallArgs, functionName: "alarmTime" },
      { ..._multicallArgs, functionName: "alarmDays" },
      { ..._multicallArgs, functionName: "status" },
      { ..._multicallArgs, functionName: "player1" },
      { ..._multicallArgs, functionName: "player2" },
      { ..._multicallArgs, functionName: "submissionWindow" },
    ],
  } as const;
};

function formatAlarmConstants(
  alarmId: number,
  alarmAddr: EvmAddress,
  alarmTime: bigint,
  alarmDays: readonly number[],
  status: number,
  player1: EvmAddress,
  player2: EvmAddress,
  submissionWindow: bigint
) {
  return {
    alarm_id: alarmId,
    alarm_address: alarmAddr,
    status,
    player1,
    player2,
    alarm_time: Number(alarmTime),
    alarm_days: alarmDays.toString(),
    submission_window: Number(submissionWindow),
  };
}

async function recordLastQueriedBlock(block: number) {
  console.log("Recording last captured block", block);
  const { error: error2 } = await supabaseClient
    .from("dapp_sync_status")
    .update({
      last_block_queried: block,
    })
    .eq("alarm_type", "PartnerAlarmClock");

  if (error2) {
    throw new Error("Failed to update sync status");
  }
}

async function onNewAlarmEvent(
  blockNumber: number,
  alarmAddress: EvmAddress,
  alarmId: number
) {
  console.log("New alarm creation event received for alarm", alarmId);
  // Check supabase client to ensure alarmId isnt already saved
  const { data: existingAlarm } = await supabaseClient
    .from("partner_alarms")
    .select("alarm_id")
    .eq("alarm_id", alarmId);

  console.log(existingAlarm);
  if (existingAlarm?.length) {
    throw new Error("Alarm already exists in db");
  }

  // Query for alarm constants
  const res = await viemClient.multicall({
    ...alarmConstantsMulticallArgs(alarmAddress),
    allowFailure: false,
  });

  // Save alarm constants to db
  const { error } = await supabaseClient
    .from("partner_alarms")
    .insert(formatAlarmConstants(...[alarmId, alarmAddress, ...res]));

  if (error) {
    console.log(error);
    throw new Error("Failed to insert alarm constants");
  }

  recordLastQueriedBlock(blockNumber);
}

async function onAlarmStatusChanged(
  alarmId: number,
  oldStatus: number,
  newStatus: number
) {
  console.log("Alarm status changed for alarm", alarmId);

  const updatedRow: Partial<RowSchema> = { status: newStatus };

  if (oldStatus === AlarmStatus.INACTIVE) {
    const { data, error } = await supabaseClient
      .from("partner_alarms")
      .select("alarm_address,player1,player2")
      .eq("alarm_id", alarmId);

    if (error) throw error;
    if (!data)
      throw new Error(`Missing expected data in query for alarm id ${alarmId}`);

    const [p1Tz, p2Tz] = await queryTimezoneOffsets(data);
    updatedRow["player1_timezone"] = Number(p1Tz);
    updatedRow["player2_timezone"] = Number(p2Tz);
  }

  console.log("updated row:", updatedRow);
  const { error } = await supabaseClient
    .from("partner_alarms")
    .update(updatedRow)
    .eq("alarm_id", alarmId);

  if (error) {
    console.log(error);
    throw new Error("Failed to update alarm status");
  }
}

async function queryTimezoneOffsets(
  alarmsToQuery: {
    alarm_address: string;
    player1: string;
    player2: string;
  }[]
) {
  const contractCalls = alarmsToQuery
    .map(
      ({ alarm_address, player1, player2 }) =>
        [
          {
            address: alarm_address as EvmAddress,
            abi: PartnerAlarmClock,
            functionName: "playerTimezone",
            args: [player1 as EvmAddress],
          },
          {
            address: alarm_address as EvmAddress,
            abi: PartnerAlarmClock,
            functionName: "playerTimezone",
            args: [player2 as EvmAddress],
          },
        ] as const
    )
    .flat();

  return await viemClient.multicall({
    contracts: contractCalls,
    allowFailure: false,
  });
}

/**
 * Query and add timezone values for activated alarms
 */
async function addTimezoneOffsets(alarms: RowSchema[]) {
  // Inactive alarms don't have both player's timezone offset
  const alarmsToQuery = alarms.filter((a) => a.status !== AlarmStatus.INACTIVE);

  if (alarmsToQuery.length === 0) return alarms;

  const res = await queryTimezoneOffsets(alarmsToQuery);

  if (res.length !== alarmsToQuery.length * 2) throw new Error("whoopsie");

  let iRes = 0;
  const timezoneAdded = alarmsToQuery.reduce((acc, alarm) => {
    acc[alarm.alarm_id] = {
      ...alarm,
      player1_timezone: Number(res[iRes]),
      player2_timezone: Number(res[iRes + 1]),
    };

    iRes += 2;
    return acc;
  }, {} as { [key: string]: (typeof alarms)[0] });

  return alarms.map((a) =>
    timezoneAdded[a.alarm_id] ? timezoneAdded[a.alarm_id] : a
  );
}

async function backfillAlarmConstants(fromBlock: number, toBlock: number) {
  const events = await queryAlarmCreationEvents(hubAddress, {
    fromBlock: BigInt(fromBlock),
    toBlock: BigInt(toBlock),
    alarmType: "PartnerAlarmClock",
  });

  const lastStoredAlarmId = Number(
    (
      await supabaseClient
        .from("partner_alarms")
        .select("alarm_id")
        .order("alarm_id", { ascending: false })
        .limit(1)
    ).data?.[0]?.alarm_id ?? 0
  );

  console.log("Last stored alarm id", lastStoredAlarmId);

  const uncapturedEvents = events.filter(
    (event) => Number(event.args.id) > lastStoredAlarmId
  );

  // Make batched multicalls to get the alarm constants for each alarm id
  const alarmInfo: { alarmAddr: EvmAddress; id: bigint }[] = [];
  const multicallArgs = [];
  for (let event of uncapturedEvents) {
    const { alarmAddr, id } = event.args;
    if (!alarmAddr || !id) {
      throw new Error("Missing event args");
    }

    alarmInfo.push({ id, alarmAddr });
    multicallArgs.push(alarmConstantsMulticallArgs(alarmAddr));
  }

  console.log("Querying", multicallArgs.length, "alarms");
  const multicallRes = await Promise.all(
    multicallArgs.map((args) =>
      viemClient.multicall({ ...args, allowFailure: false })
    )
  );

  // Save alarm constants to db
  const alarmConstants = multicallRes.map((res, i) => {
    const { id, alarmAddr } = alarmInfo[i];
    const [
      alarmTime,
      alarmDays,
      alarmStatus,
      player1,
      player2,
      submissionWindow,
    ]: [bigint, readonly number[], number, EvmAddress, EvmAddress, bigint] =
      res as any;

    return {
      alarm_id: Number(id),
      alarm_address: alarmAddr,
      status: alarmStatus,
      player1,
      player2,
      alarm_time: Number(alarmTime),
      alarm_days: alarmDays.toString(),
      submission_window: Number(submissionWindow),
      player1_timezone: null,
      player2_timezone: null,
    };
  });

  const rowsToInsert = await addTimezoneOffsets(alarmConstants);

  console.log("Inserting", rowsToInsert.length, "rows");
  const { error: error1 } = await supabaseClient
    .from("partner_alarms")
    .insert(rowsToInsert);

  if (error1) {
    console.log(error1);
    throw new Error("Failed to insert alarm constants");
  }
}

async function backfillStatusUpdates(fromBlock: number, toBlock: number) {}

async function startPartnerAlarmSync() {
  const { data } = await supabaseClient
    .from("dapp_sync_status")
    .select("last_block_queried")
    .eq("alarm_type", "PartnerAlarmClock");

  const lastObservedBlock = data?.[0].last_block_queried ?? 0;
  const queryToBlock = await viemClient.getBlockNumber();

  await backfillAlarmConstants(lastObservedBlock, Number(queryToBlock));
  await backfillStatusUpdates(lastObservedBlock, Number(queryToBlock));
  recordLastQueriedBlock(Number(queryToBlock));

  console.log("Listening for new alarm events...");
  viemClient.watchContractEvent({
    address: hubAddress,
    abi: AlarmBetsHub,
    eventName: "AlarmCreation",
    args: {
      alarmType: alarmTypeVals["PartnerAlarmClock"],
    },
    onLogs: (logs) => {
      logs.forEach((log) => {
        const { alarmAddr, id } = log.args;
        if (!alarmAddr || !id || !log.blockNumber) {
          throw new Error("Missing event args");
        }

        onNewAlarmEvent(Number(log.blockNumber), alarmAddr, Number(id));
      });
    },
  });

  console.log("listening for status changed events...");
  viemClient.watchContractEvent({
    address: hubAddress,
    abi: AlarmBetsHub,
    eventName: "StatusChanged",
    args: {
      alarmType: alarmTypeVals["PartnerAlarmClock"],
    },
    onLogs: (logs) => {
      logs.forEach((log) => {
        if (
          !log.args.alarmId ||
          log.args.to === undefined ||
          log.args.from === undefined
        ) {
          return console.error("Missing event args");
        }

        const alarmId = Number(log.args.alarmId);
        onAlarmStatusChanged(alarmId, log.args.from, log.args.to);
      });
    },
  });

  setInterval(async () => {
    const blockNumber = await viemClient.getBlockNumber();
    console.log("Sync at block number", blockNumber);
    const { error } = await supabaseClient
      .from("dapp_sync_status")
      .update({
        last_block_queried: Number(blockNumber),
      })
      .eq("alarm_type", "PartnerAlarmClock");

    if (error) {
      throw new Error("Failed to update sync status");
    }
  }, BLOCK_SYNC_INTERVAL * 1000);
}

startPartnerAlarmSync();
