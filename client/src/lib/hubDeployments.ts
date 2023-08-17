import { baseGoerli, hardhat, optimismGoerli } from "viem/chains";
import type { EvmAddress } from "../types";

export type DeploymentChain = (typeof deploymentChains)[number];
export const deploymentChains = [hardhat, optimismGoerli] as const;
export const deploymentChainIds = deploymentChains.map((c) => c.id);

export const hubDeployments: Record<
  (typeof deploymentChainIds)[number],
  EvmAddress
> = {
  31337: "0x5fbdb2315678afecb367f032d93f642f64180aa3",
  420: "0xe36a39e59e4Cd17E0922E8d7c1209606abda0186",
};

export const partnerAlarmClockContractTemplates = {
  420: "0x847cc5099d86e931216cDb8B3eCBC5acB354420e",
};
