import type { EvmAddress } from '$lib/types';
import type { RequestEvent } from '@sveltejs/kit';

type UpdateAlarmParams = {
	alarmId: string;
	userAddress: EvmAddress;
	alarmAddress: EvmAddress;
	alarmTime: string;
};

/**
 * Update cached user alarm data
 * TODO: Make this an authenticated route so alarm data can only be updated by
 * a signed in wallet
 * */
export function POST({ params }: RequestEvent<UpdateAlarmParams>) {
	const { alarmId, userAddress, alarmAddress, alarmTime } = params;
}

/**
 * Query cached user alarm data, if none exists query the blockchain for this data
 */
export function GET({ params }: RequestEvent) {}
