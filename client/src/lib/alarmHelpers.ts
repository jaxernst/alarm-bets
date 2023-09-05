import { getAbiItem, encodeAbiParameters, parseAbiParameters } from 'viem';
import {
	getPublicClient,
	prepareWriteContract,
	writeContract,
	readContract,
	multicall
} from '@wagmi/core';
import type { UserAlarm } from './contractStores';
import {
	type AlarmType,
	type InitializationTypes,
	alarmTypeVals,
	solidityNamedInitTypes,
	AlarmStatus
} from '@sac/contracts/lib/types';

import HubAbi from './abi/SocialAlarmClockHub';
import PartnerAlarmClock from './abi/PartnerAlarmClock';
import type { EvmAddress } from './types';
import { get } from 'svelte/store';
import { deploymentBlockNumbers } from './deployments';

export const AlarmCreationEvent = getAbiItem({
	abi: HubAbi,
	name: 'AlarmCreation'
});

export const AlarmJoinedEvent = getAbiItem({ abi: HubAbi, name: 'UserJoined' });

export const getAlarmById = async (id: string | number, hubAddress: EvmAddress) => {
	const alarmAddr = await readContract({
		address: hubAddress,
		abi: HubAbi,
		functionName: 'alarms',
		args: [BigInt(id)]
	});

	return alarmAddr;
};

export const getAlarmConstants = async (alarmAddress: EvmAddress) => {
	const args = { address: alarmAddress, abi: PartnerAlarmClock };
	const res = await multicall({
		contracts: [
			{ ...args, functionName: 'alarmTime' },
			{ ...args, functionName: 'alarmDays' },
			{ ...args, functionName: 'betAmount' },
			{ ...args, functionName: 'player1' },
			{ ...args, functionName: 'player2' },
			{ ...args, functionName: 'missedAlarmPenalty' },
			{ ...args, functionName: 'submissionWindow' }
		],
		allowFailure: false
	});

	return {
		alarmTime: res[0],
		alarmDays: res[1],
		betAmount: res[2],
		player1: res[3],
		player2: res[4],
		missedAlarmPenalty: res[5],
		submissionWindow: res[6]
	};
};

export const getAlarmState = async (
	alarmAddress: EvmAddress,
	targetPlayer: EvmAddress,
	p1: EvmAddress,
	p2: EvmAddress
) => {
	const args = { address: alarmAddress, abi: PartnerAlarmClock };

	const [
		timeToNextDeadline,
		p1Missed,
		p2Missed,
		p1Confirms,
		p2Confirms,
		p1Balance,
		p2Balance,
		p1Timezone,
		p2Timezone
	] = await multicall({
		contracts: [
			{
				...args,
				functionName: 'timeToNextDeadline',
				args: [targetPlayer === p1 ? p1 : p2]
			},
			{ ...args, functionName: 'missedDeadlines', args: [p1] },
			{ ...args, functionName: 'missedDeadlines', args: [p2] },
			{ ...args, functionName: 'numConfirmations', args: [p1] },
			{ ...args, functionName: 'numConfirmations', args: [p2] },
			{ ...args, functionName: 'getPlayerBalance', args: [p1] },
			{ ...args, functionName: 'getPlayerBalance', args: [p2] },
			{ ...args, functionName: 'playerTimezone', args: [p1] },
			{ ...args, functionName: 'playerTimezone', args: [p2] }
		],
		allowFailure: false
	});

	return {
		timeToNextDeadline,
		player1MissedDeadlines: p1Missed,
		player2MissedDeadlines: p2Missed,
		player1Confirmations: p1Confirms,
		player2Confirmations: p2Confirms,
		player1Balance: p1Balance,
		player2Balance: p2Balance,
		player1Timezone: p1Timezone,
		player2Timezone: p2Timezone
	};
};

