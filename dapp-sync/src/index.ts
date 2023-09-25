import { createClient } from "@supabase/supabase-js";
import type { Database as PartnerAlarmsDb } from "../../partner-alarms";
import { PublicClient, createPublicClient, http, webSocket } from "viem";
import { mainnet, optimismGoerli } from "viem/chains";

require("dotenv").config({ path: "../.env" });

/**
 * Db should have all alarm IDs for partner alarms
 * Each db row should contain the alarm constants, addresses, and the current status
 */

if (!process.env.PUBLIC_SUPA_API_URL || !process.env.PUBLIC_SUPA_ANON_KEY) {
  throw new Error("Missing Supabase env variables for notifcation server");
}

export const supabaseClient = createClient<PartnerAlarmsDb>(
  process.env.PUBLIC_SUPA_API_URL,
  process.env.PUBLIC_SUPA_ANON_KEY,
  {
    auth: {
      persistSession: false,
    },
  }
);

const alchemyEndpoints = {
  optimismGoerli: {
    http: `https://opt-goerli.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
    ws: `wss://opt-goerli.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
  },
  optimism: {
    http: `https://opt-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
    ws: `wss://opt-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
  },
};

export const viemWsClient = createPublicClient({
  chain: mainnet,
  transport: webSocket(alchemyEndpoints.optimismGoerli.ws),
});

const queryAlarmCreationEvents = async (client: PublicClient) => {};
const queryUserJoinedEvents = async (client: PublicClient) => {};

// Need to populate the db with all alarm id
const unwatch = viemWsClient.watchBlockNumber({
  onBlockNumber: (blockNumber: any) => console.log(blockNumber),
});

setInterval(() => {}, 1 << 30);
