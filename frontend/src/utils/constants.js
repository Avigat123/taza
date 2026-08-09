export const PRODUCE_TYPES = [
  "Mango",
  "Tomato",
  "Banana",
  "Onion",
  "Papaya",
  "Grapes",
  "Spinach",
  "Potato",
];

export const ACTIONS = {
  SELL_LOCAL: "Sell locally",
  SHIP: "Ship to high-demand location",
  DISCOUNT: "Discount now",
  PROCESS: "Redirect to processing",
  MONITOR: "Monitor",
};

export const NAV_ITEMS = [
  { labelKey: "nav.dashboard", path: "/", icon: "LayoutDashboard" },
  { labelKey: "nav.inspect", path: "/inspect", icon: "ScanLine" },
  { labelKey: "nav.batches", path: "/batches", icon: "Boxes" },
  { labelKey: "nav.recommendations", path: "/recommendations", icon: "ListChecks" },
  { labelKey: "nav.traceability", path: "/traceability", icon: "QrCode" },
  { labelKey: "nav.agent", path: "/agent", icon: "Sparkles" },
];
