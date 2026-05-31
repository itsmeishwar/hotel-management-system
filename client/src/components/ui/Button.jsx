export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled,
  type = 'button',
  ...props
}) {
  const base =
    'inline-flex items-center justify-center font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary: 'bg-olive text-white hover:bg-olive-dark',
    secondary: 'bg-white text-ink border border-cream-300 hover:bg-cream-50',
    danger: 'bg-terracotta text-white hover:bg-terracotta-light',
    ghost: 'text-ink-muted hover:text-ink hover:bg-cream-100'
  };

  const sizes = {
    sm: 'text-xs px-2.5 py-1.5 rounded',
    md: 'text-sm px-4 py-2 rounded-md',
    lg: 'text-sm px-5 py-2.5 rounded-md'
  };

  return (
    <button
      type={type}
      disabled={disabled}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
