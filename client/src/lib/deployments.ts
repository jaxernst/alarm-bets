import { base, hardhat, optimismGoerli, optimism } from 'viem/chains';
import type { EvmAddress } from './types';

export type DeploymentChain = (typeof deploymentChains)[number];
export const deploymentChains = [hardhat, optimismGoerli] as const;
export const deploymentChainIds = deploymentChains.map((c) => c.id);

export const hubDeployments: Record<(typeof deploymentChainIds)[number], EvmAddress> = {
	31337: '0x5fbdb2315678afecb367f032d93f642f64180aa3',
	420: '0x345d6532B3542bE064407C31Eb8d7cBa4033Cd36'
};

export const partnerAlarmClockContractTemplates = {
	420: '0x847cc5099d86e931216cDb8B3eCBC5acB354420e'
};

export const deploymentBlockNumbers: Record<(typeof deploymentChainIds)[number], number> = {
	31337: 0,
	420: 15222027
};
