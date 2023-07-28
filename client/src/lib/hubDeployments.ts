import { baseGoerli, hardhat, optimismGoerli } from "viem/chains";
import type { EvmAddress } from "../types";

export type DeploymentChain = (typeof deploymentChains)[number];
export const deploymentChains = [baseGoerli, hardhat, optimismGoerli] as const;
export const deploymentChainIds = deploymentChains.map((c) => c.id);

export const hubDeployments: Record<
  (typeof deploymentChainIds)[number],
  EvmAddress
> = {
  84531: "0x4a07b0728F9F52a64fD18C00C96a8a2bA5e34311",
  31337: "0x5fbdb2315678afecb367f032d93f642f64180aa3",
  420: "0x035b1a820a7C984Bf6BAd3C4C964E30fbe3a5C84",
};

export const partnerAlarmClockContractTemplates = {
  420: "0xc23d0a83d95a3F628943A0a64bD054e82009a1Cc",
};
