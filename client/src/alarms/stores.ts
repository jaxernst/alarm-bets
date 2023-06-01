import { writable } from "svelte/store";

export const displayedAlarmId = writable<number | null>(null);
export const showEndAlarmModal = writable<boolean>(false);
