import { writable } from "svelte/store";

export const displayedAlarmId = writable<string | null>(null);
