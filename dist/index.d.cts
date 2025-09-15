import { Context } from 'react';

/**
 * Selector function type: picks slice S from full state T.
 */
type Selector<T, S> = (state: T) => S;
/**
 * Store interface that gets passed through React Context.
 */
interface StoreApi<T> {
    getSnapshot: () => T;
    subscribe: (listener: () => void, selector: Selector<T, any>) => () => void;
}
/**
 * Hook: Creates a stable store reference for any value that can be passed to React Context.
 * The store reference never changes - only the internal state updates.
 * Only notifies listeners whose selected slice actually changed.
 */
declare function useContextStore<T>(value: T): StoreApi<T>;
/**
 * Hook: select a slice from context store with shallow equality.
 * Only re-renders when the selected slice actually changes.
 */
declare function useShallowSelector<T, S>(context: Context<StoreApi<T> | null>, selector: Selector<T, S>): S;

export { type Selector, type StoreApi, useContextStore, useShallowSelector };
