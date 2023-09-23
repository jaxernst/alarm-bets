import { createClient } from "@supabase/supabase-js";
import type { Database as PartnerAlarmsDb } from "../../partner-alarms";
import { createPublicClient, http, webSocket } from "viem";
import { mainnet, optimismGoerli } from "viem/chains";

require("dotenv").config({ path: "../.env" });

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
  transport: http(),
});

const unwatch = viemWsClient.watchBlockNumber({
  onBlockNumber: (blockNumber: any) => console.log(blockNumber),
});

setInterval(() => {}, 1 << 30);
