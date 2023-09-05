import { writable } from "svelte/store";

export type Tab = "alarms" | "new" | "join";
export const activeTab = writable<Tab>("alarms");

export const showWelcome = writable(true);
export const welcomeHasBeenViewed = writable(false);
