import { base, hardhat, optimismGoerli, optimism } from "viem/chains";
import type { EvmAddress } from "../../client/src/lib/types";

export type DeploymentChain = (typeof deploymentChains)[number];
export const deploymentChains = [hardhat, optimismGoerli] as const;
export const deploymentChainIds = deploymentChains.map((c) => c.id);

export const hubDeployments: Record<
  (typeof deploymentChainIds)[number],
  EvmAddress
> = {
  31337: "0x5fbdb2315678afecb367f032d93f642f64180aa3",
  420: "0x4eEFc0E9A80730fb5207Ea395036004350Dd30B1",
};

export const partnerAlarmClockContractTemplates = {
  420: "0xCe012c7310AE6BEecBAa49f727e4341607093F41",
};

export const deploymentBlockNumbers: Record<
  (typeof deploymentChainIds)[number],
  number
> = {
  31337: 0,
  420: 15222027,
};
