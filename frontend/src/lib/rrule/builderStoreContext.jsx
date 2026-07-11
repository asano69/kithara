// Optional sharing layer for createBuilderStore(). Most screens only need
// one <RRuleBuilder> and can ignore this entirely — Stage 3's RRuleBuilder
// will call createBuilderStore() directly. This exists only for the case
// where a sibling component (e.g. an external validation panel) needs
// access to the same store without prop drilling.

import { createContext, useContext } from "solid-js";
import { createBuilderStore } from "./builderStore";

const BuilderStoreContext = createContext();

export function BuilderStoreProvider(props) {
  const store = createBuilderStore();
  return (
    <BuilderStoreContext.Provider value={store}>
      {props.children}
    </BuilderStoreContext.Provider>
  );
}

// Returns the store from the nearest BuilderStoreProvider, or creates a
// fresh independent one if there isn't one. Safe to call directly in a
// component's setup code: Solid components run their setup once, so this
// doesn't recreate the store on every reactive update (unlike React, this
// needs no useRef trick).
export function useBuilderStoreContext() {
  return useContext(BuilderStoreContext) ?? createBuilderStore();
}

export { BuilderStoreContext };
