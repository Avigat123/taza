import { createContext, useContext, useState } from "react";

const PageHeaderContext = createContext(null);

export function PageHeaderProvider({ children }) {
  const [header, setHeaderState] = useState({ title: "", subtitle: "" });

  function setHeader(title, subtitle) {
    setHeaderState((prev) => (prev.title === title && prev.subtitle === subtitle ? prev : { title, subtitle }));
  }

  return (
    <PageHeaderContext.Provider value={{ ...header, setHeader }}>{children}</PageHeaderContext.Provider>
  );
}

export function usePageHeader() {
  const ctx = useContext(PageHeaderContext);
  if (!ctx) throw new Error("usePageHeader must be used within PageHeaderProvider");
  return ctx;
}
