import { cn } from '@/utils';

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  size?: 'sm' | 'md';
}

export function Toggle({
  checked,
  onChange,
  label,
  disabled = false,
  size = 'md',
}: ToggleProps) {
  const sizes = {
    sm: { toggle: 'w-8 h-5', thumb: 'w-3 h-3', translate: 'translate-x-3.5' },
    md: { toggle: 'w-11 h-6', thumb: 'w-5 h-5', translate: 'translate-x-5' },
  };

  const s = sizes[size];

  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative inline-flex shrink-0 rounded-full transition-colors duration-200',
          s.toggle,
          checked ? 'bg-blush-500' : 'bg-gray-200',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <span
          className={cn(
            'inline-block rounded-full bg-white shadow-sm transform transition-transform duration-200',
            s.thumb,
            'm-0.5',
            checked && s.translate
          )}
        />
      </button>
      {label && (
        <span
          className={cn(
            'text-sm text-gray-700',
            disabled && 'opacity-50'
          )}
        >
          {label}
        </span>
      )}
    </label>
  );
}
