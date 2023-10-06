import { EnumMember, EnumType, UnionType } from "typescript";

type ListenerFunction<T> = (data: T) => void;

export class Publisher<EventTypes extends Record<string, any>> {
  private subscribers: Partial<
    Record<keyof EventTypes, ListenerFunction<any>[]>
  > = {};

  subscribe<T extends keyof EventTypes>(
    eventType: T,
    listener: ListenerFunction<EventTypes[T]>
  ): void {
    if (!this.subscribers[eventType]) {
      this.subscribers[eventType] = [];
    }

    this.subscribers[eventType]?.push(listener);
  }

  publish<T extends keyof EventTypes>(eventType: T, data: EventTypes[T]): void {
    (this.subscribers[eventType] || []).forEach((listener) => listener(data));
  }
}
