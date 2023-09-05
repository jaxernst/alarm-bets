import { writable } from "svelte/store";

export const displayedAlarmId = writable<number | undefined>();
export const showEndAlarmModal = writable<boolean>(false);
