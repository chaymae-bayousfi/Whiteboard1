import { cn } from '@/utils';
import { Check } from 'lucide-react';

interface ColorPickerProps {
  colors: readonly string[];
  selectedColor: string;
  onChange: (color: string) => void;
  label?: string;
  size?: 'sm' | 'md';
}

export function ColorPicker({
  colors,
  selectedColor,
  onChange,
  label,
  size = 'md',
}: ColorPickerProps) {
  const sizes = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
  };

  return (
    <div>
      {label && (
        <p className="text-xs font-medium text-gray-500 mb-2">{label}</p>
      )}
      <div className="flex flex-wrap gap-1.5">
        {colors.map((color) => (
          <button
            key={color}
            type="button"
            className={cn(
              'rounded-lg transition-all duration-200 border-2',
              sizes[size],
              selectedColor === color
                ? 'border-blush-400 shadow-sm scale-105'
                : 'border-transparent hover:border-gray-200'
            )}
            style={{
              backgroundColor: color === 'transparent' ? '#f9fafb' : color,
              backgroundImage:
                color === 'transparent'
                  ? 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)'
                  : undefined,
              backgroundSize: '6px 6px',
              backgroundPosition: '0 0, 0 3px, 3px -3px, -3px 0px',
            }}
            onClick={() => onChange(color)}
          >
            {selectedColor === color && (
              <Check
                className={cn(
                  'w-3 h-3 m-auto',
                  color === '#FFFFFF' || color === 'transparent'
                    ? 'text-gray-600'
                    : 'text-white'
                )}
              />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
