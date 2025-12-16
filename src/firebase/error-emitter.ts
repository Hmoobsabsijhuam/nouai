'use client';

import { FirestorePermissionError } from '@/firebase/errors';

/**
 * Defines the shape of all possible application-wide events and their corresponding payload types.
 * This interface centralizes event definitions, ensuring type safety and discoverability
 * for all emitted events and their listeners.
 */
export interface AppEvents {
  'permission-error': FirestorePermissionError;
}

/**
 * A generic type for a callback function that handles an event.
 * @template T The type of the data payload for the event.
 */
type Callback<T> = (data: T) => void;

/**
 * Creates a strongly-typed pub/sub event emitter.
 * This factory function returns an emitter instance that is constrained by the
 * provided generic type `T`, which maps event names to their payload types.
 *
 * @template T A record mapping event names (string keys) to their payload types.
 * @returns An object with `on`, `off`, and `emit` methods for event handling.
 */
function createEventEmitter<T extends Record<string, any>>() {
  // The `events` object stores arrays of callbacks, keyed by event name.
  // The use of mapped types ensures that a callback for a specific event
  // always receives a payload of the correct type.
  const events: { [K in keyof T]?: Array<Callback<T[K]>> } = {};

  return {
    /**
     * Subscribes to an event.
     * @param eventName The name of the event to subscribe to.
     * @param callback The function to be executed when the event is emitted.
     */
    on<K extends keyof T>(eventName: K, callback: Callback<T[K]>) {
      if (!events[eventName]) {
        events[eventName] = [];
      }
      events[eventName]?.push(callback);
    },

    /**
     * Unsubscribes from an event.
     * @param eventName The name of the event to unsubscribe from.
     * @param callback The specific callback function to remove.
     */
    off<K extends keyof T>(eventName: K, callback: Callback<T[K]>) {
      if (!events[eventName]) {
        return;
      }
      events[eventName] = events[eventName]?.filter(cb => cb !== callback);
    },

    /**
     * Publishes an event, triggering all subscribed callbacks.
     * @param eventName The name of the event to emit.
     * @param data The data payload that corresponds to the event's type.
     */
    emit<K extends keyof T>(eventName: K, data: T[K]) {
      if (!events[eventName]) {
        return;
      }
      events[eventName]?.forEach(callback => callback(data));
    },
  };
}

/**
 * A singleton instance of the event emitter, typed with the `AppEvents` interface.
 * This exported emitter is used throughout the application to handle global errors
 * and other cross-cutting concerns in a decoupled manner.
 */
export const errorEmitter = createEventEmitter<AppEvents>();
