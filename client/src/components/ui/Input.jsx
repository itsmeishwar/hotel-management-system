export function Input({ label, error, className = '', id, ...props }) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className={className}>
      {label && (
        <label htmlFor={inputId} className="block text-sm text-ink-muted mb-1">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`w-full px-3 py-2 text-sm bg-white border rounded-md transition-colors
          ${error ? 'border-terracotta' : 'border-cream-300 focus:border-olive'}
          placeholder:text-ink-faint`}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-terracotta">{error}</p>}
    </div>
  );
}
