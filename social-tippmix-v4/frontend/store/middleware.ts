import { create, StateCreator, StoreMutatorIdentifier } from 'zustand'
import { persist, PersistOptions } from 'zustand/middleware'
import { devtools, DevtoolsOptions } from 'zustand/middleware'

// Middleware típus segédlet, hogy a TypeScript helyesen kezelje a kombinált middleware-eket
type ExtractState<S> = S extends { getState: () => infer X } ? X : never
type WithPersist<S extends object> = (
  config: StateCreator<S, [], []>,
  options: PersistOptions<S>
) => StateCreator<S>

type WithDevtools<S extends object> = (
  config: StateCreator<S, [], []>,
  options: DevtoolsOptions
) => StateCreator<S, [], []>

// Ez a segédfüggvény kombinált middleware használatát teszi lehetővé
export const createWithMiddleware = <
  T extends object,
  Mps extends [StoreMutatorIdentifier, unknown][] = []
>(
  initializer: StateCreator<T, [], Mps>,
  options: {
    name: string // Store neve, DevTools-ban jelenik meg
    persist?: boolean // Perzisztencia bekapcsolása
    devtools?: boolean // DevTools bekapcsolása
    partialize?: (state: T) => Partial<T> // Mit tároljon perzisztensen
  }
) => {
  let store = initializer

  // DevTools middleware hozzáadása
  if (options.devtools) {
    store = devtools(store, { name: options.name }) as typeof store
  }

  // Perzisztens tárolás hozzáadása
  if (options.persist) {
    store = persist(store, {
      name: `${options.name}-storage`,
      partialize: options.partialize
    }) as typeof store
  }

  return create(store)
}
