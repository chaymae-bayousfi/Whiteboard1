import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/utils';

interface DropdownProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  align?: 'left' | 'right';
}

export function Dropdown({ trigger, children, align = 'left' }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef} className="relative">
      <div onClick={() => setIsOpen(!isOpen)}>{trigger}</div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.15 }}
            className={cn(
              'absolute z-50 mt-2 min-w-[200px] py-2',
              'bg-white rounded-xl shadow-lg border border-gray-100',
              align === 'left' ? 'left-0' : 'right-0'
            )}
            onClick={() => setIsOpen(false)}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface DropdownItemProps {
  icon?: React.ReactNode;
  label: string;
  onClick?: () => void;
  variant?: 'default' | 'danger';
  disabled?: boolean;
}

export function DropdownItem({
  icon,
  label,
  onClick,
  variant = 'default',
  disabled = false,
}: DropdownItemProps) {
  return (
    <button
      className={cn(
        'w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors text-left',
        'hover:bg-gray-50',
        variant === 'danger' && 'text-red-600 hover:bg-red-50',
        variant === 'default' && 'text-gray-700',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
      onClick={onClick}
      disabled={disabled}
    >
      {icon && <span className={cn('w-4 h-4', variant === 'danger' && 'text-red-500')}>{icon}</span>}
      {label}
    </button>
  );
}

interface DropdownMenuProps {
  trigger: React.ReactNode;
  items: DropdownItemProps[];
  align?: 'left' | 'right';
}

export function DropdownMenu({ trigger, items, align = 'left' }: DropdownMenuProps) {
  return (
    <Dropdown trigger={trigger} align={align}>
      {items.map((item, index) => (
        <DropdownItem key={index} {...item} />
      ))}
    </Dropdown>
  );
}

export function DropdownDivider() {
  return <div className="my-2 border-t border-gray-100" />;
}
