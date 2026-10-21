import { useSyncExternalStore } from 'react';

const emptySubscribe = () => () => {};

// `useSyncExternalStore` reads the server snapshot during SSR/hydration and
// the client snapshot afterwards, avoiding a hydration mismatch.
export function useClientOnlyValue<S, C>(server: S, client: C): S | C {
  return useSyncExternalStore<S | C>(
    emptySubscribe,
    () => client,
    () => server,
  );
}
