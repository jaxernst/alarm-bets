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
  420: "0xa38A60Ac4291A6474BE2cca2cd10d6b49589D790",
};

export const partnerAlarmClockContractTemplates = {
  420: "0x9F2Cc4a92FCA405FcFA5aC99F2E8a197738c2Ada",
};

export const deploymentBlockNumbers: Record<
  (typeof deploymentChainIds)[number],
  number
> = {
  31337: 0,
  420: 15222027,
};
