const variants = {
  primary: "bg-brand-700 text-white hover:bg-brand-900",
  secondary: "bg-white text-ink border border-border hover:bg-brand-50",
  ghost: "bg-transparent text-muted hover:bg-brand-50 hover:text-ink",
  danger: "bg-risk-high text-white hover:opacity-90",
};

const sizes = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-sm",
  lg: "px-5 py-2.5 text-base",
};

export default function Button({
  children,
  variant = "primary",
  size = "md",
  icon: Icon,
  className = "",
  ...props
}) {
  return (
    <button
      className={`inline-flex items-center gap-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {Icon && <Icon size={16} />}
      {children}
    </button>
  );
}
