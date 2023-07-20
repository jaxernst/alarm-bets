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
  420: "0x43c9118ba7B885d39d5d489F1fb5591bc09e6e6a",
};
