export function formatKg(value) {
  return `${Number(value).toLocaleString("en-IN")} kg`;
}

export function formatPercent(value, digits = 0) {
  return `${Number(value).toFixed(digits)}%`;
}

export function formatDays(value) {
  const v = Number(value);
  return `${v.toFixed(1)} day${v === 1 ? "" : "s"}`;
}

export function formatDate(dateStr) {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

export function formatCurrency(value) {
  return `₹${Number(value).toLocaleString("en-IN")}`;
}