export const getBetStanding = (alarmStore: UserAlarm, targetPlayer: EvmAddress) => {
	const alarm = get(alarmStore);
	if (!alarm.missedAlarmPenalty) return 0n;

	let otherPlayer;
	let urMissedDeadlines: bigint = 0n;
	let theirMissedDeadlines: bigint = 0n;
	if (targetPlayer === alarm.player1) {
		otherPlayer = alarm.player2;
		urMissedDeadlines = alarm.player1MissedDeadlines ?? 0n;
		theirMissedDeadlines = alarm.player2MissedDeadlines ?? 0n;
	} else if (targetPlayer === alarm.player2) {
		otherPlayer = alarm.player1;
		urMissedDeadlines = alarm.player2MissedDeadlines ?? 0n;
		theirMissedDeadlines = alarm.player1MissedDeadlines ?? 0n;
	} else {
		throw new Error('Invariant error');
	}

	return alarm.missedAlarmPenalty * (theirMissedDeadlines - urMissedDeadlines);
};

export const getOtherPlayer = async (alarmAddress: EvmAddress, userAddress: EvmAddress) => {
	const player1 = await getPlayer(alarmAddress, 1);
	if (player1 === userAddress) return player1;

	const player2 = await getPlayer(alarmAddress, 2);
	if (player2 === userAddress) return player2;

	throw new Error('Other player not found');
};

export const getPlayer = async (alarmAddress: EvmAddress, player: 1 | 2) => {
	return await readContract({
		address: alarmAddress,
		abi: PartnerAlarmClock,
		functionName: player === 1 ? 'player1' : 'player2'
	});
};

export const getPlayerBalance = async (alarmAddress: EvmAddress, player: EvmAddress) => {
	return await readContract({
		address: alarmAddress,
		abi: PartnerAlarmClock,
		functionName: 'getPlayerBalance',
		args: [player]
	});
};

export const getMissedDeadlines = async (alarmAddress: EvmAddress, userAddress: EvmAddress) => {
	return await readContract({
		address: alarmAddress,
		abi: PartnerAlarmClock,
		functionName: 'missedDeadlines',
		args: [userAddress]
	});
};

export const getTimeToNextDeadline = async (alarmAddress: EvmAddress, player: EvmAddress) => {
	return await readContract({
		address: alarmAddress,
		abi: PartnerAlarmClock,
		functionName: 'timeToNextDeadline',
		args: [player]
	});
};

export const getNumConfirmations = async (alarmAddress: EvmAddress, player: EvmAddress) => {
	return await readContract({
		address: alarmAddress,
		abi: PartnerAlarmClock,
		functionName: 'numConfirmations',
		args: [player]
	});
};

export const getMissedAlarmPenalty = async (alarmAddress: EvmAddress) => {
	return await readContract({
		address: alarmAddress,
		abi: PartnerAlarmClock,
		functionName: 'missedAlarmPenalty'
	});
};

export const getBetAmount = async (alarmAddress: EvmAddress) => {
	return await readContract({
		address: alarmAddress,
		abi: PartnerAlarmClock,
		functionName: 'betAmount'
	});
};

export const getPlayerTimezone = async (alarmAddress: EvmAddress, player: EvmAddress) => {
	return await readContract({
		address: alarmAddress,
		abi: PartnerAlarmClock,
		functionName: 'playerTimezone',
		args: [player]
	});
};

export const getStatus = async (alarmAddress: EvmAddress) => {
	return await readContract({
		address: alarmAddress,
		abi: PartnerAlarmClock,
		functionName: 'status'
	});
};

export async function createAlarm<T extends AlarmType>(
	hubAddress: EvmAddress,
	type: T,
	initData: InitializationTypes[T],
	value?: bigint
) {
	console.log(initData);
	const byteData = encodeCreationParams(type, initData);
	const { request } = await prepareWriteContract({
		address: hubAddress,
		abi: HubAbi,
		functionName: 'createAlarm',
		args: [alarmTypeVals[type], byteData],
		value: value ? value : BigInt(0)
	});

	return (await writeContract(request)).hash;
}

export async function startAlarm(alarmAddress: EvmAddress, timezoneOffsetHrs: number) {
	if (timezoneOffsetHrs < -12 || timezoneOffsetHrs > 12) {
		throw new Error('Invalid timezone offset');
	}

	const betAmount = await getBetAmount(alarmAddress);
	const { request } = await prepareWriteContract({
		address: alarmAddress,
		abi: PartnerAlarmClock,
		functionName: 'start',
		args: [BigInt(timezoneOffsetHrs * 60 * 60)],
		value: betAmount
	});

	return (await writeContract(request)).hash;
}

