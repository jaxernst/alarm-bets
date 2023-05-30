import { writable } from "svelte/store";

export const displayedAlarmId = writable<number | null>(null);
