import { base, baseGoerli, hardhat, optimismGoerli } from "viem/chains";
import type { EvmAddress } from "../types";

export type DeploymentChain = (typeof deploymentChains)[number];
export const deploymentChains = [hardhat, optimismGoerli, base] as const;
export const deploymentChainIds = deploymentChains.map((c) => c.id);

export const hubDeployments: Record<
  (typeof deploymentChainIds)[number],
  EvmAddress
> = {
  31337: "0x5fbdb2315678afecb367f032d93f642f64180aa3",
  420: "0xe36a39e59e4Cd17E0922E8d7c1209606abda0186",
  8453: "0x61d68465f88b9DE628D5d0Cbac12A5B8c5E4E236",
};

export const partnerAlarmClockContractTemplates = {
  420: "0x847cc5099d86e931216cDb8B3eCBC5acB354420e",
  8453: "0xEAf85983c5C39DC7cEaCfBcE5B0D9874EeaF86c4",
};
