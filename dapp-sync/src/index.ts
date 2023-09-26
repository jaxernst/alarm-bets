import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../alarm-bets-db";
import {
  PublicClient,
  createPublicClient,
  http,
  parseAbiItem,
  webSocket,
} from "viem";
import { mainnet, optimism, optimismGoerli } from "viem/chains";
import { hubDeployments } from "./deployments";
import { EvmAddress, queryAlarmCreationEvents } from "./helpers";
import PartnerAlarmClock from "./abi/PartnerAlarmClock";

require("dotenv").config({ path: "../.env" });

const chainName: "optimismGoerli" | "optimism" = "optimismGoerli";

const chains = {
  optimismGoerli: optimismGoerli,
  optimismMainnet: optimism,
};

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

const hubAddress = hubDeployments[chains[chainName].id];

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

export const wsClient = createPublicClient({
  chain: chains[chainName],
  transport: webSocket(alchemyEndpoints[chainName].ws),
});

export const queryClient = createPublicClient({
  chain: chains[chainName],
  transport: http(alchemyEndpoints[chainName].http),
});

/**
 * To start the sync process, we will query the RPC for all partner alarm creation
 * events. For each creation event, we will query for the alarm constants and store
 * those in the db
 *
 * After these alarms have been backfilled, we will start watching for new alarms
 *
 * There needs to be some commit posted to the db each time a new block event is
 * recevied so we know where to pick up from if the sync process dies
 */

async function startPartnerAlarmSync(client: PublicClient) {
  const { data } = await supabaseClient
    .from("dapp_sync_status")
    .select("last_block_queried")
    .eq("alarm_type", "PartnerAlarmClock");

  console.log(data?.[0].last_block_queried);

  const events = await queryAlarmCreationEvents(client, hubAddress, {
    fromBlock: 13643915n,
    alarmType: "PartnerAlarmClock",
  });

  const alarmInfo = [];
  const multicallArgs = [];
  for (let event of events) {
    const { alarmAddr, id } = event.args;
    if (!alarmAddr || !id) {
      throw new Error("Missing event args");
    }

    alarmInfo.push({ id, alarmAddr });

    const _multicallArgs = { address: alarmAddr, abi: PartnerAlarmClock };
    multicallArgs.push({
      contracts: [
        { ..._multicallArgs, functionName: "alarmTime" },
        { ..._multicallArgs, functionName: "alarmDays" },
        { ..._multicallArgs, functionName: "player1" },
        { ..._multicallArgs, functionName: "player2" },
        { ..._multicallArgs, functionName: "submissionWindow" },
      ],
    });
  }

  const multicallRes = await Promise.all(
    multicallArgs.map((args) =>
      client.multicall({ ...args, allowFailure: false })
    )
  );

  let i = 0;
  for (const res of multicallRes) {
    const { id, alarmAddr } = alarmInfo[i];
    const [alarmTime, alarmDays, player1, player2, submissionWindow]: [
      bigint,
      bigint[],
      EvmAddress,
      EvmAddress,
      bigint,
      bigint
    ] = res as any;

    await supabaseClient.from("partner_alarms").insert([
      {
        alarm_id: id.toString(),
        alarm_address: alarmAddr,
        player1,
        player2,
        alarm_time: Number(alarmTime),
        alarm_days: alarmDays.toString(),
        submission_window: Number(submissionWindow),
      },
    ]);
  }
}

/*const unwatch = viemWsClient.watchBlockNumber({
  onBlockNumber: (blockNumber: any) => console.log(blockNumber),
}); */

startPartnerAlarmSync(queryClient as any);

setInterval(() => {}, 1 << 30);
