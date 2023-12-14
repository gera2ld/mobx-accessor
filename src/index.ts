import { makeAutoObservable, toJS } from 'mobx';

const symbolState = Symbol('mobxAccessorState');

type DropFirst<T extends unknown[]> = T extends [any, ...infer U] ? U : never;

type MutationHandler<S> = (state: S, payload?: any) => void;
type GetterHandler<S> = (state: S, getters?: any) => any;

type Getters<S, G extends { [key: string]: GetterHandler<S> }> = {
  [P in keyof G]: ReturnType<G[P]>;
};
type Mutations<S, M extends { [key: string]: MutationHandler<S> }> = {
  [P in keyof M]: (...args: DropFirst<Parameters<M[P]>>) => ReturnType<M[P]>;
};
type InjectStore<
  S,
  G extends { [key: string]: (state: S) => any },
  M extends { [key: string]: MutationHandler<S> },
> = {
  state: S;
  getters: Getters<S, G>;
  mutations: Mutations<S, M>;
};

type ActionHandler<
  S,
  G extends { [key: string]: GetterHandler<S> },
  M extends { [key: string]: MutationHandler<S> },
> = (store: InjectStore<S, G, M>, payload?: any) => any;
type Actions<
  S,
  G extends { [key: string]: GetterHandler<S> },
  M extends { [key: string]: MutationHandler<S> },
  A extends {
    [key: string]: ActionHandler<S, G, M>;
  },
> = {
  [P in keyof A]: (...args: DropFirst<Parameters<A[P]>>) => ReturnType<A[P]>;
};
type Accessor<
  S,
  G extends { [key: string]: GetterHandler<S> },
  M extends { [key: string]: MutationHandler<S> },
  A extends {
    [key: string]: ActionHandler<S, G, M>;
  },
> = S & Getters<S, G> & Mutations<S, M> & Actions<S, G, M, A>;

export const getterTree = <S, T extends { [key: string]: GetterHandler<S> }>(
  _: { state: () => S },
  tree: T,
): T => tree;

export const mutationTree = <
  S,
  T extends { [key: string]: MutationHandler<S> },
>(
  _: { state: () => S },
  tree: T,
): T => tree;

export const actionTree = <
  S,
  G extends { [key: string]: GetterHandler<S> },
  M extends { [key: string]: MutationHandler<S> },
  T extends {
    [key: string]: (
      store: {
        state: S;
        getters: Getters<S, G>;
        mutations: Mutations<S, M>;
      },
      payload?: any,
    ) => any;
  },
>(
  _: { state: () => S; getters?: G; mutations?: M },
  tree: T,
): T => tree;

function makeProxy(target: unknown, keys: string[], set = false) {
  return Object.defineProperties(
    {},
    Object.fromEntries(
      keys.map((key) => [
        key,
        {
          get() {
            return target[key];
          },
          set: set
            ? (value) => {
                target[key] = value;
              }
            : undefined,
        },
      ]),
    ),
  );
}

/**
 * `mobx` will make such an object observable:
 *
 * ```js
 * {
 *   // ordinary properties as states
 *   state1 = 0,
 *   state2 = [1, 2, 3],
 *
 *   // getters as computed properties
 *   get total() {
 *     return this.state1 + this.state2;
 *   }
 *
 *   // functions as actions
 *   increase() {
 *     this.state1++
 *   }
 * }
 * ```
 *
 * So all we need is to build such an object for `mobx` to consume.
 * All fields on this object must be configurable so that `mobx` can convert them.
 *
 * Finally we will get an object with all states, getters, actions and mutations.
 *
 * There is no difference between `actions` and `mutations` from the perspective of `mobx`.
 * But `mobx` cannot detect changes in a different tick, e.g. after `await`.
 *
 * So we separate them into two concepts to better support reactivity in async scenarios:
 *
 * - `mutations`: always synchronous, can modify `state` directly, don't dispatch actions or call other mutations.
 * - `actions`: do not modify `state` directly, can access all properties
 */
export function makeAccessor<
  S,
  G extends { [key: string]: GetterHandler<S> },
  M extends { [key: string]: MutationHandler<S> },
  A extends {
    [key: string]: ActionHandler<S, G, M>;
  },
>({
  state,
  getters,
  mutations,
  actions,
}: {
  state: () => S;
  getters?: G;
  mutations?: M;
  actions?: A;
}) {
  const stateData = makeAutoObservable(state() as object) as S;
  const stateKeys = Object.keys(stateData as object);

  const accessor = makeAutoObservable(
    Object.defineProperties(
      {
        ...(mutations &&
          (Object.fromEntries(
            Object.entries(mutations).map(([key, mutate]) => [
              key,
              function value(...args: any[]) {
                return mutate(stateData, ...args);
              },
            ]),
          ) as unknown as Mutations<S, M>)),

        ...(actions &&
          Object.fromEntries(
            Object.entries(actions).map(([key, action]) => [
              key,
              function value(this: Accessor<S, G, M, A>, ...args: any[]) {
                return action(
                  {
                    state: stateProxy,
                    getters: getterProxy,
                    mutations: mutationProxy,
                  },
                  ...args,
                );
              },
            ]),
          )),
      },

      // convert getter definitions into real getters
      // Note: `configurable` must be `true` for `mobx` to process the getters
      Object.fromEntries([
        ...stateKeys.map((key) => [
          key,
          {
            get() {
              return stateData[key];
            },
            configurable: true,
          },
        ]),

        ...Object.entries(getters || {}).map(([key, getter]) => [
          key,
          {
            get() {
              return getter(stateProxy, getterProxy);
            },
            configurable: true,
          },
        ]),
      ]),
    ),
  ) as Accessor<S, G, M, A>;

  const stateProxy = makeProxy(stateData, stateKeys) as S;
  const getterProxy = makeProxy(
    accessor,
    Object.keys(getters || {}),
  ) as Getters<S, G>;
  const mutationProxy = makeProxy(
    accessor,
    Object.keys(mutations || {}),
    true,
  ) as Mutations<S, M>;

  (accessor as any)[symbolState] = stateData;

  return accessor;
}

export function dumpState<
  S,
  G extends { [key: string]: GetterHandler<S> },
  M extends { [key: string]: MutationHandler<S> },
  A extends {
    [key: string]: ActionHandler<S, G, M>;
  },
>(accessor: Accessor<S, G, M, A>) {
  const stateData = (accessor as any)[symbolState];
  return toJS(stateData);
}

export function loadState<
  S,
  G extends { [key: string]: GetterHandler<S> },
  M extends { [key: string]: MutationHandler<S> },
  A extends {
    [key: string]: ActionHandler<S, G, M>;
  },
>(accessor: Accessor<S, G, M, A>, state: S) {
  const stateData = (accessor as any)[symbolState];
  Object.keys(stateData).forEach(key => {
    stateData[key] = state[key];
  });
}