export async function endAlarm(alarmAddress: EvmAddress) {
	const { request } = await prepareWriteContract({
		address: alarmAddress,
		abi: PartnerAlarmClock,
		functionName: 'withdraw'
	});

	return (await writeContract(request)).hash;
}

export async function addToBalance(
	alarmAddress: EvmAddress,
	playerAddress: EvmAddress,
	amount: bigint
) {
	const { request } = await prepareWriteContract({
		address: alarmAddress,
		abi: PartnerAlarmClock,
		functionName: 'addToBalance',
		args: [playerAddress],
		value: amount
	});
	return (await writeContract(request)).hash;
}

export async function submitConfirmation(alarmAddress: EvmAddress) {
	const { request } = await prepareWriteContract({
		address: alarmAddress,
		abi: PartnerAlarmClock,
		functionName: 'submitConfirmation'
	});

	return (await writeContract(request)).hash;
}

export function encodeCreationParams<T extends AlarmType>(
	alarmType: T,
	initData: InitializationTypes[T]
) {
	const parsedParameters = parseAbiParameters(solidityNamedInitTypes[alarmType].join(', '));

	return encodeAbiParameters(parsedParameters, Object.values(initData));
}

export type AlarmBaseInfo = {
	id: number;
	contractAddress: EvmAddress;
	creationBlock: number;
	status: AlarmStatus;
};

/**
 * Get user alarms by type along with their current status
 */
export async function getUserAlarmsByType<T extends AlarmType>(
	hubAddress: EvmAddress,
	userAddress: EvmAddress,
	type: T
) {
	const creationEvents = await queryAlarmCreationEvents(hubAddress, userAddress, type);

	const joinEvents = await queryUserJoinedEvents(hubAddress, userAddress, type);

	if (!creationEvents) return;

	/**
	 * Get alarm indentification info
	 */
	const alarms: Omit<AlarmBaseInfo, 'status'>[] = [];
	for (const { args, blockNumber } of [...creationEvents, ...joinEvents]) {
		if (!args.id || !args.alarmAddr || !args.user || !blockNumber) {
			throw new Error('Bad event query');
		}

		alarms.push({
			id: Number(args.id),
			contractAddress: args.alarmAddr,
			creationBlock: Number(blockNumber)
		});
	}

	/**
	 * Batch query alarm statuses
	 */
	const statusQueryRes = await multicall({
		contracts: alarms.map(({ contractAddress }) => ({
			address: contractAddress,
			abi: PartnerAlarmClock,
			functionName: 'status'
		})),
		allowFailure: false
	});

	return alarms.reduce<Record<number, AlarmBaseInfo>>((acc, alarm, i) => {
		acc[alarm.id] = {
			...alarm,
			status: statusQueryRes[i]
		};
		return acc;
	}, {});
}

export async function queryAlarmCreationEvents(
	hubAddress: EvmAddress,
	userAddress: EvmAddress,
	alarmType?: AlarmType
) {
	const client = getPublicClient();
	const deploymentBlock = (deploymentBlockNumbers as any)[client.chain.id] ?? 0;

	return await client.getLogs({
		address: hubAddress,
		event: AlarmCreationEvent,
		args: {
			_type: alarmType ? alarmTypeVals[alarmType] : 0,
			user: userAddress
		},
		fromBlock: BigInt(deploymentBlock),
		toBlock: 'latest'
	});
}

export async function queryUserJoinedEvents(
	hubAddress: EvmAddress,
	userAddress: EvmAddress,
	alarmType?: AlarmType
) {
	const client = getPublicClient();
	const deploymentBlock = (deploymentBlockNumbers as any)[client.chain.id] ?? 0;

	return await client.getLogs({
		address: hubAddress,
		event: AlarmJoinedEvent,
		args: {
			user: userAddress,
			_type: alarmType ? alarmTypeVals[alarmType] : 0
		},
		fromBlock: BigInt(deploymentBlock),
		toBlock: 'latest'
	});
}
