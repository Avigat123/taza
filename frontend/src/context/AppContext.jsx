import { createContext, useContext, useState } from "react";

const AppContext = createContext(null);

export const ROLES = {
  FARMER: "farmer",
  AGGREGATOR: "aggregator",
  PACK_HOUSE: "pack-house",
  MANDI: "mandi",
  WAREHOUSE: "warehouse",
  COLD_CHAIN: "cold-chain",
  RETAILER: "retailer",
  CONSUMER: "consumer",
};

export const ROLE_LABELS = {
  [ROLES.FARMER]: "Farmer",
  [ROLES.AGGREGATOR]: "Aggregator",
  [ROLES.PACK_HOUSE]: "Pack House",
  [ROLES.MANDI]: "Mandi",
  [ROLES.WAREHOUSE]: "Warehouse",
  [ROLES.COLD_CHAIN]: "Cold Chain",
  [ROLES.RETAILER]: "Retailer",
  [ROLES.CONSUMER]: "Consumer",
};

export function AppProvider({ children }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem("taza_user");

      return savedUser
        ? JSON.parse(savedUser)
        : null;
    } catch {
      return null;
    }
  });

  const login = (role, userData = {}) => {
    const nextUser = {
      ...userData,
      role,
      roleLabel: ROLE_LABELS[role] || role,
    };

    setUser(nextUser);

    localStorage.setItem(
      "taza_user",
      JSON.stringify(nextUser)
    );

    return nextUser;
  };

  const logout = () => {
    setUser(null);

    localStorage.removeItem("taza_user");
  };

  const value = {
    sidebarCollapsed,

    toggleSidebar: () =>
      setSidebarCollapsed((value) => !value),

    user,

    role: user?.role || null,

    isAuthenticated: Boolean(user),

    login,

    logout,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);

  if (!context) {
    throw new Error(
      "useAppContext must be used within AppProvider"
    );
  }

  return context;
}