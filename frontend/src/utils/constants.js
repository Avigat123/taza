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
  { label: "Dashboard", path: "/", icon: "LayoutDashboard" },
  { label: "Inspect Produce", path: "/inspect", icon: "ScanLine" },
  { label: "Batches", path: "/batches", icon: "Boxes" },
  { label: "Recommendations", path: "/recommendations", icon: "ListChecks" },
  { label: "Traceability", path: "/traceability", icon: "QrCode" },
  { label: "Ops Agent", path: "/agent", icon: "Sparkles" },
];
