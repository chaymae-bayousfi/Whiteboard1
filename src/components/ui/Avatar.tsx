import { User } from 'lucide-react';
import { cn, getInitials } from '@/utils';

interface AvatarProps {
  src?: string;
  alt?: string;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  color?: string;
  className?: string;
}

const sizes = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-12 h-12 text-lg',
  xl: 'w-16 h-16 text-xl',
};

export function Avatar({
  src,
  alt,
  name,
  size = 'md',
  color,
  className,
}: AvatarProps) {
  const initials = name ? getInitials(name) : '';

  return (
    <div
      className={cn(
        'relative flex items-center justify-center rounded-full',
        'bg-gradient-to-br from-blush-100 to-lavender-100',
        sizes[size],
        className
      )}
      style={{ backgroundColor: color }}
    >
      {src ? (
        <img
          src={src}
          alt={alt || name || 'Avatar'}
          className="w-full h-full object-cover rounded-full"
        />
      ) : name ? (
        <span className="font-medium text-blush-700">{initials}</span>
      ) : (
        <User className="w-1/2 h-1/2 text-blush-400" />
      )}
    </div>
  );
}

interface AvatarGroupProps {
  avatars: Array<{ src?: string; name?: string; color?: string }>;
  max?: number;
  size?: 'xs' | 'sm' | 'md';
}

export function AvatarGroup({ avatars, max = 3, size = 'sm' }: AvatarGroupProps) {
  const visible = avatars.slice(0, max);
  const remaining = avatars.length - max;

  return (
    <div className="flex -space-x-2">
      {visible.map((avatar, index) => (
        <Avatar
          key={index}
          src={avatar.src}
          name={avatar.name}
          color={avatar.color}
          size={size}
          className="ring-2 ring-white"
        />
      ))}
      {remaining > 0 && (
        <div
          className={cn(
            'flex items-center justify-center rounded-full bg-gray-100 ring-2 ring-white',
            sizes[size],
            'text-gray-600 font-medium'
          )}
        >
          +{remaining}
        </div>
      )}
    </div>
  );
}
