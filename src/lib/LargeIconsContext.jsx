import { createContext, useContext, useState } from "react";

const LargeIconsContext = createContext(null);

export function LargeIconsProvider({ children }) {
  const [largeIcons, setLargeIcons] = useState(() => localStorage.getItem("homelife_large_icons") === "true");

  function toggle() {
    setLargeIcons(v => {
      const next = !v;
      localStorage.setItem("homelife_large_icons", String(next));
      return next;
    });
  }

  return (
    <LargeIconsContext.Provider value={{ largeIcons, toggle }}>
      {children}
    </LargeIconsContext.Provider>
  );
}

export function useLargeIcons() {
  return useContext(LargeIconsContext);
}